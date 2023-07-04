var express = require('express');
var router = express.Router();
const adminController = require('../server/controller/adminController')
const {adminAuthenticationChecking,adminChecking } = require('../server/middlewares/sessionHandling')
const multer=require('../server/middlewares/multer')

/* GET home page. */
router.get('/',adminAuthenticationChecking,adminController.adminLogin);

router.post('/adminLogin',adminController.adminLoginPost)

router.get('/logout',adminController.adminLogout)

router.get('/dashboard',adminChecking,adminController.adminDashboard)

router.get('/sales-report-page',adminChecking,adminController.salesReportPage);

router.post('/sales-report',adminChecking,adminController.salesReport);

router.get('/userList',adminChecking,adminController.adminUserList)

router.get('/block-unblock-user/:id',adminChecking,adminController.adminBlockUnblockUser)

router.get('/userProfile/:id',adminChecking,adminController.userProfile)

// router.get('/unblockuser/:id',adminChecking,adminController.adminUnblockUser) (no need right now)



router.get('/productCategory',adminChecking,adminController.productCategory);

router.post('/createCategory',adminChecking,adminController.postAddProductCategory);

router.get('/deleteCategory/:id',adminChecking,adminController.softDeleteCategory)



router.get('/productList',adminChecking,adminController.adminProductList)

router.get('/add-product',adminChecking,adminController.adminAddProduct)

router.post('/add-product',adminChecking,multer.productUpload,adminController.postAddProduct);

router.get('/edit-product/:id',adminChecking,adminController.editProduct)

router.post('/edit-product/:id',adminChecking,multer.productUpload,adminController.postEditProduct)

router.get('/delete-product/:id',adminChecking,adminController.deleteProduct);



router.get('/orders',adminChecking,adminController.allOrders)

router.post('/order-status',adminChecking,adminController.changeProductOrderStatus);

router.get('/order-details/:id',adminChecking,adminController.orderDetails)



router.get('/coupon',adminChecking,adminController.coupons)

router.post('/add-coupon',adminChecking,adminController.addCoupon)

router.get('/edit-coupon/:id',adminChecking,adminController.getAddedCoupon)

router.post('/edit-coupon',adminChecking,adminController.postEditCoupon)

router.get('/deleteCoupon/:id',adminChecking,adminController.deleteCoupon)



router.get('/banner',adminChecking,adminController.banners)





module.exports = router;
