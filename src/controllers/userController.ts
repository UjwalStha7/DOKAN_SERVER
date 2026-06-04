import { Request, Response } from "express";
import User from "../database/models/userModel";
// import sequelize from "../database/connection";
import bcrypt from 'bcrypt';
import generateToken from "../services/generateToken";
import generateOtp from "../services/generateOtp";
import sendMail from "../services/sendMail";


class UserController{
    static async register(req:Request,res:Response){
        //incoming user data receive 
        const {username,email,password} = req.body
        if(!username || !email || !password){
            res.status(400).json({
                message : "Please provide username,email,password"
            })
            return
        }
        // data --> users table ma insert garne 
        await User.create({
            username, 
            email, 
            password : bcrypt.hashSync(password,12) //hashing the password before storing it in the database.
        })
        await sendMail({ 
            to : email,
            subject : "Digital Dokan Account Registration", 
            text : `Hi ${username}, Welcome to Digital Dokan. Your account has been created successfully.`
        })

        // await sequelize.query(`INSERT INTO users(id,username,email,password) VALUES (?,?,?,?)`, {
        //     replacements : ['b5a3f20d-6202-4159-abd9-0c33c6f70487', username,email,password], 
        // })

        res.status(201).json({
            message : "User registered successfully"
        })
    }
    static async login(req:Request,res:Response){
        //accepting incoming user data(email & password))
        const {email,password} = req.body
        if(!email || !password){
            res.status(400).json({
                message : "Please provide email and password"
            })
            return
        }

        //checking if the email exist or not
        const [user] = await User.findAll({ //returns an array
            where : {
                email : email
            }
        })

        //email exist bhaye password verify garne
        if(!user){
            res.status(404).json({
                message : "User not found"
            })
        }else{
            const isEqual = bcrypt.compareSync(password, user.password) //comparing the provided password with the hashed password stored in the database.
            if(!isEqual){
                res.status(400).json({
                    message : "Invalid password"
                })
            }else{
                //password verify bhaye, generate token(unique identifier)
                const token = generateToken(user.id)
                res.status(200).json({
                    message : "User logged in successfully",
                    token : token
                })
            }
        } 
    }
    static async handleForgotPassword(req:Request,res:Response){
        //accepting incoming user data(email)
        const {email} = req.body
        if(!email){
            res.status(400).json({
                message : "Please provide email"
            })
            return
        }
        const [user] = await User.findAll({
            where : {
                email : email
            }
        })
        if(!user){
            res.status(404).json({
                message : "Email not registered"
            })
            return
        }
        const otp = generateOtp()
        sendMail({
            to : email,
            subject : "Digital Dokan Password Reset OTP", 
            text : `You just requested to reset your password. Your OTP is ${otp}.`
        })
        user.otp = otp.toString()
        user.otpGeneratedTime = Date.now().toString()
        await user.save()
        
        res.status(200).json({
            message : "Password reset OTP sent !!!"
        })
    }
}

export default UserController