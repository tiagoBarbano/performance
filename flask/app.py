from flask import Flask
from pyctuator.pyctuator import Pyctuator

app_name = "Flask App with Pyctuator"
app = Flask(app_name)


@app.route('/')
async def hello_world():
    return 'Hello, World!'

Pyctuator(
    app,
    app_name,
    app_url="http://localhost:5000",
    pyctuator_endpoint_url="http://localhost:5000/pyctuator",
    registration_url="http://localhost:8180/instances"
)


    
if __name__ == "__main__":
    app.run(host='0.0.0.0')    