const response = require('../../app')
const userSchema = require('../model/userModel')
const categorySchema=require('../model/categoryModel')
const adminSchema = require('../model/adminModel')
const orderSchema=require('../model/orderModel')
const productSchema = require('../model/productModel')

module.exports = {

    isAdminExist : (adminEmail,adminPassword)=>{
        return new Promise(async(resolve,reject)=>{
            const isAdminExist = await adminSchema.findOne({email:adminEmail,password:adminPassword})
            resolve(isAdminExist)
        })
    },



    findUsers: () => {
        return new Promise(async (resolve, reject) => {
            await userSchema.find()

                .then((response) => {
                    resolve(response)
                })
                .catch((error) => {
                    console.log(error);
                    reject(error)
                })
        })
    },

    blockOrUnBlockUser: async (userId) => {
        return new Promise(async (resolve, reject) => {
            // await userSchema.updateOne({ _id: userId }, { $set: { isActive: false } })
            //     .then((result) => {
            //         console.log(result+"updateeeeeeeeeeeeeeeeeeeeee");
            //         resolve(result)
            //     })
            //     .catch((error) => {
            //         console.log(error);
                
            //     })
            const user = await userSchema.findById(userId);
            user.isActive = !user.isActive
            await user.save()
            resolve(user)
        })
    },


    // unBlockUser: async (userId) => {
    //     return new Promise(async (resolve, reject) => {
    //         await userSchema.updateOne({ _id: userId }, { $set: { isActive: true } })

    //             .then((result) => {
    //                 resolve(result)
    //             }).catch((error) => {
    //                 console.log(error);
    //             })
    //     })
    // }



    // addCategoryTooDb:(productData)=>{
    //     return new Promise(async(resolve,reject)=>{
           
    //         let category = await new categorySchema({
    //             name: productData.categoryName,
    //             description: productData.categoryDescription,
    //           });
    //           await category.save();
    //           resolve(category._id);
    //     }) 
    // },

  

      findAUser: (userId) =>{
        return new Promise (async(resolve,reject) =>{
            await userSchema.findById({_id:userId})
            .then((result) =>{
                resolve(result)
            }).catch((error) =>{
                console.log(error);
            })
        })
      },


      getChartDetails: () => {
        return new Promise(async (resolve, reject) => {
          // Retrieve delivered orders and extract the order date
          const orders = await orderSchema.aggregate([
            {
              $match: { orderStatus: 'delivered' }
            },
            {
              $project: {
                _id: 0,
                orderDate: "$createdAt"
              }
            }
          ]);
      
          let monthlyData = [];
          let dailyData = [];
      
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      
          let monthlyMap = new Map();
          let dailyMap = new Map();
      
          // Convert to monthly order array
          orders.forEach((order) => {
            const date = new Date(order.orderDate);
            const month = date.toLocaleDateString('en-US', { month: 'short' });
      
            // Count the number of orders in each month
            if (!monthlyMap.has(month)) {
              monthlyMap.set(month, 1);
            } else {
              monthlyMap.set(month, monthlyMap.get(month) + 1);
            }
          });
      
          // Populate monthlyData array with order counts for each month
          for (let i = 0; i < months.length; i++) {
            if (monthlyMap.has(months[i])) {
              monthlyData.push(monthlyMap.get(months[i]));
            } else {
              monthlyData.push(0);
            }
          }
      
          // Convert to daily order array
          orders.forEach((order) => {
            const date = new Date(order.orderDate);
            const day = date.toLocaleDateString('en-US', { weekday: 'long' });
      
            // Count the number of orders on each day of the week
            if (!dailyMap.has(day)) {
              dailyMap.set(day, 1);
            } else {
              dailyMap.set(day, dailyMap.get(day) + 1);
            }
          });
      
          // Populate dailyData array with order counts for each day of the week
          for (let i = 0; i < days.length; i++) {
            if (dailyMap.has(days[i])) {
              dailyData.push(dailyMap.get(days[i]));
            } else {
              dailyData.push(0);
            }
          }
      
          // Resolve the promise and return the monthlyData and dailyData
          resolve({ monthlyData: monthlyData, dailyData: dailyData });
        });
      },



      getDashboardDetails: () => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let revenueTotal, revenueMonthly, totalProducts;

            revenueTotal = await orderSchema.aggregate([
                {
                    $match: { orderStatus: 'delivered' }
                },
                {
                    $group: {
                        _id: null,
                        revenue: { $sum: '$totalAmount' }
                    }
                }
            ])

            // if(revenueTotal){
                response.revenueTotal = revenueTotal[0]?.revenue;
            // }else{
            //     response.revenueTotal=0
            // }



            revenueMonthly = await orderSchema.aggregate([
                {
                    $match: {
                        orderStatus: 'delivered',
                        orderDate: {
                            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        revenue: { $sum: '$totalAmount' }
                    }
                }
            ])


            response.revenueMonthly = revenueMonthly[0]?.revenue

            totalProducts = await productSchema.aggregate([
              {
                $group: {
                  _id: null,
                  total: { $sum: { $toInt: "$product_quantity" } } // Sum the converted product_quantity values
                }
              }
            ]);
            
            const ordersss = await productSchema.find()
            
            response.totalProducts = totalProducts[0]?.total;
            
            response.totalOrders = await orderSchema.find({ orderStatus: 'confirmed' }).count();

            response.numberOfCategories = await categorySchema.find({}).count();

            resolve(response)
        })
    },
      
}