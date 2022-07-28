const express = require('express');
const { home } = require('../controllers/homeController');

const router = express.Router();

router.get('/login', home);

module.exports = router;
