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

    connection.query('SELECT P.*, U.name FROM post P LEFT OUTER JOIN user U ON P.user_id = U.id ORDER BY P.created_at DESC', (err, result) => {
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
    const fileName = req.file !== undefined ? req.file.filename : false;
    const user_id = req.user !== undefined ? req.user.id : null; // 로그인한 회원의 경우 ... 

    if(!fileName) { // 파일을 안올린경우
        connection.query('insert into post(title, content, password, user_id) values(?, ?, ?, ?)', [title, content, password, user_id], (err, result) => {
            if (err) throw err;
    
            // console.log(result.insertId);
            return res.send(`<script>alert('글을 올렸습니다.'); location.href='/post/${result.insertId}';</script>`); // 글 생성
            // res.redirect('/post');
        });
    } else { // 이미지 파일만 올라갈 수 있게 하자    
        const ext = path.extname(fileName); // 확장자 
        // console.log(ext);
        if (ext === ".jpeg" || ext === ".png" || ext === ".jpg") {

            connection.query('insert into post(title, content, filename, password, user_id) values(?, ?, ?, ?, ?)', [title, content, fileName, password, user_id], (err, result) => {
                if (err) throw err;
        
                return res.send(`<script>alert('글을 올렸습니다.'); location.href='/post/${result.insertId}';</script>`); // 글 생성
            });
        } else {
            return res.send(`<script>alert('이미지 파일만 올려주세요!!'); location.href='/post/new';</script>`); // 이미지 파일만 올라가야함
        }

        
    }
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

                connection.query(`SELECT COUNT(*) AS commentCount FROM comment WHERE post_id = ${post_id}`, (err, result) => {

                    const commentCount = result[0].commentCount;
                    // console.log(commentCount);

                    res.render('post/detail', {
                        post: post,
                        comments: comments,
                        commentCount: commentCount,
                    });
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
        const fileName = req.file !== undefined ? req.file.filename : null;

        if (isUserPost) { // 로그인 회원의 수정 
            connection.query(`update post set title = ?, content = ?, filename = ? updated_at = ? where id = ${post_id}`, [title, content, fileName, new Date()], (err, result) => {
                if (err) throw err;

                return res.send(`<script>alert('수정완료'); location.href='/post/${post_id}';</script>`); // 수정완료
                // res.redirect('/post/' + post_id);
            });
        } else {        // 비로그인 회원의 수정
            connection.query(`select * from post where id = ${post_id}`, (err, result) => {
                const post = result[0];

                if (post.password === password) { // 비밀번호 비교해서 맞을 때
                    connection.query(`update post set title = ?, content = ?, filename = ?, updated_at = ? where id = ${post_id}`, [title, content, fileName, new Date()], (err, result) => {
                        if (err) throw err;

                        return res.send(`<script>alert('수정완료'); location.href='/post/${post_id}';</script>`); // 수정완료
                        // res.redirect('/post/' + post_id);
                    });
                } else {                        // 비밀번호 틀림

                    return res.send(`<script>alert('비밀번호를 확인해주세요.'); location.href='/post/${post_id}';</script>`); // 수정완료
                    // console.log('비밀번호 틀려서 수정 실패');
                    // res.redirect('/post/' + post_id);
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

                return res.send(`<script>alert('삭제하였습니다.'); location.href='/post';</script>`); // 삭제하고 글 목록으로 리다이렉트
                // res.redirect('/post');
            });
        } else {            // 비회원 글 삭제 
            connection.query(`select * from post where id = ${post_id}`, (err, result) => {
                if (err) throw err;

                const post = result[0];

                if (post.password === password) { // 비밀번호 비교 
                    connection.query(`delete from post where id = ${post_id}`, (err, result) => {
                        if (err) throw err;

                        return res.send(`<script>alert('삭제하였습니다.'); location.href='/post';</script>`); // 삭제하고 글 목록으로 리다이렉트
                        // res.redirect('/post');
                    });
                } else {

                    return res.send(`<script>alert('비밀번호가 맞지않습니다.'); location.href='/post/${post_id}';</script>`); // 삭제실패 해당 글로 리다이렉트
                    // console.log('비밀번호가 맞지 않음');
                    // res.redirect('/post');
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

                return res.send(`<script>alert('잘못된 접근!!'); location.href='/post/${post_id}';</script>`); // 잘못된 접근
                // console.log('잘못된 접근!!');
                // res.redirect('/post/' + post_id);
            }
        }
    });
});

// 좋아요(토글) 
router.get('/:id/like', (req, res) => {

    // 로그인 회원만 이용 가능
    if (req.user === undefined || req.user === null) {
        
        return res.send(`<script>alert('로그인 회원만 이용 가능합니다.'); location.href='/auth/login';</script>`); // 로그인 회원만 좋아요 기능 사용가능, 로그인 창으로 리다이렉트
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

                    return res.send(`<script>alert('좋아요'); location.href='/post/${post_id}';</script>`); // 좋아요
                    // res.redirect('/post/' + post_id);
                });
            });
        } else { 
            // 있으면 해당 글의 좋아요를 삭제하고 
            connection.query(`delete from likes where post_id = ${post_id} and user_id = ${user_id}`, (err, result) => {
                if (err) throw err; 

                // 해당 글의 좋아요 수를 1 내린다. 
                connection.query(`update post set likes = likes - 1 where id = ${post_id}`, (err, result) => {
                    if (err) throw err;

                    return res.send(`<script>alert('좋아요를 해제합니다.'); location.href='/post/${post_id}';</script>`); // 좋아요 해제
                    // res.redirect('/post/' + post_id);
                });
            })
        }
    });     
}); 

module.exports = router; 