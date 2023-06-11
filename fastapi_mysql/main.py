from fastapi import FastAPI
from fastapi.responses import UJSONResponse
import asyncpg, asyncmy, uvicorn
from pydantic import BaseModel, EmailStr, StrictInt, StrictStr
from observability import metrics, tracing, logs


class User(BaseModel):
    email: EmailStr
    first: StrictStr
    last: StrictStr
    city: StrictStr
    county: StrictStr
    age: StrictInt

app = FastAPI()

metrics(app)
tracing(app, "users", None)
logger = logs("users")

async def start_pool():
    global pool
    pool = await asyncmy.create_pool(user="root",
                        password="dbpwd",
                        database="testdb",
                        host='127.0.0.1',
                        echo=True)
    logger.info("Conexao com Pool Mysql")
    
    global poolpg
    poolpg = await asyncpg.create_pool(database="postgres",
                                    host="localhost",
                                    password="changeme",
                                    user="postgres",
                                    port=5432)
    logger.info("Conexao com Pool Postgresql")

@app.get("/")   
async def root():
    global pool
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT * FROM users")
            ret = await cursor.fetchall()
            r = [dict(zip(User.__annotations__.keys(), v)) for v in ret]
    
    logger.info(message="Consulta realiza com sucesso - Pool Mysql", extra=r)
    return UJSONResponse(content=r)

@app.get("/pg")   
async def get_all_users():
    global poolpg

    async with poolpg.acquire() as conn:
        values = await conn.fetch(f"SELECT * FROM users")
        r = [dict(v) for v in values]
    
    extra_labels = {'user_id': 123, 'action': 'login'}
    logger.info(msg=f"Consulta realiza com sucesso - Pool Postgresql", extra={'tags':extra_labels})    
    return UJSONResponse(content=r)


@app.get("/hello")
async def hello():
     return UJSONResponse(content='Hello world!', status_code=200)

app.add_event_handler("startup", start_pool)

if __name__ == "__main__":
     uvicorn.run(app, host="0.0.0.0")