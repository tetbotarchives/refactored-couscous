const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.socket.io"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"],
        },
    },
}));

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Bot state and logs
let botState = {
    status: 'Starting...',
    connected: false,
    startTime: new Date(),
    messagesProcessed: 0,
    groupsConnected: 0,
    lastActivity: new Date(),
    logs: []
};

// Store original console methods first
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Log storage with rotation
const MAX_LOGS = 100;
function addLog(level, message) {
    const logEntry = {
        timestamp: new Date(),
        level,
        message
    };
    
    botState.logs.unshift(logEntry);
    if (botState.logs.length > MAX_LOGS) {
        botState.logs = botState.logs.slice(0, MAX_LOGS);
    }
    
    // Emit to connected clients
    io.emit('newLog', logEntry);
    
    // Also log to console using original console methods to avoid recursion
    originalConsoleLog(`[${level.toUpperCase()}] ${message}`);
}

// Override console methods to capture logs

console.log = (...args) => {
    const message = args.join(' ');
    originalConsoleLog(...args);
    if (!message.includes('[LOG CAPTURE]')) {
        // Direct log to avoid recursion
        const logEntry = {
            timestamp: new Date(),
            level: 'info',
            message
        };
        
        botState.logs.unshift(logEntry);
        if (botState.logs.length > MAX_LOGS) {
            botState.logs = botState.logs.slice(0, MAX_LOGS);
        }
        
        // Emit to connected clients
        io.emit('newLog', logEntry);
    }
};

console.error = (...args) => {
    const message = args.join(' ');
    originalConsoleError(...args);
    // Direct log to avoid recursion
    const logEntry = {
        timestamp: new Date(),
        level: 'error',
        message
    };
    
    botState.logs.unshift(logEntry);
    if (botState.logs.length > MAX_LOGS) {
        botState.logs = botState.logs.slice(0, MAX_LOGS);
    }
    
    // Emit to connected clients
    io.emit('newLog', logEntry);
};

console.warn = (...args) => {
    const message = args.join(' ');
    originalConsoleWarn(...args);
    // Direct log to avoid recursion
    const logEntry = {
        timestamp: new Date(),
        level: 'warn',
        message
    };
    
    botState.logs.unshift(logEntry);
    if (botState.logs.length > MAX_LOGS) {
        botState.logs = botState.logs.slice(0, MAX_LOGS);
    }
    
    // Emit to connected clients
    io.emit('newLog', logEntry);
};

// API Routes
app.get('/api/status', (req, res) => {
    res.json(botState);
});

app.get('/api/logs', (req, res) => {
    res.json(botState.logs);
});

app.post('/api/bot/restart', (req, res) => {
    addLog('info', 'Bot restart requested via API');
    res.json({ message: 'Restart signal sent' });
    // In a real implementation, you'd restart the bot here
});

// Health check endpoint for deployment platforms
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        uptime: Date.now() - botState.startTime.getTime(),
        botConnected: botState.connected
    });
});

// Socket.io for real-time updates
io.on('connection', (socket) => {
    addLog('info', `[LOG CAPTURE] Web client connected: ${socket.id}`);
    
    // Send current state to new client
    socket.emit('botState', botState);
    
    socket.on('disconnect', () => {
        addLog('info', `[LOG CAPTURE] Web client disconnected: ${socket.id}`);
    });
});

// Update bot state functions (to be called from WhatsApp bot)
global.updateBotState = (updates) => {
    Object.assign(botState, updates);
    botState.lastActivity = new Date();
    io.emit('botState', botState);
};

global.addBotLog = addLog;

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '0.0.0.0';

server.listen(PORT, HOST, () => {
    addLog('info', `[LOG CAPTURE] Server running on ${HOST}:${PORT}`);
    addLog('info', `[LOG CAPTURE] Environment: ${process.env.NODE_ENV || 'development'}`);
    addLog('info', `[LOG CAPTURE] Web interface available at http://${HOST}:${PORT}`);
});

// Export for use in other modules
module.exports = { app, server, io, addLog, updateBotState: global.updateBotState };