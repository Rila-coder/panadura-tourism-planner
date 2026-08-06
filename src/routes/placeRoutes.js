// src/routes/placeRoutes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');  // Change this line

// Now use pool.query instead of db.query
// Change all instances of db.query to pool.query

// Example - GET all places
router.get('/', async (req, res) => {
    try {
        const { category, featured, search } = req.query;
        
        let sql = `
            SELECT 
                p.place_id,
                p.title,
                p.description,
                p.latitude,
                p.longitude,
                p.address,
                p.entry_fee,
                p.est_food_cost,
                p.avg_duration,
                p.best_time,
                p.has_parking,
                p.image_url,
                p.opening_time,
                p.closing_time,
                p.rating,
                p.total_reviews,
                p.is_featured,
                c.name as category_name,
                c.category_id
            FROM places p
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (category) {
            sql += ` AND c.category_id = ?`;
            params.push(category);
        }
        
        if (featured === 'true') {
            sql += ` AND p.is_featured = 1`;
        }
        
        if (search) {
            sql += ` AND (p.title LIKE ? OR p.description LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }
        
        sql += ` ORDER BY p.rating DESC, p.title ASC`;
        
        // Change db.query to pool.query
        const [rows] = await pool.query(sql, params);
        
        const places = rows.map(place => ({
            ...place,
            entry_fee: parseFloat(place.entry_fee) || 0,
            est_food_cost: parseFloat(place.est_food_cost) || 0,
            avg_duration: parseInt(place.avg_duration) || 0,
            rating: parseFloat(place.rating) || 0
        }));
        
        res.json({
            success: true,
            count: places.length,
            data: places
        });
        
    } catch (error) {
        console.error('Error fetching places:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch places',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET single place
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const sql = `
            SELECT 
                p.*,
                c.name as category_name,
                c.category_id
            FROM places p
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.place_id = ?
        `;
        
        // Change db.query to pool.query
        const [rows] = await pool.query(sql, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Place not found'
            });
        }
        
        const place = rows[0];
        
        const nearbySql = `
            SELECT 
                p.place_id,
                p.title,
                p.latitude,
                p.longitude,
                p.rating,
                p.image_url,
                c.name as category_name,
                (
                    6371 * acos(
                        cos(radians(?)) * cos(radians(p.latitude)) *
                        cos(radians(p.longitude) - radians(?)) +
                        sin(radians(?)) * sin(radians(p.latitude))
                    )
                ) AS distance_km
            FROM places p
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.place_id != ?
            HAVING distance_km <= 10
            ORDER BY distance_km ASC
            LIMIT 5
        `;
        
        // Change db.query to pool.query
        const [nearby] = await pool.query(nearbySql, [
            place.latitude,
            place.longitude,
            place.latitude,
            id
        ]);
        
        res.json({
            success: true,
            data: {
                ...place,
                nearby_places: nearby
            }
        });
        
    } catch (error) {
        console.error('Error fetching place details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch place details',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;