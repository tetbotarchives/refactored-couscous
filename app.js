/**
 * Knight Bot - Integrated Web Server and WhatsApp Bot
 * Main entry point that starts both the Express server and WhatsApp bot
 */

// Start the web server first
const { addLog, updateBotState } = require('./server');

// Add initial log
addLog('info', 'Starting Knight Bot integrated application...');

// Override global functions for bot integration
global.addBotLog = addLog;
global.updateBotState = updateBotState;

// Update initial bot state
updateBotState({
    status: 'Initializing...',
    connected: false,
    startTime: new Date(),
    messagesProcessed: 0,
    groupsConnected: 0,
    lastActivity: new Date()
});

// Wait a moment for server to initialize, then start the WhatsApp bot
setTimeout(() => {
    addLog('info', 'Web server initialized, starting WhatsApp bot...');
    
    // Start the WhatsApp bot
    try {
        require('./index');
        addLog('info', 'WhatsApp bot module loaded successfully');
    } catch (error) {
        addLog('error', `Failed to start WhatsApp bot: ${error.message}`);
        updateBotState({
            status: 'Failed to start',
            connected: false
        });
    }
}, 2000);

// Handle process signals for graceful shutdown
process.on('SIGTERM', () => {
    addLog('info', 'Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    addLog('info', 'Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    addLog('error', `Uncaught Exception: ${error.message}`);
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    addLog('error', `Unhandled Rejection: ${reason}`);
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

addLog('info', 'Knight Bot application startup complete');