const express = require('express');
const passport = require('passport');

const router = express.Router();

router.route('/login')
    .get((req, res) => {        // 로그인 화면
        res.render('auth/login'); 
    })
    .post((req, res, next) => { // 로그인하기
        passport.authenticate('local', (authError, user, info) => {

            console.log(user);
            
            if (authError) { // 서버 에러
                console.error(authError);
                return next(authError); 
            }
    
            if (!user) { // 로그인 실패
                
                return res.send(`<script>alert('${info.message}'); location.href='/post';</script>`);
                // return res.redirect(`/auth/login?loginError=${info.message}`); 
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

router.get('/google',
  passport.authenticate('google', { scope:
      [ 'email', 'profile' ] }
));

router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
    });

// 로그아웃
router.get('/logout', (req, res, next) => {
    req.logout();
    req.session.destroy();

    return res.send(`<script>alert('로그아웃 했습니다.'); location.href='/post';</script>`);
    // res.redirect('/'); 
})

module.exports = router; 