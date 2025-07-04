from flask_restful import Resource
from flask import request
from api.models.lead import Lead           
from api.models.customer import Customer
from api.models.contact import Contact
from api.schemas.lead_schema import LeadSchema  
from api.schemas.customer_schema import CustomerSchema
from api.schemas.contact_schema import ContactSchema
from db.db_config import db            
from http import HTTPStatus            # For readable HTTP status codes

class LeadResource(Resource):
    def __init__(self):
        # Initialize Marshmallow schemas for single and multiple leads
        self.schema = LeadSchema()
        self.schema_many = LeadSchema(many=True)
        # schema for conversion
        self.customer_schema = CustomerSchema()
        self.contact_schema = ContactSchema()

    def get(self, id=None):
        """
        GET /api/leads           - List leads (with optional pagination/filtering/sorting)
        GET /api/leads/<id>      - Get a single lead by ID
        """
        if id is None:
            # Handle list endpoint with pagination, filtering, and sorting
            page = request.args.get('page', 1, type=int)         # Page number (default 1)
            per_page = request.args.get('per_page', 10, type=int) # Items per page (default 10)
            status = request.args.get('status')                  # Optional filter by status
            source = request.args.get('source')                  # Optional filter by source
            is_converted = request.args.get('is_converted')       # Optional filter by conversion status
            
            # Sorting parameters
            sort_by = request.args.get('sort_by')                # Field to sort by
            sort_order = request.args.get('sort_order', 'asc')   # asc or desc (default asc)

            query = Lead.query                                   # Start with all leads

            # Apply filters if present
            if status:
                query = query.filter(Lead.status == status)
            if source:
                query = query.filter(Lead.source == source)
            if is_converted is not None:
                # Convert string 'true'/'false' to boolean
                if is_converted.lower() == 'true':
                    query = query.filter(Lead.is_converted == True)
                elif is_converted.lower() == 'false':
                    query = query.filter(Lead.is_converted == False)

            # Apply sorting if requested
            if sort_by:
                # Map frontend field names to model attributes if needed
                field_mapping = {
                    'date_created': Lead.date_created,
                    'status': Lead.status,
                    'full_name': Lead.full_name,
                    'company_name': Lead.company_name,
                    'type': Lead.type,
                    'source': Lead.source,
                    'bd_in_charge': Lead.bd_in_charge
                }
                
                if sort_by in field_mapping:
                    sort_field = field_mapping[sort_by]
                    
                    if sort_order.lower() == 'desc':
                        query = query.order_by(sort_field.desc())
                    else:
                        query = query.order_by(sort_field.asc())
                else:
                    # If invalid sort field, just ignore and use default ordering
                    query = query.order_by(Lead.date_created.desc())
            else:
                # Default ordering by date_created descending (newest first)
                query = query.order_by(Lead.date_created.desc())

            # Paginate the results
            pagination = query.paginate(page=page, per_page=per_page)

            # Return paginated, serialized results
            return {
                'leads': self.schema_many.dump(pagination.items),
                'total': pagination.total,
                'pages': pagination.pages,
                'current_page': page,
                'sort_by': sort_by,
                'sort_order': sort_order
            }, HTTPStatus.OK

        # If an ID is provided, return a single lead or 404 if not found
        lead = Lead.query.get_or_404(id)
        return {'lead': self.schema.dump(lead)}, HTTPStatus.OK

    def post(self, id=None):
        if id is None: 
            json_data = request.get_json()
            errors = self.schema.validate(json_data)
            if errors:
                return {'errors': errors}, HTTPStatus.BAD_REQUEST

            try:
                lead = Lead(**json_data)
                db.session.add(lead)
                db.session.commit()
                return {'lead': self.schema.dump(lead)}, HTTPStatus.CREATED
            except Exception as e:
                db.session.rollback()
                return {'message': 'Error creating lead', 'error': str(e)}, HTTPStatus.INTERNAL_SERVER_ERROR
        
        try:
            lead = Lead.query.get_or_404(id)
            if lead.is_converted:
                return {'message': 'Lead has already been converted as a customer'}, HTTPStatus.BAD_REQUEST

            json_data = request.get_json()
            if not json_data:
                return {'message': 'No input data provided'}, HTTPStatus.BAD_REQUEST

            errors = self.customer_schema.validate(json_data)
            if errors:
                return {'message': 'Validation error', 'errors': errors}, HTTPStatus.BAD_REQUEST

            try:
                customer = Customer(**json_data)
                db.session.add(customer)
                
                contact = Contact(
                    customer_uid=customer.customer_uid,
                    lead_id=lead.lead_id
                )
                db.session.add(contact)
                
                lead.is_converted = True
                db.session.commit()

                return {
                    'message': 'Lead successfully converted to customer',
                    'customer': self.customer_schema.dump(customer),
                    'contact': self.contact_schema.dump(contact)
                }, HTTPStatus.OK
            
            except Exception as e:
                db.session.rollback()
                return {'message': 'Error converting lead to customer', 'error': str(e)}, HTTPStatus.INTERNAL_SERVER_ERROR
                
        except Exception as e:
            return {'message': 'Error processing request', 'error': str(e)}, HTTPStatus.INTERNAL_SERVER_ERROR

    def put(self, id):
        """
        PUT /api/leads/<id>
        Update an existing lead by ID.
        """
        lead = Lead.query.get_or_404(id)  # Fetch the lead or return 404
        json_data = request.get_json()
        if not json_data:
            return {'message': 'No input data provided'}, HTTPStatus.BAD_REQUEST

        # Validate input data (partial=True allows partial updates)
        errors = self.schema.validate(json_data, partial=True)
        if errors:
            return {'errors': errors}, HTTPStatus.BAD_REQUEST

        try:
            # Update lead fields with provided data
            for key, value in json_data.items():
                setattr(lead, key, value)
            db.session.commit()
            # Return the updated lead, serialized
            return {'lead': self.schema.dump(lead)}, HTTPStatus.OK

        except Exception as e:
            db.session.rollback()
            return {'message': 'Error updating lead', 'error': str(e)}, HTTPStatus.INTERNAL_SERVER_ERROR

    def delete(self, id):
        """
        DELETE /api/leads/<id>
        Delete a lead by ID.
        """
        lead = Lead.query.get_or_404(id)  # Fetch the lead or return 404
        try:
            db.session.delete(lead)
            db.session.commit()
            # Return empty response with 204 No Content
            return '', HTTPStatus.NO_CONTENT
        except Exception as e:
            db.session.rollback()
            return {'message': 'Error deleting lead', 'error': str(e)}, HTTPStatus.INTERNAL_SERVER_ERROR