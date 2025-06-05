const { sequelize, Sequelize } = require('../config/db');
const User = require('./User');
const Restaurant = require('./Restaurant');
const Reservation = require('./Reservation');
const Testimonial = require('./Testimonial');
const Menu = require('./Menu');

// Associations
User.hasMany(Reservation, {
  foreignKey: { name: 'userId', allowNull: false },
  onDelete: 'CASCADE',
});
Reservation.belongsTo(User, {
  foreignKey: { name: 'userId', allowNull: false },
});

User.hasOne(Restaurant, {
  foreignKey: { name: 'ownerId', allowNull: false },
  onDelete: 'CASCADE',
});
Restaurant.belongsTo(User, {
  foreignKey: { name: 'ownerId', allowNull: false },
});

Restaurant.hasMany(Reservation, {
  foreignKey: { name: 'restaurantId', allowNull: false },
  onDelete: 'CASCADE',
});
Reservation.belongsTo(Restaurant, {
  foreignKey: { name: 'restaurantId', allowNull: false },
});

Restaurant.hasMany(Menu, {
  foreignKey: { name: 'restaurantId', allowNull: false },
  onDelete: 'CASCADE',
});
Menu.belongsTo(Restaurant, {
  foreignKey: { name: 'restaurantId', allowNull: false },
});

// Optional: Testimonial associations (example, if needed)
Restaurant.hasMany(Testimonial, {
  foreignKey: { name: 'restaurantId', allowNull: false },
  onDelete: 'CASCADE',
});
Testimonial.belongsTo(Restaurant, {
  foreignKey: { name: 'restaurantId', allowNull: false },
});

const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    await sequelize.query('CREATE SCHEMA IF NOT EXISTS public;', { logging: false });

    await sequelize.sync({ force: false });
    console.log('✅ All models synchronized successfully.');

    const tables = await sequelize.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE';`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    console.log('📦 Existing tables:', tables.map(t => t.table_name));
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    throw error;
  }
};

const createDefaultRestaurants = async () => {
  const defaultRestaurants = [
    {
      name: 'Kuenga Samdrup',
      description: 'Traditional Bhutanese cuisine in a modern setting',
      address: 'Kanglung, Near College Gate',
      phone: '+975 17123456',
      openingHours: '9:00 AM - 9:00 PM',
    },
    {
      name: 'Ngawang Choden',
      description: 'Popular local restaurant serving Bhutanese and Indian dishes',
      address: 'Kanglung Main Road',
      phone: '+975 17234567',
      openingHours: '8:00 AM - 10:00 PM',
    },
    {
      name: 'Tashi Delek',
      description: 'Family restaurant with diverse menu options',
      address: 'Lower Kanglung',
      phone: '+975 17345678',
      openingHours: '10:00 AM - 8:00 PM',
    },
    {
      name: 'Apple Bees',
      description: 'Modern café with international cuisine',
      address: 'Kanglung Town',
      phone: '+975 17456789',
      openingHours: '8:00 AM - 8:00 PM',
    },
    {
      name: 'Namsai',
      description: 'Authentic Chinese and Thai cuisine',
      address: 'Upper Kanglung',
      phone: '+975 17567890',
      openingHours: '11:00 AM - 9:00 PM',
    },
  ];

  try {
    for (const restaurant of defaultRestaurants) {
      await Restaurant.findOrCreate({
        where: { name: restaurant.name },
        defaults: restaurant,
      });
    }
    console.log('✅ Default restaurants ensured.');
  } catch (error) {
    console.error('❌ Error creating default restaurants:', error.message);
  }
};

module.exports = {
  sequelize,
  User,
  Restaurant,
  Reservation,
  Testimonial,
  Menu,
  initializeDatabase,
  createDefaultRestaurants,
};

