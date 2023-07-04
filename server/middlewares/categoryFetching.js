const categories = require('../helpers/categoryHelper')


const category = async(req,res,next) =>{
    try{
        const allCategories = await categories.getAllcategory()
        res.locals.allCategories = allCategories
        next()
    }catch{
        res.status(500).redirect('/error')
    }
}

module.exports = category;