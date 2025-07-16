from flask_restful import Resource
from flask import request
from api.services.analytics_service import get_lead_funnel, get_monthly_lead_conversion_rate, get_activity_analytics, get_avg_daily_activity
from api.schemas.analytics_schema import ActivityAnalyticsSchema
from http import HTTPStatus

class LeadConversionRateResource(Resource):
    def get(self):
        """
        GET /api/analytics/monthly-lead-conversion-rate
        """
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        bd_in_charge = request.args.get('bd_in_charge')

        try:
            result = get_monthly_lead_conversion_rate(
                start_date=start_date,
                end_date=end_date,
                bd_in_charge=bd_in_charge
            )
            return result, HTTPStatus.OK
        except Exception as e:
            return {'message': 'Error calculating lead conversion rate', 'error': str(e)}, HTTPStatus.INTERNAL_SERVER_ERROR

class ActivityAnalyticsResource(Resource):
    def get(self):
        """
        GET /api/analytics/activity-analytics
        Query params: start_date, end_date, bd_in_charge, group_by ('day', 'week', 'month')
        """
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        bd_in_charge = request.args.get('bd_in_charge')
        group_by = request.args.get('group_by', 'month')
        schema = ActivityAnalyticsSchema(many=True)  # Schema still works, just 'period' instead of 'month'
        try:
            result = get_activity_analytics(
                start_date=start_date,
                end_date=end_date,
                bd_in_charge=bd_in_charge,
                group_by=group_by
            )
            return schema.dump(result), HTTPStatus.OK
        except Exception as e:
            return {'message': 'Error calculating activity analytics', 'error': str(e)}, HTTPStatus.INTERNAL_SERVER_ERROR

class AvgDailyActivityResource(Resource):
    def get(self):
        """
        GET /api/analytics/avg-daily-activity
        Query params: start_date, end_date, bd_in_charge
        """
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        bd_in_charge = request.args.get('bd_in_charge')

        try:
            result = get_avg_daily_activity(
                start_date=start_date,
                end_date=end_date,
                bd_in_charge=bd_in_charge
            )
            return result, HTTPStatus.OK
        except Exception as e:
            return {'message': 'Error calculating average daily activity', 'error': str(e)}, HTTPStatus.INTERNAL_SERVER_ERROR

class LeadFunnelResource(Resource):
    def get(self):
        """
        GET /api/analytics/lead-funnel
        Query params: start_date, end_date, bd_in_charge
        """
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        bd_in_charge = request.args.get('bd_in_charge')

        try:
            result = get_lead_funnel(
                start_date=start_date,
                end_date=end_date,
                bd_in_charge=bd_in_charge
            )
            return result, HTTPStatus.OK
        except Exception as e:
            return {'message': 'Error calculating lead funnel', 'error': str(e)}, HTTPStatus.INTERNAL_SERVER_ERROR