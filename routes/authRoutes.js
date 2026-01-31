const express = require('express');
const router = express.Router();
const User = require('../models/user');


router.post('/login', async (req, res) => {
  res.send('test');
});

module.exports = router;
