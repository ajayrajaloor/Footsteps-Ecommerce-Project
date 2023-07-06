require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var ejs = require('ejs')
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');
const connectDB = require('./server/database/connection')
const bodyparser = require('body-parser')
const mongoose = require('mongoose');
const session = require('express-session')
const expressLayout = require('express-ejs-layouts')
const nocache = require('nocache')
const flash  = require('connect-flash')



connectDB()
const  app = express();

app.use(expressLayout)



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('layout','./layout/userLayout')

//log requests 
app.use(logger('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use (nocache())
app.use(express.static(path.join(__dirname, 'public')));


app.use(session
  ({secret:"Key",
 resave: false,
 saveUninitialized: false,
 cookie:{maxAge:6000000}
}));


//inintializing flash middleware
app.use(flash());
app.use((req,res,next)=>{
  res.locals.message = req.session.message;
  delete req.session.message
  next()
})


app.use('/', usersRouter);
app.use('/admin', adminRouter);




// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {}; 

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

console.log(`Server is running on http://localhost:3000`)

const PORT =  4000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports=app