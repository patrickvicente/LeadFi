from flask_restful import Resource
from flask import request
from api.services.analytics_service import get_monthly_lead_conversion_rate
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