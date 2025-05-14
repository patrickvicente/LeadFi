from db.db_config import db
from datetime import datetime

class Lead(db.Model):
    __tablename__ = 'lead'

    lead_id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(50))
    email = db.Column(db.String(120))
    telegram = db.Column(db.String(50))
    phone_number = db.Column(db.String(20))
    source =  db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(50))
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    linkedin_url = db.Column(db.String(255))
    company_name = db.Column(db.String(120))
    country = db.Column(db.String(50))
    bd_in_charge = db.Column(db.String(20), nullable=False)
    background = db.Column(db.Text)
    is_converted = db.Column(db.Boolean, default=False)
    contacts = db.relationship(
        'Contact',
        backref=db.backref('lead', lazy=True),
        lazy='select',
        cascade='all, delete-orphan'
    )

    def to_dict(self):
        return {
            'lead_id': self.lead_id,
            'full_name': self.full_name,
            'title': self.title,
            'email': self.email,
            'telegram': self.telegram,
            'phone_number': self.phone_number,
            'source': self.source,
            'status': self.status,
            'date_created': self.date_created.isoformat() if self.date_created else None,
            'linkedin_url': self.linkedin_url,
            'company_name': self.company_name,
            'country': self.country,
            'bd_in_charge': self.bd_in_charge,
            'background': self.background,
            'is_converted': self.is_converted
        }