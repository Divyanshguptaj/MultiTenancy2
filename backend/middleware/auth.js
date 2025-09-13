import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    const user = await User.findById(decoded.userId).populate('tenantId');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token or inactive user.' });
    }

    if (!user.tenantId || !user.tenantId.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive tenant.' });
    }

    req.user = user;
    req.tenant = user.tenantId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    next();
  };
};

export const tenantIsolation = (req, res, next) => {
  if (!req.tenant) {
    return res.status(401).json({ error: 'Tenant context required.' });
  }
  next();
};