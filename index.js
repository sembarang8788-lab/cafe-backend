console.log('--- STARTUP CHECK ---');
console.log('Node Version:', process.version);
console.log('Starting initialization...');

const express = require('express');
const cors = require('cors');

// Try load env
try {
    require('dotenv').config();
    console.log('✅ Dotenv config loaded');
} catch (e) {
    console.warn('⚠️ Dotenv failed to load:', e.message);
}

// Handle errors early
process.on('uncaughtException', (err) => {
    console.error('❌ CRITICAL: Uncaught Exception:', err.message);
    console.error(err.stack);
});

// Load models
let sequelize;
try {
    console.log('⏳ Loading models...');
    const models = require('./models');
    sequelize = models.sequelize;
    console.log('✅ Models loaded successfully');
} catch (error) {
    console.error('❌ Error loading models:', error.message);
}

const app = express();
app.use(cors());
app.use(express.json());

// Log every request in Vercel
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Import routes as functions to check before use
function safeUse(path, modulePath) {
    try {
        const route = require(modulePath);
        if (route && typeof route === 'function') {
            app.use(path, route);
            console.log(`✅ Route ${path} registered`);
        } else {
            console.warn(`⚠️ Route ${path} is not a valid middleware`);
        }
    } catch (err) {
        console.error(`❌ Failed to load route ${path}:`, err.message);
    }
}

// Static/Basic routes
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send("User-agent: *\nAllow: /");
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        message: '☕ Cafe Backend API',
        info: {
            time: new Date().toISOString(),
            node: process.version,
            database: sequelize ? 'initialized' : 'failed'
        }
    });
});

app.get('/health', async (req, res) => {
    try {
        if (!sequelize) throw new Error('Sequelize not initialized');
        await sequelize.authenticate();
        res.json({ status: 'healthy', database: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'unhealthy', error: error.message });
    }
});

// Dynamic routes
safeUse('/api/products', './routes/products');
safeUse('/api/orders', './routes/orders');
safeUse('/api/users', './routes/users');

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found', path: req.url });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ UNHANDLED ERROR:', err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        path: req.url
    });
});

module.exports = app;

// Local dev setup
if (require.main === module) {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`🚀 Local server on http://localhost:${PORT}`);
    });
}
