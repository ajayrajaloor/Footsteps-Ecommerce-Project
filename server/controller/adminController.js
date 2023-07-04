// const userSchema = require('../model/userModel')
const { response } = require('../../app');
const adminHelper = require('../helpers/adminHelper')
// const { response } = require('../../app')
const categoryHelper = require('../helpers/categoryHelper')
const productHelper = require("../helpers/productHelper");
const productSchema = require('../model/productModel')
const categorySchema = require('../model/categoryModel')
const fs = require('fs');
const orderHelper = require('../helpers/orderHelper');
const couponHelper = require('../helpers/couponHelper');
const { json } = require('body-parser');
const { error } = require('console');
const walletHelper = require('../helpers/walletHelper')





const adminLogin = async (req, res, next) => {
  try {
    res.render('admin/admin-login',
      {
        layout: './layout/adminLayout',
        admin: true
      })

  } catch (error) {
    next(error)
  }
}


const adminLoginPost = async (req, res, next) => {

  const adminEmail = req.body.email
  const adminPassword = req.body.password
              
  try {
    const adminDetails = await adminHelper.isAdminExist(adminEmail, adminPassword)
    if (adminDetails) {
      req.session.admin = adminDetails
      res.redirect('/admin')
    } else {
      res.redirect('/admin')
    }
  } catch (error) {
    next(error)
  }
}


const adminDashboard = async (req, res, next) => {
  try {

    const orderStatus = await orderHelper.getAllOrderStatusesCount();
    const chartData = await adminHelper.getChartDetails();
    const dashboardDetails = await adminHelper.getDashboardDetails();
    // dashboardDetails.revenueTotal = currencyFormat(dashboardDetails.revenueTotal)
    // dashboardDetails.revenueMonthly = currencyFormat(dashboardDetails.revenueMonthly)

    res.render('admin/dashboard', { orderStatus, chartData, dashboardDetails, layout: "./layout/adminLayout" })

  } catch (error) {
    return next(error)
  }
}

const salesReportPage = async (req, res, next) => {
  try {
    const sales = await orderHelper.getAllDeliveredOrders();
    sales.forEach((order) => {
      const orderDate = new Date(order.orderDate)
      const formattedDate = orderDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
      order.orderDate = formattedDate
    })
    
    res.render('admin/salesReport', { sales, layout: "./layout/adminLayout" })
  } catch (error) {
    next(error)
  }
}



const salesReport = async (req, res, next) => {
  try {
    let { startDate, endDate } = req.body;

    startDate = new Date(startDate)
    endDate = new Date(endDate)

    const salesReport = await orderHelper.getAllDeliveredOrdersByDate(startDate, endDate);
    for (let i = 0; i < salesReport.length; i++) {
      salesReport[i].orderDate = dateFormat(salesReport[i].orderDate)
      salesReport[i].totalAmount = currencyFormat(salesReport[i].totalAmount)
    }
    res.status(200).json({ sales: salesReport })
  } catch (error) {
    return next(error)
  }
}


const adminUserList = async (req, res) => {
  adminHelper.findUsers().then((response) => {
    res.status(200).render("admin/usersList", {
      layout: "./layout/adminLayout",
      // admin: false,
      users: response,
    });
  }).catch((error) => {
    console.log(error);
  });
}


const adminBlockUnblockUser = async (req, res) => {
  let userId = req.params.id;
  await adminHelper.blockOrUnBlockUser(userId)
    .then((result) => {
      // console.log(result);
      // res.redirect("/admin/userList")
      if (result.isActive) {
        res.status(200).json({ error: false, message: 'User has been unBlocked', user: result })
      } else {
        res.status(200).json({ error: false, message: 'User has been Blocked', user: result })
      }
    }).catch((error) => {
      res.status(200).json({ error: true, message: 'Something went wrong', user: result })
      console.log(error);
    })
}



const userProfile = async (req, res) => {
  const orderDetailsOfUser = await orderHelper.singleUserOrderDetails(req.params.id)

  for (let i = 0; i < orderDetailsOfUser.length; i++) {
    orderDetailsOfUser[i].totalAmount = currencyFormat(orderDetailsOfUser[i].totalAmount)
    orderDetailsOfUser[i].orderDate = dateFormat(orderDetailsOfUser[i].orderDate)
  }

  await adminHelper.findAUser(req.params.id)
    .then((response) => {
      res.render('admin/userProfile', {
        layout: './layout/adminLayout',
        user: response,
        orderDetailsOfUser
      })
    }).catch((error) => {
      return next(error)
    })
}



// const adminUnblockUser = async (req,res) => {
//   let userId = req.params.id;
//   console.log("unblockkkkkkkkkkkk");
//   await adminHelper.unBlockUser(userId)
//   .then((result)=>{
//     console.log(result);
//     res.redirect('/admin/userList')
//   }).catch((error) =>{
//     console.log(error);
//   })
// }


const productCategory = (req, res) => {
  categoryHelper.getAllcategory().then((category) => {
    res.render('admin/category', {
      layout: './layout/adminLayout',
      categories: category
    })
  })
}


// const postAddProductCategory = (req, res) => {
//   try{
//     categoryHelper.addCategoryTooDb(req.body)
//     .then((category) => {
//       console.log(category,"zzzzzzzzzzzzzzzzzzzzzzzz");
//       // res.status(200).redirect("/admin/productCategory");
//       res.json(category)
//     })
//   } catch(err) {
//       console.log(err);
//     };
// }


const postAddProductCategory = (req, res) => {
  try {
    categoryHelper.addCategoryTooDb(req.body).then((response) => {
      res.json(response)
    })
  } catch (err) {
    console.error(err)
  }
}


// const softDeleteCategory = async (req, res) => {

//   let categoryId = req.params.id;
//   try {
//     await categoryHelper.softDeleteCategory(categoryId);
//     res.redirect("/admin/productCategory");
//   } catch (error) {
//     console.error(error);
//   }
// }

const softDeleteCategory = async (req, res) => {

  console.log(req.params.id);
  categoryHelper.softDeleteCategory(req.params.id)
    .then((response) => {
      if (response.status) {
        res.status(200).json({ error: false, message: "category listed", listed: true })
      } else {
        res.status(200).json({ error: false, message: "category unlisted", listed: false })
      }

    });
}






const adminProductList = (req, res) => {
  productHelper.getAllProducts()
    .then((response) => {
      res.render('admin/productList',
        {
          layout: './layout/adminLayout',
          products: response
        })
    })
}

const adminAddProduct = (req, res) => {
  categoryHelper.getAllcategory().
    then((response) => {
      res.render('admin/add-product',
        {
          layout: './layout/adminLayout',
          category: response
        })
    })
}

const postAddProduct = (req, res) => {
  productHelper.addProductToDb(req.body, req.files)
    .then((response) => {
      res.status(500).redirect('/admin/productList')
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
};



const editProduct = async (req, res) => {
  try {
    let product = await productHelper.getAProduct(req.params.id)
    let categories = await categoryHelper.getAllcategory()

    if (product == '') {
      res.status(401).redirect('/admin')
    } else {
      res.status(200).render('admin/edit-Product', { layout: './layout/adminLayout', product, categories })
    }
  }
  catch (error) {
    console.log(error);
  }
}


const postEditProduct = async (req, res) => {
  try {
    const product = await productSchema.findById(req.params.id);
    if (!product) {
      return res.redirect('/admin/productList');
    }
    product.product_name = req.body.product_name;
    product.product_description = req.body.product_description;
    product.product_price = req.body.product_price;
    product.product_quantity = req.body.product_quantity;
    product.product_category = req.body.product_category;
    product.product_discount = req.body.product_discount;
    if (req.files) {
      const filenames = await productHelper.editImages(product.image, req.files);
      product.image = filenames;
    }
    await product.save();
    res.redirect('/admin/productList');
  } catch (err) {
    console.log(err);
  }
};




const deleteProduct = (req, res) => {
  console.log(req.params.id);

  productHelper.softDeleteProduct(req.params.id)
    .then((result) => {
      if (result) {
        console.log(result);
        if (result.product_status) {
          res.status(200).json({ error: false, message: "product listed", product: result })
        } else {
          res.status(200).json({ error: false, message: "product unlisted", product: result })
        }
      } else {
        res.status(401).json({ error: false, message: "error occurred" })
      }
    })
}

const allOrders = async (req, res) => {
  try {
    const allOrders = await orderHelper.findAllOrders();

    for (let i = 0; i < allOrders.length; i++) {
      const orderDate = new Date(allOrders[i].orderDate);
      const formattedTime = orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const formattedDate = orderDate.toLocaleDateString('en-IN');

      allOrders[i].formattedDateTime = `${formattedTime}, ${formattedDate}`;
      allOrders[i].totalInrAmount = allOrders[i].totalAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
    }

    res.render('admin/orders', { layout: './layout/adminLayout', allOrders });
  } catch (error) {
    console.log(error);
  }
}


const changeProductOrderStatus = async (req, res, next) => {
  try {
    const response = await orderHelper.changeOrderStatus(req.body.orderId, req.body.status);

    if (response.orderStatus == 'returned') {
      await walletHelper.addMoneyToWallet(response.user, response.totalAmount);
      await productHelper.increaseStock(response)
    }
    res.status(202).json({ error: false, message: 'order status updated', status: response.orderStatus })
  } catch (error) {
    return next(error);
  }
};


const orderDetails = async (req, res, next) => {
  try {
    const orderId = req.params.id
    const orderDetails = await orderHelper.getUserOrderDetailsAndAddress(orderId)
    const productDetails = await orderHelper.getOrderedProductDetails(orderId)


    for (let i = 0; i < orderDetails.length; i++) {
      orderDetails[i].discount = currencyFormat(orderDetails[i].discount)
    }

    for (let i = 0; i < productDetails.length; i++) {
      productDetails[i].orderedProduct.totalPriceOfOrderdProducts = currencyFormat(productDetails[i].orderedProduct.product_price * productDetails[i].orderedItems.quantity)
      productDetails[i].orderedProduct.product_price = currencyFormat(productDetails[i].orderedProduct.product_price);
    }

    orderDetails.totalAmount = currencyFormat(orderDetails.totalAmount)
    res.render('admin/order-details-admin', { orderDetails, productDetails, layout: './layout/adminLayout' })

  } catch (error) {
    return next(error)
  }
}




const banners = async (req, res, next) => {
  try {
    res.render('admin/banners', { layout: './layout/adminLayout' })
  } catch (error) {
    return next(error)
  }
}



const coupons = async (req, res, next) => {
  try {

    let allCoupons = await couponHelper.findAllCoupons()


    for (let i = 0; i < allCoupons.length; i++) {
      allCoupons[i].discount = currencyFormat(allCoupons[i].discount)
      allCoupons[i].expiryDate = dateFormat(allCoupons[i].expiryDate)
    }

    res.render('admin/coupon', { layout: './layout/adminLayout', coupons: allCoupons })
  } catch (error) {
    return next(error)
  }
}


const addCoupon = async (req, res, next) => {
  try {
    const coupon = await couponHelper.addCouponToDb(req.body)
    res.status(200).redirect('/admin/coupon')

  } catch (error) {
    return next(error)
  }
}



const getAddedCoupon = async (req, res, next) => {
  try {
  
    const couponData = await couponHelper.getCouponData(req.params.id)

    couponData.expiryDate = dateFormat(couponData.expiryDate)
    

    res.status(200).json({ couponData })
  } catch (error) {
    return next(error)
  }
}


const postEditCoupon = async(req,res,next)=>{
  try{

    let editedCoupon = await couponHelper.editTheCouponDetails(req.body)

    res.redirect('/admin/coupon')
  }catch(error){
    return next(error)
  }
}


const deleteCoupon = async (req, res, next) => {
  try {
    const result = await couponHelper.deleteSelectedCoupon(req.params.id);
    res.json({ message: "coupon deleted successfully" });
  } catch (error) {
    return next(error);
  }
};


const adminLogout = (req, res) => {
  req.session.admin = false
  res.redirect('/admin')
}


// convert a number to a indian currency format
function currencyFormat(amount) {
  return Number(amount).toLocaleString('en-in', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })
}


function dateFormat(date) {
  return date.toISOString().slice(0, 10)
}



module.exports = {
  adminLogin,
  adminLoginPost,
  adminDashboard,
  salesReport,
  salesReportPage,
  adminProductList,
  adminAddProduct,
  adminLogout,
  adminUserList,
  adminBlockUnblockUser,
  // adminUnblockUser,
  postAddProduct,
  productCategory,
  postAddProductCategory,
  softDeleteCategory,
  userProfile,
  editProduct,
  postEditProduct,
  deleteProduct,
  allOrders,
  dateFormat,
  changeProductOrderStatus,
  orderDetails,
  banners,
  coupons,
  addCoupon,
  getAddedCoupon,
  postEditCoupon,
  deleteCoupon
}