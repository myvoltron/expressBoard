const express = require('express');
const connection = require('../mysql/mysqlConfig');

const router = express.Router();

router.post('/', (req, res) => {
    
    const searchType = req.body.searchType;
    const searchKeyword = req.body.searchKeyword;

    if (searchType === 'post') {
        connection.query(`SELECT P.*, U.name FROM post P LEFT OUTER JOIN user U ON P.user_id = U.id WHERE P.title LIKE '%${searchKeyword}%' OR P.content LIKE '%${searchKeyword}%' ORDER BY P.created_at DESC`, (err, result) => {
            if (err) throw err; 

            res.render('post/index', {
                posts: result,
            });
        });

    } else if (searchType === 'user') { 
        connection.query(`select * from user WHERE user.name LIKE '%${searchKeyword}%'`, (err, result) => {
            if (err) throw err;
    
            // console.log(result);
    
            res.render('user/index', {
                users: result,
            });
        });
    } else {

        console.log('잘못된 검색타입');
        res.redirect('/post');
    }
}); 

module.exports = router; 