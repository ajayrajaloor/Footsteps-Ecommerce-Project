const wishListSchema = require('../model/wishlistModel')
const productSchema = require('../model/productModel');
const { ObjectId } = require('mongodb');


module.exports={


    addItemToWishlist: (productId, userId) => {
        return new Promise(async (resolve, reject) => {
          const product = await productSchema.findOne({ _id: productId });
      
      
          if (!product || !product.product_status) {
            reject(Error("Product Not Found"));
            return;
          }
      
          const wishlist = await wishListSchema.updateOne(
            {
              user: userId
            },
            {
             $push:{
                products : {productItemId:productId}
             }
            },
            {
              upsert: true
            }
          );
      
      
          resolve(wishlist)
        });
      },



    //   isInWishlist :async (userId,productId) =>{
    //     console.log(userId,'{{{{{{{{{{{{{{{{{{{');
    //     console.log(productId,'{{{{{{{{{{{{{{{{{{{');
    //     try{
    //         const wishList = await wishListSchema.findOne({
    //             user: userId,
    //             'products.productItemId': productId
    //           });
              
    //         console.log(wishList,'lllllllllltttttttttttttttt');

    //         if(wishList){
    //             return true
    //         }else{
    //             return false
    //         }
    //     }catch(error){                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
    //         console.log(error);
    //     }
    //   },

    isInWishlist: (userId, productId) => {
        return new Promise(async (resolve, reject) => {
          try {
            const wishList = await wishListSchema.findOne({
              user: userId,
              'products.productItemId': productId
            });
                    
            if (wishList) {
              resolve(true);
            } else {
              resolve(false);
            }
          } catch (error) {
            console.log(error);
            reject(error);
          }
        });
      },
      


      getAllWishlistProducts : (userId) =>{
        return new Promise(async(resolve,reject) =>{
            let wishlistProducts = await wishListSchema.aggregate([
                {
                    $match :{
                        user : new ObjectId(userId)
                    }
                },

                {
                    $unwind : '$products'
                },
                {
                    $project : {
                        item : '$products.productItemId'
                    }
                },
                {
                    $lookup : {
                        from : 'products',
                        localField : 'item',
                        foreignField : '_id',
                        as : 'product'
                    }
                },
                {
                    $project : {
                        item : 1,
                        product : {
                            $arrayElemAt : ['$product',0]
                        }
                    }
                }
            ])
            resolve(wishlistProducts)
        })
      },


      removeProductFromWishlist : (userId,productId)=>{
        return new Promise(async(resolve,reject)=>{

            await wishListSchema.updateOne(
                {
                    user : new ObjectId(userId)
                },
                {
                    $pull :{
                        products :{
                            productItemId : productId
                        }
                    }
                }
            ).then((result) =>{
                resolve(result)
            })
        })
      },

      getWishListCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wishlist = await wishListSchema.findOne({ user: userId });
            let wishlistCount = wishlist?.products.length;
            resolve(wishlistCount)
        })
    },
      
}