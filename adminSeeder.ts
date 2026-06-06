import envConfig from "./src/config/config"
import User from "./src/database/models/userModel"
import bcrypt from 'bcrypt';

const adminSeeder = async () => {
    const [data] = await User.findAll({
        where : {
            email : envConfig.adminEmail
        }
    })
    if (!data) {
        await User.create({
        username : envConfig.adminUsername,
        email : envConfig.adminEmail,
        password : bcrypt.hashSync(envConfig.adminPassword as string, 8),
        role : "admin"
    })
    console.log("Admin user seeded successfully")
    }else{
        console.log("Admin user already exists")
    }
}
export default adminSeeder