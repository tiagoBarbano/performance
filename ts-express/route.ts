import express from "express";

import { getLogger } from './logger'
import { collections } from "./dbconnector";
import User from "./user";

const Router = express.Router();
let logger = getLogger()


class Hello {
    constructor() {
          Router.get('/', this.getHello); 
    }
    
    getHello = async (req: any, res: any) => {
        logger.info("Hello World")
        await res.send("Hello World");
    } 
}

class Crud {
    constructor() {
          Router.get('/user', this.getUsers);
          Router.post('/user', this.addUser); 
    }
    
    getUsers = async (req: any, res: any) => {
        try {
            const user = await collections.users?.find().toArray()
        
             res.status(200).send(user);
         } catch (error) {
             res.status(500).send(error);
         }
    }

    addUser = async (req: any, res: any) => {
        try {
            const newUser = req.body as User;
            const result = await collections.users?.insertOne(newUser)
            console.log(result)
        
            result
                ? res.status(201).send(`Successfully created a new user with id ${result.insertedId}`)
                : res.status(500).send("Failed to create a new user.");
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
        }
}

new Hello();
new Crud();

export default Router;