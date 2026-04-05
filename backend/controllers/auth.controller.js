const prisma = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        token: generateToken(user.id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Email o contraseña inválidos' });
    }
  } catch (error) {
    console.error('ERROR EN LOGIN (BACKEND):', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, avatar: true, role: true, createdAt: true },
    });
    
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'Usuario no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    
    if (req.file) {
      // Create relative path for the frontend to access
      updateData.avatar = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: { id: true, email: true, name: true, avatar: true, role: true }
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando perfil', error: error.message });
  }
};

module.exports = {
  loginUser,
  getProfile,
  updateProfile,
};
