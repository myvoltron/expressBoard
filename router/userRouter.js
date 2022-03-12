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

                return res.send(`<script>alert('회원가입 성공'); location.href='/user';</script>`); // 회원가입 성공
                // res.redirect('/user');
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

            const userInfo = result[0];

            connection.query(`SELECT P.* FROM post P INNER JOIN likes L ON P.id = L.post_id WHERE L.user_id = ${user_id}`, (err, result) => {
                if (err) throw err;

                const postsByUserLike = result;

                connection.query(`SELECT COUNT(*) AS followCount FROM follow WHERE follower_id = ${user_id}`, (err, result) => {
                    if (err) throw err; 

                    const followCount = result[0].followCount;
                    // console.log(followCount);

                    res.render('user/detail', {
                        userInfo: userInfo,
                        postsByUserLike: postsByUserLike,
                        followCount: followCount, 
                    });
                });
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

// 팔로우하기 
// 로그인 유저만 사용가능
// 팔로우하려는 유저와 팔로우하는 유저가 같으면 안됨
// 토글
router.get('/:id/follow', (req, res) => {

    const follower_id = req.params.id;
    const following_id = req.user !== null && req.user !== undefined ? req.user.id : null;

    // 로그인 되어 있지않으면 로그인화면으로 보낸다. 
    if (!following_id) {
        return res.send(`<script>alert('좋아요 기능을 사용하시려면 로그인을 해주세요'); location.href='/auth/login';</script>`); // 로그인화면으로 리다이렉트
        // res.redirect('/auth/login');
    } else {

        // 팔로우하려는 유저와 팔로우하는 유저가 비교
        if (follower_id === following_id) { // 같으면
            return res.send(`<script>alert('자기자신을 팔로우할 순 없습니다.'); location.href='/user/${req.params.id}';</script>`); // 회원 정보창으로 리다이렉트
        } else {                            // 다르다면

            // 이미 팔로우되어있는지 확인
            connection.query(`SELECT * FROM follow WHERE following_id = ${following_id} AND follower_id = ${follower_id}`, (err, result) => {
                if (err) throw err;

                const follow = result[0];
                if (follow) { // 팔로우 되어있다면 삭제 
                    connection.query(`DELETE FROM follow WHERE following_id = ${following_id} AND follower_id = ${follower_id}`, (err, result) => {
                        if (err) throw err;

                        return res.send(`<script>alert('팔로우를 해제합니다.'); location.href='/user/${req.params.id}';</script>`); // 팔로우 해제
                        // res.redirect('/user/' + req.params.id);
                    });
                } else { // 팔로우 생성
                    connection.query(`INSERT INTO follow(following_id, follower_id) values(${following_id}, ${follower_id})`, (err, result) => {
                        if (err) throw err;

                        return res.send(`<script>alert('팔로우 했습니다.'); location.href='/user/${req.params.id}';</script>`); // 팔로우 하기
                        // res.redirect('/user/' + req.params.id);
                    });
                }
            });
        }
    }
});

module.exports = router; 