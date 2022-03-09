const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const connection = require('../mysql/mysqlConfig');

const router = express.Router();

router.post('/login', (req, res, next) => {
    passport.authenticate('local', )
})

module.exports = router; 