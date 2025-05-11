const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Signup
exports.registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Check if user already exists
        const existingUser = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser) {
            return res.render('signup', { error: 'Error registering user' });
        }

        // Insert new user
        await db.none('INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
                      [name, email, hashedPassword]);
        
        // Redirect to login page with success message
        res.redirect('/auth/login?success=Registration successful! Please login.');
    } catch (err) {
        // Keep user on signup page with error message
        res.render('signup', { error: 'Error registering user' });
    }
};

// Login
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);

        if (!user) {
            return res.render('login', { error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', { error: 'Invalid email or password' });
        }

        req.session.user = { id: user.id, name: user.name, email: user.email };
        res.redirect('/home');
    } catch (err) {
        return res.render('login', { error: 'Error logging in' });
    }
};

// Logout
exports.logoutUser = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/');
    });
};
