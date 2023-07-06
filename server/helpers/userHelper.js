const userSchema = require('../model/userModel')
const bcrypt = require('bcrypt')


module.exports = {
        doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let user = await userSchema.findOne({ email: userData.email })
            let response = {}
            if (user) {
                console.log(user);
                if(user.isActive){
                    bcrypt.compare(userData.password, user.password).then((result) => {
                        if (result) {
                            response.user=user;
                            response.loggedIn = true;
                            resolve(response)
                        } else {
                            response.logginMessage = "Invalid username or password";
                           resolve(response)
                        }
                    })
                }else{
                    response.logginMessage = "blocked user";
                    // response.user=user;
                    // response.loggedIn = false;
                    resolve(response)
                }
            } else {
                response.logginMessage = "Invalid username or password";
                resolve(response)
            }
        })
    },

    doSignup: (userData)=>{

        return new Promise(async (resolve,reject)=>{
            const isUserExist = await userSchema.findOne({$or:[{ email: userData.email },{ phone: userData.phone }]});
            if(!isUserExist){
                userData.password=await bcrypt.hash(userData.password, 10);
              
                userSchema.create({
                    name: userData.name,
                    email: userData.email,
                    phone: userData.phone,
                    password: userData.password
                }).then((data) => {
                    console.log(data);
                    resolve(data)
                }).catch((error) => {
                    reject(error)
                })
            }else{
                
                resolve({userExist:true})
            }
        })

    },




    resetPassword : (newPassword,phone) =>{
        return new Promise  (async(resolve,reject) =>{
            newPassword = await bcrypt.hash(newPassword,10)
            let user = await userSchema.findOne({phone : phone})
            user.password = newPassword
            await user.save()
            resolve(user)
        })
    }
}

