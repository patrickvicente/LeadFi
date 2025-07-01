from db.db_config import db
from datetime import datetime

class Customer(db.Model):
    __tablename__ = 'customer'

    customer_uid = db.Column(db.Integer, primary_key=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    registered_email = db.Column(db.String(120))
    type = db.Column(db.String(50))
    country = db.Column(db.String(50))
    is_closed = db.Column(db.Boolean, default=False)
    date_closed = db.Column(db.DateTime)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    # relationship with contacts
    contacts = db.relationship(
        'Contact',
        backref=db.backref('customer', lazy=True),
        lazy='select',
        cascade='all, delete-orphan'
    )
    # relationship with trading volume (view-based, read-only)
    trading_volumes = db.relationship(
        'TradingVolume',
        backref=db.backref('customer', lazy=True),
        lazy='select',
        viewonly=True  # Read-only relationship since it's based on a view
    )

    def get_related_leads(self):
        """Get all leads that were converted to this customer"""
        from api.models.lead import Lead
        from api.models.contact import Contact
        
        leads = db.session.query(Lead).join(
            Contact, Lead.lead_id == Contact.lead_id
        ).filter(
            Contact.customer_uid == self.customer_uid
        ).all()
        
        return [lead.to_dict() for lead in leads]

    def get_primary_lead_status(self):
        """Get the status from the primary contact's lead"""
        from api.models.lead import Lead
        from api.models.contact import Contact
        
        primary_contact = db.session.query(Contact).filter(
            Contact.customer_uid == self.customer_uid,
            Contact.is_primary_contact == True
        ).first()
        
        if primary_contact:
            lead = db.session.query(Lead).filter(
                Lead.lead_id == primary_contact.lead_id
            ).first()
            if lead:
                return lead.status
        return None

    def get_date_converted(self):
        """Get the date when the primary lead was converted (from contact table)"""
        from api.models.contact import Contact
        
        primary_contact = db.session.query(Contact).filter(
            Contact.customer_uid == self.customer_uid,
            Contact.is_primary_contact == True
        ).first()
        
        if primary_contact:
            return primary_contact.date_added
        return self.date_created

    def get_bd_in_charge(self):
        """Get BD in charge from the primary lead"""
        from api.models.lead import Lead
        from api.models.contact import Contact
        
        primary_contact = db.session.query(Contact).filter(
            Contact.customer_uid == self.customer_uid,
            Contact.is_primary_contact == True
        ).first()
        
        if primary_contact:
            lead = db.session.query(Lead).filter(
                Lead.lead_id == primary_contact.lead_id
            ).first()
            if lead:
                return lead.bd_in_charge
        return None

    def to_dict(self, include_leads=False):
        result = {
            'customer_uid': self.customer_uid,
            'name': self.name,
            'registered_email': self.registered_email,
            'type': self.type,
            'country': self.country,
            'is_closed': self.is_closed,
            'date_closed': self.date_closed.isoformat() if self.date_closed else None,
            'date_created': self.date_created.isoformat() if self.date_created else None,
            # Add lead-derived fields
            'lead_status': self.get_primary_lead_status(),
            'date_converted': self.get_date_converted().isoformat() if self.get_date_converted() else None,
            'bd_in_charge': self.get_bd_in_charge()
        }
        
        if include_leads:
            result['related_leads'] = self.get_related_leads()
            
        return result