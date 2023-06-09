from fastapi import FastAPI
from fastapi.responses import ORJSONResponse, UJSONResponse, JSONResponse
from asyncmy import create_pool
import uvicorn
from pydantic import BaseModel, EmailStr, StrictInt, StrictStr


class User(BaseModel):
    email: EmailStr
    first: StrictStr
    last: StrictStr
    city: StrictStr
    county: StrictStr
    age: StrictInt

app = FastAPI()

async def start_pool():
    global pool
    pool = await create_pool(user="root",
                            password="dbpwd",
                            database="testdb",
                            echo=True)

@app.get("/")
async def root():
    global pool
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT * FROM users")
            ret = await cursor.fetchall()
            r = [dict(zip(User.__annotations__.keys(), v)) for v in ret]

    return UJSONResponse(content=r)


@app.get("/hello")
async def hello():
     return UJSONResponse(content='Hello world!', status_code=200)

app.add_event_handler("startup", start_pool)

if __name__ == "__main__":
     uvicorn.run(app)