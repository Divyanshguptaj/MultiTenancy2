import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email, isActive: true }).populate('tenantId');
    
    if (!user || !await user.comparePassword(password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.tenantId || !user.tenantId.isActive) {
      return res.status(401).json({ error: 'Tenant is inactive' });
    }

    const token = jwt.sign(
      { userId: user._id, tenantId: user.tenantId._id, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        tenant: {
          id: user.tenantId._id,
          name: user.tenantId.name,
          slug: user.tenantId.slug,
          subscription: user.tenantId.subscription
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticate, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      tenant: {
        id: req.tenant._id,
        name: req.tenant.name,
        slug: req.tenant.slug,
        subscription: req.tenant.subscription
      }
    }
  });
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;