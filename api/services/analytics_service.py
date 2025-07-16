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
    
def get_activity_analytics(start_date=None, end_date=None, bd_in_charge=None, group_by='month'):
    """
    Returns activity analytics for the given period and BD in charge, grouped by the specified granularity.

    :param start_date: (optional) filter activities created on or after this date (YYYY-MM-DD)
    :param end_date: (optional) filter activities created on or before this date (YYYY-MM-DD)
    :param bd_in_charge: (optional) filter by BD in charge
    :param group_by: 'day', 'week', or 'month' (default: 'month')
    :return: list of dicts, each with keys: period, bd_in_charge, total_activities, activity_by_type, activity_by_status
    """
    try:
        conditions, params = build_sql_filters(
            start_date, end_date, bd_in_charge
        )

        # Determine date trunc granularity
        date_trunc_map = {
            'day': 'day',
            'week': 'week',
            'month': 'month'
        }
        date_trunc = date_trunc_map.get(group_by, 'month')
        date_format = {
            'day': 'YYYY-MM-DD',
            'week': 'IYYY-IW',  # ISO week
            'month': 'YYYY-MM'
        }[group_by]

        # Get total activities for the period
        total_activities_sql = f"""
            SELECT
                TO_CHAR(DATE_TRUNC('{date_trunc}', date_created), '{date_format}') AS period,
                assigned_to AS bd_in_charge,
                COUNT(activity_id) AS total_activities
            FROM activity
            WHERE {' AND '.join(conditions)}
            AND activity_category = 'manual'
            GROUP BY DATE_TRUNC('{date_trunc}', date_created), bd_in_charge
        """

        # Get total activities by type for the period
        manual_activities_by_type_sql = f"""
            SELECT
                TO_CHAR(DATE_TRUNC('{date_trunc}', date_created), '{date_format}') AS period,
                activity_type,
                assigned_to AS bd_in_charge,
                COUNT(activity_id) AS activity_count
            FROM activity
            WHERE {' AND '.join(conditions)}
            AND activity_category = 'manual'
            GROUP BY DATE_TRUNC('{date_trunc}', date_created), activity_type, bd_in_charge
        """

        # Get total activities by status for the period
        activities_by_status_sql = f"""
            SELECT
                TO_CHAR(DATE_TRUNC('{date_trunc}', date_created), '{date_format}') AS period,
                assigned_to AS bd_in_charge,
                status,
                COUNT(activity_id) AS activity_count
            FROM activity
            WHERE {' AND '.join(conditions)}
            AND activity_category = 'manual'
            GROUP BY DATE_TRUNC('{date_trunc}', date_created), status, bd_in_charge
        """

        total_activities_result = db.session.execute(text(total_activities_sql), params).fetchall()
        manual_activities_by_type_result = db.session.execute(text(manual_activities_by_type_sql), params).fetchall()
        activities_by_status_result = db.session.execute(text(activities_by_status_sql), params).fetchall()

        # Process results
        activity_data = {}

        # Only process if there are results
        if total_activities_result:
            # Process total activities by period
            for row in total_activities_result:
                period = row.period
                bd = row.bd_in_charge
                total_activities = row.total_activities
                key = (period, bd)
                if key not in activity_data:
                    activity_data[key] = {
                        'period': period,
                        'bd_in_charge': bd,
                        'total_activities': total_activities,
                        'activity_by_type': {},
                        'activity_by_status': {}
                    }

            for row in manual_activities_by_type_result:
                period = row.period
                bd = row.bd_in_charge
                activity_type = row.activity_type
                activity_count = row.activity_count
                key = (period, bd)
                if key in activity_data:
                    activity_data[key]['activity_by_type'][activity_type] = activity_count

            for row in activities_by_status_result:
                period = row.period
                bd = row.bd_in_charge
                status = row.status
                activity_count = row.activity_count
                key = (period, bd)
                if key in activity_data:
                    activity_data[key]['activity_by_status'][status] = activity_count

        # Return as a list of dicts
        return list(activity_data.values())

    except Exception as e:
        return {'error': f'Activity analytics error: {str(e)}'}

def get_avg_daily_activity(start_date=None, end_date=None, bd_in_charge=None):
    """
    Returns the average daily activity for the given period and BD in charge
    - Returns a list of dictionaries with bd_in_charge and avg_daily_activity
    """
    try:
        conditions, params = build_sql_filters(
            start_date, end_date, bd_in_charge
        )
        
        sql = f"""
            SELECT 
                assigned_to AS bd_in_charge,
                AVG(activity_count) AS avg_daily_activity
            FROM (
                SELECT assigned_to, COUNT(activity_id) AS activity_count
                FROM activity
                WHERE {' AND '.join(conditions)}
                AND activity_category = 'manual'
                GROUP BY assigned_to, DATE(date_created)
            ) AS activity_counts
            GROUP BY assigned_to
        """

        rows = db.session.execute(text(sql), params).fetchall()
        dicts = [dict(row._mapping) for row in rows]
        for d in dicts:
            d['avg_daily_activity'] = float(d['avg_daily_activity'])
        return dicts
    
    except Exception as e:
        return {'error': f'Average daily activity error: {str(e)}'}

def get_lead_funnel(start_date=None, end_date=None, bd_in_charge=None):
    """
    Returns the lead funnel for the given period and BD in charge
    """
    try:
        conditions, params = build_sql_filters(
            start_date, end_date, bd_in_charge
        )
        
        sql = f"""
            SELECT status, 
                COUNT(lead_id) AS count
            FROM lead
            WHERE {' AND '.join(conditions)}
            GROUP BY status
            ORDER BY status ASC
        """

        rows = db.session.execute(text(sql), params).fetchall()
        return {row.status: row.count for row in rows}
    
    except Exception as e:
        return {'error': f'Lead funnel error: {str(e)}'}