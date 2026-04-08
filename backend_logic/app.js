const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Useful if the frontend is hosted elsewhere or has specific CSP needs
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Checks
app.get('/api/status', (req, res) => {
  try {
    res.json({ 
      status: 'online', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      db_status: process.env.DATABASE_URL ? 'URL PRESENT' : 'MISSING URL'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/status', (req, res) => {
  res.send('Backend is running');
});

// Import Routes
const authRoutes = require('./routes/auth.routes');
const billingRoutes = require('./routes/billing.routes');
const customerRoutes = require('./routes/customer.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const expenseRoutes = require('./routes/expense.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const reportsRoutes = require('./routes/reports.routes');
const reservationRoutes = require('./routes/reservation.routes');
const roomRoutes = require('./routes/room.routes');
const webReservationRoutes = require('./routes/webReservation.routes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/web-reservations', webReservationRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

module.exports = app;
