import  express from 'express';
import './database/connection'  //must necessary to import the connection file to establish the connection with database.
import userRoute from './routes/userRoute' //importing the auth route to use it in the app.
import categoryRoute from './routes/categoryRoute' //importing the category route to use it in the app.
import productRoute from './routes/productRoute' //importing the product route to use it in the app.
import orderRoute from './routes/orderRoute'
import CartRoute from './routes/cartRoute'
import cors from 'cors'

const app  = express();
app.use(cors({
    origin : "*"
}))
app.use(express.json()) //to parse the incoming request body in json format.
// localhost:3000/api/auth/
app.use('/api/auth',userRoute) //importing the auth route and using it in the app.
app.use('/api/category',categoryRoute) //importing the category route and using it in the app.
app.use('/api/product',productRoute) //importing the product route and using it in the app.
app.use('/api/order',orderRoute)
app.use("/api/cart",CartRoute)

app.use(express.static("./src/uploads"))

export default app;