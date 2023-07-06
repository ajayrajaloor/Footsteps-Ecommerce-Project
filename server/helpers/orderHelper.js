const { orders } = require('../controller/userController');
const orderSchema = require('../model/orderModel')
const ObjectId = require('mongoose').Types.ObjectId;

const addressHelper = require('../helpers/addressHelper')



function orderDate(){
    const  date = new Date()
    console.log(date);
    return date;
}

function orderStatusCount(orderStatuses) {   //to display on doughnut chart
    let counts = {};

    orderStatuses.forEach(oneStatus => {
        let status = oneStatus.orderStatus
        if (counts[status]) {
            counts[status]++;
        } else {
            counts[status] = 1;
        }

        console.log(status);
        //need to remove after adding razorpay
       
        // counts.cancelPending = 3;
        // counts.canceled = 3

    });
    console.log(counts);
    return counts
}


module.exports = {

    forOrderPlacing : (order,totalAmount,cartItems) =>{
        return new Promise(async(resolve,reject)=>{
            let status = order.payment == 'COD' ? 'confirmed' : 'pending'
            let date = orderDate()
            let userId = order.userId
            let paymentMethod = order.payment;
            let address = await addressHelper.findAnAddress(order.addressSelected); 
            let itemsOrdered = cartItems

            let completedOrders = new orderSchema({
                user: userId,
                address: address,
                orderDate: date,
                totalAmount: totalAmount,
                paymentMethod: paymentMethod,
                orderStatus: status,
                orderedItems: itemsOrdered
            })
            await completedOrders.save();
            resolve(completedOrders);
        })
    },


    // getAllOrderStatusesCount: async () => {
    //     try {
    //         const orderStatuses = await orderSchema.find().select({ _id: 0, orderStatus: 1 })

    //         const eachOrderStatusCount = orderStatusCount(orderStatuses);

    //         return eachOrderStatusCount
    //     } catch (error) {
    //         console.log(error);
    //     }
    // },

    getAllOrderStatusesCount: () => {
        return new Promise(async (resolve, reject) => {
          try {
            const orderStatuses = await orderSchema.find().select({ _id: 0, orderStatus: 1 });
            const eachOrderStatusCount = orderStatusCount(orderStatuses);
            resolve(eachOrderStatusCount);
          } catch (error) {
            console.log(error);
            reject(error);
          }
        });
      },
      

    singleUserOrderDetails : (userId) =>{
        return new Promise(async(resolve,reject) =>{
            const userOrders = await orderSchema.aggregate([
                {   
                    $match: {user: new ObjectId(userId)}
                },
                {
                    $lookup: {
                        from : "addresses",
                        localField : "address",
                        foreignField : "_id",
                        as : "lookedUpAddress"
                    }
                }
            ])
            resolve(userOrders)
        })
    },


    // changeOrderStatus : async(orderId,changeStatus)=>{
    //     try{
    //         const orderStatusChange = await orderSchema.findOneAndUpdate(
    //             {_id:orderId},
    //             {
    //                 $set: {
    //                     orderStatus : changeStatus
    //                 }
    //             },
    //             {
    //                 new:true
    //             }
    //         )
    //         return orderStatusChange
    //     }catch(error){
    //         throw new Error('something wrong!!! failed to change status')
    //     }
    // },

    changeOrderStatus: (orderId, changeStatus) => {
        return new Promise(async (resolve, reject) => {
          try {
            const orderStatusChange = await orderSchema.findOneAndUpdate(
              { _id: orderId },
              {
                $set: {
                  orderStatus: changeStatus
                }
              },
              {
                new: true
              }
            );
            resolve(orderStatusChange);
          } catch (error) {
            reject(new Error('something wrong!!! failed to change status'));
          }
        });
      },
      

    findAllOrders : () =>{
        return new Promise(async(resolve,reject) =>{
            await orderSchema.aggregate([
                {
                    $lookup : {
                        from:"users",
                        localField: "user",
                        foreignField: "_id",
                        as: "userOrderDetails"
                    }
                }
            ])
            .then((result) =>{
                resolve(result)
            })
        })
    },

    getAllDeliveredOrders: () => {
        return new Promise(async (resolve, reject) => {
            const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            await orderSchema.aggregate([
                {
                    $match: { orderStatus: 'delivered' }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user',
                        foreignField: '_id',
                        as: 'userDetails'
                    }
                },
                {
                    $match: {
                        createdAt: { $gte: currentMonthStart },
                        
                    }
                }
            ])
                .then((result) => {
                    resolve(result)
                })
        })
    },

    getAllDeliveredOrdersByDate: (startDate, endDate) => {
        return new Promise(async (resolve, reject) => {
            await orderSchema.find({ orderDate: { $gte: startDate, $lte: endDate }, orderStatus: 'delivered' }).lean()
                .then((result) => {
                    console.log("orders in range", result);
                    resolve(result)
                })

        })

    },


    getUserOrderDetailsAndAddress: (orderId) =>{
        return new Promise(async(resolve,reject)=>{
            await orderSchema.aggregate([

                {
                    $match : {
                        _id : new ObjectId(orderId)
                    }
                },
                {
                    $lookup : {
                        from : 'addresses',
                        localField : 'address',
                        foreignField : '_id',
                        as : 'userAddress'
                    }
                },

                {
                    $project: {
                        user: 1,
                        totalAmount: 1,
                        paymentMethod: 1,
                        orderDate : 1,
                        orderStatus: 1,
                        address : {
                            $arrayElemAt: ['$userAddress',0]
                        }
                    }
                }
            ]).then((result)=>{
                console.log(result);

                resolve(result[0])
            })
        })
    },


    getOrderedProductDetails : (orderId) =>{
        return new Promise(async(resolve,reject)=>{
            await orderSchema.aggregate([
                {
                    $match : {
                        _id : new ObjectId(orderId)
                    }
                },
                {
                    $unwind: '$orderedItems'
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'orderedItems.product',
                        foreignField: '_id',
                        as: 'orderedProduct'
                    }
                },
                {
                    $unwind: '$orderedProduct'
                }
            ]).then((result)=>{
                console.log('orderProducts',result);
                resolve(result)
            })
        })
    },

    cancelOrder: (userId, orderId, reason) => {
        return new Promise(async (resolve, reject) => {
          try {
            const cancelledOrderResponse = await orderSchema.findOneAndUpdate(
              { _id: new ObjectId(orderId) },
              { $set: { orderStatus: "cancelled", cancellationReason: reason } },
              { new: true }
            );
      
            console.log(cancelledOrderResponse, 'rrrreeeeeeesssssss');
      
            resolve({
                cancelledOrderResponse
              
            });
          } catch (error) {
            reject(error);
          }
        });
      },
      
   
      returnOrder: (userId, orderId, reason) => {
        return new Promise(async (resolve, reject) => {
          try {
            const order = await orderSchema.findOne({ _id: new ObjectId(orderId) });
            console.log("order", order);
      
            if (order.orderStatus === "delivered") {
              order.orderStatus = "return pending";
              order.cancellationReason = reason; // Set the cancellation reason
            } else if (order.orderStatus === "return pending") {
              order.orderStatus = "returned";
            }
      
            await order.save();
            console.log("order after", order);
            resolve(order);
          } catch (error) {
            reject(error);
          }
        });
      }
      
}

