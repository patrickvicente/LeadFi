from db.db_config import db
from datetime import datetime

class Customer(db.Model):
    __tablename__ = 'customer'

    customer_uid = db.Column(db.String(8), primary_key=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    type = db.Column(db.String(50))
    country = db.Column(db.String(50))
    is_closed = db.Column(db.Boolean, default=False)
    date_closed = db.Column(db.DateTime)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    # relationship woith contacts
    contacts = db.relationship(
        'Contact',
        backref=db.backref('customer', lazy=True),
        lazy='select',
        cascade='all, delete-orphan'
    )

    def to_dict(self):
        return {
            'customer_uid': self.customer_uid,
            'name': self.name,
            'type': self.type,
            'country': self.country,
            'is_closed': self.is_closed,
            'date_closed': self.date_closed.isoformat() if self.date_closed else None,
            'date_created': self.date_created.isoformat() if self.date_created else None,
        }