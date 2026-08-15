import { Request, Response } from "express";
import Order from "../database/models/orderModel";
import OrderDetails from "../database/models/orderDetails";
import { OrderStatus, PaymentMethod, PaymentStatus } from "../globals/types";
import Payment from "../database/models/paymentModel";
import axios from 'axios'
import Cart from "../database/models/cartModel";
import Product from "../database/models/productModel";
import Category from "../database/models/categoryModel";

interface IProduct{
    productId : string,
    productQty : string
}

interface OrderRequest extends Request{
    user? :{
        id : string
    }
}


class OrderWithPaymentId extends Order{
  declare paymentId : string | null 
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
        let data;
        const paymentData = await Payment.create({
          paymentMethod : paymentMethod, 
        })
        const orderData = await Order.create({
            phoneNumber, 
            city, 
            state, 
            zipCode, 
            addressLine,
            totalAmount, 
            userId, 
            firstName, 
            lastName, 
            email, 
            paymentId : paymentData.id
        })
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
        if(paymentMethod == PaymentMethod.Khalti){
            //khalti logic
            const data = {
                return_url : "https://ecommerce.ujwal-shrestha.com.np/order-complete",
                website_url : "https://ecommerce.ujwal-shrestha.com.np/",
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
            await paymentData.save() // must be awaited, otherwise the response can go out before pidx is actually persisted
            res.status(200).json({
                message : "Order created successfully",
                url : khaltiResponse.payment_url,
                pidx : khaltiResponse.pidx,  
                data : orderData
            })
        }else if(paymentMethod == PaymentMethod.Esewa){

        }else{
            res.status(200).json({
                message : "Order created successfully",  
                data : orderData
            })
        }
        
    }
    static async verifyTransaction(req: Request, res: Response): Promise<void> {
      const { pidx } = req.body
      if (!pidx) {
        res.status(400).json({ message: "Please provide pidx" })
        return
      }

      // Khalti's lookup can legitimately keep returning "Pending" for a while right
      // after the redirect back to us, even though the payment itself succeeded.
      // 5 attempts * 2s (10s total) was not enough headroom in practice, and treating
      // "still pending after retries" the same as a real failure (Expired/User canceled)
      // was the root cause of the false "Payment Not Verified" screen.
      const maxAttempts = 10
      const delayMs = 3000 // ~30s total before we tell the frontend to fall back to slower polling

      try {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          const response = await axios.post(
            "https://dev.khalti.com/api/v2/epayment/lookup/",
            { pidx },
            { headers: { Authorization: "Key 805a43d4832f40ea980d83f4a2a09f4c" } }
          )
          const data = response.data
          console.log(`Khalti lookup attempt ${attempt}:`, data)

          if (data.status === "Completed") {
            const [affectedCount] = await Payment.update(
              { paymentStatus: PaymentStatus.Paid },
              { where: { pidx } }
            )
            if (affectedCount === 0) {
              res.status(404).json({ message: "No matching payment found for this pidx" })
              return
            }
            res.status(200).json({ message: "Payment verified successfully", status: data.status })
            return
          }

          // Only these are genuine, final failures per Khalti's docs.
          if (data.status === "Expired" || data.status === "User canceled" || data.status === "Refunded") {
            res.status(200).json({ message: "Payment not verified or cancelled", status: data.status })
            return
          }

          // status is "Pending" / "Initiated" — Khalti just hasn't settled it yet, keep retrying
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, delayMs))
          } else {
            // We genuinely don't know the outcome yet - this is NOT the same as a failure.
            // Tell the frontend to keep checking rather than telling the user to pay again.
            res.status(200).json({ message: "Payment still pending", status: data.status })
          }
        }
      } catch (error: any) {
        console.error("Khalti verify error:", error?.response?.data || error.message)
        res.status(500).json({
          message: "Verification request failed",
          detail: error?.response?.data || error.message
        })
      }
    }
    static async fetchMyOrders(req:OrderRequest,res:Response):Promise<void>{
      const userId = req.user?.id 
      const orders = await Order.findAll({
        where : {
          userId
        }, 
        attributes : ["totalAmount","id","orderStatus"], 
        include : {
          model : Payment, 
          attributes : ["paymentMethod", "paymentStatus"]
        }
      })
      if(orders.length > 0){
        res.status(200).json({
          message : "Order fetched successfully", 
          data : orders 
        })
      }else{
        res.status(404).json({
          message : "No order found", 
          data : []
        })
      }
    }
    static async fetchAllOrders(req:OrderRequest,res:Response):Promise<void>{
      
      const orders = await Order.findAll({
       
        attributes : ["totalAmount","id","orderStatus"], 
        include : {
          model : Payment, 
          attributes : ["paymentMethod", "paymentStatus"]
        }
      })
      if(orders.length > 0){
        res.status(200).json({
          message : "Order fetched successfully", 
          data : orders 
        })
      }else{
        res.status(404).json({
          message : "No order found", 
          data : []
        })
      }
    }
    static async fetchMyOrderDetail(req:OrderRequest,res:Response):Promise<void>{
      const orderId = req.params.id 
      const userId = req.user?.id 
      const orders = await OrderDetails.findAll({
        where : {
          orderId, 

        }, 
        include : [{
          model : Order , 
          include : [
            {
              model : Payment, 
              attributes : ["paymentMethod","paymentStatus"]
            }
          ],
          attributes : ["orderStatus","AddressLine","City","State","totalAmount","phoneNumber", "firstName", "lastName","userId"]
        },{
          model : Product, 
          include : [{
            model : Category
          }], 
          attributes : ["productImageUrl","productName","productPrice"]
        }]
      })
      if(orders.length > 0){
        res.status(200).json({
          message : "Order fetched successfully", 
          data : orders 
        })
      }else{
        res.status(404).json({
          message : "No order found", 
          data : []
        })
      }
    }

    static async cancelMyOrder(req:OrderRequest,res:Response):Promise<void>{
      const userId = req.user?.id 
      const orderId = req.params.id 
      const [order] = await Order.findAll({
        where : {
          userId : userId, 
          id : orderId 
        }
      })
      if(!order){
        res.status(400).json({
          message : "No order with that Id"
        })
        return 
      }
      // check order status 
      if(order.orderStatus === OrderStatus.OnTheWay || order.orderStatus === OrderStatus.Preparation){
        res.status(403).json({
          message : "You cannot cancel order, it is on the way or being prepared"
        })
        return
      }
      await Order.update({orderStatus : OrderStatus.Cancelled},{
        where : {
          id : orderId
        }
      })
      res.status(200).json({
        message : "Order cancelled successfully"
      })
    }
    static async changeOrderStatus(req:OrderRequest,res:Response) : Promise<void>{
      const orderId = req.params.id 
      const {orderStatus} = req.body
      if(!orderId || !orderStatus){
        res.status(400).json({
          message : "Please provide orderId and orderStatus"
        })
      }
      await Order.update({orderStatus : orderStatus},{
        where : {
          id : orderId
        }
      })
      res.status(200).json({
        message : "Order status updated successfully"
      })
    }
    static async deleteOrder(req:OrderRequest, res:Response) : Promise<void>{

      const orderId = req.params.id 
      const order : OrderWithPaymentId= await Order.findByPk(orderId as string) as OrderWithPaymentId
      const paymentId = order?.paymentId
      if(!order){
        res.status(404).json({
          message : "You dont have that orderId order"
        })
        return
      }
      await OrderDetails.destroy({
        where : {
          orderId : orderId
        }
      })
      await Payment.destroy({
        where : {
          id : paymentId
        }
      })
      await Order.destroy({
        where : {
          id : orderId
        }
      })
      res.status(200).json({
        message : "Order delete successfully"
      })
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