console.log('🎬 1. Starting initialization...');
const express = require('express');
console.log('🎬 2. Express loaded');
const cors = require('cors');
console.log('🎬 3. Cors loaded');
try {
    require('dotenv').config();
    console.log('🎬 4. Dotenv config called');
} catch (e) {
    console.warn('⚠️ Dotenv failed to load (normal in Vercel):', e.message);
}

// Handle uncaught exceptions early
process.on('uncaughtException', (err) => {
    console.error('❌ CRITICAL: Uncaught Exception:', err.message);
    console.error(err.stack);
});

// Handle unhandled promise rejections early
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ CRITICAL: Unhandled Rejection:', reason);
});

console.log('🎬 5. Loading models...');
let sequelize;
try {
    const models = require('./models');
    sequelize = models.sequelize;
    console.log('🎬 6. Models loaded successfully');
} catch (error) {
    console.error('❌ CRITICAL Error loading models:', error.message);
    console.error(error.stack);
}


const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes with error checks
let productRoutes, orderRoutes, userRoutes;
try {
    console.log('🎬 5a. Loading routes...');
    productRoutes = require('./routes/products');
    orderRoutes = require('./routes/orders');
    userRoutes = require('./routes/users');
    console.log('🎬 5b. Routes loaded successfully');
} catch (err) {
    console.error('❌ CRITICAL Error loading routes:', err.message);
}

// Use routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

// Basic routes
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send("User-agent: *\nAllow: /");
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        message: '☕ Cafe Backend API is running!',
        time: new Date().toISOString(),
        env: process.env.NODE_ENV,
        database: sequelize ? 'initialized' : 'failed'
    });
});

// Health check for database
app.get('/health', async (req, res) => {
    try {
        if (!sequelize) {
            throw new Error('Sequelize not initialized');
        }
        console.log('🔍 Checking database health...');
        await sequelize.authenticate();
        res.json({
            status: 'healthy',
            database: 'connected',
            orm: 'Sequelize',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Health Check Failed:', error.message);
        res.status(500).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message,
            hint: 'Check DATABASE_URL and database availability.',
            timestamp: new Date().toISOString()
        });
    }
});


// Global error handler middleware
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});



// Export app for Vercel
module.exports = app;

// Start server only if run directly (local development)
if (require.main === module) {
    // Database sync logic (only for local dev)
    const syncDatabase = async () => {
        try {
            console.log('🔄 Syncing database...');
            await sequelize.sync({ alter: false });
            console.log('✅ Database synced!');
        } catch (error) {
            console.error('❌ Database sync failed:', error.message);
        }
    };

    syncDatabase();

    app.listen(PORT, () => {
        console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
        console.log(`📦 API Endpoints:`);
        console.log(`   - Products: http://localhost:${PORT}/api/products`);
        console.log(`   - Orders:   http://localhost:${PORT}/api/orders`);
        console.log(`   - Users:    http://localhost:${PORT}/api/users`);
        console.log(`   - Health:   http://localhost:${PORT}/health\n`);
    });
}

