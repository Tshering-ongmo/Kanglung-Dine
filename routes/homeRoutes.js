const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');


// Home route (only accessible by logged-in users)
router.get('/home', isAuthenticated, (req, res) => {
    // Prevent caching of the home page by setting appropriate headers
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.render('home', { user: req.session.user });
});


// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/auth/login'); // Redirect to login after logout
    });
});


module.exports = router;
