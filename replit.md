# Knight Bot - WhatsApp Bot with Web Dashboard

## Overview
This is an integrated WhatsApp bot with a web dashboard that provides real-time monitoring, logs, and bot management capabilities. The project has been successfully transformed from a console-only bot to a deployable web server suitable for platforms like Render and Replit.

## Current State
- ✅ WhatsApp Bot fully functional with Baileys library
- ✅ Express.js web server running on port 5000
- ✅ Real-time web dashboard with Socket.IO
- ✅ Log aggregation and display
- ✅ Bot status monitoring and metrics
- ✅ HTTPS support for production deployment
- ✅ Environment variable configuration

## Project Architecture
- **Main Entry**: `app.js` - Starts both web server and WhatsApp bot
- **Web Server**: `server.js` - Express.js server with Socket.IO
- **Bot Core**: `index.js` - WhatsApp bot using Baileys
- **Web Interface**: `public/index.html` - Real-time dashboard
- **Configuration**: Environment variables in `.env` file

## Recent Changes
- **Date**: 2025-09-20
- **Changes**: 
  - Integrated Express.js web server with WhatsApp bot
  - Created real-time dashboard with logs and bot status
  - Fixed console logging recursion issues
  - Configured for both Replit and Render deployment
  - Added proper error handling and graceful shutdown
  - Set up autoscale deployment configuration

## User Preferences
- Simple, clean UI focusing on functionality over aesthetics
- Server-first approach with HTTPS support
- Render deployment compatibility
- Real-time log monitoring capability

## Deployment
- **Replit**: Configured with autoscale deployment
- **Render**: Compatible with environment variables and port binding
- **Port**: 5000 (configurable via PORT environment variable)
- **Host**: 0.0.0.0 for external access

## Environment Variables
See `.env.example` for required configuration:
- OWNER_NUMBER: WhatsApp number for bot owner
- BOT_NAME: Display name for the bot
- API Keys: Various third-party service keys

## Features
- Real-time bot status monitoring
- Live log streaming
- Bot control via web interface
- Message and group statistics
- Responsive web dashboard
- Production-ready deployment configuration