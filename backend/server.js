require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Basic Route imports
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

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

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Interns emit 'join' with their user ID to join a specific room for targeted notifications
    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined room ${userId}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Middleware
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Successfully connected to MongoDB.');

        server.listen(PORT, () => {
            console.log(`Server is running on port: ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

const certificateRoutes = require('./routes/certificateRoutes');
const path = require('path');

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/certificates', certificateRoutes);

app.get('/', (req, res) => {
    res.send({ message: 'Backend is running' });
});

// Global Error Handler Middleware (MUST be the last middleware)
app.use(errorHandler);