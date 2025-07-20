from flask_restful import Resource
from flask import request
from api.models.activity import Activity
from api.models.lead import Lead
from api.models.customer import Customer
from api.models.contact import Contact
from api.schemas.activity_schema import ActivitySchema, ActivityCreateSchema, TaskCreateSchema, TaskUpdateSchema
from db.db_config import db
from http import HTTPStatus
from sqlalchemy import desc, and_, or_, asc
from datetime import datetime, timedelta

activity_schema = ActivitySchema()
activities_schema = ActivitySchema(many=True)

class ActivityListResource(Resource):
    def get(self):
        """Get activities with filtering, sorting, and pagination"""
        try:
            # Pagination parameters
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 20, type=int)
            per_page = min(per_page, 100)  # Limit max per_page
            
            # Sorting parameters
            sort_by = request.args.get('sort_by', 'date_created')
            sort_order = request.args.get('sort_order', 'desc')
            
            # Filter parameters
            lead_id = request.args.get('lead_id', type=int)
            activity_type = request.args.get('activity_type')
            activity_category = request.args.get('activity_category')
            status = request.args.get('status')
            assigned_to = request.args.get('assigned_to')
            
            # Task filtering
            tasks_only = request.args.get('tasks_only', 'false').lower() == 'true'
            overdue_only = request.args.get('overdue_only', 'false').lower() == 'true'
            
            # Date filtering
            due_date_filter = request.args.get('due_date_filter')  # 'today', 'week', 'month'
            
            # Get customer activities via lead relationship
            customer_uid = request.args.get('customer_uid', type=int)
            
            # Build query
            query = Activity.query
            
            # Apply filters
            if lead_id:
                query = query.filter(Activity.lead_id == lead_id)
                
            # For customer activities, find related lead(s)
            if customer_uid:
                # Get all leads associated with this customer via contact table
                contact_leads = db.session.query(Contact.lead_id).filter(
                    Contact.customer_uid == customer_uid
                ).subquery()
                query = query.filter(Activity.lead_id.in_(contact_leads))
            
            if activity_type:
                query = query.filter(Activity.activity_type == activity_type)
                
            if activity_category:
                query = query.filter(Activity.activity_category == activity_category)
                
            if status:
                query = query.filter(Activity.status == status)
                
            if assigned_to:
                query = query.filter(Activity.assigned_to == assigned_to)
                
            # Task filtering
            if tasks_only:
                query = query.filter(
                    or_(
                        Activity.status.in_(['pending', 'in_progress']),
                        Activity.due_date.isnot(None)
                    )
                )
                
            if overdue_only:
                query = query.filter(
                    and_(
                        Activity.due_date < datetime.utcnow(),
                        Activity.status.in_(['pending', 'in_progress'])
                    )
                )
                
            # Due date filtering
            if due_date_filter:
                today = datetime.utcnow().date()
                if due_date_filter == 'today':
                    query = query.filter(
                        db.func.date(Activity.due_date) == today
                    )
                elif due_date_filter == 'week':
                    week_end = today + timedelta(days=7)
                    query = query.filter(
                        and_(
                            Activity.due_date >= today,
                            db.func.date(Activity.due_date) <= week_end
                        )
                    )
                elif due_date_filter == 'month':
                    month_end = today + timedelta(days=30)
                    query = query.filter(
                        and_(
                            Activity.due_date >= today,
                            db.func.date(Activity.due_date) <= month_end
                        )
                    )
            
            # Apply sorting
            if hasattr(Activity, sort_by):
                sort_column = getattr(Activity, sort_by)
                if sort_order == 'desc':
                    query = query.order_by(desc(sort_column))
                else:
                    query = query.order_by(asc(sort_column))
            else:
                # Default sorting
                query = query.order_by(desc(Activity.date_created))
            
            # Execute query with pagination
            result = query.paginate(
                page=page, 
                per_page=per_page, 
                error_out=False
            )
            
            # Serialize results
            activities = activities_schema.dump(result.items)
            
            return {
                'activities': activities,
                'total': result.total,
                'pages': result.pages,
                'current_page': result.page,
                'per_page': result.per_page,
                'has_next': result.has_next,
                'has_prev': result.has_prev
            }, 200
            
        except Exception as e:
            return {'error': str(e)}, 500

    def post(self):
        """Create a new activity or task"""
        try:
            json_data = request.get_json()
            
            if not json_data:
                return {'error': 'No input data provided'}, 400
            
            # Validate required fields
            if not json_data.get('lead_id'):
                return {'error': 'lead_id is required'}, 400
                
            if not json_data.get('activity_type'):
                return {'error': 'activity_type is required'}, 400
                
            if not json_data.get('description'):
                return {'error': 'description is required'}, 400
            
            # Check if lead exists
            lead = Lead.query.get(json_data.get('lead_id'))
            if not lead:
                return {'error': 'Lead not found'}, 404
            
            # Determine if this is a task or activity based on presence of due_date
            if json_data.get('due_date'):
                # Create task
                due_date = datetime.fromisoformat(json_data['due_date'].replace('Z', '+00:00'))
                activity = Activity.create_task(
                    activity_type=json_data['activity_type'],
                    description=json_data['description'],
                    due_date=due_date,
                    lead_id=json_data['lead_id'],
                    priority=json_data.get('priority', 'medium'),
                    assigned_to=json_data.get('assigned_to')
                )
            else:
                # Create completed activity
                activity = Activity.create_manual_activity(
                    lead_id=json_data['lead_id'],
                    activity_type=json_data['activity_type'],
                    description=json_data['description'],
                    created_by=json_data.get('created_by')
                )
            
            db.session.commit()
            result = activity_schema.dump(activity)
            
            return result, 201
            
        except ValueError as e:
            return {'error': f'Invalid date format: {str(e)}'}, 400
        except Exception as e:
            return {'error': str(e)}, 500

class ActivityResource(Resource):
    def get(self, activity_id):
        """Get a specific activity"""
        try:
            activity = Activity.query.get(activity_id)
            if not activity:
                return {'error': 'Activity not found'}, 404
            
            result = activity_schema.dump(activity)
            return result, 200
        except Exception as e:
            return {'error': str(e)}, 500

    def put(self, activity_id):
        """Update an activity"""
        try:
            activity = Activity.query.get(activity_id)
            if not activity:
                return {'error': 'Activity not found'}, 404
            
            json_data = request.get_json()
            if not json_data:
                return {'error': 'No input data provided'}, 400
            
            # Update allowed fields
            if 'description' in json_data:
                activity.description = json_data['description']
            if 'due_date' in json_data:
                if json_data['due_date']:
                    activity.due_date = datetime.fromisoformat(json_data['due_date'].replace('Z', '+00:00'))
                else:
                    activity.due_date = None
            if 'priority' in json_data:
                activity.priority = json_data['priority']
            if 'assigned_to' in json_data:
                activity.assigned_to = json_data['assigned_to']
            if 'status' in json_data:
                activity.status = json_data['status']
                # If marking as completed, set completion date
                if json_data['status'] == 'completed' and not activity.date_completed:
                    activity.date_completed = datetime.utcnow()
            
            db.session.commit()
            result = activity_schema.dump(activity)
            
            return result, 200
        except ValueError as e:
            return {'error': f'Invalid date format: {str(e)}'}, 400
        except Exception as e:
            return {'error': str(e)}, 500

    def delete(self, activity_id):
        """Delete an activity"""
        try:
            activity = Activity.query.get(activity_id)
            if not activity:
                return {'error': 'Activity not found'}, 404
            
            db.session.delete(activity)
            db.session.commit()
            
            return {'message': 'Activity deleted successfully'}, 200
        except Exception as e:
            return {'error': str(e)}, 500

class ActivityTimelineResource(Resource):
    def get(self):
        """Get activity timeline for leads/customers"""
        try:
            # Parameters
            lead_id = request.args.get('lead_id', type=int)
            customer_uid = request.args.get('customer_uid', type=int)
            limit = request.args.get('limit', 50, type=int)
            
            query = Activity.query
            
            # Filter by lead or customer (via contact relationship)
            if lead_id and customer_uid:
                # Get all leads for this customer
                contact_leads = db.session.query(Contact.lead_id).filter(
                    Contact.customer_uid == customer_uid
                ).subquery()
                query = query.filter(
                    or_(Activity.lead_id == lead_id, Activity.lead_id.in_(contact_leads))
                )
            elif lead_id:
                query = query.filter(Activity.lead_id == lead_id)
            elif customer_uid:
                # Get all leads associated with this customer
                contact_leads = db.session.query(Contact.lead_id).filter(
                    Contact.customer_uid == customer_uid
                ).subquery()
                query = query.filter(Activity.lead_id.in_(contact_leads))
            else:
                return {'error': 'Either lead_id or customer_uid is required'}, 400
            
            # Order by date and limit
            activities = query.order_by(desc(Activity.date_created)).limit(limit).all()
            
            result = activities_schema.dump(activities)
            return {'activities': result}, 200
            
        except Exception as e:
            return {'error': str(e)}, 500

class TaskResource(Resource):
    def post(self, task_id):
        """Handle task operations (complete, cancel)"""
        try:
            action = request.args.get('action')
            if not action:
                return {'error': 'Action parameter required'}, 400
            
            activity = Activity.query.get(task_id)
            if not activity:
                return {'error': 'Task not found'}, 404
            
            json_data = request.get_json() or {}
            
            if action == 'complete':
                completion_notes = json_data.get('completion_notes')
                if activity.complete_task(completion_notes):
                    db.session.commit()
                    result = activity_schema.dump(activity)
                    return result, 200
                else:
                    return {'error': 'Task cannot be completed (invalid status)'}, 400
                    
            elif action == 'cancel':
                reason = json_data.get('reason')
                if activity.cancel_task(reason):
                    db.session.commit()
                    result = activity_schema.dump(activity)
                    return result, 200
                else:
                    return {'error': 'Task cannot be cancelled (invalid status)'}, 400
            else:
                return {'error': 'Invalid action. Use "complete" or "cancel"'}, 400
                
        except Exception as e:
            return {'error': str(e)}, 500

# Legacy task creation endpoint (now redirects to activity creation)
class TaskListResource(Resource):
    def post(self):
        """Create a task (legacy endpoint - redirects to activity creation with due_date)"""
        try:
            json_data = request.get_json()
            
            if not json_data:
                return {'error': 'No input data provided'}, 400
            
            # Ensure due_date is present for task creation
            if not json_data.get('due_date'):
                return {'error': 'due_date is required'}, 400
            
            # Validate required fields
            if not json_data.get('lead_id'):
                return {'error': 'lead_id is required'}, 400
                
            if not json_data.get('activity_type'):
                return {'error': 'activity_type is required'}, 400
                
            if not json_data.get('description'):
                return {'error': 'description is required'}, 400
            
            # Check if lead exists
            lead = Lead.query.get(json_data.get('lead_id'))
            if not lead:
                return {'error': 'Lead not found'}, 404
            
            # Create task using Activity model
            due_date = datetime.fromisoformat(json_data['due_date'].replace('Z', '+00:00'))
            activity = Activity.create_task(
                activity_type=json_data['activity_type'],
                description=json_data['description'],
                due_date=due_date,
                lead_id=json_data['lead_id'],
                priority=json_data.get('priority', 'medium'),
                assigned_to=json_data.get('assigned_to')
            )
            
            db.session.commit()
            result = activity_schema.dump(activity)
            
            return result, 201
            
        except ValueError as e:
            return {'error': f'Invalid date format: {str(e)}'}, 400
        except Exception as e:
            return {'error': str(e)}, 500


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