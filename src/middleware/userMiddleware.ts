import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import envConfig from "../config/config";
import User from "../database/models/userModel";

export enum Role{
    Admin = "admin",
    Customer = "customer"
}

interface IExtendRequest extends Request{
    user?: {  // ? for optional
        username : string,
        email : string,
        role: string,
        password: string,
        id: string
    }
}

class  UserMiddleware {
    async isUserLoggedIn(req:IExtendRequest,res:Response,next:NextFunction):Promise<void>{
        //receive token
        const token = req.headers.authorization
        if(!token){
            res.status(403).json({
                message: "Access denied. No token provided."
            })
            return
        }
        //validate token
        jwt.verify(token, envConfig.jwtSecretKey as string, async (err, result:any) => {
            if (err) {
                res.status(403).json({
                    message: "Invalid token."
                })
            }else{
                const userData = await User.findByPk(result.userId)
                if(!userData){
                    res.status(404).json({
                        message: "User not found."  
                    })
                    return
                } 
                req.user = userData; // Set the user role in the response object
                next() //if the token is valid, the next() function is called to pass control to the next middleware or route handler in the Express application. Simple ma bujda yesle yeha vayeko kam pura vayo vani arko kam garna baki jun xa tyo gardinxa, route ma yo pxi post garni xa
            }
        })
    }   
    restrictTo(...roles:Role[]){ //rest operator is used to gather all the remaining arguments passed to the function into an array called roles. This allows the function to accept a variable number of arguments, which can be used to specify multiple roles that are allowed to access a particular route or resource.
        return (req:IExtendRequest, res:Response, next:NextFunction):void => {
           let userRole = req.user?.role as Role
           console.log(userRole)
        } 
    }
} 

export default new UserMiddleware