#!/usr/bin/env node

/**
 * Node.js wrapper for Python Easter Egg API
 * This allows PM2 to better manage the Python process
 */

const { spawn } = require('child_process');
const path = require('path');

const API_PORT = process.env.PORT || 8888;

console.log(`🥚 Starting Easter Egg API on port ${API_PORT}...`);

// Start Python process
const python = spawn('python3', ['app.py'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: {
        ...process.env,
        PORT: API_PORT,
        PYTHONUNBUFFERED: '1'
    }
});

python.on('close', (code) => {
    console.log(`Easter Egg API process exited with code ${code}`);
    process.exit(code);
});

python.on('error', (err) => {
    console.error('Failed to start Easter Egg API:', err);
    process.exit(1);
});

// Handle process termination
process.on('SIGTERM', () => {
    console.log('🥚 Easter Egg API received SIGTERM, shutting down gracefully...');
    python.kill('SIGTERM');
});

process.on('SIGINT', () => {
    console.log('🥚 Easter Egg API received SIGINT, shutting down gracefully...');
    python.kill('SIGINT');
});

console.log('🎉 Easter Egg API Node.js wrapper started successfully!');
