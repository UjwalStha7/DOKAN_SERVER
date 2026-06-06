import Category from "../database/models/categoryModel"
import { Request, Response } from "express"


class CategoryController{
    categoryData = [
        {
            categoryName : "Electronics"
        },
         {
            categoryName : "Groceries"
        },
         {
            categoryName : "Foods"
        }
    ]
    async seedCategory():Promise<void>{
        const datas = await Category.findAll()
        if(datas.length === 0){
            await Category.bulkCreate(this.categoryData) 
            console.log("Categories seeded successfully")
        }else{
            console.log("Categories already exist")
        }
        // await Category.create(this.categoryData[0])
        // await Category.create(this.categoryData[1])
        // await Category.create(this.categoryData[2])
        //bulkCreate method is used to insert multiple records into the database at once.
    }
    async addCategory(req:Request, res:Response):Promise<void>{
        const {categoryName} = req.body;
        if(!categoryName){
            res.status(400).json({
                message: "Please provide category name"
            })
            return
        }
        await Category.create({
            categoryName})
        res.status(201).json({
            message: "Category added successfully"
        })
    }
    async getCategory(req:Request, res:Response):Promise<void>{
        const data = await Category.findAll()
        res.status(200).json({
            message: "Category fetched successfully",
            data
        })
    }
    async deleteCategory(req:Request, res:Response):Promise<void>{
        const {id} = req.params
        if(!id){
            res.status(400).json({
                message: "Please provide category id"
            })
            return
        }
        const data = await Category.findAll({
            where : {
                id : id
            }
        })
        if(data.length === 0){
            res.status(404).json({
                message: "Category not found"
            })
        }else{
            await Category.destroy({
                where : {
                    id : id
                }
            })
        }
        res.status(200).json({
            message: "Category deleted successfully"
        })
    }
     async updateCategory(req:Request, res:Response):Promise<void>{
        const {id} = req.params
        const {categoryName} = req.body
        if(!id || !categoryName){
            res.status(400).json({
                message: "Please provide id to update"
            })
            return
        }
        const data = await Category.findAll({
            where : {
                id : id
            }
        })
        if(data.length === 0){
            res.status(404).json({
                message: "Category not found"
            })
        }else{
            await Category.update({  //keslai rw kasko
                categoryName : categoryName
            },{
                where : {
                    id : id
                }
            })
        }
        res.status(200).json({
            message: "Category updated successfully"
        })
    }
}
export default new CategoryController