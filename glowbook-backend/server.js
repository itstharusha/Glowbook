const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/salons', require('./routes/salonRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/stylists', require('./routes/stylistRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));

// Review placeholder since it's Member 6
app.use('/api/reviews', require('express').Router().get('/', (req, res) => res.json({ message: 'Review routes placeholder' })));

app.get('/', (req, res) => res.json({ message: 'GlowBook API running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
