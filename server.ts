import adminSeeder from './adminSeeder';
import app from './src/app';
import envConfig from './src/config/config';
import categoryController from './src/controllers/categoryController';
import {Server} from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './src/database/models/userModel';
import Order from './src/database/models/orderModel';

function startServer() {
    const port = envConfig.port || 4000;
    adminSeeder();
    const server = app.listen(port, () => {
        categoryController.seedCategory();
        console.log(`Server is running on port ${port}`);
    });
    const io = new Server(server,{  //must provide http to know if they want to establish the connection or not. so server is send as parameter.
        cors : {
            origin : 'https://ecommerce.ujwal-shrestha.com.np/' //restricting access to other requests.
        }
    })
    let onlineUsers:{socketId:string, userId:string,role:string}[] = []
    let addToOnlineUsers = (socketId:string, userId:string,role:string)=>{
        onlineUsers = onlineUsers.filter((user)=>user.userId !== userId)
        onlineUsers.push({socketId, userId, role})
    }
    io.on("connection", (socket) =>{
        //const token = socket.handshake.headers.token  //jwt token // same as req.header. passing data from client to server
        console.log("connected")
        const {token} = socket.handshake.auth // jwt token 
        console.log(token,"TOKEN")
        if(token){
            console.log(token)
            jwt.verify(token as string, envConfig.jwtSecretKey as string, async (err:any, result:any) => {
                if (err) {
                    socket.emit("error", err)
                }else{
                    const userData = await User.findByPk(result.userId)
                    if(!userData){
                        socket.emit("error", "No user found with that token")
                        return
                    } 
                    // grab userId when user found
                    console.log(socket.id,result.userId,userData.role)
                    addToOnlineUsers(socket.id, result.userId, userData.role) //connected client id.
                    console.log(onlineUsers)
                }
            })
        }else{
            console.log("triggered")
            socket.emit("error","Please provide token")
        }
        console.log(onlineUsers)
        socket.on("updateOrderStatus", async (data)=>{
            const {status, orderId,userId} = data
            console.log(data,"USS")
            console.log(status, orderId)
            //checking if user is online or not.
            const findUser = onlineUsers.find(user=>user.userId == userId) // provide object // {socketId, userId, role}
            await Order.update(
                {
                    orderStatus : status
                },
                {
                    where : {
                        id : orderId
                    }
                }
            )
            if(findUser){
                console.log(findUser.socketId,"FS")
                io.to(findUser.socketId).emit("statusUpdated",data)
            }else{
                socket.emit("error", "User is not online")
            }
        })
    })
}

startServer();