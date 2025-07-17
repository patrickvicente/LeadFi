from marshmallow.fields import Method
from db.db_config import db
from datetime import datetime
from sqlalchemy import func, and_, text

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
            conditions, params = cls._build_sql_filters(
                start_date, end_date, customer_uid
            )

            sql = f"""
                SELECT
                    date,
                    SUM(CASE WHEN trade_side = 'maker' THEN volume ELSE 0 END) AS maker_volume,
                    SUM(CASE WHEN trade_side = 'taker' THEN volume ELSE 0 END) AS taker_volume,
                    SUM(CASE WHEN trade_side = 'maker' THEN fees ELSE 0 END) AS maker_fees,
                    SUM(CASE WHEN trade_side = 'taker' THEN fees ELSE 0 END) AS taker_fees,
                    SUM(volume) AS total_volume,
                    SUM(fees) AS total_fees
                FROM v_trading_volume_detail
                WHERE {' AND '.join(conditions)}
                GROUP BY date
                ORDER BY date ASC
            """
            result = db.session.execute(text(sql), params).fetchall()
            return [
                {
                    'date': row.date.isoformat(),
                    'maker_volume': float(row.maker_volume or 0),
                    'taker_volume': float(row.taker_volume or 0),
                    'maker_fees': float(row.maker_fees or 0),
                    'taker_fees': float(row.taker_fees or 0),
                    'total_volume': float(row.total_volume or 0),
                    'total_fees': float(row.total_fees or 0)
                }
                for row in result
            ]
        except Exception as e:
            return {'error': f'Daily volumes query error: {str(e)}'}
        
    @classmethod
    def get_summary_stats(cls, start_date=None, end_date=None, customer_uid=None, bd_in_charge=None):  
        """Get comprehensive trading volume summary statistics"""
        try:
            # Use shared filter builder
            conditions, params = cls._build_sql_filters(
                start_date, end_date, customer_uid, bd_in_charge
            )

            sql = f"""
                SELECT
                    COALESCE(SUM(volume), 0) AS total_volume,
                    COALESCE(SUM(fees), 0) AS total_fees,
                    COUNT(*) AS total_trades,
                    COUNT(DISTINCT customer_uid) AS unique_customers,
                    COUNT(DISTINCT date) AS trading_days,
                    CASE
                        WHEN COUNT(*) > 0
                        THEN COALESCE(SUM(volume), 0) / COUNT(*)
                        ELSE 0
                    END AS avg_volume_per_trade,
                    CASE
                        WHEN COUNT(DISTINCT date) > 0
                        THEN COALESCE(SUM(volume), 0) / COUNT(DISTINCT date)
                        ELSE 0
                    END AS avg_daily_volume,
                    CASE
                        WHEN COUNT(DISTINCT date) > 0
                        THEN COALESCE(SUM(fees), 0) / COUNT(DISTINCT date)
                        ELSE 0
                    END AS avg_daily_fees
                FROM v_trading_volume_detail
                WHERE {' AND '.join(conditions)}
            """

            # Execute query and fetch one row
            result = db.session.execute(text(sql), params).fetchone()
            if result:
                result_dict = dict(result._mapping)
                # Convert decimal values to float for JSON serialization
                for key, value in result_dict.items():
                    if hasattr(value, '__float__'):  # Handle Decimal types
                        result_dict[key] = float(value)
                return result_dict
            else:
                return {}

        except Exception as e:
            return {'error': f'Summary stats query error: {str(e)}'}

    @classmethod
    def _build_sql_filters(cls, start_date=None, end_date=None, customer_uid=None, 
                          bd_in_charge=None, trade_type=None, trade_side=None):
        """
        Build SQL WHERE conditions and parameters for trading volume queries
        Returns: (conditions_list, params_dict)
        """
        conditions = ["1=1"]  # Base condition
        params = {}
        
        if start_date:
            conditions.append("date >= :start_date")
            params['start_date'] = start_date
        if end_date:
            conditions.append("date <= :end_date") 
            params['end_date'] = end_date
        if customer_uid:
            conditions.append("customer_uid = :customer_uid")
            params['customer_uid'] = customer_uid
        if bd_in_charge:
            conditions.append("bd_in_charge = :bd_in_charge")
            params['bd_in_charge'] = bd_in_charge
        if trade_type:
            conditions.append("trade_type = :trade_type")
            params['trade_type'] = trade_type
        if trade_side:
            conditions.append("trade_side = :trade_side")
            params['trade_side'] = trade_side
            
        return conditions, params

    @classmethod
    def get_paginated_trading_data(cls, start_date=None, end_date=None, customer_uid=None,
                                  bd_in_charge=None, trade_type=None, trade_side=None,
                                  sort_by='date', sort_order='desc', page=1, per_page=20):
        """
        Get paginated trading volume data using raw SQL for better performance
        """
        try:
            # Build filters
            conditions, params = cls._build_sql_filters(
                start_date, end_date, customer_uid, bd_in_charge, trade_type, trade_side
            )
            
            # Validate and build sort clause
            valid_sort_fields = ['date', 'customer_uid', 'volume', 'fees', 'customer_name', 'trade_type', 'trade_side', 'bd_in_charge']
            if sort_by not in valid_sort_fields:
                sort_by = 'date'
            
            sort_direction = 'DESC' if sort_order.lower() == 'desc' else 'ASC'
            sort_clause = f"ORDER BY {sort_by} {sort_direction}"
            
            # Add secondary sort for consistency (like your current ORM query)
            if sort_by != 'date':
                sort_clause += ", date DESC"
            if sort_by not in ['customer_uid', 'date']:
                sort_clause += ", customer_uid ASC"
            
            # Calculate offset
            offset = (page - 1) * per_page
            
            # Get total count first
            count_sql = f"""
                SELECT COUNT(*) as total_count
                FROM v_trading_volume_detail 
                WHERE {' AND '.join(conditions)}
            """
            
            count_result = db.session.execute(text(count_sql), params).fetchone()
            total_count = count_result.total_count if count_result else 0
            
            # Get paginated data
            data_sql = f"""
                SELECT 
                    date,
                    customer_uid,
                    customer_name,
                    trade_type,
                    trade_side,
                    volume,
                    fees,
                    bd_in_charge
                FROM v_trading_volume_detail 
                WHERE {' AND '.join(conditions)}
                {sort_clause}
                LIMIT :per_page OFFSET :offset
            """
            
            # Add pagination parameters
            params.update({
                'per_page': per_page,
                'offset': offset
            })
            
            # Execute data query
            data_result = db.session.execute(text(data_sql), params).fetchall()
            
            # Convert to list of dictionaries with proper serialization
            trading_data = []
            for row in data_result:
                row_dict = dict(row._mapping)
                # Convert all values to JSON-serializable types
                for key, value in row_dict.items():
                    if value is not None:
                        # Convert date objects to ISO format strings
                        if hasattr(value, 'isoformat'):
                            row_dict[key] = value.isoformat()
                        # Convert Decimal objects to float
                        elif hasattr(value, '__float__'):
                            row_dict[key] = float(value)
                trading_data.append(row_dict)
            
            # Calculate pagination metadata
            total_pages = (total_count + per_page - 1) // per_page  # Ceiling division
            has_next = page < total_pages
            has_prev = page > 1
            
            return {
                'trading_volume': trading_data,
                'total': total_count,
                'pages': total_pages,
                'current_page': page,
                'per_page': per_page,
                'has_next': has_next,
                'has_prev': has_prev
            }
            
        except Exception as e:
            return {'error': f'Paginated trading data error: {str(e)}'}
    
    @classmethod
    def get_breakdown_by_type(cls, start_date=None, end_date=None, customer_uid=None, bd_in_charge=None):
        """Get volume and fees breakdown by trade type (spot vs futures)"""
        try:
            # Use shared filter builder
            conditions, params = cls._build_sql_filters(
                start_date, end_date, customer_uid, bd_in_charge
            )
            
            sql = f"""
                SELECT 
                    trade_type,
                    COALESCE(SUM(volume), 0) AS total_volume,
                    COALESCE(SUM(fees), 0) AS total_fees,
                    COUNT(*) AS trade_count
                FROM v_trading_volume_detail
                WHERE {' AND '.join(conditions)}
                GROUP BY trade_type
                ORDER BY total_volume DESC
            """
            
            # Execute query and fetch all rows
            results = db.session.execute(text(sql), params).fetchall()
            
            # Convert to list of dictionaries with proper serialization
            breakdown_data = []
            for row in results:
                breakdown_data.append({
                    'trade_type': row.trade_type,
                    'volume': float(row.total_volume or 0),
                    'fees': float(row.total_fees or 0),
                    'trade_count': int(row.trade_count or 0)
                })
            
            return breakdown_data
            
        except Exception as e:
            return {'error': f'Breakdown by type error: {str(e)}'}

    @classmethod
    def get_breakdown_by_side(cls, start_date=None, end_date=None, customer_uid=None, bd_in_charge=None):
        """Get volume and fees breakdown by trade side (maker vs taker)"""
        try:
            # Use shared filter builder
            conditions, params = cls._build_sql_filters(
                start_date, end_date, customer_uid, bd_in_charge
            )
            
            sql = f"""
                SELECT 
                    trade_side,
                    COALESCE(SUM(volume), 0) AS total_volume,
                    COALESCE(SUM(fees), 0) AS total_fees,
                    COUNT(*) AS trade_count
                FROM v_trading_volume_detail
                WHERE {' AND '.join(conditions)}
                GROUP BY trade_side
                ORDER BY total_volume DESC
            """
            
            # Execute query and fetch all rows
            results = db.session.execute(text(sql), params).fetchall()
            
            # Convert to list of dictionaries with proper serialization
            breakdown_data = []
            for row in results:
                breakdown_data.append({
                    'trade_side': row.trade_side,
                    'volume': float(row.total_volume or 0),
                    'fees': float(row.total_fees or 0),
                    'trade_count': int(row.trade_count or 0)
                })
            
            return breakdown_data
            
        except Exception as e:
            return {'error': f'Breakdown by side error: {str(e)}'}
    
    @classmethod
    def get_top_customers(cls, start_date=None, end_date=None, trade_type=None, trade_side=None, bd_in_charge=None):
        """
        Get top customers by volume
        Returns: list of top customers by volume
        """
        try:
            # Use shared filter builder
            conditions, params = cls._build_sql_filters(
                start_date, end_date, trade_type, trade_side, bd_in_charge
            )

            sql = f"""
                SELECT 
                    customer_uid,
                    customer_name,
                    SUM(volume) AS total_volume
                FROM v_trading_volume_detail
                WHERE {' AND '.join(conditions)}
                GROUP BY customer_uid, customer_name
                ORDER BY total_volume DESC
                LIMIT 10
            """

            result = db.session.execute(text(sql), params).fetchall()
            return [
                {
                    'customer_uid': row.customer_uid,
                    'customer_name': row.customer_name,
                    'total_volume': float(row.total_volume or 0)
                }
                for row in result
            ]
            
        except Exception as e:
            return {'error': f'Top customers error: {str(e)}'}

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