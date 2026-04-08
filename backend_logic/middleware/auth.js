const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      console.error('JWT VERIFY ERROR:', error.message);
      res.status(401).json({ message: 'No autorizado, token fallido' });
    }
  }

  if (!token) {
    console.error('AUTH ERROR: No token provided in headers', req.headers.authorization);
    res.status(401).json({ message: 'No autorizado, no hay token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(401).json({ message: 'No autorizado como administrador' });
  }
};

module.exports = { protect, admin };
