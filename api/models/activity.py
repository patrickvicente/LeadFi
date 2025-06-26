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
    bd_in_charge = db.Column(db.String(20))
    created_by = db.Column(db.String(50))
    is_visible_to_bd = db.Column(db.Boolean, default=True)

    # Relationships
    lead = db.relationship('Lead', backref=db.backref('activities', lazy=True))
    customer = db.relationship('Customer', backref=db.backref('activities', lazy=True))

    # Activity categories
    MANUAL = 'manual'
    SYSTEM = 'system'
    AUTOMATED = 'automated'

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
        activity = cls(
            lead_id=lead_id,
            customer_uid=customer_uid,
            activity_type=activity_type,
            activity_category=cls.SYSTEM,
            description=description,
            metadata=metadata,
            created_by=created_by,
            is_visible_to_bd=True
        )
        db.session.add(activity)
        return activity

    @classmethod
    def create_manual_activity(cls, lead_id=None, customer_uid=None, activity_type=None,
                              description=None, bd_in_charge=None, created_by=None):
        """Helper method to create manual BD activities"""
        activity = cls(
            lead_id=lead_id,
            customer_uid=customer_uid,
            activity_type=activity_type,
            activity_category=cls.MANUAL,
            description=description,
            bd_in_charge=bd_in_charge,
            created_by=created_by or bd_in_charge,
            is_visible_to_bd=True
        )
        db.session.add(activity)
        return activity

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
            'bd_in_charge': self.bd_in_charge,
            'created_by': self.created_by,
            'is_visible_to_bd': self.is_visible_to_bd,
            'related_entity_name': self.get_related_entity_name(),
            'related_entity_type': self.get_related_entity_type()
        }
        
        if include_related:
            if self.lead:
                result['lead'] = self.lead.to_dict()
            if self.customer:
                result['customer'] = self.customer.to_dict()
                
        return result

    def __repr__(self):
        return f'<Activity {self.activity_id}: {self.activity_type} - {self.get_related_entity_name()}>' 