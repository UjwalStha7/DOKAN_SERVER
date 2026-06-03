import jwt from "jsonwebtoken"
import envConfig from "../config/config"

const generateToken = (userId: string) => {
    //token generation (jwt)
    const token = jwt.sign({
        userId : userId
    }, envConfig.jwtSecretKey as string, {
        expiresIn : envConfig.jwtExpiresIn as any
    })
    return token
}       

export default generateToken