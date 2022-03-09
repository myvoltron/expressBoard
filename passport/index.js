const passport = require('passport');
const connection = require('../mysql/mysqlConfig'); 
const local = require('./localStrategy');

module.exports = () => {
    passport.serializeUser((user, done) => {
        done(null, user.id); 
    }); 

    passport.deserializeUser((id, done) => {
        connection.query(`select * from user where id = ${id}`, (err, result) => {
            if (err) done(err); 

            done(null, result[0]); 
        });
    });

    local(); 
}; 