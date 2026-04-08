const express = require('express');
const router = express.Router();
const {
  getReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
} = require('../controllers/reservation.controller');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getReservations)
  .post(protect, createReservation);

router.route('/:id')
  .get(protect, getReservationById)
  .put(protect, updateReservation)
  .delete(protect, deleteReservation);

module.exports = router;
