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
from api.exceptions import ValidationError, NotFoundError, DatabaseError, ConflictError
from api.utils.logging_config import get_logger, log_database_operation
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from marshmallow import ValidationError as MarshmallowValidationError

logger = get_logger(__name__)

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
        try:
            if id is None:
                # Handle list endpoint with pagination, filtering, and sorting
                page = request.args.get('page', 1, type=int)
                per_page = request.args.get('per_page', 20, type=int)
                status = request.args.get('status')
                source = request.args.get('source')
                search = request.args.get('search')
                sort_by = request.args.get('sort_by')
                sort_order = request.args.get('sort_order', 'desc')

                # Validate pagination parameters
                if page < 1:
                    raise ValidationError("Page number must be greater than 0")
                if per_page < 1 or per_page > 100:
                    raise ValidationError("Per page must be between 1 and 100")

                query = Lead.query

                # Apply filters if present
                if status:
                    query = query.filter(Lead.status == status)
                if source:
                    query = query.filter(Lead.source == source)
                if search:
                    search_term = f"%{search}%"
                    query = query.filter(
                        db.or_(
                            Lead.full_name.ilike(search_term),
                            Lead.company_name.ilike(search_term),
                            Lead.email.ilike(search_term)
                        )
                    )

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
                try:
                    pagination = query.paginate(page=page, per_page=per_page)
                except Exception as e:
                    logger.error(f"Pagination error: {e}")
                    raise DatabaseError("Error retrieving leads", e)

                log_database_operation("SELECT", "lead", {
                    'filters': {'status': status, 'source': source, 'search': search},
                    'pagination': {'page': page, 'per_page': per_page}
                })

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
            lead = Lead.query.get(id)
            if not lead:
                raise NotFoundError("Lead", str(id))
            
            log_database_operation("SELECT", "lead", {'lead_id': id})
            return {'lead': self.schema.dump(lead)}, HTTPStatus.OK

        except (ValidationError, NotFoundError) as e:
            raise e
        except Exception as e:
            logger.error(f"Unexpected error in get_leads: {e}", exc_info=True)
            raise DatabaseError("Error retrieving leads", e)

    def post(self, id=None):
        """
        POST /api/leads          - Create a new lead
        POST /api/leads/<id>     - Convert lead to customer
        """
        try:
            if id is None: 
                # Create new lead
                json_data = request.get_json()
                if not json_data:
                    raise ValidationError("No input data provided")

                try:
                    errors = self.schema.validate(json_data)
                    if errors:
                        raise ValidationError("Validation failed", errors)
                except MarshmallowValidationError as e:
                    raise ValidationError("Validation failed", e.messages)

                try:
                    lead = Lead(**json_data)
                    db.session.add(lead)
                    db.session.commit()
                    
                    log_database_operation("INSERT", "lead", {'lead_id': lead.lead_id})
                    logger.info(f"Lead created successfully: {lead.lead_id}")
                    
                    return {'lead': self.schema.dump(lead)}, HTTPStatus.CREATED
                    
                except IntegrityError as e:
                    db.session.rollback()
                    logger.error(f"Integrity error creating lead: {e}")
                    if 'email' in str(e.orig):
                        raise ConflictError("Email already exists", "email")
                    elif 'telegram' in str(e.orig):
                        raise ConflictError("Telegram handle already exists", "telegram")
                    else:
                        raise ConflictError("Lead data conflicts with existing record")
                except SQLAlchemyError as e:
                    db.session.rollback()
                    logger.error(f"Database error creating lead: {e}")
                    raise DatabaseError("Error creating lead", e)
        
            else:
                # Convert lead to customer
                lead = Lead.query.get(id)
                if not lead:
                    raise NotFoundError("Lead", str(id))
                
                if lead.is_converted:
                    raise ConflictError("Lead has already been converted to customer")

                json_data = request.get_json()
                if not json_data:
                    raise ValidationError("No input data provided")

                try:
                    errors = self.customer_schema.validate(json_data)
                    if errors:
                        raise ValidationError("Customer validation failed", errors)
                except MarshmallowValidationError as e:
                    raise ValidationError("Customer validation failed", e.messages)

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

                    log_database_operation("INSERT", "customer", {'customer_uid': customer.customer_uid})
                    log_database_operation("INSERT", "contact", {'lead_id': lead.lead_id, 'customer_uid': customer.customer_uid})
                    log_database_operation("UPDATE", "lead", {'lead_id': lead.lead_id, 'converted': True})
                    
                    logger.info(f"Lead {id} converted to customer {customer.customer_uid}")

                    return {
                        'message': 'Lead successfully converted to customer',
                        'customer': self.customer_schema.dump(customer),
                        'contact': self.contact_schema.dump(contact)
                    }, HTTPStatus.OK
                
                except IntegrityError as e:
                    db.session.rollback()
                    logger.error(f"Integrity error converting lead: {e}")
                    if 'customer_uid' in str(e.orig):
                        raise ConflictError("Customer UID already exists", "customer_uid")
                    else:
                        raise ConflictError("Customer data conflicts with existing record")
                except SQLAlchemyError as e:
                    db.session.rollback()
                    logger.error(f"Database error converting lead: {e}")
                    raise DatabaseError("Error converting lead to customer", e)
                
        except (ValidationError, NotFoundError, ConflictError, DatabaseError) as e:
            raise e
        except Exception as e:
            logger.error(f"Unexpected error in post_lead: {e}", exc_info=True)
            raise DatabaseError("Unexpected error processing request", e)

    def put(self, id):
        """
        PUT /api/leads/<id>
        Update an existing lead by ID.
        """
        try:
            lead = Lead.query.get(id)
            if not lead:
                raise NotFoundError("Lead", str(id))
            
            json_data = request.get_json()
            if not json_data:
                raise ValidationError("No input data provided")

            # Validate input data (partial=True allows partial updates)
            try:
                errors = self.schema.validate(json_data, partial=True)
                if errors:
                    raise ValidationError("Validation failed", errors)
            except MarshmallowValidationError as e:
                raise ValidationError("Validation failed", e.messages)

            try:
                # Update lead fields with provided data
                for key, value in json_data.items():
                    setattr(lead, key, value)
                db.session.commit()
                
                log_database_operation("UPDATE", "lead", {'lead_id': id, 'fields': list(json_data.keys())})
                logger.info(f"Lead {id} updated successfully")
                
                # Return the updated lead, serialized
                return {'lead': self.schema.dump(lead)}, HTTPStatus.OK

            except IntegrityError as e:
                db.session.rollback()
                logger.error(f"Integrity error updating lead: {e}")
                if 'email' in str(e.orig):
                    raise ConflictError("Email already exists", "email")
                elif 'telegram' in str(e.orig):
                    raise ConflictError("Telegram handle already exists", "telegram")
                else:
                    raise ConflictError("Lead data conflicts with existing record")
            except SQLAlchemyError as e:
                db.session.rollback()
                logger.error(f"Database error updating lead: {e}")
                raise DatabaseError("Error updating lead", e)

        except (ValidationError, NotFoundError, ConflictError, DatabaseError) as e:
            raise e
        except Exception as e:
            logger.error(f"Unexpected error in put_lead: {e}", exc_info=True)
            raise DatabaseError("Unexpected error updating lead", e)

    def delete(self, id):
        """
        DELETE /api/leads/<id>
        Delete a lead by ID.
        """
        try:
            lead = Lead.query.get(id)
            if not lead:
                raise NotFoundError("Lead", str(id))
            
            try:
                db.session.delete(lead)
                db.session.commit()
                
                log_database_operation("DELETE", "lead", {'lead_id': id})
                logger.info(f"Lead {id} deleted successfully")
                
                # Return empty response with 204 No Content
                return '', HTTPStatus.NO_CONTENT
                
            except SQLAlchemyError as e:
                db.session.rollback()
                logger.error(f"Database error deleting lead: {e}")
                raise DatabaseError("Error deleting lead", e)

        except (NotFoundError, DatabaseError) as e:
            raise e
        except Exception as e:
            logger.error(f"Unexpected error in delete_lead: {e}", exc_info=True)
            raise DatabaseError("Unexpected error deleting lead", e)