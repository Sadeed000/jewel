const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');

/* ───────────── Global crash handlers ─────────────
   Register BEFORE anything async so they catch errors during boot too. */
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION — shutting down');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});






const PORT = parseInt(process.env.PORT, 10) || 5000;

const start = async () => {
  await connectDB();

  /* Fingerprint the catalogue for "Search With a Pic" in the background, so the
     first shopper to upload a photo doesn't wait for the whole index. */
  require('./services/imageSearchService').warmIndex();

  const server = app.listen(PORT, () => {
    console.log(`✓ Aurelia API running on http://localhost:${PORT}${process.env.API_PREFIX || '/api/v1'}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  /* Unhandled rejections — close the server gracefully so in-flight
     requests finish, then exit so PM2/container can restart cleanly. */
  process.on('unhandledRejection', (err) => {
    console.error('💥 UNHANDLED REJECTION — shutting down');
    console.error(err.name, err.message);
    server.close(() => process.exit(1));
  });

  /* SIGTERM (Docker, Kubernetes, Heroku) — graceful shutdown. */
  process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received — shutting down gracefully');
    server.close(() => {
      mongoose.connection.close(false, () => {
        console.log('✓ MongoDB connection closed');
        process.exit(0);
      });
    });
  });
};

start();
