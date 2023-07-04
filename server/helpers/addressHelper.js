const { editAddress } = require('../controller/userController')
const addressSchema = require('../model/addressModel')

module.exports = {
    addAddress: (addressDetails) => {
        return new Promise(async (resolve,reject) => {
            let address = await new addressSchema({

                first_name: addressDetails.fname,
                last_name: addressDetails.lname,
                mobile: addressDetails.mobile,
                email_id: addressDetails.email,
                address: addressDetails.address,
                city: addressDetails.city,
                state: addressDetails.state,
                country: addressDetails.country,
                pincode: addressDetails.pincode,
                userId: addressDetails.id
            })
            await address.save()
            resolve(address)
        })
    },

    findAllAddress: (userId) =>{
        return new Promise(async(resolve,reject) =>{
            await  addressSchema.find({userId:userId})
            .then((result) =>{
                resolve(result)
            })
        })
    },

    findAnAddress: (addressId) =>{
        return new Promise(async(resolve,reject) =>{
            await addressSchema.findById(addressId)
            .then((result) =>{
                resolve(result)
            })
        })
    },

    EditAnAddress:(editAddress) =>{
        return new Promise(async (resolve,reject)=>{
          
            let address=await addressSchema.findById(editAddress.addressId)

            address.first_name=editAddress.fname;
            address.last_name=editAddress.lname;
            address.mobile=editAddress.mobile;
            address.email_id=editAddress.email;
            address.address=editAddress.address;
            address.country=editAddress.country;
            address.state=editAddress.state;
            address.city=editAddress.city;
            address.pincode=editAddress.pincode;

            await address.save();
            resolve(address);
        })
    }

    
}