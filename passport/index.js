const passport = require('passport');
const connection = require('../mysql/mysqlConfig'); 
const local = require('./localStrategy');
const google = require('./googleStrategy');

module.exports = () => {
    passport.serializeUser((user, done) => { // 로그인 할 때
        done(null, user.id); // req.session에 user.id를 저장
    }); 

    passport.deserializeUser((id, done) => { // 매 요청마다 실행됨 

        // serializeUser에서 세션에 저장했던 id를(req.session에 저장됐던) 가지고 와서 사용자 정보를 조회
        // 조회한 사용자 정보는 req.user에 저장될 것이다. 
        connection.query(`select * from user where id = ${id}`, (err, result) => {
            if (err) done(err); 

            done(null, result[0]); 
        });
    });

    local(); 
    google();
}; 