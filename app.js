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
const helmet = require('helmet');
const hpp = require('hpp');
const redis = require('redis');
const RedisStore = require('connect-redis')(session);
const logger = require('./logger');
 
dotenv.config();
const redisClient = redis.createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    password: process.env.REDIS_PASSWORD, 
});
const passportConfig = require('./passport'); 

const app = express(); 

passportConfig(); // 패스포트 설정 
app.set('port', process.env.PORT || 8081); 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 
app.use(ejsLayout); 

if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
    app.use(helmet({ contentSecurityPolicy: false }));
    app.use(hpp());
} else {
    app.use(morgan('dev'));
}
app.use(methodOverride('_method')); // '_method'를 안넣으면 오류가 남
app.use(express.static(path.join(__dirname, 'public'))); 
app.use(express.json()); // json 데이터 처리
app.use(express.urlencoded({ extended: false })); // POST로 들어오는 body 처리 
app.use(cookieParser(process.env.COOKIE_SECRET));
const sessionOption = session({               // passport.session() 보다 앞에 있어야함
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET, 
    cookie: {
        httpOnly: true, 
        secure: false, 
    },
    store: new RedisStore({ client: redisClient }),
});
if (process.env.NODE_ENV === 'production') {
    sessionOption.proxy = true; 
}
app.use(session(sessionOption)); 
app.use(passport.initialize()); // req에 passport 설정을 심는다. 
app.use(passport.session());    // req.session 에 passport 정보를 심는다. 
/* 
    로그인 이후에 요청이 들어올 때마다 passport.session 미들웨어가 passport.deserializeUser 메서드를 호출할 것이다. 
    req.session에 저장된 아이디로 데이터베이스에서 user를 조회한다. 
    조회한 user는 req.user에 담긴다. 
*/




// routers
const postRouter = require('./router/postRouter'); 
const userRouter = require('./router/userRouter');
const authRouter = require('./router/authRouter');
const commentRouter = require('./router/commentRouter');

app.get('/', (req, res) => {
    res.redirect('/post');
});
app.use((req, res, next) => {

    res.locals.user = req.user !== null && req.user !== undefined ? req.user : null; // user를 전역적으로 처리하게 함 
    next();
}); 
app.use('/post', postRouter); 
app.use('/user', userRouter); 
app.use('/auth', authRouter);
app.use('/comment', commentRouter); 






// 유효하지 않은 url || 404
app.use((req, res, next) => {
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
    error.status = 404;
    logger.info('hello');
    logger.error(error.message); 
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