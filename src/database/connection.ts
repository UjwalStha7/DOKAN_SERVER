
import {Sequelize} from 'sequelize-typescript'; //{Sequelize} a class
import envConfig from '../config/config';
import Product from './models/productModel';
import Category from './models/categoryModel';


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
Product.belongsTo(Category) //product table ma categoryId chaiyeko hunale belongs to category
Category.hasOne(Product) 

export default sequelize;