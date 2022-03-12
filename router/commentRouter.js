const express = require('express');
const connection = require('../mysql/mysqlConfig'); 
const router = express.Router();

router.route('/')
    .post((req, res) => { // 댓글 쓰기

        const content = req.body.commentContent; 
        const post_id = req.body.id;
        const user_id = req.user != null ? req.user.id : null; // 로그인한 회원의 경우 ... 
        const password = req.body.password != null ? req.body.password : null; // 로그인한 회원의 경우 애초에 password 값이 안올것이다. 
        
        connection.query('insert into comment(content, post_id, user_id, password) values(?, ?, ?, ?)', [content, post_id, user_id, password], (err, result) => {
            if (err) throw err;

            res.redirect('/post/' + post_id); 
        }); 
    }); 

router.route('/:id')
    .delete((req, res) => { // 댓글 삭제

        const post_id = req.body.post_id; 
        const comment_id = req.params.id; 
        const password = req.body.password; 

        if (password) { // 비회원 댓글 삭제 
            connection.query(`select * from comment where id = ${comment_id}`, (err, result) => {
                if (err) throw err; 

                if (password === result[0].password) { // 비밀번호가 맞다면 
                    connection.query(`delete from comment where id = ${comment_id}`, (err, result) => {
                        if (err) throw err; 
            
                        return res.send(`<script>alert('댓글 삭제 성공'); location.href='/post/${post_id}';</script>`); // 댓글 삭제 성공
                        // res.redirect('/post/' + post_id); 
                    }); 
                } else { // 비밀번호 틀림 

                    // console.log('댓글 삭제 실패!');
                    return res.send(`<script>alert('댓글 삭제 실패 비밀번호를 확인해주세요'); location.href='/post/${post_id}';</script>`); // 댓글 삭제 실패
                    // res.redirect('/post/' + post_id); 
                }
            })
        } else {        // 회원의 댓글 삭제
            connection.query(`delete from comment where id = ${comment_id}`, (err, result) => {
                if (err) throw err; 
    
                return res.send(`<script>alert('댓글 삭제 성공'); location.href='/post/${post_id}';</script>`); // 댓글 삭제 성공
                // res.redirect('/post/' + post_id); 
            }); 
        }        
    }); 

module.exports = router;