from flask_restful import Resource
from flask import request
from api.models.lead import Lead           # Updated import path
from api.schemas.lead_schema import LeadSchema  # Updated import path
from db.db_config import db            # Updated import path
from http import HTTPStatus            # For readable HTTP status codes

class LeadResource(Resource):
    def __init__(self):
        # Initialize Marshmallow schemas for single and multiple leads
        self.schema = LeadSchema()
        self.schema_many = LeadSchema(many=True)

    def get(self, id=None):
        """
        GET /api/leads           - List leads (with optional pagination/filtering)
        GET /api/leads/<id>      - Get a single lead by ID
        """
        if id is None:
            # Handle list endpoint with pagination and filtering
            page = request.args.get('page', 1, type=int)         # Page number (default 1)
            per_page = request.args.get('per_page', 10, type=int) # Items per page (default 10)
            status = request.args.get('status')                  # Optional filter by status
            source = request.args.get('source')                  # Optional filter by source

            query = Lead.query                                   # Start with all leads

            # Apply filters if present
            if status:
                query = query.filter(Lead.status == status)
            if source:
                query = query.filter(Lead.source == source)

            # Paginate the results
            pagination = query.paginate(page=page, per_page=per_page)

            # Return paginated, serialized results
            return {
                'leads': self.schema_many.dump(pagination.items),
                'total': pagination.total,
                'pages': pagination.pages,
                'current_page': page
            }, HTTPStatus.OK

        # If an ID is provided, return a single lead or 404 if not found
        lead = Lead.query.get_or_404(id)
        return {'lead': self.schema.dump(lead)}, HTTPStatus.OK

    def post(self):
        """
        POST /api/leads
        Create a new lead from JSON request data.
        """
        json_data = request.get_json()

        # Validate input data using Marshmallow schema
        errors = self.schema.validate(json_data)
        if errors:
            return {'errors': errors}, HTTPStatus.BAD_REQUEST

        try:
            # Create a new Lead instance and add to the session
            lead = Lead(**json_data)
            db.session.add(lead)
            db.session.commit()
            # Return the created lead, serialized
            return {'lead': self.schema.dump(lead)}, HTTPStatus.CREATED

        except Exception as e:
            # Rollback in case of error and return error message
            db.session.rollback()
            return {'message': 'Error creating lead', 'error': str(e)}, HTTPStatus.INTERNAL_SERVER_ERROR

    def put(self, id):
        """
        PUT /api/leads/<id>
        Update an existing lead by ID.
        """
        lead = Lead.query.get_or_404(id)  # Fetch the lead or return 404
        json_data = request.get_json()

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