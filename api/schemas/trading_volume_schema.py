from marshmallow import Schema, fields, validate

class TradingVolumeSchema(Schema):
    # Primary key fields (composite)
    date = fields.Date(required=True, dump_only=True)
    customer_uid = fields.Int(required=True, dump_only=True) 
    trade_type = fields.String(required=True, dump_only=True, validate=validate.OneOf(['spot', 'futures']))
    trade_side = fields.String(required=True, dump_only=True, validate=validate.OneOf(['maker', 'taker']))
    
    # Data fields - using Float instead of Decimal for JSON serialization
    customer_name = fields.String(required=True, dump_only=True)
    volume = fields.Float(required=True, dump_only=True)
    fees = fields.Float(required=True, dump_only=True)
    bd_in_charge = fields.String(required=True, dump_only=True)

class TradingVolumeQuerySchema(Schema):
    """Schema for query parameters when fetching trading volume data"""
    start_date = fields.Date(allow_none=True)
    end_date = fields.Date(allow_none=True)
    customer_uid = fields.Int(allow_none=True)
    trade_type = fields.String(allow_none=True, validate=validate.OneOf(['spot', 'futures']))
    trade_side = fields.String(allow_none=True, validate=validate.OneOf(['maker', 'taker']))
    bd_in_charge = fields.String(allow_none=True)
    page = fields.Int(allow_none=True, validate=validate.Range(min=1), load_default=1)
    per_page = fields.Int(allow_none=True, validate=validate.Range(min=1, max=100), load_default=20)
