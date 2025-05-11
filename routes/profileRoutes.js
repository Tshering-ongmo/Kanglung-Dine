const express = require('express');
const router = express.Router();

router.get('/profile', (req, res) => {
    // Get user data from session
    const user = req.session.user || null;
    res.render('profile', { 
        user: user,
        title: 'User Profile'
    });
});

module.exports = router;