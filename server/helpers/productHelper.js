const { resolve } = require('path')
const productSchema = require('../model/productModel')
const ObjectId = require('mongoose').Types.ObjectId
const fs = require('fs')
const slugify = require('slugify');


module.exports ={

    addProductToDb: (data, files) => {
        return new Promise(async (resolve, reject) => {
          let imageUrls = [];
      
          for (let i = 0; i < files.length; i++) {
            let file = files[i];
            let imageUrl = file.filename;
            imageUrls.push(imageUrl);
          }
      
          await productSchema.create({
            product_name: data.product_name,
            product_description: data.product_description,
            product_category: data.product_category,
            product_price: data.price,
            product_quantity: data.quantity,
            product_discount: data.discount,
            image: imageUrls,
          }).then((result) => {
            resolve(result);
          }).catch((error) => {
            console.log(error);
          });
        });
      },
      

    getAllProducts: () =>{
        return new Promise(async(resolve,reject) =>{
            const a = await productSchema.aggregate([{
                $lookup:{
                    from:'categories',
                    localField:"product_category",
                    foreignField:"_id",
                    as:"category"
                }
            }])
            .then((result) =>{
                resolve(result)
            })
            .catch((error) =>{
                console.log(error);
            }) 
        })
    },


    // getAllProductsByCategory: (categoryId) => {
    //   return new Promise(async (resolve, reject) => {
    //     await productSchema
    //       .aggregate([
    //         {
    //           $match: {
    //             product_category: new ObjectId(categoryId),
    //           },
    //         },
    //         {
    //           $lookup: {
    //             from: 'categories',
    //             localField: 'product_category',
    //             foreignField: '_id',
    //             as: 'category',
    //           },
    //         },
    //       ])
    //       .then((result) => {
    //         resolve(result);
    //       })
    //       .catch((error) => {
    //         console.log(error);
    //       });
    //   });
    // },

    
    getAllproductsWithLookUp : () =>{
      return new Promise(async(resolve,reject)=>{
        const a = await productSchema.aggregate([
          {
            $lookup:{ 
              from:'categories',
                localField:'product_category',
                foreignField:'_id',
                as:'category'
            }
          }
        ])
        .then((result)=>{
          resolve(result)
        })
        .catch((error)=>{
          console.log(error);
        })
      })
    },


    
    filterProduct : (filterData) =>{
      return new Promise(async(resolve,reject)=>{
        console.log("categoryArray",filterData);
        console.log("categoryArray1",filterData.selectedCategories);
        console.log("filterData.min",Number(filterData.min));
        console.log("categoryArray",filterData.max);
        if(filterData.selectedCategories.length > 0){
          let filteredProducts = await productSchema.find({
            product_category: { $in: filterData.selectedCategories },
            product_price: { $gte: Number(filterData.min), $lte: Number(filterData.max) }
          }).lean();
          
          resolve(filteredProducts)
        }else{
          let filteredProducts = await productSchema.find({
           
            product_price: { $gte: Number(filterData.min), $lte: Number(filterData.max) }
          }).lean();

          resolve(filteredProducts)
        }
        
        
        
       
      })
    },
    

    getAProduct : (productId) =>{
        return new Promise (async(resolve,reject) =>{
            await productSchema.findById(productId)
            .then((result) =>{
                resolve(result)
            }) 
            .catch((error) =>{
                console.log(error);
            })
        })
    },


    recentProducts : ()=>{
      return new Promise(async(resolve,reject)=>{
        let products = await productSchema.find({}).sort({createdAt:-1}).limit(8).lean()
        resolve(products)
      })
    },


    editImages : async (oldImages, newImages) => {
        return new Promise((resolve, reject) => {
          if (newImages && newImages.length > 0) {
            // if new files are uploaded
            let filenames = [];
            for (let i = 0; i < newImages.length; i++) {
              filenames.push(newImages[i].filename);
            }
            // delete old images if they exist
            if (oldImages && oldImages.length > 0) {
              for (let i = 0; i < oldImages.length; i++) {
                fs.unlink("public/uploads/product-images/" + oldImages[i], (err) => {
                  if (err) {
                    reject(err);
                  }
                });
              }
            }
            resolve(filenames);
          } else {
            // use old images if new images are not uploaded
            resolve(oldImages);
          }
        });
      },
      
      
      
      
      
    softDeleteProduct : (productId) =>{
        return new Promise (async(resolve,reject) =>{
            let product = await productSchema.findById(productId)
            product.product_status = !product.product_status
            product.save()
            resolve(product)
        })
    },

    stockDecrease : (cartItems) =>{
      return new Promise(async(resolve,reject) =>{
        for(let i = 0;i<cartItems.length;i++){
          let product = await productSchema.findById({_id:cartItems[i].item});

          const availableProductInStock = (product.product_quantity - cartItems[i].quantity) >0 ? true:false;
          if(availableProductInStock){
            product.product_quantity = product.product_quantity - cartItems[i].quantity
          }
          await product.save()
        }
        resolve(true)
      })
    },

    increaseStock: (orderDetails) => {
      return new Promise(async (resolve, reject) => {
          // console.log("{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{");

          // console.log(orderDetails);

          // console.log("{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{");
          console.log("increaseStock",orderDetails);
          for (let i = 0; i < orderDetails.orderedItems.length; i++) {
              let product = await productSchema.findById({ _id: orderDetails.orderedItems[i].product });
              console.log("increaseStock1",product);
              // const isProductAvailableInStock = (product.product_quantity - cartItems[i].quantity) > 0 ? true : false;
              // if (isProductAvailableInStock) {
              product.product_quantity = product.product_quantity + orderDetails.orderedItems[i].quantity;
              // }
              // else{

              // }
              await product.save();
              console.log("increaseStock2",product);  
          }
          resolve(true)
      })
  },

}
