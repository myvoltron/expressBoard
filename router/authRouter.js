const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const connection = require('../mysql/mysqlConfig');

const router = express.Router();


router.route('/login')
    .get((req, res) => {        // 로그인 화면
        res.render('auth/login'); 
    })
    .post((req, res, next) => { // 로그인하기
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