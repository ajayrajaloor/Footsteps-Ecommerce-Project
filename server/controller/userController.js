
const userSchema = require('../model/userModel')
const userHelper = require('../helpers/userHelper')
const twilio = require('../../api/twilio')
const categoryHelper = require('../helpers/categoryHelper');
const productHelper = require('../helpers/productHelper');
const productSchema = require('../model/productModel')
const cartHelper = require('../helpers/cartHelper')
const addressHelper = require('../helpers/addressHelper')
const orderHelper = require('../helpers/orderHelper');
const { response } = require('express');
const { dateFormat, orderDetails } = require('./adminController')
const wishlistHelper = require('../helpers/wishlistHelper')
const walletHelper = require('../helpers/walletHelper')

let easyinvoice = require('easyinvoice');
const razorpay = require('../../api/razorPay');
const couponHelper = require('../helpers/couponHelper');

// let loginStatus;
let cartCount;
let wishListCount;



const landingPage = async (req, res, next) => {

  try {
    let latestProducts = await productHelper.recentProducts()
    

    for (let i = 0; i < latestProducts.length; i++) {
      latestProducts[i].product_price = currencyFormat(latestProducts[i].product_price)
    }

    res.render('users/home', {
      latestProducts,
       loginStatus : req.session.user
    })
  } catch (error) {
    res.status(500).render('error', { error , layout: false });
  }
}

const userHome = async (req, res) => {

  try {
    let userId = req.session.user._id
    cartCount = await cartHelper.getCartCount(userId)
    wishListCount = await wishlistHelper.getWishListCount(userId)

    let latestProducts = await productHelper.recentProducts()
   
    const response = await productHelper.getAllProducts()

    for (let i = 0; i < latestProducts.length; i++) {
      const isInCart = await cartHelper.isAProductInCart(userId, latestProducts[i]._id)
      const isInWishlist = await wishlistHelper.isInWishlist(userId, latestProducts[i]._id)

      latestProducts[i].isInCart = isInCart
      latestProducts[i].isInWishlist = isInWishlist

      latestProducts[i].product_price = currencyFormat(latestProducts[i].product_price)
    }
    res.status(200).render('users/home', {
      latestProducts, loginStatus : req.session.user, cartCount, wishListCount
    })
  } catch (error) {
   
    // res.render('error',{error})
    res.status(500).render('error', { error , layout: false });
  }
}



const userLogin = async (req, res, next) => {
  res.render('users/login', { user: true, loggedInError: req.session.loggedInError })
}


const userLoginPost = async (req, res) => {
  await userHelper.doLogin(req.body).then((response) => {
    
    if (response.loggedIn) {
      // req.session.loggedIn = true
      req.session.user = response.user
      // loginStatus = req.session.user
      return res.status(202).json({ error: false, message: response.logginMessage })

    } else {
      return res.status(401).json({ error: false, message: response.logginMessage })
    }


  })
}



const forgotPassword = (req, res) => {
  try {
    res.render('users/forgotPassword')
  } catch (error) {
    res.status(500).render('error', { error , layout: false });
  }
}


const postForgotPass = async (req, res) => {
  try {
    const form = req.body

    req.session.mobile = form.phone
    await userSchema.findOne({ phone: form.phone })
      .then(async (userData) => {
        if (userData) {
          await twilio.sentOTP(form.phone)
          res.render('users/forgotPasswordOtp')
        } else {
          res.redirect('/signup')
        }
      }).catch((error) => {
        res.status(500).render('error', { error  , layout: false});
      })
  } catch (error) {
    res.status(500).render('error', { error  , layout: false});
  }
}


const postForgotPasswordOtp = async (req, res) => {

  const phone = req.session.mobile
  const otp = req.body.num1 + req.body.num2 + req.body.num3 + req.body.num4 + req.body.num5 + req.body.num6

  await twilio.verifyOtp(phone, otp)
    .then((matchOtp) => {
      if (matchOtp) {
        res.render('users/resetPassword', { layout: false })
      } else {
        res.redirect('/signup')
      }
    }).catch((error) => {
      res.status(500).render('error', { error , layout: false });
    })
}



const resetPassword = async (req, res) => {
  try {
    const phone = req.session.mobile
    let newPassword = req.body.confirmPassword
    let userConfirmed = await userHelper.resetPassword(newPassword, phone)
    res.redirect('/login')
  } catch (error) {
    res.status(500).render('error', { error  , layout: false});
  }
}




const userLogout = async (req, res) => {
  try {
    req.session.user = null
    // loginStatus = false
    res.redirect('/')
  } catch {
    res.status(500).render('error', { error  , layout: false});
  }
}

const userProfile = async (req, res) => {
  try {
    let userId = req.session.user._id
    cartCount = await cartHelper.getCartCount(userId)
    wishListCount = await wishlistHelper.getWishListCount(userId)

    let allAddress = await addressHelper.findAllAddress(userId)
    res.render('users/profile', { loginStatus : req.session.user, allAddress, cartCount, wishListCount })
  } catch (error) {
    res.status(500).render('error', { error  , layout: false});
  }

}


const userSignup = async (req, res, next) => {
  try {
    const message = req.flash('message');

    res.render('users/signup', {
      message: message // Access the first message in the array
    });
  } catch (error) {
    
    // Handle any errors that occurred during rendering or processing
    res.status(500).render('error', { error , layout: false });
  }
};



const userSignupPost = async (req, res) => {
  try {
    const response = await userHelper.doSignup(req.body);
    if (!response.userExist) {
      res.redirect('/login');
    } else {
      req.flash('message', 'You are an existing user. Please log in.');
     
      res.redirect('/signup');
    }
  } catch (error) {
    
    // Handle any errors that occurred during the signup process
    res.redirect('/signup');
  }
};



const otpUser = (req, res) => {
  res.render('users/otp-form', { loginStatus : req.session.user })
}

const otpSending = async (req, res) => {
  const find = req.body;
  req.session.mobile = req.body.phone;
  await userSchema.findOne({ phone: find.phone })
    .then(async (userData) => {
      if (userData) {
        req.session.tempUser = userData;
        await twilio.sentOTP(find.phone);
        req.session.resendOTP = true; // Set the flag to indicate OTP resend
        req.session.resendTimer = Date.now() + 30000; // Set the timer for 30 seconds
        res.render('users/otp-verification', { resendOTP: req.session.resendOTP, resendTimer: req.session.resendTimer });
      } else {
       
        res.redirect('/signup');
      }
    })
    .catch((error) => {
     
      res.redirect('/signup');
    });
};



const otpVerifying = async (req, res) => {
  const phone = req.session.mobile;
  const otp = req.body.num1 + req.body.num2 + req.body.num3 + req.body.num4 + req.body.num5 + req.body.num6;
  
  await twilio.verifyOtp(phone, otp)
    .then((status) => {
      
      if (status) {
        req.session.user = req.session.tempUser;
        // loginStatus = req.session.user;
        res.redirect('/');
      } else {
        res.redirect('/signup');
      }
    }).catch((error) => {
     
      res.status(500).render('error', { error  , layout: false});
    });
};


const resendOTP = async (req, res) => {
  const phone = req.session.mobile;
  await twilio.sentOTP(phone);
  req.session.resendOTP = true; // Set the flag to indicate OTP resend
  req.session.resendTimer = Date.now() + 30000; // Set the timer for 30 seconds
  res.render('users/otp-verification', { resendOTP: req.session.resendOTP, resendTimer: req.session.resendTimer });
};


const searchProduct = async (req, res, next) => {
  let payload = req.body.payload.trim();
  try {
    let searchResult = await productSchema.find({ product_name: { $regex: new RegExp('^' + payload + '.*', 'i') } }).exec();
    searchResult = searchResult.slice(0, 5);
    res.send({ searchResult })
  } catch (error) {
    res.status(500).render('error', { error  , layout: false});
  }
}



const displayProducts = async (req, res, next) => {
  try {
    let product;
    const page = parseInt(req.query.page) || 1;
    const perPage = 3;
    const docCount = await productSchema.countDocuments({ product_status: true });
  

    const products = await productSchema
      .find({ product_status: true })
      .skip((page - 1) * perPage)
      .limit(perPage);

   

    if (req.session.user) {
      let userId = req.session.user._id
      cartCount = await cartHelper.getCartCount(userId)
      wishListCount = await wishlistHelper.getWishListCount(userId)
    }

    if (!req.query.filterData) {
      product = await productHelper.getAllproductsWithLookUp()

      for (let i = 0; i < product.length; i++) {
        if (req.session.user) {
          let userId = req.session.user._id
          const isInCart = await cartHelper.isAProductInCart(userId, product[i]._id)
          const isInWishlist = await wishlistHelper.isInWishlist(userId, product[i]._id)

          product[i].isInCart = isInCart
          product[i].isInWishlist = isInWishlist
        }
        product[i].product_price = Number(product[i].product_price).toLocaleString('en-in', { style: 'currency', currency: 'INR' })
      }

      res.render('users/userProduct', { product: products, loginStatus : req.session.user, cartCount, wishListCount,totalPages: Math.ceil(docCount / perPage),
      currentPage: page,
      perPage,products  })


    } else {
      let filterData = JSON.parse(req.query.filterData)
      product = await productHelper.filterProduct(filterData)
      for (let i = 0; i < product.length; i++) {
        if (req.session.user) {
          let userId = req.session.user._id;
          const isInCart = await cartHelper.isAProductInCart(userId, product[i]._id);
          const isInWishlist = await wishlistHelper.isInWishlist(userId, product[i]._id)

          product[i].isInCart = isInCart;
          product[i].isInWishlist = isInWishlist

        }
        product[i].product_price = Number(product[i].product_price).toLocaleString('en-in', { style: 'currency', currency: 'INR' })
      }
      res.json({ product: product, loginStatus : req.session.user, cartCount, wishListCount})
    }
  } catch (error) {
    res.status(500).render('error', { error  , layout: false});
  }
}



// const categoryWiseProducts = async (req, res) => {
//   try {
//     const response = await productHelper.getAllProductsByCategory(req.params.id)
//     for (let i = 0; i < response.length; i++) {

//       if (req.session.user) {
//         const isInCart = await cartHelper.isAProductInCart(req.session.user._id, response[i]._id)

//         response[i].isInCart = isInCart
//       }

//       response[i].product_price = Number(response[i].product_price).toLocaleString('en-in', { style: 'currency', currency: 'INR' })
//     }
//     
//     res.render('users/userProduct', { products: response, loginStatus })
//   } catch (error) {
//     console.log(error);
//   }
// }


const userProductDisplay = async (req, res) => {
  try {
   
   
    let userId = req.session.user
    let productId = req.params.id
    let product = await productHelper.getAProduct(productId)

    if (req.session.user) {
      const isInCart = await cartHelper.isAProductInCart(userId, productId);
      const isInWishlist = await wishlistHelper.isInWishlist(userId, productId)
      cartCount = await cartHelper.getCartCount(userId)
      wishListCount = await wishlistHelper.getWishListCount(userId)
      product.isInCart = isInCart;
      product.isInWishlist = isInWishlist
    }

    res.render('users/productDisplay', { product, loginStatus : req.session.user,  cartCount, wishListCount})
  } catch (error) {
   
    res.status(500).render('error', { error  , layout: false});
  }

}

const userCart = async (req, res) => {
  try {
    let user = req.session.user;
    let allCartItems = await cartHelper.getAllCartItems(user._id)
    cartCount = await cartHelper.getCartCount(user._id)
    wishListCount = await wishlistHelper.getWishListCount(user._id)
    let totalandSubTotal = await cartHelper.totalSubtotal(user._id, allCartItems)


    totalandSubTotal = currencyFormat(totalandSubTotal)
  
    res.render('users/cart', { loginStatus : req.session.user, allCartItems, cartCount, wishListCount, totalAmount: totalandSubTotal })
  } catch (error) {
   
    res.status(500).render('error', { error , layout: false });
  }

}

const addToCart = async (req, res) => {
  //   try {
  //     let productId = req.params.id;
  //     let user = req.session.user;
  //     let response=await cartHelper.addToUserCart(user._id,productId);
  //     if(response){
  //         res.status(202).json({status: "success", message: "product added to cart"})
  //     }
  // } catch (error) {
  //     console.log(error);
  // }

  try {
    let productId = req.params.id;
    let user = req.session.user;
    let response = await cartHelper.addToUserCart(user._id, productId);
    if (response) {
      cartCount = await cartHelper.getCartCount(user._id)
      res.status(202).json({ status: "success", message: "product added to cart" })
    }
  } catch (error) {
  
    res.status(500).render('error', { error  , layout: false});
  }
}

const incDecQuantity = async (req, res) => {
  try {
    let obj = {}
    let user = req.session.user
    let productId = req.body.productId
    let quantity = req.body.quantity

    obj.quantity = await cartHelper.incDecProductQuantity(user._id, productId, quantity)

    let cartItems = await cartHelper.getAllCartItems(user._id)
    obj.totalAmount = await cartHelper.totalSubtotal(user._id, cartItems)
    obj.totalAmount = obj.totalAmount.toLocaleString('en-in', { style: 'currency', currency: 'INR' })

    res.status(202).json({ message: obj })

  } catch (error) {
  
    res.status(500).render('error', { error  , layout: false});
  }
}


const removeFromCart = (req, res) => {
  try {
    let cartId = req.body.cartId;
    let productId = req.params.id


    cartHelper.removeAnItemFromCart(cartId, productId)
      .then((response) => {
        res.status(202).json({ message: "sucessfully item removed" })
      })
  } catch (error) {
    
    res.status(500).render('error', { error  , layout: false});
  }
}



const addToWishlist = async (req, res, next) => {
  try {
    let productId = req.body.productId
    let user = req.session.user._id
    let result = await wishlistHelper.addItemToWishlist(productId, user)
    res.json({ message: `item added to wishlist ` })
  } catch (error) {
    res.status(500).render('error', { error  , layout: false});

  }
}


const viewWishlist = async (req, res, next) => {
  try {
    let userId = req.session.user._id
    let wishlist = await wishlistHelper.getAllWishlistProducts(userId)
    cartCount = await cartHelper.getCartCount(userId)
    wishListCount = await wishlistHelper.getWishListCount(userId)


    for (let i = 0; i < wishlist.length; i++) {
      // console.log(wishlist[i].product._id,'iiiiiiiiiiiddd');
      let isInCart = await cartHelper.isAProductInCart(userId, wishlist[i].product._id)

      wishlist[i].isInCart = isInCart
    }

    res.render('users/wishlist', { loginStatus : req.session.user, wishlist: wishlist, cartCount, wishListCount })
  } catch (error) {
    res.status(500).render('error', { error  , layout: false});
  }
}



const removeFromWishlist = async (req, res, next) => {
  try {
    let userId = req.session.user._id
    let productId = req.body.productId
    await wishlistHelper.removeProductFromWishlist(userId, productId)
    wishlistCount = await wishlistHelper.getWishListCount(userId)

    res.status(200).json({ message: 'item removed from the wishlist', wishlistCount })
  } catch (error) {
    res.status(500).render('error', { error  , layout: false});
  }
}



const checkout = async (req, res) => {
  try {
    const user = req.session.user

    cartCount = await cartHelper.getCartCount(user._id)
    wishListCount = await wishlistHelper.getWishListCount(user._id)
    let cartItems = await cartHelper.getAllCartItems(user._id)
    let walletBalance = await walletHelper.getWalletAmount(user._id)
    walletBalance = currencyFormat(walletBalance);

    let totalAmount = await cartHelper.totalSubtotal(user._id, cartItems)
    const coupons = await couponHelper.findAllCoupons();
    
    const userAddress = await addressHelper.findAllAddress(user._id)
    // for (let i = 0; i < cartItems.length; i++) {
    //   cartItems[i].product.product_price = cartItems[i].product.product_price.toLocaleString('en-in', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
    // }


    res.render('users/checkout', { loginStatus : req.session.user, user, cartItems, walletBalance,coupons, totalAmount: totalAmount, address: userAddress, cartCount, wishListCount })
  } catch (error) {
 
    res.status(500).render('error', { error  , layout: false});
  }

}


// const findAllCoupons = async (req, res) => {
//   try {
//     const coupons = await couponHelper.findAllCoupons();
//     res.json(coupons);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// }



const getWallet = async (req, res, next) => {
  try {
    let userId = req.session.user._id
    let walletAmount = await walletHelper.getWalletAmount(userId)
    walletDetails = currencyFormat(walletAmount)
    res.json({ walletDetails })

  } catch (error) {
    res.status(500).render('error', { error  , layout: false});
  }
}


const applyCoupon = async (req, res, next) => {
  try {
    let user = req.session.user._id
    const { totalAmount, couponCode } = req.body

    const result = await couponHelper.applyCoupon(user, couponCode)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).render('error', { error  , layout: false});
  }
}


const addAddress = async (req, res) => {
  try {
    addressHelper.addAddress(req.body)
      .then((result) => {
        res.status(202).json({ message: "address added successfully" })
      })
  } catch (error) {
   
    res.status(500).render('error', { error  , layout: false});
  }
}


const editAddress = async (req, res) => {
  try {
    let address = await addressHelper.findAnAddress(req.params.id)
    res.json({ address: address })
  } catch (error) {
   
    res.status(500).render('error', { error  , layout: false});
  }
}

const postEditAddress = async (req, res) => {
  try {
    let updatedAddress = await addressHelper.EditAnAddress(req.body)
    res.json({ message: "address updated" })
  } catch (error) {
   
    res.status(500).render('error', { error  , layout: false});
  }
}


const placeOrder = async (req, res) => {
  try {
    let userId = req.body.userId

    let cartItems = await cartHelper.getAllCartItems(userId);

    if (!cartItems.length) {
      return res.json({ error: true, message: "Please add items to cart before checkout" })
    }


    if (req.body.addressSelected == undefined) {
      return res.json({ error: true, message: "Please Select any Address before checkout" })
    }

    if (req.body.payment == undefined) {
      return res.json({ error: true, message: "Please Select any Payment Method before checkout" })
    }

    const totalAmount = await cartHelper.totalAmount(userId); // instead find cart using user id and take total amound from that 


    if (req.body.payment == 'COD') {
      const placeOrder = await orderHelper.forOrderPlacing(req.body, totalAmount, cartItems)
        .then(async (response) => {

          await productHelper.stockDecrease(cartItems);

          await cartHelper.clearTheCart(userId);

          // cartCount = await cartHelper.getCartCount(userId)

          res.status(202).json({ paymentMethod: 'COD', message: "Purchase Done" })
        })
    } else if (req.body.payment == 'razorpay') {
      await orderHelper.forOrderPlacing(req.body, totalAmount, cartItems)
        .then(async (orderDetails) => {
          await razorpay.razorpayOrderCreate(orderDetails._id, orderDetails.totalAmount)
            .then(async (razorpayOrderDetails) => {
              await orderHelper.changeOrderStatus(orderDetails._id, 'confirmed')
              await productHelper.stockDecrease(cartItems)
              await cartHelper.clearTheCart(userId)
              res.json({ paymentMethod: 'razorpay', orderDetails, razorpayOrderDetails, razorpaykeyId: process.env.RAZORPAY_KEY_ID })
            })
        })
    }
    else if (req.body.payment == 'wallet') {
      let isPaymentDone = await walletHelper.payUsingWallet(userId, totalAmount)
      if (isPaymentDone) {
        await orderHelper.forOrderPlacing(req.body, totalAmount, cartItems)
          .then(async (orderDetails) => {
            await orderHelper.changeOrderStatus(orderDetails._id, 'confirmed')
            await productHelper.stockDecrease(cartItems)
            await cartHelper.clearTheCart(userId)
            res.status(202).json({ paymentMethod: 'wallet', error: false, message: "Purchase Done" })
          })
      } else {
        res.status(200).json({ paymentMethod: 'wallet', error: true, message: "Balance Insufficient in Wallet" })
      }
    }


  } catch (error) {
   
    res.status(500).render('error', { error  , layout: false});
  }
}



//razorpay payment verification
const verifyPayment = async (req, res, next) => {
  const userId = req.session.user._id;
  await razorpay.verifyPaymentSignature(req.body)
    .then(async (response) => {
      if (response.signatureIsValid) {
        await orderHelper.changeOrderStatus(req.body['orderDetails[_id]'], "confirmed");
        let cartItems = await cartHelper.getAllCartItems(userId);
        await productHelper.stockDecrease(cartItems);
        await cartHelper.clearTheCart(userId);

        res.status(200).json({ status: true })
      } else {
        res.status(200).json({ status: false })
      }
    })
    .catch((error) => {
      res.status(500).render('error', { error  , layout: false});
    })
}


const orderSuccess = (req, res) => {
  try {
    res.render('users/successOrderPage', { loginStatus : req.session.user })
  } catch (error) {
  
    res.status(500).render('error', { error  , layout: false});
  }
}


const orders = async (req, res) => {
  try {
    const user = req.session.user
    const orderDetailsUser = await orderHelper.singleUserOrderDetails(user._id)
    cartCount = await cartHelper.getCartCount(user._id)
    wishListCount = await wishlistHelper.getWishListCount(user._id)

    for (let i = 0; i < orderDetailsUser.length; i++) {
      orderDetailsUser[i].orderDate = dateFormat(orderDetailsUser[i].orderDate)
      orderDetailsUser[i].totalAmount = currencyFormat(orderDetailsUser[i].totalAmount)
    }

    res.render('users/orders', { loginStatus : req.session.user, orderDetailsUser, cartCount, wishListCount })
  } catch (error) {
  
    res.status(500).render('error', { error  , layout: false});
  }
}


const viewOrderDetails = async (req, res) => {
  try {
    const userId = req.session.user._id
    const orderId = req.params.id

    cartCount = await cartHelper.getCartCount(userId)
    wishListCount = await wishlistHelper.getWishListCount(userId)

    let orderDetails = await orderHelper.getUserOrderDetailsAndAddress(orderId)
    let productDetails = await orderHelper.getOrderedProductDetails(orderId)

    // const expiryOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }; to change the date format to - eg: 14/07/2023
    const orderDate = new Date(orderDetails.orderDate); // Create a new Date object based on orderDate

    const expiryDate = new Date(orderDate); // Create a new Date object for expiry date

    expiryDate.setDate(expiryDate.getDate() + 7); // Set the expiry date to 1 week from orderDate

    orderDetails.expiryDate = expiryDate

    res.render('users/userOrderDetails', { loginStatus : req.session.user, orderDetails, productDetails, cartCount, wishListCount })
  } catch (error) {
   
    res.status(500).render('error', { error  , layout: false});
  }
}

const cancelOrder = async (req, res, next) => {
  const { userId, orderId, reason } = req.body;
  try {
    const cancelled = await orderHelper.cancelOrder(userId, orderId, reason);

    
    if (cancelled.cancelledOrderResponse.orderStatus === 'cancelled') {
      if(cancelled.cancelledOrderResponse.paymentMethod !== 'COD'){

        await walletHelper.addMoneyToWallet(cancelled.cancelledOrderResponse.user, cancelled.cancelledOrderResponse.totalAmount);
        await productHelper.increaseStock(cancelled.cancelledOrderResponse);
        
      }
     
    }

    res.status(200).json({ isCancelled: true, message: "Order cancelled successfully" });
  } catch (error) {
    res.status(500).render('error', { error  , layout: false});
  }
};





const returnOrder = async (req, res, next) => {
  const { userId, orderId, reason } = req.body; // Added `reason` from the request body
  try {
    const returnedResponse = await orderHelper.returnOrder(userId, orderId, reason);
    res
      .status(200)
      .json({ isReturned: "return pending", message: "order returning process started" });
  } catch (error) {
    res.status(500).render('error', { error  , layout: false});
  }
};


function currencyFormat(amount) {
  return Number(amount).toLocaleString('en-in', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })
}



module.exports = {
  landingPage,
  userHome, userLogin,
  userSignup, userProductDisplay, userCart,
  userSignupPost, userLoginPost,
  userLogout, otpUser,
  otpSending,
  otpVerifying,
  userProfile,
  displayProducts,
  forgotPassword,
  postForgotPass,
  postForgotPasswordOtp,
  resetPassword,
  // categoryWiseProducts,
  addToCart,
  resendOTP,
  incDecQuantity,
  removeFromCart,
  checkout,
  addAddress,
  editAddress,
  postEditAddress,
  placeOrder,
  verifyPayment,
  orderSuccess,
  orders,
  viewOrderDetails,
  cancelOrder,
  returnOrder,
  addToWishlist,
  viewWishlist,
  removeFromWishlist,
  searchProduct,
  applyCoupon,
  getWallet,
  // findAllCoupons 
}