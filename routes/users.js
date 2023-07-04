var express = require('express');
var router = express.Router();
const userController = require('../server/controller/userController')
const {userAuthenticationCheck,userChecking } = require('../server/middlewares/sessionHandling')
const categorySupply = require('../server/middlewares/categoryFetching')



router.use(categorySupply)
/* GET users listing. */
router.get('/',userAuthenticationCheck,userController.landingPage)

router.get('/home',userChecking,userController.userHome);

router.get('/login',userAuthenticationCheck, userController.userLogin)

router.post('/login',userController.userLoginPost)

router.get('/signup',userAuthenticationCheck,userController.userSignup)

router.post('/signup',userController.userSignupPost)

router.get('/user-profile',userChecking,userController.userProfile)

router.get('/otp-login',userAuthenticationCheck,userController.otpUser)

router.post('/otp-login',userController.otpSending)

router.post('/otp-verify',userController.otpVerifying)

router.get('/user-logout',userController.userLogout)

router.get('/forgot-password',userController.forgotPassword)

router.post('/otp-forgotPass',userAuthenticationCheck,userController.postForgotPass)

router.post('/postForgotPasswordOtp',userAuthenticationCheck,userController.postForgotPasswordOtp)

router.post('/reset-password',userAuthenticationCheck,userController.resetPassword)

router.get('/resend-otp',userAuthenticationCheck,userController.resendOTP)



router.get('/productPage',userController.displayProducts) 

// router.get('/category-products/:id',userController.categoryWiseProducts)

router.get('/productDisplay/:id', userController.userProductDisplay)



router.get('/cart',userChecking,userController.userCart)

router.get('/add-to-cart/:id',userChecking,userController.addToCart)

router.post('/quantity-change',userChecking,userController.incDecQuantity)

router.post('/remove-cart-item/:id',userChecking,userController.removeFromCart)



router.get('/view-wishlist',userChecking,userController.viewWishlist)

router.post('/wishlist',userChecking,userController.addToWishlist)

router.post('/removeFromWishlist/:id',userChecking,userController.removeFromWishlist)


router.post('/search-product',userController.searchProduct)

router.get('/wallet',userChecking,userController.getWallet)

router.post('/add-address',userChecking,userController.addAddress)

router.get('/edit-address/:id',userChecking,userController.editAddress)

router.post('/edit-address',userChecking,userController.postEditAddress)



// router.get('/coupons',userChecking,userController.findAllCoupons)

router.get('/checkoutPage',userChecking,userController.checkout)

router.post('/place-order',userChecking,userController.placeOrder)

router.post('/applyCoupon',userChecking,userController.applyCoupon)

router.post('/verify-payment',userChecking,userController.verifyPayment)

router.get('/order-success',userChecking,userController.orderSuccess)


router.get('/order-details',userChecking,userController.orders)

router.get('/user-order-details/:id',userChecking,userController.viewOrderDetails)

router.post('/cancel-order',userChecking,userController.cancelOrder)

router.post('/return-order',userChecking,userController.returnOrder)


module.exports = router;



