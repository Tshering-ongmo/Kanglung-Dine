// Import required modules
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { sequelize } = require('./config/db');
const bodyParser = require('body-parser');
const session = require('express-session');
const { initializeDatabase } = require('./models');
const SequelizeStore = require("connect-session-sequelize")(session.Store);

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3030;

// Session store setup
const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: "Session",
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 24 * 60 * 60 * 1000,
});

// Trust proxy in production
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  store: sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'strict'
  }
}));

// Routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/authRoutes');
const homeRoutes = require('./routes/homeRoutes');
const profileRoutes = require('./routes/profileRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const adminRoutes = require('./routes/adminRoutes');
const ownerRoutes = require('./routes/ownerRoutes');

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/', homeRoutes);
app.use('/profile', profileRoutes);
app.use('/reservations', reservationRoutes);
app.use('/testimonials', testimonialRoutes);
app.use('/admin', adminRoutes);
app.use('/res_owner', ownerRoutes);

// Static page routes
app.get('/', (req, res) => res.render('index'));
app.get('/restaurants', (req, res) => res.render('restaurants'));
app.get('/about', (req, res) => res.render('about'));
app.get('/contact', (req, res) => res.render('contact'));
app.get('/home', (req, res) => res.render('home'));
app.get('/lmap', (req, res) => res.render('lmap'));
app.get('/labout', (req, res) => res.render('labout'));
app.get('/lcontact', (req, res) => res.render('lcontact'));
app.get('/Kuengasamdrup', (req, res) => res.render('Kuengasamdrup'));
app.get('/NC', (req, res) => res.render('NC'));
app.get('/Applebees', (req, res) => res.render('Applebees'));
app.get('/Namsai', (req, res) => res.render('Namsai'));
app.get('/Tashidelek', (req, res) => res.render('Tashidelek'));
app.get('/terms', (req, res) => res.render('terms'));

// DB connection test
app.get('/db-test', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ message: 'Database connected successfully', time: new Date() });
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

// Start server after initializing DB
const startServer = async () => {
  try {
    await sessionStore.sync();
    await sequelize.sync({ force: false });
    await initializeDatabase();

    console.log("✅ Database and session store synchronized!");

    app.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
