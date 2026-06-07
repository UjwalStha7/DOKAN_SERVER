import {Request, Response} from 'express';
import Product from '../database/models/productModel';
import Category from '../database/models/categoryModel';



class ProductController {
    async createProduct(req:Request, res:Response):Promise<void>{
        const {productName, productDescription, productPrice, productTotalStock, discount, categoryId} = req.body
        const filename = req.file ? req.file.filename : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2IYhSn8Y9S9_HF3tVaYOepJBcrYcd809pBA&s"
        if(!productName || !productDescription || !productPrice || !productTotalStock || !categoryId){
            res.status(400).json({
                message: "All fields are required"
            })
            return
        }
        await Product.create({
            productName, 
            productDescription, 
            productPrice, 
            productTotalStock, 
            discount : discount || 0, 
            categoryId,
            productImageUrl : filename
        })
        res.status(200).json({
            message: "Product created successfully"
        })
    }
    async getAllProducts(req:Request, res:Response):Promise<void>{
        const datas = await Product.findAll({
            include : [
                {
                    model : Category, //joining category table with product table to get category details along with product details
                    attributes : ['id', 'categoryName'] //resolving over fetching.
                }
            ]
        })
        res.status(200).json({
            message: "Products fetched successfully",
            data: datas
        })
    }
    async getSingleProduct(req:Request, res:Response):Promise<void>{
        const {id} = req.params
        const datas = await Product.findAll({
            where : {
                id : id
            },
            include : [
                {
                    model : Category, //joining category table with product table to get category details along with product details
                    attributes : ['id', 'categoryName']
                }
            ]
        })
        res.status(200).json({
            message: "Products fetched successfully",
            data: datas
        })
    }
    async deleteProduct(req:Request, res:Response):Promise<void>{
        const {id} = req.params
        const datas = await Product.findAll({
            where : {
                id : id
            }
        })
        if(datas.length === 0){
            res.status(404).json({
                message: "Product not found"
            })
            return
        }else{
            await Product.destroy({
                where : {
                    id : id
                }
            })
            res.status(200).json({
            message: "Product deleted successfully"
            })
        }  
    }
}

export default new ProductController;

