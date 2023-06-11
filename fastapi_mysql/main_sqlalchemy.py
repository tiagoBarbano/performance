from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, UJSONResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.future import select
import uvicorn
from observability import metrics, tracing, logs


database_url = "mysql+asyncmy://root:dbpwd@localhost:3306/testdb"
engine = create_async_engine(database_url, 
                             future=True, 
                             echo=False,
                             pool_pre_ping=True)
async_session = sessionmaker(engine, 
                            expire_on_commit=False, 
                            class_=AsyncSession) 

Base = declarative_base()
  
# Definir a classe de modelo
class UserModel(Base):
    __tablename__ = "users"
    email = Column(String, primary_key=True, index=True)
    first = Column(String)
    last = Column(String)
    city = Column(String)
    county = Column(String)
    age = Column(Integer)

# Criar o objeto FastAPI
app = FastAPI()

metrics(app)
tracing(app, "users", None)
logger = logs("users")

# Rota para criar um novo usuário
@app.post("/users/")
async def create_user(request: Request):
    # Criar uma nova sessão
    async with async_session() as session:
        # Criar um novo usuário
        user = UserModel(email=user.email,
                         first=user.first,
                         last=user.last,
                         city=user.city,
                         country=user.county,
                         age=user.age
                         )
        session.add(user)
        await session.commit()
        await session.refresh(user)
    return JSONResponse(content=user)

# Rota para obter um usuário por ID
@app.get("/users/{user_id}")
async def get_user(user_id: int):
    # Criar uma nova sessão
     async with async_session() as session:
        # Obter o usuário pelo ID
        user = await session.get(UserModel, user_id)
        if not user:
            return {"error": "User not found"}
        
        return JSONResponse(content=user)
    
@app.get("/users")
async def get_users():
    # Criar uma nova sessão
    async with AsyncSession(engine) as session:
        # Obter o usuário pelo ID
        query = select(UserModel)
        users = await session.execute(query)
        users = users.scalars().all()
  
    extra_labels = {'resutado': str(users)}
    logger.info("consulta realizada com sucesso", extra={ 'tags' : extra_labels})
                
    return UJSONResponse(content=jsonable_encoder(users))

if __name__ == "__main__":
     uvicorn.run(app, host="0.0.0.0")