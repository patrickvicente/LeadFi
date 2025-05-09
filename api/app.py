from flask import Flask
from flask_restful import Api
from flask_cors import CORS
from resources.lead import LeadResource

# Creates  Flas app instance
app = Flask(__name__)
CORS(app)

api = Api(app)

#Register 'api/leads' endpoint
api.add_resource(LeadResource, '/api/leads', '/api/leads/<int:id>')

if __name__ == '__main__':
    app.run(debug=True)