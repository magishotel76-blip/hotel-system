const express = require('express');
const router = express.Router();
const {
  getRoomTypes,
  createRoomType,
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  uploadRoomImages,
  deleteRoomImage,
  checkoutRoom
} = require('../controllers/room.controller');
const { protect, admin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const fs = require('fs');

// Multer Config
const uploadDir = path.join(__dirname, '..', 'uploads', 'rooms');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `room-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

router.route('/types')
  .get(protect, getRoomTypes)
  .post(protect, admin, createRoomType);

router.route('/')
  .get(protect, getRooms)
  .post(protect, admin, createRoom);

router.route('/images/:imageId')
  .delete(protect, admin, deleteRoomImage);

router.route('/:id')
  .get(protect, getRoomById)
  .put(protect, admin, updateRoom);

router.post('/:id/checkout', protect, checkoutRoom);

router.post('/:id/images', protect, admin, upload.array('images', 5), uploadRoomImages);

module.exports = router;
