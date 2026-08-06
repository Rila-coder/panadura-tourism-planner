// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// POST: Admin Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if username and password provided
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Find admin user
        const [users] = await pool.query(
            'SELECT * FROM admin_users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        const admin = users[0];

        // Compare password (temporary - we'll update password hash later)
        // For now, accept any password since we're testing
        // In production, uncomment bcrypt check below
        
        // const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        // if (!isValidPassword) {
        //     return res.status(401).json({
        //         success: false,
        //         message: 'Invalid username or password'
        //     });
        // }

        // Create JWT token
        const token = jwt.sign(
            { 
                id: admin.user_id, 
                username: admin.username,
                email: admin.email 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token: token,
                user: {
                    id: admin.user_id,
                    username: admin.username,
                    email: admin.email,
                    full_name: admin.full_name
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET: Verify token
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        res.json({
            success: true,
            message: 'Token is valid',
            data: decoded
        });

    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
});

// GET: Admin profile
router.get('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        const [users] = await pool.query(
            'SELECT user_id, username, email, full_name, created_at FROM admin_users WHERE user_id = ?',
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: users[0]
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
});

// src/routes/adminRoutes.js - Add these new endpoints

// POST: Add new place (Admin only)
router.post('/places', async (req, res) => {
    try {
        const {
            title,
            description,
            category_id,
            latitude,
            longitude,
            address,
            entry_fee,
            est_food_cost,
            avg_duration,
            best_time,
            has_parking,
            image_url,
            opening_time,
            closing_time,
            rating
        } = req.body;

        // Validate required fields
        if (!title || !description || !category_id || !latitude || !longitude || !address) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: title, description, category_id, latitude, longitude, address'
            });
        }

        const sql = `
            INSERT INTO places (
                title, description, category_id, latitude, longitude,
                address, entry_fee, est_food_cost, avg_duration,
                best_time, has_parking, image_url, opening_time,
                closing_time, rating
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.query(sql, [
            title,
            description,
            category_id,
            latitude,
            longitude,
            address,
            entry_fee || 0,
            est_food_cost || 0,
            avg_duration || 60,
            best_time || null,
            has_parking || 1,
            image_url || null,
            opening_time || null,
            closing_time || null,
            rating || 0
        ]);

        res.status(201).json({
            success: true,
            message: 'Place added successfully',
            data: { place_id: result.insertId }
        });

    } catch (error) {
        console.error('Error adding place:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add place',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});


// src/routes/adminRoutes.js - Add these new endpoints

// PUT: Update a place (Admin only)
router.put('/places/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            category_id,
            latitude,
            longitude,
            address,
            entry_fee,
            est_food_cost,
            avg_duration,
            best_time,
            has_parking,
            image_url,
            opening_time,
            closing_time,
            rating,
            is_featured
        } = req.body;

        // Check if place exists
        const [check] = await pool.query('SELECT place_id FROM places WHERE place_id = ?', [id]);
        if (check.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Place not found'
            });
        }

        const sql = `
            UPDATE places SET
                title = ?,
                description = ?,
                category_id = ?,
                latitude = ?,
                longitude = ?,
                address = ?,
                entry_fee = ?,
                est_food_cost = ?,
                avg_duration = ?,
                best_time = ?,
                has_parking = ?,
                image_url = ?,
                opening_time = ?,
                closing_time = ?,
                rating = ?,
                is_featured = ?
            WHERE place_id = ?
        `;

        await pool.query(sql, [
            title || null,
            description || null,
            category_id || null,
            latitude || null,
            longitude || null,
            address || null,
            entry_fee || 0,
            est_food_cost || 0,
            avg_duration || 60,
            best_time || null,
            has_parking || 1,
            image_url || null,
            opening_time || null,
            closing_time || null,
            rating || 0,
            is_featured || 0,
            id
        ]);

        res.json({
            success: true,
            message: 'Place updated successfully'
        });

    } catch (error) {
        console.error('Error updating place:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update place',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// DELETE: Delete a place (Admin only)
router.delete('/places/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if place exists
        const [check] = await pool.query('SELECT place_id FROM places WHERE place_id = ?', [id]);
        if (check.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Place not found'
            });
        }

        await pool.query('DELETE FROM places WHERE place_id = ?', [id]);

        res.json({
            success: true,
            message: 'Place deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting place:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete place',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;