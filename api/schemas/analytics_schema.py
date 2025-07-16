from marshmallow import Schema, fields, validate

class ActivityAnalyticsSchema(Schema):
    """Schema for activity analytics data"""
    period = fields.String(required=True, dump_only=True)
    bd_in_charge = fields.String(required=True, dump_only=True)
    total_activities = fields.Int(required=True, dump_only=True)
    activity_by_type = fields.Dict(keys=fields.String(), values=fields.Int(), dump_only=True)
    activity_by_status = fields.Dict(keys=fields.String(), values=fields.Int(), dump_only=True)