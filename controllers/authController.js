const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { Restaurant } = require('../models');
const { sequelize } = require('../config/db');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/email');

// Admin credentials (in production, these should be in environment variables)
const ADMIN_EMAIL = 'admin@kanglungdine.com';
const ADMIN_PASSWORD = 'KD@admin2024#secure';

// Signup
exports.registerUser = async (req, res) => {
    let transaction;
    
    try {
        // Start transaction
        transaction = await sequelize.transaction();
        
        console.log('Registration attempt with data:', {
            name: req.body.name,
            email: req.body.email,
            role: req.body.role
        });

        const { name, email, password, role, restaurantName, restaurantAddress, restaurantPhone, restaurantHours } = req.body;

        // Input validation
        if (!name || !email || !password || !role) {
            console.log('Missing required fields:', { name: !!name, email: !!email, password: !!password, role: !!role });
            return res.render('signup', { 
                error: 'All fields are required',
                name,
                email,
                role
            });
        }

        // Additional validation for restaurant owners
        if (role === 'owner' && (!restaurantName || !restaurantAddress || !restaurantPhone || !restaurantHours)) {
            return res.render('signup', {
                error: 'All restaurant fields are required for restaurant owners',
                name,
                email,
                role,
                restaurantName,
                restaurantAddress,
                restaurantPhone,
                restaurantHours
            });
        }

        // Validate role
        if (!['user', 'owner', 'admin'].includes(role)) {
            console.log('Invalid role:', role);
            return res.render('signup', { 
                error: 'Invalid role selected',
                name,
                email
            });
        }
        
        // Prevent registration with admin email
        if (email === ADMIN_EMAIL) {
            return res.render('signup', { 
                error: 'This email cannot be used for registration',
                name
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            where: { email },
            transaction
        });

        if (existingUser) {
            await transaction.rollback();
            console.log('User already exists:', email);
            return res.render('signup', { 
                error: 'Email already registered',
                name
            });
        }

        // Check if restaurant name already exists for restaurant owners
        if (role === 'owner') {
            const existingRestaurant = await Restaurant.findOne({
                where: { name: restaurantName },
                transaction
            });

            if (existingRestaurant) {
                await transaction.rollback();
                return res.render('signup', {
                    error: 'Restaurant name already exists',
                    name,
                    email,
                    role,
                    restaurantAddress,
                    restaurantPhone,
                    restaurantHours
                });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        // Create new user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            verificationToken
        }, { transaction });

        // If user is a restaurant owner, create the restaurant
        if (role === 'owner') {
            try {
                const restaurant = await Restaurant.create({
                    name: restaurantName,
                    ownerId: user.id,
                    address: restaurantAddress,
                    phone: restaurantPhone,
                    openingHours: restaurantHours,
                    description: `Welcome to ${restaurantName}, owned by ${name}.`
                }, { transaction });

                // Verify restaurant was created
                if (!restaurant) {
                    throw new Error('Restaurant was not saved to database');
                }
            } catch (error) {
                await transaction.rollback();
                console.error('Error creating restaurant:', error);
                return res.render('signup', {
                    error: 'Error creating restaurant: ' + error.message,
                    name,
                    email,
                    role,
                    restaurantName,
                    restaurantAddress,
                    restaurantPhone,
                    restaurantHours
                });
            }
        }

        // Commit transaction only after both user and restaurant (if applicable) are created
        // Send verification email
        try {
            await sendVerificationEmail(user.email, user.verificationToken);
        } catch (emailError) {
            // If email sending fails, we should still rollback the transaction
            // or decide if the user should be created without verification email sent.
            // For now, let's rollback and show an error.
            await transaction.rollback();
            console.error('Failed to send verification email:', emailError);
            return res.render('signup', {
                error: 'Error registering user: Could not send verification email. Please try again.',
                name: req.body.name,
                email: req.body.email,
                role: req.body.role,
                restaurantName: req.body.restaurantName,
                restaurantAddress: req.body.restaurantAddress,
                restaurantPhone: req.body.restaurantPhone,
                restaurantHours: req.body.restaurantHours
            });
        }
        
        await transaction.commit();
        
        console.log('User registered successfully, verification email sent:', {
            id: user.id,
            email: user.email,
            role: user.role
        });

        // Redirect to login page with success message
        return res.redirect('/auth/login?success=Registration successful! Please check your email to verify your account.');
    } catch (err) {
        // Rollback transaction on error
        if (transaction) await transaction.rollback();
        console.error('Registration error:', err);
        return res.render('signup', { 
            error: 'Error registering user: ' + err.message,
            name: req.body.name,
            email: req.body.email,
            role: req.body.role,
            restaurantName: req.body.restaurantName,
            restaurantAddress: req.body.restaurantAddress,
            restaurantPhone: req.body.restaurantPhone,
            restaurantHours: req.body.restaurantHours
        });
    }
};

// Login
exports.loginUser = async (req, res) => {
    try {
        console.log('Login attempt:', {
            email: req.body.email
        });

        const { email, password } = req.body;

        // Check for admin credentials
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            let adminUser = await User.findOne({ where: { email: ADMIN_EMAIL } });

            if (!adminUser) {
                // Admin user does not exist, create it
                const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
                adminUser = await User.create({
                    name: 'Administrator',
                    email: ADMIN_EMAIL,
                    password: hashedPassword,
                    role: 'admin',
                    isVerified: true // Admins are verified by default
                });
                console.log('Admin user created in database:', adminUser.toJSON());
            } else {
                // Admin user exists, ensure role is 'admin' and isVerified is true
                if (adminUser.role !== 'admin' || !adminUser.isVerified) {
                    adminUser.role = 'admin';
                    adminUser.isVerified = true;
                    await adminUser.save();
                    console.log('Admin user updated in database:', adminUser.toJSON());
                }
            }

            req.session.isAdmin = true; // Retain for specific admin checks if needed elsewhere
            req.session.user = {
                id: adminUser.id, // Use ID from database
                name: adminUser.name,
                email: adminUser.email,
                role: adminUser.role
            };
            console.log('Admin login successful, session set:', req.session.user);
            return res.redirect('/admin/dashboard');
        }

        // Regular user authentication
        const user = await User.findOne({ 
            where: { email },
            attributes: ['id', 'name', 'email', 'password', 'role', 'isVerified']
        });

        if (!user) {
            console.log('Login failed: User not found for email:', email);
            return res.render('login', { error: 'Invalid email or password' });
        }

        if (!user.isVerified) {
            console.log('Login failed: Email not verified for user:', email);
            return res.render('login', { error: 'Please verify your email address before logging in. Check your inbox for a verification email.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Login failed: Invalid password for email:', email);
            return res.render('login', { error: 'Invalid email or password' });
        }

        // Set user session
        req.session.user = { 
            id: user.id, 
            name: user.name, 
            email: user.email,
            role: user.role 
        };
        req.session.isAdmin = false;

        console.log('Login successful:', {
            id: user.id,
            email: user.email,
            role: user.role
        });

        // Redirect based on role
        if (user.role === 'owner') {
            console.log('Redirecting to owner dashboard');
            return res.redirect('/res_owner/dashboard');
        } else {
            console.log('Redirecting to home');
            return res.redirect('/home');
        }
    } catch (err) {
        console.error('Login error:', err);
        return res.render('login', { error: 'Error logging in: ' + err.message });
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

// Verify Email
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        if (!token) {
            return res.status(400).send('Verification token is missing.');
        }

        const user = await User.findOne({ where: { verificationToken: token } });

        if (!user) {
            return res.status(400).send('Invalid or expired verification token. Please try registering again or contact support.');
        }

        user.isVerified = true;
        user.verificationToken = null; // Clear the token after verification
        await user.save();

        // Optionally, redirect to login with a success message or show a success page
        // For now, let's send a simple success message.
        // It's better to redirect to a page that says "Email verified, you can now login"
        // and then redirect to login page.
        // res.send('Email verified successfully! You can now login.');
        return res.redirect('/auth/login?success=Email verified successfully! You can now login.');

    } catch (err) {
        console.error('Email verification error:', err);
        // It's good practice to have an error page or a more user-friendly error message
        return res.status(500).send('Error verifying email: ' + err.message);
    }
};
