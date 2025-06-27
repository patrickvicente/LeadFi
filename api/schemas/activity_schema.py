from marshmallow import Schema, fields, validate, validates_schema, ValidationError

class ActivitySchema(Schema):
    activity_id = fields.Int(dump_only=True)
    lead_id = fields.Int(allow_none=True)
    customer_uid = fields.Int(allow_none=True)
    activity_type = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    activity_category = fields.Str(validate=validate.OneOf(['manual', 'system', 'automated']))
    description = fields.Str(allow_none=True)
    activity_metadata = fields.Dict(allow_none=True)  # JSON field
    date_created = fields.DateTime(dump_only=True)
    created_by = fields.Str(allow_none=True, validate=validate.Length(max=50))
    is_visible_to_bd = fields.Boolean()
    
    # Task-related fields
    due_date = fields.DateTime(allow_none=True)
    status = fields.Str(validate=validate.OneOf(['pending', 'in_progress', 'completed', 'cancelled']))
    priority = fields.Str(validate=validate.OneOf(['low', 'medium', 'high']))
    assigned_to = fields.Str(allow_none=True, validate=validate.Length(max=50))
    date_completed = fields.DateTime(dump_only=True)
    
    # Additional computed fields for frontend
    related_entity_name = fields.Method('get_related_entity_name', dump_only=True)
    related_entity_type = fields.Method('get_related_entity_type', dump_only=True)
    is_overdue = fields.Method('get_is_overdue', dump_only=True)
    is_task = fields.Method('get_is_task', dump_only=True)
    
    def get_related_entity_name(self, obj):
        """Get the related entity name by calling the model method"""
        return obj.get_related_entity_name()
    
    def get_related_entity_type(self, obj):
        """Get the related entity type by calling the model method"""
        return obj.get_related_entity_type()
    
    def get_is_overdue(self, obj):
        """Get the is_overdue status by calling the model method"""
        return obj.is_overdue()
    
    def get_is_task(self, obj):
        """Get the is_task status by calling the model method"""
        return obj.is_task()

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
    created_by = fields.Str(allow_none=True)

    @validates_schema
    def validate_entity_relationship(self, data, **kwargs):
        """Ensure at least one of lead_id or customer_uid is provided"""
        if not data.get('lead_id') and not data.get('customer_uid'):
            raise ValidationError('Either lead_id or customer_uid must be provided')

class TaskCreateSchema(Schema):
    """Schema for creating new tasks"""
    lead_id = fields.Int(allow_none=True)
    customer_uid = fields.Int(allow_none=True)
    activity_type = fields.Str(required=True)
    description = fields.Str(required=True)
    due_date = fields.DateTime(required=True)
    priority = fields.Str(validate=validate.OneOf(['low', 'medium', 'high']), load_default='medium')
    assigned_to = fields.Str(allow_none=True)  # Will default to lead/customer bd_in_charge if not provided

    @validates_schema
    def validate_entity_relationship(self, data, **kwargs):
        """Ensure at least one of lead_id or customer_uid is provided"""
        if not data.get('lead_id') and not data.get('customer_uid'):
            raise ValidationError('Either lead_id or customer_uid must be provided')

class TaskUpdateSchema(Schema):
    """Schema for updating tasks"""
    description = fields.Str(allow_none=True)
    due_date = fields.DateTime(allow_none=True)
    priority = fields.Str(validate=validate.OneOf(['low', 'medium', 'high']), allow_none=True)
    assigned_to = fields.Str(allow_none=True)
    status = fields.Str(validate=validate.OneOf(['pending', 'in_progress', 'completed', 'cancelled']), allow_none=True)

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