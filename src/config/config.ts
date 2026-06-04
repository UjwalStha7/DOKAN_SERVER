import {config} from 'dotenv';   
config();


const envConfig = {
    port : process.env.PORT,
    connectionString : process.env.CONNECTION_STRING,
    jwtSecretKey : process.env.JWT_SECRET_KEY,
    jwtExpiresIn : process.env.JWT_EXPIRES_IN,
    email : process.env.EMAIL,
    emailPassword : process.env.EMAIL_PASSWORD
};

export default envConfig;