from fastapi import FastAPI, Response
from fastapi.responses import ORJSONResponse, UJSONResponse, JSONResponse
import uvicorn



app = FastAPI()

@app.get("/")
def root():
    return Response(content='Hello world!', status_code=200)

@app.get("/json")
async def root():
    return JSONResponse(content='Hello world!', status_code=200)

@app.get("/orjson")
async def root():
    return ORJSONResponse(content='Hello world!')

@app.get("/ujson")
async def root():
    return UJSONResponse(content='Hello world!', status_code=200)


if __name__ == "__main__":
     uvicorn.run(app)