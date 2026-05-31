
import {Sequelize} from 'sequelize-typescript'; //{Sequelize} a class
import envConfig from '../config/config';

const sequelize = new Sequelize(envConfig.connectionString as string)

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

export default sequelize;