require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const { initSocket } = require('./socket');
const { seedDatabase } = require('./seedData');

// Route handlers
const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const quizRoutes = require('./routes/quizRoutes');
const tutorRoutes = require('./routes/tutorRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
const server = http.createServer(app);

// Socket.io configuration with open CORS for dev & production compatibility
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  },
  pingTimeout: 60000,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads route (for uploaded PDFs and images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/bookings', bookingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    project: 'StudySync',
    timestamp: new Date().toISOString(),
    webrtc: true,
    socket: true,
  });
});

// Initialize Socket.io logic from /socket folder
initSocket(io);

const PORT = process.env.PORT || 5000;

// Start Server & Connect Database
connectDB().then(async () => {
  await seedDatabase();
  server.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 StudySync Server running on http://localhost:${PORT}`);
    console.log(`📡 Socket.io server ready with Whiteboard & Chat`);
    console.log(`📹 WebRTC Signaling ready for virtual study rooms`);
    console.log(`===============================================`);
  });
}).catch(err => {
  console.error('Fatal server startup error:', err);
});
