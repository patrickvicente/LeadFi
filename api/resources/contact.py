from flask_restful import Resource
from flask import request
from api.models.contact import Contact
from api.schemas.contact_schema import ContactSchema
from db.db_config import db
from http import HTTPStatus

class ContactResource(Resource):
    def __init__(self):
        self.schema = ContactSchema()
        self.schema_many = ContactSchema(many=True)

    def get(self, contact_id=None):
        if contact_id is None:
            # List contacts with pagination and filtering
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 10, type=int)
            customer_uid = request.args.get('customer_uid')

            query = Contact.query

            if customer_uid:
                query = query.filter(Contact.customer_uid == customer_uid)

            pagination = query.paginate(page=page, per_page=per_page)
            return {
                'contacts': self.schema_many.dump(pagination.items),
                'total': pagination.total,
                'pages': pagination.pages,
                'current_page': page
            }, HTTPStatus.OK

        contact = Contact.query.get_or_404(contact_id)
        return {'contact': self.schema.dump(contact)}, HTTPStatus.OK

    def put(self, contact_id):
        contact = Contact.query.get_or_404(contact_id)
        json_data = request.get_json()

        # Only allow updating is_primary_contact
        if 'is_primary_contact' not in json_data:
            return {'message': 'Only is_primary_contact can be updated'}, HTTPStatus.BAD_REQUEST

        try:
            contact.is_primary_contact = json_data['is_primary_contact']
            db.session.commit()
            return {'contact': self.schema.dump(contact)}, HTTPStatus.OK
        except Exception as e:
            db.session.rollback()
            return {'message': 'Error updating contact', 'error': str(e)}, HTTPStatus.INTERNAL_SERVER_ERROR