const express = require('express');
const dotenv = require('dotenv'); 
const passport = require('passport'); 
const cookieParser = require('cookie-parser'); 
const session = require('express-session'); 
const ejs = require('ejs');
const ejsLayout = require('express-ejs-layouts'); 
const path = require('path'); 
const morgan = require('morgan');
const methodOverride = require('method-override');
 
dotenv.config();
const passportConfig = require('./passport'); 

const app = express(); 

passportConfig(); // 패스포트 설정 
app.set('port', 8081); 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 
app.use(ejsLayout); 

app.use(morgan('dev'));
app.use(methodOverride('_method')); // '_method'를 안넣으면 오류가 남
app.use(express.static(path.join(__dirname, 'public'))); 
app.use(express.json()); // json 데이터 처리 
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET, 
    cookie: {
        httpOnly: true, 
        secure: false, 
    }, 
}));
app.use(express.urlencoded({ extended: false })); 

// routers
const postRouter = require('./router/postRouter'); 
const userRouter = require('./router/userRouter');

app.get('/', (req, res) => {
    res.redirect('/post');
});
app.use('/post', postRouter); 
app.use('/user', userRouter); 

// 유효하지 않은 url || 404
app.use((req, res, next) => {
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
    error.status = 404;
    next(error);
});

// error 처리 미들웨어 
app.use((err, req, res, next) => {
     res.render('error', {
         message: err.message,
         error: err,
         status: err.status || 500,
     }); 
});

// 요청 대기
app.listen(app.get('port'), () => {
    console.log('포트 ' + app.get('port') + '에서 대기중');
}); 