from flask_restful import Resource
from flask import request
from api.models.activity import Activity
from api.schemas.activity_schema import ActivitySchema, ActivityCreateSchema
from db.db_config import db
from http import HTTPStatus
from sqlalchemy import desc, and_, or_

class ActivityResource(Resource):
    def __init__(self):
        self.schema = ActivitySchema()
        self.schema_many = ActivitySchema(many=True)
        self.create_schema = ActivityCreateSchema()

    def get(self, activity_id=None):
        """
        GET /api/activities         - List activities with filtering
        GET /api/activities/<id>    - Get a single activity
        """
        if activity_id is None:
            # Handle list endpoint with filtering and pagination
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 20, type=int)
            
            # Filters
            lead_id = request.args.get('lead_id', type=int)
            customer_uid = request.args.get('customer_uid', type=int)
            activity_category = request.args.get('category')
            activity_type = request.args.get('type')
            bd_in_charge = request.args.get('bd')
            visible_only = request.args.get('visible_only', 'true').lower() == 'true'
            
            # Sorting
            sort_by = request.args.get('sort_by', 'date_created')
            sort_order = request.args.get('sort_order', 'desc')

            # Build query
            query = Activity.query

            # Apply filters
            if lead_id:
                query = query.filter(Activity.lead_id == lead_id)
            if customer_uid:
                query = query.filter(Activity.customer_uid == customer_uid)
            if activity_category:
                query = query.filter(Activity.activity_category == activity_category)
            if activity_type:
                query = query.filter(Activity.activity_type == activity_type)
            if bd_in_charge:
                query = query.filter(Activity.bd_in_charge == bd_in_charge)
            if visible_only:
                query = query.filter(Activity.is_visible_to_bd == True)

            # Apply sorting
            if sort_by == 'date_created':
                if sort_order.lower() == 'desc':
                    query = query.order_by(desc(Activity.date_created))
                else:
                    query = query.order_by(Activity.date_created)
            elif sort_by == 'activity_type':
                if sort_order.lower() == 'desc':
                    query = query.order_by(desc(Activity.activity_type))
                else:
                    query = query.order_by(Activity.activity_type)
            else:
                # Default sorting
                query = query.order_by(desc(Activity.date_created))

            # Paginate
            pagination = query.paginate(page=page, per_page=per_page, error_out=False)

            return {
                'activities': self.schema_many.dump(pagination.items),
                'total': pagination.total,
                'pages': pagination.pages,
                'current_page': page,
                'per_page': per_page
            }, HTTPStatus.OK

        # Single activity
        activity = Activity.query.get_or_404(activity_id)
        return {'activity': self.schema.dump(activity)}, HTTPStatus.OK

    def post(self):
        """Create a new activity"""
        json_data = request.get_json()
        if not json_data:
            return {'message': 'No input data provided'}, HTTPStatus.BAD_REQUEST

        # Validate input
        errors = self.create_schema.validate(json_data)
        if errors:
            return {'errors': errors}, HTTPStatus.BAD_REQUEST

        try:
            # Create manual activity
            activity = Activity.create_manual_activity(
                lead_id=json_data.get('lead_id'),
                customer_uid=json_data.get('customer_uid'),
                activity_type=json_data['activity_type'],
                description=json_data['description'],
                bd_in_charge=json_data.get('bd_in_charge'),
                created_by=json_data.get('bd_in_charge')  # BD creates the activity
            )
            
            db.session.commit()
            return {'activity': self.schema.dump(activity)}, HTTPStatus.CREATED

        except Exception as e:
            db.session.rollback()
            return {'message': 'Error creating activity', 'error': str(e)}, HTTPStatus.INTERNAL_SERVER_ERROR

    def put(self, activity_id):
        """Update an activity"""
        activity = Activity.query.get_or_404(activity_id)
        json_data = request.get_json()

        if not json_data:
            return {'message': 'No input data provided'}, HTTPStatus.BAD_REQUEST

        # Only allow updating certain fields for manual activities
        if activity.activity_category != Activity.MANUAL:
            return {'message': 'Only manual activities can be updated'}, HTTPStatus.BAD_REQUEST

        try:
            # Update allowed fields
            if 'description' in json_data:
                activity.description = json_data['description']
            if 'activity_type' in json_data:
                activity.activity_type = json_data['activity_type']
            if 'bd_in_charge' in json_data:
                activity.bd_in_charge = json_data['bd_in_charge']

            db.session.commit()
            return {'activity': self.schema.dump(activity)}, HTTPStatus.OK

        except Exception as e:
            db.session.rollback()
            return {'message': 'Error updating activity', 'error': str(e)}, HTTPStatus.INTERNAL_SERVER_ERROR

    def delete(self, activity_id):
        """Delete an activity"""
        activity = Activity.query.get_or_404(activity_id)

        # Only allow deleting manual activities
        if activity.activity_category != Activity.MANUAL:
            return {'message': 'Only manual activities can be deleted'}, HTTPStatus.BAD_REQUEST

        try:
            db.session.delete(activity)
            db.session.commit()
            return {'message': 'Activity deleted successfully'}, HTTPStatus.OK

        except Exception as e:
            db.session.rollback()
            return {'message': 'Error deleting activity', 'error': str(e)}, HTTPStatus.INTERNAL_SERVER_ERROR


class ActivityTimelineResource(Resource):
    """Resource for getting activity timelines"""
    
    def __init__(self):
        self.schema_many = ActivitySchema(many=True)

    def get(self):
        """Get activity timeline with optional entity filtering"""
        lead_id = request.args.get('lead_id', type=int)
        customer_uid = request.args.get('customer_uid', type=int)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        category = request.args.get('category')  # filter by category

        query = Activity.query

        # Apply entity filters
        if lead_id and customer_uid:
            # Get activities for both lead and related customer
            query = query.filter(
                or_(Activity.lead_id == lead_id, Activity.customer_uid == customer_uid)
            )
        elif lead_id:
            query = query.filter(Activity.lead_id == lead_id)
        elif customer_uid:
            query = query.filter(Activity.customer_uid == customer_uid)

        # Apply category filter
        if category:
            query = query.filter(Activity.activity_category == category)

        # Only show visible activities
        query = query.filter(Activity.is_visible_to_bd == True)

        # Order by date (newest first)
        query = query.order_by(desc(Activity.date_created))

        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        return {
            'activities': self.schema_many.dump(pagination.items),
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page,
            'per_page': per_page
        }, HTTPStatus.OK


class ActivityStatsResource(Resource):
    """Resource for activity statistics"""
    
    def get(self):
        """Get activity statistics"""
        # Get counts by category
        manual_count = Activity.query.filter(Activity.activity_category == Activity.MANUAL).count()
        system_count = Activity.query.filter(Activity.activity_category == Activity.SYSTEM).count()
        automated_count = Activity.query.filter(Activity.activity_category == Activity.AUTOMATED).count()

        # Get recent activity count (last 7 days)
        from datetime import datetime, timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_count = Activity.query.filter(Activity.date_created >= week_ago).count()

        return {
            'total_activities': manual_count + system_count + automated_count,
            'manual_activities': manual_count,
            'system_activities': system_count,
            'automated_activities': automated_count,
            'recent_activities_7_days': recent_count
        }, HTTPStatus.OK 