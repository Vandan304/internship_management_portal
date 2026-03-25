require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Basic Route imports
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const fileRoutes = require('./routes/fileRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const taskRoutes = require('./routes/taskRoutes');
const chatRoutes = require('./routes/chatRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');
const { initCronJobs, processMissedNotifications } = require('./utils/cronJobs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: (origin, callback) => {
        // Allows both local and any Vercel domain
        if (!origin || origin.indexOf('vercel.app') !== -1 || origin.indexOf('localhost') !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: true
}));

// Explicitly handle OPTIONS preflight (common fix for preflight failures)
app.options('*', cors());
app.use(express.json());

const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
    }
});

app.set('io', io);

const chatSocket = require('./socket/chatSocket');
chatSocket(io);

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Successfully connected to MongoDB.');

        server.listen(PORT, async () => {
            console.log(`Server is running on port: ${PORT}`);
            initCronJobs();
            await processMissedNotifications();
        });

        // Graceful shutdown for nodemon restarts
        process.once('SIGUSR2', function () {
            server.close(function () {
                process.kill(process.kill, 'SIGUSR2');
            });
        });
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    });

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/files', fileRoutes);

const path = require('path');

app.use('/uploads/certificates', express.static(path.join(__dirname, 'uploads/certificates')));
app.use('/uploads/offerletters', express.static(path.join(__dirname, 'uploads/offerletters')));
app.use('/uploads/tasks', express.static(path.join(__dirname, 'uploads/tasks')));
app.use('/uploads/chat', express.static(path.join(__dirname, 'uploads/chat')));

app.use('/api/certificates', certificateRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.get('/', (req, res) => {
    res.send({ message: 'Backend is running' });
});
app.use(errorHandler);

module.exports = app;

// initCronJobs(); // Removed redundant call, it is initialized after DB connection above