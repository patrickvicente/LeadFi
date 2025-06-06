from db.db_config import db
from datetime import datetime

class Contact(db.Model):
    __tablename__ = 'contact'

    contact_id = db.Column(db.Integer, primary_key=True)
    customer_uid = db.Column(
        db.Integer, 
        db.ForeignKey('customer.customer_uid', ondelete='CASCADE'), 
        nullable=False
    )
    lead_id = db.Column(
        db.Integer, 
        db.ForeignKey('lead.lead_id', ondelete='CASCADE'), 
        nullable=False
    )
    is_primary_contact = db.Column(db.Boolean, default=True)
    date_added = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'contact_id': self.contact_id,
            'customer_uid': self.customer_uid, 
            'lead_id': self.lead_id,
            'is_primary_contact': self.is_primary_contact,
            'date_added': self.date_added.isoformat() if self.date_added else None
        }