from flask_restful import Resource
from flask import request
from api.models.trading_volume import TradingVolume
from api.schemas.trading_volume_schema import TradingVolumeSchema, TradingVolumeQuerySchema
from sqlalchemy import desc, asc

class TradingVolumeResource(Resource):
    def __init__(self):
        self.schema = TradingVolumeSchema()
        self.schema_many = TradingVolumeSchema(many=True)

    def get(self):
        """Get trading volume with filtering, sorting and pagination"""
        try:
            args = TradingVolumeQuerySchema().load(request.args)
            
            # pagination param
            page = args.get('page')
            per_page = args.get('per_page')

            # Sorting parameters
            sort_by = request.args.get('sort_by', 'date')
            sort_order = request.args.get('sort_order', 'desc')

            # Filter parameters
            start_date = args.get('start_date')
            end_date = args.get('end_date')
            customer_uid = args.get('customer_uid')
            trade_type = args.get('trade_type')
            trade_side = args.get('trade_side')
            bd_in_charge = args.get('bd_in_charge')

            # Build query
            query = TradingVolume.query

            # Apply filters
            if customer_uid:
                query = query.filter(TradingVolume.customer_uid == customer_uid)

            if start_date:
                query = query.filter(TradingVolume.date >= start_date)
            if end_date:
                query = query.filter(TradingVolume.date <= end_date)
            if trade_side:
                query = query.filter(TradingVolume.trade_side == trade_side)
            if trade_type:
                query = query.filter(TradingVolume.trade_type == trade_type)
            if bd_in_charge:
                query = query.filter(TradingVolume.bd_in_charge == bd_in_charge)
            
            # Apply Sorting
            if hasattr(TradingVolume, sort_by):
                sort_column = getattr(TradingVolume, sort_by)
                if sort_order == 'desc':
                    query = query.order_by(desc(sort_column))
                else:
                    query = query.order_by(asc(sort_column))
            else:
                # default sorting
                query = query.order_by(desc(TradingVolume.date))
            
            # Execute query with pagination
            result = query.paginate(
                page=page,
                per_page=per_page,
                error_out=False
            )

            # serialize results
            trading_volume = self.schema_many.dump(result.items)

            return {
                'trading_volume': trading_volume,
                'total': result.total,
                'pages': result.pages,
                'current_page': result.page,
                'per_page': result.per_page,
                'has_next': result.has_next,
                'has_prev': result.has_prev
            }, 200

        except Exception as e:
            return {'error': str(e)}, 500