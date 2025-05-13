from marshmallow import Schema, fields

class ContactSchema(Schema):
    contact_id = fields.Int(dump_only=True)
    customer_uid = fields.Str(required=True)
    lead_id = fields.Int(required=True)
    is_primary_contact = fields.Boolean()
    date_added = fields.DateTime(dump_only=True)