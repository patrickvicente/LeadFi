from sqlalchemy import text
from db.db_config import db

def build_sql_filters(start_date=None, end_date=None, bd_in_charge=None):
    """
    Build SQL WHERE conditions and parameters for lead queries
    """
    conditions = ["1=1"]
    params = {}

    if start_date:
        conditions.append("date_created >= :start_date")
        params['start_date'] = start_date
    if end_date:
        conditions.append("date_created <= :end_date")
        params['end_date'] = end_date
    if bd_in_charge:
        conditions.append("bd_in_charge = :bd_in_charge")
        params['bd_in_charge'] = bd_in_charge

    return conditions, params

def get_monthly_lead_conversion_rate(start_date=None, end_date=None, bd_in_charge=None):
    """
    Calculate the monthly conversion rate for the period and BD in charge
    - Returns a list of dictionaries with monthly conversion rates
    """
    
    try: 
        conditions, params = build_sql_filters(
            start_date, end_date, bd_in_charge
        )

        # Get total new leads created for the period
        total_leads_sql = f"""
            SELECT
                TO_CHAR(DATE_TRUNC('month', date_created), 'YYYY-MM') AS month,
                COUNT(DISTINCT(lead_id)) AS total_leads
            FROM lead
            WHERE {' AND '.join(conditions)}
            GROUP BY DATE_TRUNC('month', date_created)
        """

        # Get total converted leads for the period
        total_converted_sql = f"""
            SELECT
                TO_CHAR(DATE_TRUNC('month', date_created), 'YYYY-MM') AS month,
                COUNT(DISTINCT(customer_uid)) AS total_converted
            FROM customer
            WHERE {' AND '.join(conditions)}
            GROUP BY DATE_TRUNC('month', date_created)
        """

        # Execute queries
        total_leads_result = db.session.execute(text(total_leads_sql), params).fetchall()
        total_converted_result = db.session.execute(text(total_converted_sql), params).fetchall()

        # Process results
        conversion_data = []
        for lead_row, converted_row in zip(total_leads_result, total_converted_result):
            month = lead_row.month
            total_leads = lead_row.total_leads
            total_converted = converted_row.total_converted

            if total_leads > 0:
                conversion_rate = (total_converted / total_leads) * 100
            else:
                conversion_rate = 0

            conversion_data.append({
                'month': month,
                'total_leads': total_leads,
                'total_converted': total_converted,
                'conversion_rate': conversion_rate
            })

        return conversion_data
    
    except Exception as e:
        return {'error': f'Monthly lead conversion rate error: {str(e)}'}