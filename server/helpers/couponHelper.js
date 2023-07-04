const couponSchema = require('../model/couponModel')
const cartschema = require('../model/cartModel')
const voucherCode = require('voucher-code-generator')

module.exports ={


    addCouponToDb : (couponData) =>{
        return new Promise(async(resolve,reject) =>{
            const dateString = couponData.couponExpiry;
            const [day, month, year] = dateString.split(/[-/]/);
            
            // Pad the month and day values with leading zeros if necessary
            const paddedMonth = month.padStart(2, '0');
            const paddedDay = day.padStart(2, '0');
            
            const date = new Date(`${year}-${paddedMonth}-${paddedDay}`);
            const convertedDate = date.toISOString();
            
            
            let couponCode=voucherCode.generate({
                length: 6,
                count: 1,
                charset: voucherCode.charset("alphabetic")
            });


            const coupon = await new couponSchema({
                couponName : couponData.couponName,
                code : couponCode[0],
                discount : couponData.couponAmount,
                expiryDate : convertedDate
            })   
            
            
            await coupon.save()
            .then(() => {
                resolve(coupon._id)
            })
            .catch((error) => {
                reject(error)
            })
        })
    },


    findAllCoupons : () =>{
        return new Promise (async(resolve,reject) =>{
            await couponSchema.find().lean()
            .then((result) =>{
                resolve(result)
            })
        })
    },


    getCouponData : (couponId) =>{
        return new Promise(async(resolve,reject) =>{
            await couponSchema.findOne({_id : couponId}).lean()
            .then((result)=>{
                resolve(result)
            })
        })
    },


    editTheCouponDetails:(editedCouponData) =>{
        return new Promise(async(resolve,reject)=>{

            let coupon = await couponSchema.findById({_id:editedCouponData.couponId})
            coupon.couponName = editedCouponData.couponName
            coupon.discount = editedCouponData.couponAmount
            coupon.expiryDate = editedCouponData.couponExpiry

            await coupon.save()
            resolve(coupon)
        })
    },

    deleteSelectedCoupon : (couponId)=>{
        return new Promise(async(resolve,reject)=>{
            let result = await couponSchema.findOneAndDelete({_id : couponId})
            resolve(result)
        })
    },


    applyCoupon : (userId,couponCode) =>{
        return new Promise(async(resolve,reject) =>{

            let coupon = await couponSchema.findOne({code : couponCode})

            if(coupon && coupon.isActive === 'Active'){
                if(!coupon.usedBy.includes(userId)){
                    let cart = await cartschema.findOne({user : userId})
                    const discount = coupon.discount
                    
                    cart.totalAmount = cart.totalAmount - coupon.discount
                    cart.coupon = couponCode

                    await cart.save()

                    coupon.usedBy.push(userId)
                    await coupon.save()

                    resolve ({discount,cart,status:true,message:"coupon applied successfully"})
                }else{
                    resolve({status:false,message:"This coupon is already used"})
                }
            }else{
                resolve({status:false,message:"Invalid Coupon code"})
            }
        })
    }


}