const express = require('express');
const router = express.Router();
const { 
  getPublicRooms, 
  createWebReservation, 
  getWebReservations, 
  updateWebReservationStatus, 
  convertToOfficialReservation 
} = require('../controllers/webReservation.controller');
const { protect, admin } = require('../middleware/auth');

// Public routes
router.get('/public/rooms', getPublicRooms);
router.post('/public/reserve', createWebReservation);

// Admin routes
router.get('/admin/requests', protect, admin, getWebReservations);
router.put('/admin/requests/:id/status', protect, admin, updateWebReservationStatus);
router.post('/admin/requests/:id/convert', protect, admin, convertToOfficialReservation);

module.exports = router;
