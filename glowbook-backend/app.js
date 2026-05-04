const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',         require('./routes/authRoutes'));
app.use('/api/users',        require('./routes/userRoutes'));
app.use('/api/salons',       require('./routes/salonRoutes'));
app.use('/api/services',     require('./routes/serviceRoutes'));
app.use('/api/stylists',     require('./routes/stylistRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/portfolio',    require('./routes/portfolioRoutes'));
app.use('/api/reviews',      require('./routes/reviewRoutes'));

app.get('/', (req, res) => res.json({ message: 'GlowBook API running' }));

module.exports = app;
