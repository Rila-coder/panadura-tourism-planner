// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// =============================================
// MULTER CONFIGURATION - File Upload
// =============================================

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.'), false);
    }
};

// Multer upload instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: fileFilter
});

// =============================================
// HELPER: Delete image file from server
// =============================================
function deleteImageFile(imageUrl) {
    if (!imageUrl) return false;
    
    const filename = path.basename(imageUrl);
    if (!filename) return false;
    
    const filePath = path.join(uploadDir, filename);
    
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Deleted image: ${filename}`);
            return true;
        } catch (error) {
            console.error('Error deleting image:', error);
            return false;
        }
    }
    return false;
}

// =============================================
// HELPER: Get old image URL before update
// =============================================
async function getOldImageUrl(placeId) {
    try {
        const [rows] = await pool.query(
            'SELECT image_url FROM places WHERE place_id = ?',
            [placeId]
        );
        return rows.length > 0 ? rows[0].image_url : null;
    } catch (error) {
        console.error('Error fetching old image:', error);
        return null;
    }
}

// =============================================
// UPLOAD IMAGE ENDPOINT
// =============================================
router.post('/upload-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const imageUrl = '/uploads/' + req.file.filename;
        
        res.json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                image_url: imageUrl,
                filename: req.file.filename,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image: ' + error.message
        });
    }
});

// =============================================
// ADMIN LOGIN - WITH DEBUG LOGS
// =============================================
router.post('/login', async (req, res) => {
    try {
        console.log('========================================');
        console.log('🔐 LOGIN ATTEMPT');
        console.log('========================================');

        const { username, password } = req.body;

        console.log('📝 Username received:', username);
        console.log('📝 Password received:', password);

        if (!username || !password) {
            console.log('❌ Missing username or password');
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        console.log('🔍 Querying database for username:', username);

        const [users] = await pool.query(
            'SELECT * FROM admin_users WHERE username = ?',
            [username]
        );

        console.log('📊 Users found:', users.length);

        if (users.length === 0) {
            console.log('❌ No user found with username:', username);
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        const admin = users[0];
        console.log('✅ User found:', {
            id: admin.user_id,
            username: admin.username,
            email: admin.email,
            password_hash: admin.password_hash ? 'HASH PRESENT' : 'HASH MISSING'
        });

        console.log('🔑 Comparing password with hash...');
        console.log('   Input password:', password);
        console.log('   Stored hash:', admin.password_hash);

        // ✅ VERIFY PASSWORD with bcrypt
        const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        
        console.log('🔐 Password valid?', isValidPassword);

        if (!isValidPassword) {
            console.log('❌ Invalid password for user:', username);
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        console.log('✅ Password verified successfully!');

        const token = jwt.sign(
            { 
                id: admin.user_id, 
                username: admin.username,
                email: admin.email 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        console.log('🎫 JWT token generated successfully');
        console.log('========================================');
        console.log('✅ LOGIN SUCCESSFUL!');
        console.log('========================================');

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
        console.error('❌ Login error:', error);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// =============================================
// VERIFY TOKEN
// =============================================
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

// =============================================
// ADMIN PROFILE
// =============================================
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

// =============================================
// ADD NEW PLACE (With Image Handling)
// =============================================
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

// =============================================
// UPDATE PLACE (With Image Cleanup)
// =============================================
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

        const [check] = await pool.query('SELECT place_id FROM places WHERE place_id = ?', [id]);
        if (check.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Place not found'
            });
        }

        const oldImageUrl = await getOldImageUrl(id);

        if (image_url && oldImageUrl && image_url !== oldImageUrl) {
            if (oldImageUrl && oldImageUrl.startsWith('/uploads/')) {
                deleteImageFile(oldImageUrl);
            }
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
            message: 'Place updated successfully',
            data: {
                old_image_deleted: oldImageUrl && image_url && oldImageUrl !== image_url ? true : false
            }
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

// =============================================
// DELETE PLACE (With Image Cleanup)
// =============================================
router.delete('/places/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [check] = await pool.query(
            'SELECT place_id, image_url FROM places WHERE place_id = ?',
            [id]
        );
        if (check.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Place not found'
            });
        }

        const imageUrl = check[0].image_url;

        if (imageUrl && imageUrl.startsWith('/uploads/')) {
            deleteImageFile(imageUrl);
        }

        await pool.query('DELETE FROM places WHERE place_id = ?', [id]);

        res.json({
            success: true,
            message: 'Place deleted successfully',
            data: {
                image_deleted: imageUrl && imageUrl.startsWith('/uploads/') ? true : false
            }
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

// =============================================
// CATEGORY MANAGEMENT
// =============================================

// GET: Get all categories
router.get('/categories', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM categories ORDER BY name ASC'
        );
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories'
        });
    }
});

// POST: Add new category
router.post('/categories', async (req, res) => {
    try {
        const { name, description, icon } = req.body;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        const [result] = await pool.query(
            'INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)',
            [name, description || null, icon || null]
        );

        res.status(201).json({
            success: true,
            message: 'Category added successfully',
            data: { category_id: result.insertId }
        });
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add category'
        });
    }
});

// PUT: Update category
router.put('/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, icon } = req.body;

        const [check] = await pool.query(
            'SELECT category_id FROM categories WHERE category_id = ?',
            [id]
        );
        if (check.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        await pool.query(
            'UPDATE categories SET name = ?, description = ?, icon = ? WHERE category_id = ?',
            [name, description || null, icon || null, id]
        );

        res.json({
            success: true,
            message: 'Category updated successfully'
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update category'
        });
    }
});

// DELETE: Delete category
router.delete('/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [check] = await pool.query(
            'SELECT COUNT(*) as count FROM places WHERE category_id = ?',
            [id]
        );
        if (check[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete category with existing places. Remove places first.'
            });
        }

        const [result] = await pool.query(
            'DELETE FROM categories WHERE category_id = ?',
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete category'
        });
    }
});

// =============================================
// USER PLANS MANAGEMENT (Admin only)
// =============================================

// GET: Get all user plans
router.get('/plans', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                p.plan_id,
                p.user_name,
                p.visit_date,
                p.total_places,
                p.total_distance,
                p.total_duration,
                p.total_budget,
                p.created_at,
                GROUP_CONCAT(pl.title SEPARATOR ', ') as place_titles
            FROM user_plans p
            LEFT JOIN plan_places pp ON p.plan_id = pp.plan_id
            LEFT JOIN places pl ON pp.place_id = pl.place_id
            GROUP BY p.plan_id
            ORDER BY p.created_at DESC
        `);
        
        res.json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch plans'
        });
    }
});

// GET: Get single plan with all details
router.get('/plans/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [plan] = await pool.query(`
            SELECT 
                p.plan_id,
                p.user_name,
                p.visit_date,
                p.total_places,
                p.total_distance,
                p.total_duration,
                p.total_budget,
                p.created_at
            FROM user_plans p
            WHERE p.plan_id = ?
        `, [id]);
        
        if (plan.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }
        
        const [places] = await pool.query(`
            SELECT 
                pp.stop_order,
                pp.estimated_duration,
                pl.place_id,
                pl.title,
                pl.description,
                pl.address,
                pl.entry_fee,
                pl.image_url,
                c.name as category_name
            FROM plan_places pp
            JOIN places pl ON pp.place_id = pl.place_id
            LEFT JOIN categories c ON pl.category_id = c.category_id
            WHERE pp.plan_id = ?
            ORDER BY pp.stop_order ASC
        `, [id]);
        
        res.json({
            success: true,
            data: {
                ...plan[0],
                places: places
            }
        });
    } catch (error) {
        console.error('Error fetching plan details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch plan details'
        });
    }
});

// DELETE: Delete a user plan
router.delete('/plans/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [check] = await pool.query(
            'SELECT plan_id FROM user_plans WHERE plan_id = ?',
            [id]
        );
        if (check.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }
        
        await pool.query('DELETE FROM user_plans WHERE plan_id = ?', [id]);
        
        res.json({
            success: true,
            message: 'Plan deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting plan:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete plan'
        });
    }
});

module.exports = router;