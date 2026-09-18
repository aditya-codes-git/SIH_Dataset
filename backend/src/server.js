require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('============================================================');
  console.log(' Starting DR Screening Node.js API Bridge around MATLAB AI ');
  console.log('============================================================');

  // Attempt database connection
  await connectDB();

  app.listen(PORT, () => {
    console.log(`[SERVER] API Bridge Server listening on port ${PORT}`);
    console.log(`[SERVER] Health check: http://localhost:${PORT}/api/health`);
    console.log(`[SERVER] Screenings endpoint: http://localhost:${PORT}/api/screenings`);
    console.log('============================================================');
  });
}

// Server active with role header and query param authentication support
startServer();

