import { Request, Response } from "express";
import Order from "../database/models/orderModel";
import OrderDetails from "../database/models/orderDetails";
import { PaymentMethod, PaymentStatus } from "../globals/types";
import Payment from "../database/models/paymentModel";
import axios from 'axios'
import Cart from "../database/models/cartModel";

interface IProduct{
    productId : string,
    productQty : string
}

interface OrderRequest extends Request{
    user? :{
        id : string
    }
}

class OrderController{
    static async createOrder(req: OrderRequest, res:Response): Promise<void>{
        const userId = req.user?.id
        const {phoneNumber, firstName,lastName, email, city,addressLine,state,zipCode, totalAmount, paymentMethod} = req.body
        const products:IProduct[] = req.body.products
        console.log(req.body)
        if(!phoneNumber || !city || !addressLine || !state || !zipCode || !totalAmount || products.length == 0 || !firstName || !lastName || !email ){ //products comes in array
            res.status(400).json({
                message : "Please provide details"
            })
            return
        }
        //for order
        const orderData = await Order.create({
            phoneNumber,
            city, 
            state, 
            zipCode, 
            addressLine,
            totalAmount,
            userId, //to track which person ordered
            firstName, 
            lastName, 
            email
        })
        let data;
        //for order details
        products.forEach(async function(product){
            data = await OrderDetails.create({
                quantity : product.productQty,
                productId : product.productId,
                orderId : orderData.id
            })

            await Cart.destroy({
              where : {
                productId : product.productId, 
                userId : userId
              }
            })
        })
        //for payment
        const paymentData = await Payment.create({
            orderId : orderData.id,
            paymentMethod : paymentMethod,
        })
        if(paymentMethod == PaymentMethod.Khalti){
            //khalti logic
            const data = {
                return_url : "http://localhost:5173/",
                website_url : "http://localhost:5173/",
                amount : totalAmount * 100 , //converting paisa into rupee
                purchase_order_id : orderData.id,
                purchase_order_name : "order_" + orderData.id
            }
            const response = await axios.post("https://dev.khalti.com/api/v2/epayment/initiate/",data,{
                headers : {
                    Authorization : "Key 805a43d4832f40ea980d83f4a2a09f4c"
                }
            })
            const khaltiResponse = response.data
            paymentData.pidx = khaltiResponse.pidx //verifying if payment is done or not. checked using pidx and generated unique everytime when mehtod called.
            paymentData.save()
            res.status(200).json({
                message : "Order created successfully",
                url : khaltiResponse.payment_url,
                pidx : khaltiResponse.pidx,  
                data
            })
        }else if(paymentMethod == PaymentMethod.Esewa){

        }else{
            res.status(200).json({
                message : "Order created successfully",  
                data
            })
        }
        
    }
    static async verifyTransaction(req:Request, res:Response):Promise<void>{
        const {pidx} = req.body
        if(!pidx){
            res.status(400).json({
                message : "Please provide pidx"
            })
            return
        }
        const response = await axios.post("https://dev.khalti.com/api/v2/epayment/lookup/",{
            pidx : pidx
        },{
            headers : {
                "Authorization" : "Key 805a43d4832f40ea980d83f4a2a09f4c"
            }
        })
        const data = response.data
        if(data.status === "Completed"){
            await Payment.update({paymentStatus : PaymentStatus.Paid},{
                where : {
                    pidx : pidx
                }
            })
            res.status(200).json({
                message : "Payment verified successfully"
            })
        }else{
            res.status(200).json({
                message : "Payment not verified or cancelled"
            })
        }
    }
}

export default OrderController

/*
{ //order
    shippingAddress : "Damaului",
    phoneNumber : 8392495,
    totalAmount : 2334,
    products = [{ //order details
        productID : 9547342,
        qty : 2
    },{
        productId : 9345,
        qty : 37
    }]
}

*/