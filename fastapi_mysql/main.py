from fastapi import FastAPI
from fastapi.responses import ORJSONResponse, UJSONResponse
from asyncmy import create_pool
import uvicorn
from pydantic import BaseModel, EmailStr


class User(BaseModel):
    email: EmailStr
    first: str
    last: str
    city: str
    county: str
    age: int

app = FastAPI()
    
async def start_pool():
    global pool
    pool = await create_pool(user="root",
                            password="dbpwd",
                            database="testdb",
                            echo=True)

@app.get("/", response_model=list[User])
async def root() -> list[User]:
    global pool
    async with pool.acquire() as conn:    
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT * FROM users")
            ret = await cursor.fetchall()
            r = [dict(zip(User.__annotations__.keys(), v)) for v in ret]
    
    return ORJSONResponse(content=r)

app.add_event_handler("startup", start_pool)

if __name__ == "__main__":
     uvicorn.run(app)