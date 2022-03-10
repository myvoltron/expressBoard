const express = require('express'); 
const bcrypt = require('bcrypt');

const saltRounds = 10;
const connection = require('../mysql/mysqlConfig'); 
const router = express.Router();

// 유저 목록 화면 
router.get('/', (req, res) => {
    
    connection.query('select * from user', (err, result) => {
        if (err) throw err; 

        // console.log(result);

        res.render('user/index', {
            users: result, 
        }); 
    }); 
}); 

// 회원 가입
router.post('/', (req, res) => {

    const email = req.body.email;
    const password = req.body.password; 
    const name = req.body.name; 

    bcrypt.hash(password, saltRounds)
        .then((hash) => {
            connection.query('insert into user(email, password, name) values(?, ?, ?)', [email, hash, name], (err, result) => {
                if (err) throw err; 
        
                res.redirect('/user');
            }); 
        })
        .catch(err => {
            console.error(err); 
        }); 
}); 

// 회원 가입 화면
router.get('/new', (req, res) => {

    res.render('user/new'); 
}); 

router.route('/:id')
    .get((req, res) => {        // 유저 상세보기
        const user_id = req.params.id; 

        connection.query(`select * from user where id = ${user_id}`, (err, result) => {

            res.render('user/detail', {
                userInfo: result[0], 
            }); 
        });
    })
    .put((req, res) => {        // 유저 수정하기 
        
        const user_id = req.params.id; 

        const email = req.body.email;
        const password = req.body.password; 
        const name = req.body.name; 

        bcrypt.hash(password, saltRounds)
        .then((hash) => {
            connection.query(`update user set email = ?, password = ?, name = ? where id = ${user_id}`, [email, hash, name], (err, result) => {
                if (err) throw err; 
    
                res.redirect('/' + user_id); 
            }); 
        })
        .catch(err => {
            console.error(err); 
        }); 
    })
    .delete((req, res) => {     // 유저 탈퇴하기 

        const user_id = req.params.id; 

        connection.query(`delete from user where id = ${user_id}`, (err, result) => {
            if (err) throw err; 

            res.redirect('/user'); 
        });
    }); 

// 유저 수정 화면
router.get('/:id/edit', (req, res) => {

    const user_id = req.params.id; 

    // 현재 로그인 중인 회원과 수정할 회원의 아이디가 같아야 수정 화면을 제공할 수 있음. 
    if (req.user && req.user.id === user_id) {
        console.log('잘못된 접근!!'); 
        res.redirect('/user/' + user_id); 
    } else {
        connection.query(`select * from user where id = ${user_id}`, (err, result) => {

            const userInfo = result[0]; 
            res.render('user/edit', {
                userInfo: userInfo,
            }); 
        });
    }
});

module.exports = router; 