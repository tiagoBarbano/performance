import * as mongoDB from "mongodb";

export const collections: { users?: mongoDB.Collection } = {}

export async function connectToDatabase() {

    const client: mongoDB.MongoClient = new mongoDB.MongoClient("mongodb://localhost:27017/");

    await client.connect();

    const db: mongoDB.Db = client.db("teste");

    const usersCollection: mongoDB.Collection = db.collection("users");
    
    await schema(db);

    collections.users = usersCollection;

    console.log(`Successfully connected to database: ${db.databaseName} and collection: ${usersCollection.collectionName}`);
}

async function schema(db: mongoDB.Db) {

    await db.command({
        "collMod": "users",
        "validator": {
            $jsonSchema: {
                bsonType: "object",
                required: ["name", "price", "category"],
                additionalProperties: false,
                properties: {
                    _id: {},
                    name: {
                        bsonType: "string",
                        description: "'name' is required and is a string"
                    },
                    price: {
                        bsonType: "number",
                        description: "'price' is required and is a number"
                    },
                    category: {
                        bsonType: "string",
                        description: "'category' is required and is a string"
                    }
                }
            }
        }
    });
}