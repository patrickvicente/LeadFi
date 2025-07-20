from marshmallow import Schema, fields, validate, post_load
from datetime import datetime
import os

class CustomerSchema(Schema):
    customer_uid = fields.Int(required=True)
    name = fields.String(required=True)
    registered_email = fields.Email(allow_none=True)
    type = fields.String(allow_none=True) 
    country = fields.String(allow_none=True)
    is_closed = fields.Boolean(allow_none=True)
    date_closed = fields.String(allow_none=True)
    
    # Conditional date_created field - only writable in demo mode
    date_created = fields.DateTime(dump_only=True)
    _demo_date_created = fields.DateTime(load_only=True, data_key='date_created')
    
    @post_load
    def handle_date_created(self, data, **kwargs):
        """Handle date_created override in demo mode."""
        # Check if we're in demo mode and date_created was provided
        is_demo_mode = os.getenv('DEMO_MODE', 'false').lower() == 'true'
        
        if is_demo_mode and '_demo_date_created' in data:
            # In demo mode, allow date_created override
            data['date_created'] = data.pop('_demo_date_created')
        else:
            # In production, remove any date_created attempts
            data.pop('_demo_date_created', None)
            # date_created will use database DEFAULT CURRENT_TIMESTAMP
            
        return data