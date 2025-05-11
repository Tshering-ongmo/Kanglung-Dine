const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get reservation page
router.get('/', (req, res) => {
    res.render('reservation');
});

// Create new reservation
router.post('/create', async (req, res) => {
    const { date, time, duration, number_of_people, name, email, phone } = req.body;

    try {
        // First, check if user exists or create new user
        const userResult = await db.one(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET name = $1 RETURNING id',
            [name, email, ''] // Note: Add proper password handling in production
        );

        // Create the reservation
        const reservationResult = await db.one(
            'INSERT INTO reservations (customer_id, reservation_date, reservation_time, duration, number_of_people, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING reservation_id',
            [userResult.id, date, time, duration, number_of_people, 'pending']
        );

        res.status(200).json({
            success: true,
            message: 'Reservation created successfully',
            reservationId: reservationResult.reservation_id
        });
    } catch (error) {
        console.error('Error creating reservation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create reservation'
        });
    }
});

// Get user's reservations
router.get('/my-reservations', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Please login to view reservations'
            });
        }

        const reservations = await db.any(
            `SELECT r.*, u.name, u.email 
             FROM reservations r 
             JOIN users u ON r.customer_id = u.id 
             WHERE r.customer_id = $1 
             ORDER BY r.reservation_date DESC, r.reservation_time DESC`,
            [req.session.userId]
        );

        res.status(200).json({
            success: true,
            reservations
        });
    } catch (error) {
        console.error('Error fetching reservations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reservations'
        });
    }
});

// Cancel reservation
router.post('/cancel/:id', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Please login to cancel reservation'
            });
        }

        await db.none(
            'UPDATE reservations SET status = $1 WHERE reservation_id = $2 AND customer_id = $3',
            ['cancelled', req.params.id, req.session.userId]
        );

        res.status(200).json({
            success: true,
            message: 'Reservation cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel reservation'
        });
    }
});

module.exports = router;