from flask_restful import Resource, reqparse
from models.lead import insert_lead
from models.lead import fetch_leads
from models.lead import fetch_lead_by_id

# Resource class for handling /api/leads endpoint
class LeadResource(Resource):
    def post(self):
        # argument parser to extract POST data
        parser = reqparse.RequestParser()
        parser.add_argument('full_name', required=True)
        parser.add_argument('title', required=False)
        parser.add_argument('email', required=False)
        parser.add_argument('telegram', required=False)
        parser.add_argument('phone_number', required=False)
        parser.add_argument('source', required=True)
        parser.add_argument('company_name', required=True)
        parser.add_argument('status', required=True)
        parser.add_argument('linkedin_url', required=False)
        parser.add_argument('country', required=False)
        parser.add_argument('bd_in_charge', required=True)
        parser.add_argument('background', required=False)
        
        #Parse incoming JSON or form to a dictionary
        data = parser.parse_args()

        #call function to insert lead into the DB
        insert_lead(data)

        ## !! TO-DO Add error handlers

        # Return success response
        return {"message": "Lead addedd successfully"}, 201
    
    def get(self, id=None):
        # Fetch all leads from DB
        leads = fetch_leads()

        #return leads asa JSON response
        return {"leads": leads}, 200
    
    def get(self, id=None):
        if id is None:
            # Fetch all leads
            leads = fetch_leads()
            return {"leads": leads}, 200
        else:
            # Fetch a single lead by ID
            lead = fetch_lead_by_id(id)
            if lead is None:
                return {"message": "Lead not found"}, 404
            return {"lead": lead}, 200