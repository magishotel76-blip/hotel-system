const prisma = require('../config/db');

// @desc    Get all room types
// @route   GET /api/rooms/types
// @access  Private
const getRoomTypes = async (req, res) => {
  try {
    const types = await prisma.roomType.findMany();
    res.json(types);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching room types', error: error.message });
  }
};

// @desc    Create room type
// @route   POST /api/rooms/types
// @access  Private
const createRoomType = async (req, res) => {
  const { name, description, price } = req.body;
  try {
    const type = await prisma.roomType.create({
      data: { name, description, price: parseFloat(price) },
    });
    res.status(201).json(type);
  } catch (error) {
    res.status(500).json({ message: 'Error creating room type', error: error.message });
  }
};

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Private
const getRooms = async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      include: { 
        roomType: true,
        images: true,
        reservations: {
          where: { status: 'activa' },
          include: { customer: true }
        },
        inventoryTransactions: {
          where: { status: 'pending' },
          include: { product: true }
        }
      },
      orderBy: { roomNumber: 'asc' },
    });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rooms', error: error.message });
  }
};

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Private
const getRoomById = async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: req.params.id },
      include: { 
        roomType: true,
        images: true,
        reservations: {
          where: { status: 'activa' },
          include: { customer: true }
        },
        inventoryTransactions: {
          where: { status: 'pending' },
          include: { product: true }
        }
      },
    });
    
    if (room) {
      res.json(room);
    } else {
      res.status(404).json({ message: 'Habitación no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching room', error: error.message });
  }
};

// @desc    Create new room
// @route   POST /api/rooms
// @access  Private
const createRoom = async (req, res) => {
  const { roomNumber, roomTypeId, pricePerNight, status } = req.body;

  try {
    const roomExists = await prisma.room.findUnique({ where: { roomNumber } });
    if (roomExists) {
      return res.status(400).json({ message: 'Ya existe una habitación con ese número' });
    }

    const room = await prisma.room.create({
      data: { 
        roomNumber, 
        roomTypeId, 
        pricePerNight: parseFloat(pricePerNight), 
        status: status || 'disponible' 
      },
    });

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: 'Error creating room', error: error.message });
  }
};

// @desc    Update room status/details
// @route   PUT /api/rooms/:id
// @access  Private
const updateRoom = async (req, res) => {
  const { roomNumber, roomTypeId, pricePerNight, status } = req.body;

  try {
    const room = await prisma.room.update({
      where: { id: req.params.id },
      data: { 
        roomNumber, 
        roomTypeId, 
        pricePerNight: pricePerNight !== undefined ? parseFloat(pricePerNight) : undefined, 
        status 
      },
    });
    res.json(room);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Habitación no encontrada' });
    }
    res.status(500).json({ message: 'Error updating room', error: error.message });
  }
};

// @desc    Upload room images
// @route   POST /api/rooms/:id/images
// @access  Private-Admin
const uploadRoomImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No se subieron archivos' });
    }

    const roomId = req.params.id;
    const imageData = req.files.map(file => ({
      roomId,
      imageUrl: `/uploads/rooms/${file.filename}`
    }));

    await prisma.roomImage.createMany({
      data: imageData
    });

    res.status(201).json({ message: 'Imágenes subidas correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error subiendo imágenes', error: error.message });
  }
};

// @desc    Delete room image
// @route   DELETE /api/rooms/images/:imageId
// @access  Private-Admin
const deleteRoomImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const image = await prisma.roomImage.findUnique({ where: { id: imageId } });
    
    if (!image) return res.status(404).json({ message: 'Imagen no encontrada' });

    // In a real app, we should also delete the file from disk (fs.unlink)
    // But for this project we'll focus on the DB record for now unless it's a priority.
    
    await prisma.roomImage.delete({ where: { id: imageId } });
    res.json({ message: 'Imagen eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando imagen', error: error.message });
  }
};

const checkoutRoom = async (req, res) => {
  const { id } = req.params;
  const { status, nights, pricePerNight, paymentMethod, transferReference } = req.body;

  try {
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        reservations: { where: { status: 'activa' } },
        inventoryTransactions: { where: { status: 'pending' }, include: { product: true } }
      }
    });

    if (!room) return res.status(404).json({ message: 'Habitación no encontrada' });

    const activeRes = room.reservations[0];
    const lodgingTotal = (nights || 1) * (pricePerNight || room.pricePerNight);
    const consumptions = room.inventoryTransactions || [];
    const consumptionsTotal = consumptions.reduce((sum, t) => sum + (t.quantity * (t.price || t.product.salePrice)), 0);
    const grandTotal = lodgingTotal + consumptionsTotal;

    // Create central Invoice
    let invoice = null;
    if (activeRes) {
      const invoiceItems = [
        { type: 'habitacion', description: `Alojamiento (${nights} noc)`, quantity: nights || 1, unitPrice: pricePerNight || room.pricePerNight, totalPrice: lodgingTotal }
      ];
      consumptions.forEach(c => {
        invoiceItems.push({
          type: 'producto',
          productId: c.productId,
          description: c.product.name,
          quantity: c.quantity,
          unitPrice: c.price || c.product.salePrice,
          totalPrice: c.quantity * (c.price || c.product.salePrice)
        });
      });

      invoice = await prisma.invoice.create({
        data: {
          reservationId: activeRes.id,
          totalAmount: grandTotal,
          status: paymentMethod === 'office' ? 'borrador' : 'pagada',
          paymentMethod: paymentMethod,
          transferReference: transferReference || null,
          items: {
            create: invoiceItems
          }
        }
      });

      // Close reservation
      await prisma.reservation.update({
        where: { id: activeRes.id },
        data: { status: 'completada' }
      });
    }

    // Mark pending consumptions as settled
    if (consumptions.length > 0) {
      await prisma.inventoryTransaction.updateMany({
        where: { id: { in: consumptions.map(c => c.id) } },
        data: { status: 'settled', paymentMethod: paymentMethod, transferReference: transferReference || null }
      });
    }

    // Release Room
    const updatedRoom = await prisma.room.update({
      where: { id },
      data: { status: status || 'limpieza' }
    });

    res.json({ message: 'Checkout exitoso', room: updatedRoom, invoice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error procesando checkout', error: error.message });
  }
};

module.exports = {
  getRoomTypes,
  createRoomType,
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  uploadRoomImages,
  deleteRoomImage,
  checkoutRoom
};
