
import {Sequelize} from 'sequelize-typescript'; //{Sequelize} a class
import envConfig from '../config/config';
import Product from './models/productModel';
import Category from './models/categoryModel';
import Order from './models/orderModel';
import User from './models/userModel';
import Payment from './models/paymentModel';
import OrderDetails from './models/orderDetails';


const sequelize = new Sequelize(envConfig.connectionString as string,{
    models : [__dirname + '/models']
})
try{
    sequelize.authenticate() //checks connection string user and password.
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch((err) => {
        console.error('Unable to connect to the database:', err);
    });
}catch(error){
    console.log(error);
}

sequelize.sync({force : false, alter: false}).then(()=>{
    console.log("local changes injected to database successfully")
})

// relationships 
Product.belongsTo(Category, {foreignKey : 'categoryId'}) //product table ma categoryId chaiyeko hunale belongs to category
Category.hasOne(Product, {foreignKey : 'categoryId'}) 

//Order X User
Order.belongsTo(User, {foreignKey : 'userId'})
User.hasMany(Order, {foreignKey : 'userId'}) 

//Payment X Order
Payment.belongsTo(Order, {foreignKey : 'orderId'})
Order.hasOne(Payment, {foreignKey : 'orderId'}) 

//OrderDetails X Order
OrderDetails.belongsTo(Order, {foreignKey : 'orderId'})
Order.hasOne(OrderDetails, {foreignKey : 'orderId'}) 

//OrderDetails X Product
OrderDetails.belongsTo(Product, {foreignKey : 'productId'})
Product.hasOne(OrderDetails, {foreignKey : 'productId'}) 

export default sequelize;