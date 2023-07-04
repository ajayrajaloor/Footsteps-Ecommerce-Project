

const userAuthenticationCheck = async (req, res, next) =>{
    try {
        if(req.session.user){
            res.status(200).redirect('/home')
        } else {
            next()
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Internal error occured"})
    }
}



const userChecking = async (req, res, next ) =>{
    try {
        if(req.session.user){
        
            next()
        } else {
            res.status(200).redirect('/login')
        }
    } catch (error) {
        res.status(500).send({message: "Internal error occured"})
    }
}

const adminAuthenticationChecking=async (req,res,next)=>{
    try{
        console.log(req.session.admin,"try");
        if(req.session.admin){ 
            res.redirect("/admin/dashboard");
        }else{
            next()
        }
    }catch(error){
        res.status(500).send("Internal error occured")
    }
}

const adminChecking=(req,res,next)=>{
    try {
        if(req.session.admin){
            next()
        }else{
            res.status(200).redirect('/admin')
        }
    } catch (error) {
        res.status(500).send("Internal error occured")
    }
}

module.exports = {
    userAuthenticationCheck,
    userChecking,
    adminAuthenticationChecking,
    adminChecking
}