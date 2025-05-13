from db.db_config import db
from datetime import datetime

class Contact(db.Model):
    __tablename__ = 'contact'

    contact_id = db.Column(db.Integer, primary_key=True)
    customer_uid = db.Column(db.String(8), db.ForeignKey('customer.customer_uid'), nullable=False)
    lead_id = db.Column(db.Integer, db.ForeignKey('lead.lead_id'), nullable=False)
    is_primary_contact = db.Column(db.Boolean, default=True)
    date_added = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships (optional, for easier access to related data)
    customer = db.relationship('Customer', backref='contacts', lazy=True)
    lead = db.relationship('Lead', backref='contacts', lazy=True)

    def to_dict(self):
        return {
            'contact_id': self.contact_id,
            'customer_uid': self.customer_uid, 
            'lead_id': self.lead_id,
            'is_primary_contact': self.is_primary_contact,
            'date_added': self.date_added.isoformat() if self.date_added else None
        }