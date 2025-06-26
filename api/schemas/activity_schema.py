from marshmallow import Schema, fields, validate, validates_schema, ValidationError

class ActivitySchema(Schema):
    activity_id = fields.Int(dump_only=True)
    lead_id = fields.Int(allow_none=True)
    customer_uid = fields.Int(allow_none=True)
    activity_type = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    activity_category = fields.Str(validate=validate.OneOf(['manual', 'system', 'automated']))
    description = fields.Str(allow_none=True)
    metadata = fields.Dict(allow_none=True)  # JSON field
    date_created = fields.DateTime(dump_only=True)
    bd_in_charge = fields.Str(allow_none=True, validate=validate.Length(max=20))
    created_by = fields.Str(allow_none=True, validate=validate.Length(max=50))
    is_visible_to_bd = fields.Boolean()
    
    # Additional computed fields for frontend
    related_entity_name = fields.Str(dump_only=True)
    related_entity_type = fields.Str(dump_only=True)

    @validates_schema
    def validate_entity_relationship(self, data, **kwargs):
        """Ensure at least one of lead_id or customer_uid is provided"""
        if not data.get('lead_id') and not data.get('customer_uid'):
            raise ValidationError('Either lead_id or customer_uid must be provided')

class ActivityCreateSchema(Schema):
    """Schema for creating new activities"""
    lead_id = fields.Int(allow_none=True)
    customer_uid = fields.Int(allow_none=True) 
    activity_type = fields.Str(required=True)
    description = fields.Str(required=True)
    bd_in_charge = fields.Str(allow_none=True)

    @validates_schema
    def validate_entity_relationship(self, data, **kwargs):
        """Ensure at least one of lead_id or customer_uid is provided"""
        if not data.get('lead_id') and not data.get('customer_uid'):
            raise ValidationError('Either lead_id or customer_uid must be provided')

class SystemActivitySchema(Schema):
    """Schema for system-generated activities"""
    lead_id = fields.Int(allow_none=True)
    customer_uid = fields.Int(allow_none=True)
    activity_type = fields.Str(required=True)
    description = fields.Str(required=True)
    metadata = fields.Dict(allow_none=True)
    created_by = fields.Str(allow_none=True)

    @validates_schema
    def validate_entity_relationship(self, data, **kwargs):
        """Ensure at least one of lead_id or customer_uid is provided"""
        if not data.get('lead_id') and not data.get('customer_uid'):
            raise ValidationError('Either lead_id or customer_uid must be provided') 