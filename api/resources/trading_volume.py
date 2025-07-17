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
        """Get trading volume with filtering, sorting and pagination using raw SQL"""
        try:
            # Validate and load query parameters
            try:
                args = TradingVolumeQuerySchema().load(request.args)
            except Exception as validation_error:
                return {'error': f'Invalid parameters: {str(validation_error)}'}, 400
            
            # Ensure args is a dict and not None
            if not isinstance(args, dict):
                return {'error': 'Invalid parameter format'}, 400
            
            # Extract parameters
            page = args.get('page', 1)
            per_page = args.get('per_page', 20)
            sort_by = args.get('sort_by', 'date')
            sort_order = args.get('sort_order', 'desc')
            
            # Filter parameters
            start_date = args.get('start_date')
            end_date = args.get('end_date')
            customer_uid = args.get('customer_uid')
            trade_type = args.get('trade_type')
            trade_side = args.get('trade_side')
            bd_in_charge = args.get('bd_in_charge')
            
            # Use the new raw SQL method
            result = TradingVolume.get_paginated_trading_data(
                start_date=start_date,
                end_date=end_date,
                customer_uid=customer_uid,
                bd_in_charge=bd_in_charge,
                trade_type=trade_type,
                trade_side=trade_side,
                sort_by=sort_by,
                sort_order=sort_order,
                page=page,
                per_page=per_page
            )
            
            # Check for errors
            if 'error' in result:
                return result, 500
                
            return result, 200

        except Exception as e:
            return {'error': str(e)}, 500


class TradingSummaryResource(Resource):
    def get(self):
        """Get trading volume summary statistics"""
        try:
            # Validate and load query parameters
            try:
                args = TradingVolumeQuerySchema().load(request.args)
            except Exception as validation_error:
                return {'error': f'Invalid parameters: {str(validation_error)}'}, 400
            
            # Ensure args is a dict and not None
            if not isinstance(args, dict):
                return {'error': 'Invalid parameter format'}, 400
            
            # Extract filter parameters for summary stats
            filter_params = {
                'start_date': args.get('start_date'),
                'end_date': args.get('end_date'),
                'customer_uid': args.get('customer_uid'),
                'bd_in_charge': args.get('bd_in_charge')
            }
            
            # Remove None values
            filter_params = {k: v for k, v in filter_params.items() if v is not None}
            
            # Get summary stats
            stats = TradingVolume.get_summary_stats(**filter_params)

            # Get breakdown data
            breakdown_type = TradingVolume.get_breakdown_by_type(**filter_params)
            breakdown_side = TradingVolume.get_breakdown_by_side(**filter_params)

            # Combine all data
            result = {
                'summary': stats,
                'breakdown_type': breakdown_type,
                'breakdown_side': breakdown_side
            }

            return result, 200
        except Exception as e:
            return {'error': str(e)}, 500

class TradingVolumeTimeSeriesResource(Resource):
    def get(self):
        """
        GET /api/trading-volume-time-series
        Query params: start_date, end_date, customer_uid
        """
        try:
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            customer_uid = request.args.get('customer_uid')

            result = TradingVolume.get_daily_volumes_for_range(
                start_date=start_date,
                end_date=end_date,
                customer_uid=customer_uid
            )
            return result, 200
        
        except Exception as e:
            return {'error': str(e)}, 500

class TradingVolumeTopCustomersResource(Resource):
    def get(self):
        """
        GET /api/analytics/trading-volume-top-customers
        Query params: start_date, end_date, trade_type, trade_side, bd_in_charge
        """
        try:
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date') 
            trade_type = request.args.get('trade_type')
            trade_side = request.args.get('trade_side')
            bd_in_charge = request.args.get('bd_in_charge')

            result = TradingVolume.get_top_customers(
                start_date=start_date,
                end_date=end_date,
                trade_type=trade_type,
                trade_side=trade_side,
                bd_in_charge=bd_in_charge
            )
            return result, 200
        except Exception as e:
            return {'error': str(e)}, 500