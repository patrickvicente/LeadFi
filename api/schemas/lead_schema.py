from marshmallow import Schema, fields, validate, post_load
from datetime import datetime
import os
from api.utils.demo_mode import is_demo_mode

class LeadSchema(Schema):
    """Schema for Lead model with conditional date_created override."""
    
    lead_id = fields.Int(dump_only=True)
    full_name = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    title = fields.Str(validate=validate.Length(max=50))
    email = fields.Email(validate=validate.Length(max=120))
    telegram = fields.Str(validate=validate.Length(max=50))
    phone_number = fields.Str(validate=validate.Length(max=20))
    source = fields.Str(required=True, validate=validate.OneOf([
        'company', 'apollo', 'linkedin', 'hubspot', 'event', 'research', 'referral'
    ]))
    status = fields.Str(validate=validate.OneOf([
        '1. lead generated', '2. proposal', '3. negotiation', 
        '4. registration', '5. integration', '6. closed won', '7. lost'
    ]))
    
    # Conditional date_created field - only writable in demo mode
    date_created = fields.DateTime(dump_only=True)
    _demo_date_created = fields.DateTime(load_only=True, data_key='date_created')
    
    linkedin_url = fields.Url(validate=validate.Length(max=255))
    company_name = fields.Str(validate=validate.Length(max=120))
    country = fields.Str(validate=validate.Length(max=50))
    bd_in_charge = fields.Str(required=True, validate=validate.Length(max=20))
    background = fields.Str()
    is_converted = fields.Bool(dump_only=True)
    type = fields.Str(required=True, validate=validate.OneOf([
        'liquidity provider', 'vip', 'institution', 'api', 'broker',
        'otc', 'project mm', 'asset manager', 'venture capital',
        'prop trader', 'family office', 'hft', 'other'
    ]))
    
    @post_load
    def handle_date_created(self, data, **kwargs):
        """Handle date_created override in demo mode."""
        # Check if we're in demo mode using centralized utility
        demo_mode_active = is_demo_mode()
        
        if demo_mode_active and '_demo_date_created' in data:
            # In demo mode, allow date_created override
            data['date_created'] = data.pop('_demo_date_created')
        else:
            # In production, remove any date_created attempts
            data.pop('_demo_date_created', None)
            # date_created will use database DEFAULT CURRENT_TIMESTAMP
            
        return data