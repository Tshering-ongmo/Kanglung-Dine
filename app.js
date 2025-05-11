// Import required modules
const express = require('express');
const path = require('path');
const dotenv = require('dotenv') // load local file .env
const db = require('./config/db');
const bodyParser = require('body-parser');
const session = require('express-session');

// Import routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/authRoutes');
const homeRoutes = require('./routes/homeRoutes');
const profileRoutes = require('./routes/profileRoutes');
const reservationRoutes = require('./routes/reservationRoutes');

//load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3030;

// Middleware for parsing request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // true in production
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true, // prevents client-side access to the cookie
        sameSite: 'strict' // CSRF protection
    }
}));

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname,'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Import routes
//Routes before logging in
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.get('/', (req, res) => {
    res.render('index');
});
app.get('/map', (req, res) => {
  res.render('map');
});

// Add this route for the about page
app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/contact', (req, res) => {
  res.render('contact');
});


// Route after logging in
// Add this new route for the home page
app.get('/home', (req, res) => {
  res.render('home');
});
// Add the lmap route
app.get('/lmap', (req, res) => {
  res.render('lmap');
});

// Add this route for the about page
app.get('/labout', (req, res) => {
  res.render('labout');
});

// Add the lcontact route
app.get('/lcontact', (req, res) => {
  res.render('lcontact');
});

// Add the reservations route
app.get('/reservations', (req, res) => {
  res.render('reservation');
});


// Add this with your other route middleware
app.use('/reservations', reservationRoutes);

// Add the reservation API endpoint
app.post('/api/reservations', async (req, res) => {
  const { date, time, duration, number_of_people, name, email, phone } = req.body;

  try {
      // First, check if user exists or create new user
      const userResult = await db.one(
          'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET name = $1 RETURNING id',
          [name, email, ''] // Note: Add proper password handling in production
      );
      const userId = userResult.id;

      // Create the reservation
      const reservationResult = await db.one(
          'INSERT INTO reservations (customer_id, reservation_date, reservation_time, duration, number_of_people, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING reservation_id',
          [userId, date, time, duration, number_of_people, 'pending']
      );

      res.status(200).json({
          message: 'Reservation created successfully',
          reservationId: reservationResult.reservation_id
      });
  } catch (error) {
      console.error('Error creating reservation:', error);
      res.status(500).json({ message: 'Failed to create reservation' });
  }
});

// Add database test endpoint
app.get('/db-test', async (req, res) => {
    try {
        const result = await db.one('SELECT NOW() AS current_time');
        res.json({ message: 'Database connected successfully', time: result.current_time });
    } catch (err) {
        res.status(500).json({ error: 'Database connection failed', details: err.message });
    }
});

// Start server
app.listen(PORT, () => {
console.log(`Server is running on http://localhost:${PORT}`);
});