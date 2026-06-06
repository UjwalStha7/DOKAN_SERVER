import  express from 'express';
import './database/connection'  //must necessary to import the connection file to establish the connection with database.
import userRoute from './routes/userRoute' //importing the auth route to use it in the app.
import categoryRoute from './routes/categoryRoute' //importing the category route to use it in the app.

const app  = express();
app.use(express.json()) //to parse the incoming request body in json format.
// localhost:3000/api/auth/
app.use('/api/auth',userRoute) //importing the auth route and using it in the app.
app.use('/api/category',categoryRoute) //importing the category route and using it in the app.

export default app;