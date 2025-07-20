from db.db_config import db
from datetime import datetime
import json

class Activity(db.Model):
    __tablename__ = 'activity'

    activity_id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('lead.lead_id', ondelete='CASCADE'), nullable=False)
    activity_type = db.Column(db.String(50), nullable=False)
    activity_category = db.Column(db.String(20), nullable=False, default='manual')
    description = db.Column(db.Text)
    activity_metadata = db.Column(db.Text)  # JSON field for additional structured data (stored as text)
    date_created = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    created_by = db.Column(db.String(50))
    is_visible_to_bd = db.Column(db.Boolean, default=True)
    
    # Task-related fields
    due_date = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='completed')
    priority = db.Column(db.String(10), default='medium')
    assigned_to = db.Column(db.String(50))  # Defaults to lead bd_in_charge
    date_completed = db.Column(db.DateTime)

    # Relationships
    lead = db.relationship('Lead', backref=db.backref('activities', lazy=True))

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
    def create_system_activity(cls, activity_type, description, lead_id, 
                              activity_metadata=None, created_by='system'):
        """Helper method to create system activities (completed immediately)"""
        # Get bd_in_charge from lead for assignment
        from api.models.lead import Lead
        lead = Lead.query.get(lead_id)
        assigned_to = lead.bd_in_charge if lead else None
            
        current_time = datetime.utcnow()
        
        activity = cls()
        activity.lead_id = lead_id
        activity.activity_type = activity_type
        activity.activity_category = cls.SYSTEM
        activity.description = description
        activity.activity_metadata = activity_metadata
        activity.created_by = created_by
        activity.assigned_to = assigned_to
        activity.is_visible_to_bd = True
        activity.status = cls.COMPLETED
        activity.date_created = current_time
        activity.date_completed = current_time  # System activities are completed immediately
        db.session.add(activity)
        return activity

    @classmethod
    def create_manual_activity(cls, lead_id, activity_type=None,
                              description=None, created_by=None):
        """Helper method to create manual BD activities (completed immediately)"""
        # Get bd_in_charge from lead for assignment
        from api.models.lead import Lead
        lead = Lead.query.get(lead_id)
        assigned_to = lead.bd_in_charge if lead else None
            
        final_created_by = created_by or assigned_to
        current_time = datetime.utcnow()
        
        activity = cls()
        activity.lead_id = lead_id
        activity.activity_type = activity_type
        activity.activity_category = cls.MANUAL
        activity.description = description
        activity.created_by = final_created_by
        activity.assigned_to = assigned_to
        activity.is_visible_to_bd = True
        activity.status = cls.COMPLETED
        activity.date_created = current_time
        activity.date_completed = current_time  # Activities are completed immediately (same as date_created)
        db.session.add(activity)
        return activity

    @classmethod
    def create_task(cls, activity_type, description, due_date, lead_id,
                   priority='medium', assigned_to=None):
        """Helper method to create tasks (pending activities with no completion date until done)"""
        # Get bd_in_charge from lead for default assignment
        from api.models.lead import Lead
        lead = Lead.query.get(lead_id)
        default_assigned_to = lead.bd_in_charge if lead else None
            
        final_assigned_to = assigned_to or default_assigned_to
        
        activity = cls()
        activity.lead_id = lead_id
        activity.activity_type = activity_type
        activity.activity_category = cls.MANUAL
        activity.description = description
        activity.due_date = due_date
        activity.status = cls.PENDING
        activity.priority = priority
        activity.assigned_to = final_assigned_to
        activity.created_by = final_assigned_to
        activity.is_visible_to_bd = True
        activity.date_completed = None  # Tasks remain null until completed
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
        """Get the name of the related lead"""
        if self.lead:
            return self.lead.full_name
        return None

    def get_related_entity_type(self):
        """Get the type of the related entity (always 'lead' now)"""
        return 'lead' if self.lead else None

    def get_customer_info(self):
        """Get customer information for this lead (if converted)"""
        if not self.lead:
            return None
            
        from api.models.contact import Contact
        from api.models.customer import Customer
        
        # Find if this lead has been converted to a customer
        contact = Contact.query.filter_by(lead_id=self.lead_id, is_primary_contact=True).first()
        if contact:
            customer = Customer.query.get(contact.customer_uid)
            if customer:
                return {
                    'customer_uid': customer.customer_uid,
                    'customer_name': customer.name,
                    'is_converted': True
                }
        
        return {'is_converted': False}

    def to_dict(self, include_related=False):
        customer_info = self.get_customer_info()
        
        result = {
            'activity_id': self.activity_id,
            'lead_id': self.lead_id,
            'activity_type': self.activity_type,
            'activity_category': self.activity_category,
            'description': self.description,
            'activity_metadata': self.activity_metadata,
            'date_created': self.date_created.isoformat() if self.date_created else None,
            'created_by': self.created_by,
            'is_visible_to_bd': self.is_visible_to_bd,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'status': self.status,
            'priority': self.priority,
            'assigned_to': self.assigned_to,
            'date_completed': self.date_completed.isoformat() if self.date_completed else None,
            'is_overdue': self.is_overdue(),
            'is_task': self.is_task(),
            'related_entity_name': self.get_related_entity_name(),
            'related_entity_type': self.get_related_entity_type(),
            # Include customer info for converted leads
            'customer_info': customer_info
        }
        
        if include_related and self.lead:
            result['lead'] = self.lead.to_dict()
            
        return result

    def __repr__(self):
        return f'<Activity {self.activity_id}: {self.activity_type} for Lead {self.lead_id}>' 