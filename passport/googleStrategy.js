const connection = require('../mysql/mysqlConfig');
const passport = require('passport'); 
const GoogleStrategy = require('passport-google-oauth20').Strategy;

module.exports = () => {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:8081/auth/google/callback"
      },
      function(accessToken, refreshToken, profile, cb) {

        // console.log(profile); 

        const email = profile._json.email; 
        const name = profile._json.name;
    
        connection.query(`SELECT * FROM user WHERE email = ?`, [email], (err, result) => {
            if (err) throw err;
    
            const user = result[0]; 
    
            if (user === null || user === undefined) { // 구글 로그인 시 DB에 없던 회원이라면 가입시킨다. 
                connection.query('INSERT INTO user(email, name) values(?, ?)', [email, name], (err, result) => {
                    if (err) throw err; 
    
                    return cb(err, user);
                }); 
            } else { // 이미 가입되어 있던 회원이라면 그대로 로그인한다. 
                return cb(err, user);
            }
        })
      }
    ));
}
