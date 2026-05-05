const jwt = require('jsonwebtoken');
const logger = require('../../config/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Generate JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { 
      id: user._id, 
      username: user.username,
      email: user.email,
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify JWT token middleware
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access denied. No token provided.' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    return res.status(403).json({ 
      error: 'Invalid or expired token.' 
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Token invalid but we don't fail
      logger.warn('Invalid token in optional auth:', error.message);
    }
  }
  next();
}

/**
 * Check if user is admin
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied. Admin privileges required.' 
    });
  }
  next();
}

module.exports = {
  generateToken,
  authenticateToken,
  optionalAuth,
  requireAdmin,
  JWT_SECRET,
  JWT_EXPIRES_IN
};
