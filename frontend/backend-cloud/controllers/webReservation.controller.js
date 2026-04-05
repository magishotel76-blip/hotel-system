const prisma = require('../config/db');

// @desc    Get all rooms for public listing
// @route   GET /api/public/rooms
// @access  Public
const getPublicRooms = async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { status: 'disponible' },
      include: {
        roomType: true,
        images: true
      },
      orderBy: { roomNumber: 'asc' }
    });
    
    // Remove prices as per requirements
    const sanitizedRooms = rooms.map(room => ({
      id: room.id,
      roomNumber: room.roomNumber,
      roomType: room.roomType.name,
      images: room.images.map(img => img.imageUrl),
    }));
    
    res.json(sanitizedRooms);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener habitaciones', error: error.message });
  }
};

// @desc    Create a web reservation request
// @route   POST /api/public/reserve
// @access  Public
const createWebReservation = async (req, res) => {
  const { 
    roomId, responsibleName, guestCount, company, 
    phone, email, checkIn, checkOut, notes 
  } = req.body;

  try {
    const webRes = await prisma.webReservation.create({
      data: {
        roomId,
        responsibleName,
        guestCount: parseInt(guestCount),
        company,
        phone,
        email,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        notes,
        status: 'pendiente'
      }
    });
    res.status(201).json({ message: 'Solicitud enviada exitosamente', data: webRes });
  } catch (error) {
    res.status(500).json({ message: 'Error al procesar la reserva', error: error.message });
  }
};

// @desc    Get all web reservations (Admin)
// @route   GET /api/admin/web-reservations
// @access  Private-Admin
const getWebReservations = async (req, res) => {
  try {
    const webReservations = await prisma.webReservation.findMany({
      include: {
        room: {
          include: { roomType: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(webReservations);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener reservas web', error: error.message });
  }
};

// @desc    Update web reservation status
// @route   PUT /api/admin/web-reservations/:id/status
// @access  Private-Admin
const updateWebReservationStatus = async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  try {
    const webRes = await prisma.webReservation.findUnique({ where: { id } });
    if (!webRes) return res.status(404).json({ message: 'Reserva no encontrada' });

    const updated = await prisma.webReservation.update({
      where: { id },
      data: { status }
    });

    // If confirmed, we might want to automatically create a REAL reservation
    // But the requirements say "convertir la solicitud en una reserva oficial", 
    // which might be a separate "Confirm & Convert" action.
    
    res.json({ message: `Estado actualizado a ${status}`, data: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar estado', error: error.message });
  }
};

// @desc    Convert web reservation to official reservation
// @route   POST /api/admin/web-reservations/:id/convert
// @access  Private-Admin
const convertToOfficialReservation = async (req, res) => {
  const { id } = req.params;

  try {
    const webRes = await prisma.webReservation.findUnique({ 
      where: { id },
      include: { room: true }
    });
    
    if (!webRes) return res.status(404).json({ message: 'Solicitud no encontrada' });

    // 1. Create or find customer (by name or phone - simplified for now)
    let customer = await prisma.customer.findFirst({
      where: { name: webRes.responsibleName }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: webRes.responsibleName,
          document: `WEB-${Date.now()}`, // Temporary document
          phone: webRes.phone,
          email: webRes.email,
          notes: `Generado desde portal web. Empresa: ${webRes.company}`
        }
      });
    }

    // 2. Create official reservation
    const officialRes = await prisma.reservation.create({
      data: {
        customerId: customer.id,
        roomId: webRes.roomId,
        checkInDate: webRes.checkIn,
        checkOutDate: webRes.checkOut,
        totalPrice: webRes.room.pricePerNight, // Assuming 1 night for simplicity or calculation needed
        guestsCount: webRes.guestCount,
        guestNames: webRes.responsibleName,
        status: 'activa'
      }
    });

    // 3. Mark room as occupied if check-in is today
    const today = new Date().toISOString().split('T')[0];
    const checkInStr = webRes.checkIn.toISOString().split('T')[0];
    
    if (today === checkInStr) {
      await prisma.room.update({
        where: { id: webRes.roomId },
        data: { status: 'ocupada' }
      });
    }

    // 4. Update web reservation status
    await prisma.webReservation.update({
      where: { id },
      data: { status: 'confirmada' }
    });

    res.json({ message: 'Reserva convertida exitosamente', data: officialRes });
  } catch (error) {
    res.status(500).json({ message: 'Error al convertir reserva', error: error.message });
  }
};

module.exports = {
  getPublicRooms,
  createWebReservation,
  getWebReservations,
  updateWebReservationStatus,
  convertToOfficialReservation
};
