const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy; 
const bcrypt = require('bcrypt');
const connection = require('../mysql/mysqlConfig');

module.exports = () => {
    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password', 
    }, (email, password, done) => {
        connection.query('select * from user where email = ?', [email], async (err, result) => {
            if (err) {
                console.error(err);
                next(err); 
            }

            const exUser = result[0]; 

            if(exUser) {
                const result = await bcrypt.compare(password, exUser.password); //
                if (result) {
                    done(null, exUser); // 로그인 성공
                } else {
                    done(null, false, { message: '비밀번호가 일치하지 않습니다.' }); 
                }
            } else {
                done(null, false, { message: '가입되지 않은 회원입니다.' }); 
            }
        });
    }))
};