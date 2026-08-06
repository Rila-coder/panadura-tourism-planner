// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./src/config/database');

// Import routes (will create these later)
const placeRoutes = require('./src/routes/placeRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const plannerRoutes = require('./src/routes/plannerRoutes');
// const adminRoutes = require('./src/routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// =============================================
// MIDDLEWARE
// =============================================

// Enable CORS
app.use(cors());

// Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// =============================================
// API ROUTES (to be added)
// =============================================

app.use('/api/places', placeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/planner', plannerRoutes);


// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        message: 'Server is running'
    });
});

// API info endpoint
app.get('/api/info', (req, res) => {
    res.json({
        name: 'Panadura Tourism Planner API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            places: '/api/places (GET)',
            categories: '/api/categories (GET)'
        }
    });
});

// =============================================
// FRONTEND ROUTES
// =============================================

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/places', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'places.html'));
});

app.get('/place/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'place-details.html'));
});

app.get('/planner', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'planner.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// =============================================
// ERROR HANDLING
// =============================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.url} not found`
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// =============================================
// START SERVER
// =============================================

async function startServer() {
    // Test database connection
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
        console.warn('⚠️  Database connection failed. Please check your configuration.');
        console.warn('   Server will still start but API endpoints may not work.');
    }

    app.listen(PORT, () => {
        console.log('='.repeat(60));
        console.log('🚀 Server Started Successfully!');
        console.log('='.repeat(60));
        console.log(`📡 Server URL: http://localhost:${PORT}`);
        console.log(`📁 Static Files: ${path.join(__dirname, 'public')}`);
        console.log(`🔌 Database: ${dbConnected ? 'Connected ✅' : 'Disconnected ❌'}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log('='.repeat(60));
        console.log('\n📝 Available Routes:');
        console.log('  GET  /                    - Homepage');
        console.log('  GET  /places              - Places List');
        console.log('  GET  /place/:id           - Place Details');
        console.log('  GET  /planner             - Trip Planner');
        console.log('  GET  /admin               - Admin Panel');
        console.log('  GET  /api/health          - Health Check');
        console.log('  GET  /api/info            - API Info');
        console.log('='.repeat(60));
    });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received. Closing server...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received. Closing server...');
    process.exit(0);
});

// Start the server
startServer();