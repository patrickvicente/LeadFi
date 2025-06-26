from db.db_config import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB

class Activity(db.Model):
    __tablename__ = 'activity'

    activity_id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('lead.lead_id', ondelete='CASCADE'))
    customer_uid = db.Column(db.Integer, db.ForeignKey('customer.customer_uid', ondelete='CASCADE'))
    activity_type = db.Column(db.String(50), nullable=False)
    activity_category = db.Column(db.String(20), nullable=False, default='manual')
    description = db.Column(db.Text)
    metadata = db.Column(JSONB)  # JSON field for additional structured data
    date_created = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    created_by = db.Column(db.String(50))
    is_visible_to_bd = db.Column(db.Boolean, default=True)
    
    # Task-related fields
    due_date = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='completed')
    priority = db.Column(db.String(10), default='medium')
    assigned_to = db.Column(db.String(50))  # Defaults to lead/customer bd_in_charge
    date_completed = db.Column(db.DateTime)

    # Relationships
    lead = db.relationship('Lead', backref=db.backref('activities', lazy=True))
    customer = db.relationship('Customer', backref=db.backref('activities', lazy=True))

    # Activity categories
    MANUAL = 'manual'
    SYSTEM = 'system'
    AUTOMATED = 'automated'
    
    # Task status options
    PENDING = 'pending'
    IN_PROGRESS = 'in_progress'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'
    
    # Priority levels
    LOW = 'low'
    MEDIUM = 'medium'
    HIGH = 'high'

    # Manual BD activity types
    MANUAL_ACTIVITIES = [
        'call', 'email', 'meeting', 'linkedin_message', 'telegram_message',
        'follow_up', 'proposal_sent', 'demo', 'negotiation', 'onboarding'
    ]

    # System activity types
    SYSTEM_ACTIVITIES = [
        'lead_created', 'lead_updated', 'lead_deleted', 'lead_converted',
        'customer_created', 'customer_updated', 'customer_deleted',
        'status_changed', 'stage_changed', 'assignment_changed'
    ]

    # Automated activity types
    AUTOMATED_ACTIVITIES = [
        'email_opened', 'email_clicked', 'document_viewed',
        'trading_activity', 'account_milestone'
    ]

    @classmethod
    def create_system_activity(cls, activity_type, description, lead_id=None, customer_uid=None, 
                              metadata=None, created_by='system'):
        """Helper method to create system activities"""
        # Get bd_in_charge from lead or customer for assignment
        assigned_to = None
        if lead_id:
            from api.models.lead import Lead
            lead = Lead.query.get(lead_id)
            assigned_to = lead.bd_in_charge if lead else None
        elif customer_uid:
            from api.models.customer import Customer
            customer = Customer.query.get(customer_uid)
            assigned_to = customer.bd_in_charge if customer else None
            
        activity = cls(
            lead_id=lead_id,
            customer_uid=customer_uid,
            activity_type=activity_type,
            activity_category=cls.SYSTEM,
            description=description,
            metadata=metadata,
            created_by=created_by,
            assigned_to=assigned_to,
            is_visible_to_bd=True
        )
        db.session.add(activity)
        return activity

    @classmethod
    def create_manual_activity(cls, lead_id=None, customer_uid=None, activity_type=None,
                              description=None, created_by=None):
        """Helper method to create manual BD activities"""
        # Get bd_in_charge from lead or customer for assignment
        assigned_to = None
        if lead_id:
            from api.models.lead import Lead
            lead = Lead.query.get(lead_id)
            assigned_to = lead.bd_in_charge if lead else None
        elif customer_uid:
            from api.models.customer import Customer
            customer = Customer.query.get(customer_uid)
            assigned_to = customer.bd_in_charge if customer else None
            
        final_created_by = created_by or assigned_to
        
        activity = cls(
            lead_id=lead_id,
            customer_uid=customer_uid,
            activity_type=activity_type,
            activity_category=cls.MANUAL,
            description=description,
            created_by=final_created_by,
            assigned_to=assigned_to,
            is_visible_to_bd=True,
            status=cls.COMPLETED,
            date_completed=datetime.utcnow()
        )
        db.session.add(activity)
        return activity

    @classmethod
    def create_task(cls, activity_type, description, due_date, lead_id=None, customer_uid=None,
                   priority='medium', assigned_to=None):
        """Helper method to create tasks (pending activities)"""
        # Get bd_in_charge from lead or customer for default assignment
        default_assigned_to = None
        if lead_id:
            from api.models.lead import Lead
            lead = Lead.query.get(lead_id)
            default_assigned_to = lead.bd_in_charge if lead else None
        elif customer_uid:
            from api.models.customer import Customer
            customer = Customer.query.get(customer_uid)
            default_assigned_to = customer.bd_in_charge if customer else None
            
        final_assigned_to = assigned_to or default_assigned_to
        
        activity = cls(
            lead_id=lead_id,
            customer_uid=customer_uid,
            activity_type=activity_type,
            activity_category=cls.MANUAL,
            description=description,
            due_date=due_date,
            status=cls.PENDING,
            priority=priority,
            assigned_to=final_assigned_to,
            created_by=final_assigned_to,
            is_visible_to_bd=True
        )
        db.session.add(activity)
        return activity

    def complete_task(self, completion_notes=None):
        """Mark task as completed"""
        if self.status in [self.PENDING, self.IN_PROGRESS]:
            self.status = self.COMPLETED
            self.date_completed = datetime.utcnow()
            if completion_notes:
                self.description += f"\n\nCompletion Notes: {completion_notes}"
            return True
        return False

    def cancel_task(self, reason=None):
        """Mark task as cancelled"""
        if self.status in [self.PENDING, self.IN_PROGRESS]:
            self.status = self.CANCELLED
            if reason:
                self.description += f"\n\nCancellation Reason: {reason}"
            return True
        return False

    def is_overdue(self):
        """Check if task is overdue"""
        if self.due_date and self.status in [self.PENDING, self.IN_PROGRESS]:
            return datetime.utcnow() > self.due_date
        return False

    def is_task(self):
        """Check if this is a task (has due date or pending status)"""
        return self.status in [self.PENDING, self.IN_PROGRESS] or self.due_date is not None

    def get_related_entity_name(self):
        """Get the name of the related lead or customer"""
        if self.lead:
            return self.lead.full_name
        elif self.customer:
            return self.customer.name
        return "Unknown"

    def get_related_entity_type(self):
        """Get whether this activity is related to a lead or customer"""
        if self.lead_id:
            return "lead"
        elif self.customer_uid:
            return "customer"
        return "unknown"

    def to_dict(self, include_related=False):
        result = {
            'activity_id': self.activity_id,
            'lead_id': self.lead_id,
            'customer_uid': self.customer_uid,
            'activity_type': self.activity_type,
            'activity_category': self.activity_category,
            'description': self.description,
            'metadata': self.metadata,
            'date_created': self.date_created.isoformat() if self.date_created else None,
            'created_by': self.created_by,
            'is_visible_to_bd': self.is_visible_to_bd,
            'related_entity_name': self.get_related_entity_name(),
            'related_entity_type': self.get_related_entity_type(),
            # Task-related fields
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'status': self.status,
            'priority': self.priority,
            'assigned_to': self.assigned_to,
            'date_completed': self.date_completed.isoformat() if self.date_completed else None,
            'is_overdue': self.is_overdue(),
            'is_task': self.is_task()
        }
        
        if include_related:
            if self.lead:
                result['lead'] = self.lead.to_dict()
            if self.customer:
                result['customer'] = self.customer.to_dict()
                
        return result

    def __repr__(self):
        return f'<Activity {self.activity_id}: {self.activity_type} - {self.get_related_entity_name()}>' 