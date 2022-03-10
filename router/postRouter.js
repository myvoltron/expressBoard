const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const connection = require('../mysql/mysqlConfig');

const router = express.Router();

try {
    fs.readdirSync('public/uploads');
} catch (error) {
    console.error('uploads 폴더가 없어 uploads 폴더를 생성');
    fs.mkdirSync('public/uploads');
}

const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, done) {
            done(null, 'public/uploads/');
        },
        filename(req, file, done) {
            const ext = path.extname(file.originalname);
            done(null, path.basename(file.originalname, ext) + Date.now() + ext);
        },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
});

// 글 목록 화면 
router.get('/', (req, res) => {

    connection.query('SELECT P.*, U.name FROM post P LEFT OUTER JOIN user U ON P.user_id = U.id', (err, result) => {
        if (err) throw err;

        // console.log(result);

        res.render('post/index', {
            posts: result,
        });
    });
});

// 글 쓰기 
router.post('/', upload.single('image'), (req, res) => {

    const password = req.body.password !== null ? req.body.password : null;
    const title = req.body.title;
    const content = req.body.content;
    const fileName = req.file !== undefined ? req.file.filename : '';
    const user_id = req.user !== undefined ? req.user.id : null; // 로그인한 회원의 경우 ... 

    connection.query('insert into post(title, content, filename, password, user_id) values(?, ?, ?, ?, ?)', [title, content, fileName, password, user_id], (err, result) => {
        if (err) throw err;

        res.redirect('/post');
    });
});

// 글 쓰기 화면 
router.get('/new', (req, res) => {

    res.render('post/new');
});

router.route('/:id')
    .get((req, res) => {        // 글 상세보기 
        const post_id = req.params.id;

        connection.query(`SELECT P.*, U.name FROM post P LEFT OUTER JOIN user U ON P.user_id = U.id WHERE P.id = ${post_id}`, (err, result) => {
            if (err) throw err;

            const post = result[0];
            connection.query(`SELECT C.*, U.name FROM comment C LEFT OUTER JOIN user U ON C.user_id = U.id WHERE C.post_id = ${post_id}`, (err, result) => {
                if (err) throw err;

                const comments = result;

                res.render('post/detail', {
                    post: post,
                    comments: comments,
                });
            })
            // connection.query(`select * from comment where post_id = ${post_id}`, (err, result) => {
            //     if (err) throw err; 

            //     const comments = result; 

            //     res.render('post/detail', {
            //         post: post, 
            //         comments: comments, 
            //     }); 
            // });
        });
    })
    .put(upload.single('image'), (req, res) => {        // 글 수정하기 

        const post_id = req.params.id;

        const isUserPost = req.body.userPost;
        const password = req.body.password;
        const title = req.body.title;
        const content = req.body.content;
        const fileName = req.file !== undefined ? req.file.filename : '';

        if (isUserPost) {
            connection.query(`update post set title = ?, content = ?, filename = ? updated_at = ? where id = ${post_id}`, [title, content, fileName, new Date()], (err, result) => {
                if (err) throw err;

                res.redirect('/post/' + post_id);
            });
        } else {
            connection.query(`select * from post where id = ${post_id}`, (err, result) => {
                const post = result[0];

                if (post.password === password) { // 비밀번호 비교 
                    connection.query(`update post set title = ?, content = ?, filename = ?, updated_at = ? where id = ${post_id}`, [title, content, fileName, new Date()], (err, result) => {
                        if (err) throw err;

                        res.redirect('/post/' + post_id);
                    });
                } else {

                    console.log('비밀번호 틀려서 수정 실패');
                    res.redirect('/post/' + post_id);
                }
            })
        }
    })
    .delete((req, res) => {     // 글 삭제하기 

        const isUserPost = req.body.userPost; // 회원 글 여부
        const password = req.body.password;
        const post_id = req.params.id;

        if (isUserPost) { // 회원 글 삭제
            connection.query(`delete from post where id = ${post_id}`, (err, result) => {
                if (err) throw err;

                res.redirect('/post');
            });
        } else {            // 비회원 글 삭제 
            connection.query(`select * from post where id = ${post_id}`, (err, result) => {
                if (err) throw err;

                const post = result[0];

                if (post.password === password) { // 비밀번호 비교 
                    connection.query(`delete from post where id = ${post_id}`, (err, result) => {
                        if (err) throw err;

                        res.redirect('/post');
                    });
                } else {

                    console.log('비밀번호가 맞지 않음');
                    res.redirect('/post');
                }
            });
        }
    });

// 글 수정 화면
router.get('/:id/edit', (req, res) => {

    const post_id = req.params.id;

    connection.query(`select * from post where id = ${post_id}`, (err, result) => {

        const post = result[0];

        if (post.user_id === null) { // 비로그인 회원이 쓴 글 
            res.render('post/edit', {
                post: post,
            });
        } else {                    // 로그인 회원이 쓴 글
            // 비로그인 회원이 로그인 회원이 쓴 글의 수정화면에 들어가면 안됨. 
            if (req.user && req.user.id === post.user_id) {
                res.render('post/edit', {
                    post: post,
                });
            } else {

                console.log('잘못된 접근!!');
                res.redirect('/post/' + post_id);
            }
        }
    });
});

// 좋아요(토글) 
router.get('/:id/like', (req, res) => {

    // 로그인 회원만 이용 가능
    if (req.user === undefined || req.user === null) {
        return; 
    }

    const post_id = req.params.id; 
    const user_id = req.user.id; 

    // 먼저 해당 글 그리고 해당 유저의 좋아요가 있는지 검색한다. 
    connection.query(`select * from likes where post_id = ${post_id} and user_id = ${user_id}`, (err, result) => {
        if (err) throw err;

        const like = result[0];
        if (like === null || like === undefined) {
            // 없으면 post_id와 user_id 정보를 담고 있는 좋아요를 만든다. 
            connection.query(`insert into likes(post_id, user_id) values(${post_id}, ${user_id})`, (err, result) => {
                if (err) throw err;

                // 그리고 해당 글의 좋아요 수를 1 올린다. 
                connection.query(`update post set likes = likes + 1 where id = ${post_id}`, (err, result) => {
                    if (err) throw err;

                    res.redirect('/post/' + post_id);
                });
            });
        } else { 
            // 있으면 해당 글의 좋아요를 삭제하고 
            connection.query(`delete from likes where post_id = ${post_id} and user_id = ${user_id}`, (err, result) => {
                if (err) throw err; 

                // 해당 글의 좋아요 수를 1 내린다. 
                connection.query(`update post set likes = likes - 1 where id = ${post_id}`, (err, result) => {
                    if (err) throw err;

                    res.redirect('/post/' + post_id);
                });
            })
        }
    });     
}); 

module.exports = router; 