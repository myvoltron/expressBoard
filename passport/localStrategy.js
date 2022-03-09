const passport = require('passport');
const localStrategy = require('passport-local').Strategy; 
const bcrypt = require('bcrypt');
const connection = require('../mysql/mysqlConfig');

module.exports = () => {
    passport.use(new localStrategy({
        usernameField: 'email',
        passwordField: 'password', 
    }, async (email, password, done) => {
        connection.query('select * from user where email = ?', email, (err, result) => {
            if (err) done(null, false, { message: '가입되지 않은 회원입니다.' }); 

            const exUser = result[0]; 

            if(exUser) {
                const result = await bcrypt.compare(password, exUser.password); 
                if (result) {
                    done(null, exUser);
                } else {
                    done(null, false, { message: '비밀번호가 일치하지 않습니다.' }); 
                }
            }
        });
    }))
};