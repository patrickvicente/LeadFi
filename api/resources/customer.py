from flask_restful import Resource
from flask import request
from api.models.customer import Customer
from api.models.lead import Lead
from api.models.contact import Contact
from api.schemas.customer_schema import CustomerSchema
from db.db_config import db
from http import HTTPStatus

class CustomerResource(Resource):
    def __init__(self):
        # Init schemas for single and multiple customers
        self.schema = CustomerSchema()
        self.schema_many = CustomerSchema(many=True)

    def get(self, customer_uid=None):
        """
        GET /api/customers       - List customers (with opt pagination/filtering)
        GET /api/customers/<customer_uid>  - Get a single customer by UID
        """
        if customer_uid is None:
            # Handle list endpoint with pagination and filtering
            page = request.args.get('page', 1, type=int)            # Page number default 1
            per_page = request.args.get('per_page', 20, type=int)   # Items per page default 20
            customer_type = request.args.get('customer_type')       # Optional filter by type
            is_closed = request.args.get('is_closed')               # Optional filter by closed status
            sort_by = request.args.get('sort_by')                   # Sort field
            sort_order = request.args.get('sort_order', 'desc')     # Sort direction
            
            if is_closed is not None:
                is_closed = is_closed.lower() == 'true'

            query = Customer.query      # start with all customers

            # Apply filters if present
            if customer_type:
                query = query.filter(Customer.type == customer_type)
            if is_closed:
                query = query.filter(Customer.is_closed == is_closed)
            
            # Handle sorting
            if sort_by:
                # Map frontend field names to database fields/expressions
                sort_field_mapping = {
                    'lead_status': 'lead_status',
                    'date_converted': 'date_converted',
                    'name': Customer.name,
                    'customer_uid': Customer.customer_uid,
                    'country': Customer.country,
                    'type': Customer.type,
                    'date_created': Customer.date_created
                }
                
                if sort_by in ['lead_status', 'date_converted']:
                    # For lead-related fields, we need to join with contact and lead tables
                    query = query.outerjoin(
                        Contact,
                        (Contact.customer_uid == Customer.customer_uid) & 
                        (Contact.is_primary_contact == True)
                    ).outerjoin(
                        Lead,
                        Lead.lead_id == Contact.lead_id
                    )
                    
                    if sort_by == 'lead_status':
                        sort_column = Lead.status
                    elif sort_by == 'date_converted':
                        sort_column = Contact.date_added
                        
                elif sort_by in sort_field_mapping:
                    sort_column = sort_field_mapping[sort_by]
                else:
                    sort_column = Customer.date_created  # Default fallback
                
                # Apply sorting
                if sort_order.lower() == 'asc':
                    query = query.order_by(sort_column.asc())
                else:
                    query = query.order_by(sort_column.desc())
            else:
                # Default sorting by date_created DESC
                query = query.order_by(Customer.date_created.desc())
            
            # Paginate the results
            pagination = query.paginate(page=page, per_page=per_page)
            
            # Convert to dict with lead information
            customers_data = [customer.to_dict(include_leads=False) for customer in pagination.items]
            
            # Return paginated, serialized results
            return {
                'customer': customers_data,
                'total': pagination.total,
                'pages': pagination.pages,
                'current_page': page
            }, HTTPStatus.OK
        
        # If a UID is provided, return single customer with related leads
        customer = Customer.query.get_or_404(customer_uid)
        return {'customer': customer.to_dict(include_leads=True)}, HTTPStatus.OK
    
    def put(self, customer_uid):
        """
        PUT /api/customers/<customer_uid> - Updated an existing customer by UID
        """
        customer = Customer.query.get_or_404(customer_uid)
        json_data = request.get_json()
        if not json_data:
            return {'message': 'No input data provided'}, HTTPStatus.BAD_REQUEST

        # validate input data
        errors = self.schema.validate(json_data, partial=True)
        if errors:
            return {'errors': errors}, HTTPStatus.BAD_REQUEST
        
        try:
            for key, value in json_data.items():
                setattr(customer, key, value)
            db.session.commit()
            return {'customer': customer.to_dict(include_leads=True)}, HTTPStatus.OK
        
        except Exception as e:
            db.session.rollback()
            return {'message': 'Error updating customer', 'error': str(e)}, HTTPStatus.INTERNAL_SERVER_ERROR
    
    def delete(self, customer_uid):
        """
        DELETE /api/customers/<customer_uid> - Delete a customer by UID
        """
        customer = Customer.query.get_or_404(customer_uid)  # Fetch the customer or return 404 if not found
        try:
            # Delete the customer from the database
            db.session.delete(customer)    
            db.session.commit()

            # Return empty response with 204 NO Content
            return '', HTTPStatus.NO_CONTENT
            
        except Exception as e:
            # Rollback the transaction in case of an error
            db.session.rollback()
            # Return an error response
            return {'message': 'Error deleting customer', 'error': str(e)}, HTTPStatus.INTERNAL_SERVER_ERROR
        