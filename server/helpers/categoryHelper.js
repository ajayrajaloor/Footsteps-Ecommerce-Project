const categorySchema = require('../model/categoryModel')



module.exports = {
  // addCategoryTooDb: async (productData) => {
  //   try {
  //     const category = new categorySchema({
  //       name: productData.categoryName,
  //       description: productData.categoryDescription,
  //     });
  //     await category.save();
  //     return;
  //   } catch (error) {
  //     console.error("Error adding category:", error);
  //   }
  // },

  // addCategoryTooDb: async (body) => {
  //   try {
  //     console.log("hai");
  //     console.log(body);
  //     let name = body.categoryName;
  //     console.log(name);
  
  //     let oldcategory = await categorySchema.findOne({ name: body.categoryName });
  
  //     console.log(oldcategory);
  //     if (oldcategory) {
  //       console.log("aaaa");
  //       return { status: false };
  //     } else {
  //       console.log("bbb");
  //       const newcategory = new categorySchema({
  //         name: body.categoryName,
  //           description: body.categoryDescription,
  //       });
  //       await newcategory.save();
  //       return { status: true };
  //     }
  //   } catch (error) {
  //     console.error("Error adding category:", error);
  //   }
  // },

  addCategoryTooDb: (body) => {
    return new Promise(async (resolve, reject) => {
      try {
       
        let name = body.categoryName;
  
        let oldcategory = await categorySchema.findOne({ name: body.categoryName });
  
        if (oldcategory) {
          resolve({ status: false });
        } else {
          const newcategory = new categorySchema({
            name: body.categoryName,
            description: body.categoryDescription,
          });
          await newcategory.save();
          resolve({ status: true });
        }
      } catch (error) {
        console.error("Error adding category:", error);
        reject(error);
      }
    });
  },
  



  getAllcategory: () => {
    return new Promise(async (resolve, reject) => {
      await categorySchema.find()
        .then((result) => {
          resolve(result)
        })
    });
  },

  // softDeleteCategory: async (categoryId) => {
  //     try {
  //       await categorySchema.findByIdAndDelete(
  //         categoryId,
  //         { status: true },
  //         { new: true }
  //       );
  //       return;
  //     } catch (error) {
  //       console.error("Error updating category:", error);
  //     }
  //   },
  softDeleteCategory: async (categoryId) => {
    return new Promise(async (resolve, reject) => {
      let category = await categorySchema.findById({ _id: categoryId });
    
      category.status = !category.status;
      category.save()
      resolve(category)
    })
  }


}
