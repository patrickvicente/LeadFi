from flask_restful import Resource
from flask import request
from api.models.customer import Customer
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
            if is_closed is not None:
                is_closed = is_closed.lower() == 'true'

            query = Customer.query      # start with all customers

            # Apply filters if present
            if customer_type:
                query = query.filter(Customer.type == customer_type)
            if is_closed:
                query = query.filter(Customer.is_closed == is_closed)
            
            # Paginate the results
            pagination = query.paginate(page=page, per_page=per_page)
            
            # Return paginated, serialized results
            return {
                'customer': self.schema_many.dump(pagination.items),
                'total': pagination.total,
                'pages': pagination.pages,
                'current_page': page
            }, HTTPStatus.OK
        
        # If a UID is provided, return single customer or 404 if not found
        customer = Customer.query.get_or_404(customer_uid)
        return {'customer': self.schema.dump(customer)}, HTTPStatus.OK
    
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
            return {'customer': self.schema.dump(customer)}, HTTPStatus.OK
        
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
        