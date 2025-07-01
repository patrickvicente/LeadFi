from db.db_config import db
from datetime import datetime
from sqlalchemy import func, and_

class TradingVolume(db.Model):
    __tablename__ = 'v_trading_volume_detail'

    customer_uid = db.Column(db.Integer, db.ForeignKey('customer.customer_uid'), primary_key=True)
    date = db.Column(db.Date, primary_key=True)
    trade_type = db.Column(db.String(20), primary_key=True)
    trade_side = db.Column(db.String(20), primary_key=True)

    customer_name = db.Column(db.String(120), nullable=False)
    volume = db.Column(db.Numeric(18, 2), nullable=False)
    fees = db.Column(db.Numeric(6, 2), nullable=False)
    bd_in_charge = db.Column(db.String(20), nullable=False)

    @classmethod
    def get_daily_volumes_for_range(cls, start_date, end_date, customer_uid=None):
        """
        Get daily volume totals for charting/visualization
        Returns data suitable for time-series charts
        """
        try:
            query = db.session.query(
                cls.date,
                func.sum(cls.volume).label('daily_volume'),
                func.sum(cls.fees).label('daily_fees')
            ).filter(
                and_(
                    cls.date >= start_date,
                    cls.date <= end_date
                )
            )
            
            if customer_uid:
                query = query.filter(cls.customer_uid == customer_uid)
            
            results = query.group_by(cls.date).order_by(cls.date).all()
            
            return [
                {
                    'date': row.date.isoformat(),
                    'volume': float(row.daily_volume or 0),
                    'fees': float(row.daily_fees or 0)
                }
                for row in results
            ]
            
        except Exception as e:
            return {'error': f'Daily volumes query error: {str(e)}'}

    def to_dict(self):
        return {
            'date': self.date,
            'customer_uid': self.customer_uid,
            'customer_name': self.customer_name,
            'trade_type': self.trade_type,
            'trade_side': self.trade_side,
            'volume': self.volume,
            'fees': self.fees,
            'bd_in_charge': self.bd_in_charge
        }

    def __repr__(self):
        return f"<TradingVolume {self.customer_uid} {self.date} {self.trade_type} {self.trade_side} {self.volume} {self.fees}>"