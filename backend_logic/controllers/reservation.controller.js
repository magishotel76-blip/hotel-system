const prisma = require('../config/db');

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Private
const getReservations = async (req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        customer: true,
        room: { include: { roomType: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reservations', error: error.message });
  }
};

// @desc    Get single reservation
// @route   GET /api/reservations/:id
// @access  Private
const getReservationById = async (req, res) => {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        room: { include: { roomType: true } },
        invoices: { include: { items: true } },
      },
    });
    if (reservation) {
      res.json(reservation);
    } else {
      res.status(404).json({ message: 'Reserva no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reservation', error: error.message });
  }
};

// @desc    Create new reservation
// @route   POST /api/reservations
// @access  Private
const createReservation = async (req, res) => {
  const { customerId, roomId, checkInDate, checkOutDate, totalPrice, guestsCount, guestNames } = req.body;

  try {
    // Verificar si la habitacion esta disponible
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.status !== 'disponible') {
      return res.status(400).json({ message: 'La habitación no está disponible' });
    }

    const reservation = await prisma.reservation.create({
      data: {
        customerId,
        roomId,
        checkInDate: new Date(checkInDate),
        checkOutDate: new Date(checkOutDate),
        totalPrice: parseFloat(totalPrice),
        guestsCount: guestsCount ? parseInt(guestsCount) : 1,
        guestNames: guestNames || null,
        status: 'activa',
      },
    });

    // Actualizar estado de habitación
    await prisma.room.update({
      where: { id: roomId },
      data: { status: 'ocupada' },
    });

    res.status(201).json(reservation);
  } catch (error) {
    res.status(500).json({ message: 'Error creating reservation', error: error.message });
  }
};

// @desc    Update reservation status (Check-out/Cancel)
// @route   PUT /api/reservations/:id
// @access  Private
const updateReservation = async (req, res) => {
  const { status, roomId, checkOutDate, totalPrice } = req.body;

  try {
    const updateData = {};
    if (status) updateData.status = status;
    if (checkOutDate) updateData.checkOutDate = new Date(checkOutDate);
    if (totalPrice !== undefined) updateData.totalPrice = parseFloat(totalPrice);

    const reservation = await prisma.reservation.update({
      where: { id: req.params.id },
      data: updateData,
    });

    // Si se completa o cancela, liberar la habitación
    if ((status === 'completada' || status === 'cancelada') && roomId) {
      await prisma.room.update({
        where: { id: roomId },
        data: { status: 'limpieza' }, // Pasa a limpieza despues de ocupada
      });
    }

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: 'Error updating reservation', error: error.message });
  }
};

// @desc    Delete reservation
// @route   DELETE /api/reservations/:id
// @access  Private Admin
const deleteReservation = async (req, res) => {
  try {
    const reservation = await prisma.reservation.findUnique({ where: { id: req.params.id } });
    if (!reservation) return res.status(404).json({ message: 'No encontrada' });

    // Liberar la habitación si la reserva aún estaba activa
    if (reservation.status === 'activa' && reservation.roomId) {
      await prisma.room.update({
        where: { id: reservation.roomId },
        data: { status: 'disponible' },
      });
    }

    await prisma.reservation.delete({ where: { id: req.params.id } });
    res.json({ message: 'Reserva eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting reservation', error: error.message });
  }
};

module.exports = {
  getReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
};
