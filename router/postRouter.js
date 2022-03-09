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
    
    connection.query('select * from post', (err, result) => {
        if (err) throw err; 

        console.log(result);

        res.render('post/index', {
            posts: result, 
        }); 
    }); 
}); 

// 글 쓰기 
router.post('/', upload.single('image'), (req, res) => {

    const title = req.body.title;
    const content = req.body.content;
    const fileName = req.file.filename !== null ? req.file.filename : '';  

    connection.query('insert into post(title, content, filename) values(?, ?, ?)', [title, content, fileName], (err, result) => {
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

        connection.query(`select * from post where id = ${post_id}`, (err, result) => {

            res.render('post/detail', {
                post: result[0], 
            }); 
        });
    })
    .put(upload.single('image'), (req, res) => {        // 글 수정하기 
        
        const post_id = req.params.id; 

        const title = req.body.title;
        const content = req.body.content;
        const fileName = req.file.filename !== null ? req.file.filename : '';  

        connection.query(`update post set title = ?, content = ?, filename = ? where id = ${post_id}`, [title, content, fileName], (err, result) => {
            if (err) throw err; 

            res.redirect('/post' + post_id); 
        }); 
    })
    .delete((req, res) => {     // 글 삭제하기 

        const post_id = req.params.id;

        connection.query(`delete from post where id = ${post_id}`, (err, result) => {
            if (err) throw err; 

            res.redirect('/post'); 
        });
    }); 

// 글 수정 화면
router.get('/:id/edit', (req, res) => {

    const post_id = req.params.id; 

    connection.query(`select * from post where id = ${post_id}`, (err, result) => {

        res.render('post/edit', {
            post: result[0], 
        }); 
    });
});

module.exports = router; 