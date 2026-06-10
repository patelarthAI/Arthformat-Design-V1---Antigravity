// Vercel Serverless Function entry point
// Import the compiled CommonJS Express app from dist/server.cjs
const app = require('../dist/server.cjs');

// Export the app for Vercel
module.exports = app.default || app;
