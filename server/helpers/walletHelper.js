const walletSchema = require('../model/walletModel')
const { totalAmount } = require('./cartHelper')
const ObjectId = require('mongoose').Types.ObjectId

module.exports = {

    addMoneyToWallet : (userId,amount) =>{
        return new Promise (async(resolve,reject) =>{
            let wallet = await walletSchema.findOne({user : userId})

            if(!wallet){
                wallet = new walletSchema({
                    user : userId,
                    walletBalance : amount 
                })
            }else{
                // console.log(typeof wallet.walletBalance,'##################');
                wallet.walletBalance += amount
            }

            await wallet.save()
            resolve(wallet)
        })
    },


    getWalletAmount : (userId) =>{
        return new Promise (async(resolve,reject)=>{
            await walletSchema.aggregate([
                {
                    $match : {
                        user : new ObjectId(userId)
                    }
                },
                {
                    $project : {
                        walletBalance : 1
                    }
                }
            ])
            .then((balance) =>{
                console.log(balance);

                if(!balance.length){
                    resolve(0)
                }else{
                    resolve(balance[0].walletBalance)
                }
            })
        })
    },

    payUsingWallet : (userId,amount) =>{
        return new Promise(async(resolve,reject) =>{
            let wallet = await walletSchema.findOne({user : userId})

            if(wallet.walletBalance >= amount){
                wallet.walletBalance -= amount
            }else {
                resolve(false)
            }

            await wallet.save()

            resolve(true)
        })
    }
}