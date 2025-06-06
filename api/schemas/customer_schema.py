from marshmallow import Schema, fields

class CustomerSchema(Schema):
    customer_uid = fields.Int(required=True)
    type = fields.String(allow_none=True) 
    name = fields.String(required=True)
    country = fields.String(allow_none=True)
    is_closed = fields.Boolean(allow_none=True)
    date_closed = fields.String(allow_none=True)
    date_created = fields.DateTime(dump_only=True)