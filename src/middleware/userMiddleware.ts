import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import envConfig from "../config/config";

class  UserMiddleware {
    async isUserLoggedIn(req:Request,res:Response,next:NextFunction):Promise<void>{
        //receive token
        const token = req.headers.authorization
        if(!token){
            res.status(403).json({
                message: "Access denied. No token provided."
            })
            return
        }
        //validate token
        jwt.verify(token, envConfig.jwtSecretKey as string, async (err, result) => {
            if (err) {
                res.status(403).json({
                    message: "Invalid token."
                })
            }else{
                console.log(result)
                next() //if the token is valid, the next() function is called to pass control to the next middleware or route handler in the Express application. Simple ma bujda yesle yeha vayeko kam pura vayo vani arko kam garna baki jun xa tyo gardinxa, route ma yo pxi post garni xa
            }
        })
    }    
} 

export default new UserMiddleware