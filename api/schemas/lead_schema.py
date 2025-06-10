from marshmallow import Schema, fields, validate

class LeadSchema(Schema):
    lead_id = fields.Int(dump_only=True)
    full_name = fields.Str(required=True)
    title = fields.Str(allow_none=True)
    email = fields.Email(allow_none=True)
    telegram = fields.Str(allow_none=True)
    phone_number = fields.Str(allow_none=True)
    source = fields.Str(required=True, validate=validate.OneOf([
    'company', 'apollo', 'linkedin', 'hubspot', 'event', 'research', 'referral'
    ]))
    status = fields.Str(required=True, validate=validate.OneOf([
        '1. lead generated', '2. proposal', '3. negotiation', '4. registration', 
        '4. integration', '5. closed won', '6. lost'
    ]))
    company_name = fields.Str(required=True)
    country = fields.Str(allow_none=True)
    bd_in_charge = fields.Str(required=True)
    linkedin_url = fields.Str(allow_none=True)
    background = fields.Str(allow_none=True)
    date_created = fields.DateTime(dump_only=True)
    is_converted = fields.Boolean()
    type = fields.String(required=True)