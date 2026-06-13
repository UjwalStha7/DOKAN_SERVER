import adminSeeder from './adminSeeder';
import app from './src/app';
import envConfig from './src/config/config';
import categoryController from './src/controllers/categoryController';
import {Server} from 'Socket.io';
import jwt from 'jsonwebtoken';
import User from './src/database/models/userModel';

function startServer() {
    const port = envConfig.port || 4000;
    adminSeeder();
    const server = app.listen(port, () => {
        categoryController.seedCategory();
        console.log(`Server is running on port ${port}`);
    });
    const io = new Server(server,{  //must provide http to know if they want to establish the connection or not. so server is send as parameter.
        cors:{
            origin : 'http://localhost:5173' //restricting access to other requests.
        }
    })
    let onlineUsers:{socketId:string, userId:string,role:string}[] = []
    let addToOnlineUsers = (socketId:string, userId:string,role:string)=>{
        onlineUsers.filter((user)=>user.userId !== userId)
        onlineUsers.push({socketId, userId, role})
    }
    io.on("connection", (socket) =>{
        const {token} = socket.handshake.auth  //jwt token // same as req.header. passing data from client to server
        if(token){
            jwt.verify(token, envConfig.jwtSecretKey as string, async (err:any, result:any) => {
            if (err) {
                socket.emit("error", err)
            }else{
                const userData = await User.findByPk(result.userId)
                if(!userData){
                    socket.emit("error", "No user found with that token")
                    return
                } 
                // grab userId when user found
                addToOnlineUsers(socket.id, result.userId, userData.role) //connected client id.
            }
        })
        }
    })
}

startServer();