const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const connection = require('../mysql/mysqlConfig');

const router = express.Router();

// 로그인 화면
router.get('/login', (req, res) => {

    res.render('auth/login'); 
}); 

// 로그인하기
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (authError, user, info) => {

        if (authError) { // 서버 에러
            console.error(authError);
            return next(authError); 
        }

        if (!user) { // 로그인 실패
            
            return res.redirect(`/auth/login?loginError=${info.message}`); 
        } 
        return req.login(user, (loginError) => {
            
            if (loginError) { // 로그인 에러
                console.error(loginError);
                return next(loginError); 
            }
            return res.redirect('/'); // 로그인 성공
        });
    })(req, res, next); 
});



// 로그아웃
router.get('/logout', (req, res, next) => {
    req.logout();
    req.session.destroy();
    res.redirect('/'); 
})

module.exports = router; 