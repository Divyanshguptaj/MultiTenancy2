import express from 'express';
import Tenant from '../models/Tenant.js';
import { authenticate, authorize, tenantIsolation } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication and tenant isolation to all routes
router.use(authenticate, tenantIsolation);

// Upgrade subscription (Admin only)
router.post('/:slug/upgrade', authorize(['admin']), async (req, res) => {
  try {
    const { slug } = req.params;

    // Verify the slug matches current tenant
    if (slug !== req.tenant.slug) {
      return res.status(403).json({ error: 'Access denied for this tenant' });
    }

    if (req.tenant.subscription.plan === 'pro') {
      return res.status(400).json({ error: 'Tenant is already on Pro plan' });
    }

    const updatedTenant = await Tenant.findByIdAndUpdate(
      req.tenant._id,
      {
        'subscription.plan': 'pro',
        'subscription.upgradeDate': new Date(),
        'settings.maxNotes': Number.MAX_SAFE_INTEGER
      },
      { new: true }
    );

    res.json({
      message: 'Subscription upgraded to Pro successfully',
      tenant: {
        id: updatedTenant._id,
        name: updatedTenant.name,
        slug: updatedTenant.slug,
        subscription: updatedTenant.subscription,
        settings: updatedTenant.settings
      }
    });
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    res.status(500).json({ error: 'Failed to upgrade subscription' });
  }
});

// Get current tenant info
router.get('/current', (req, res) => {
  res.json({
    tenant: {
      id: req.tenant._id,
      name: req.tenant.name,
      slug: req.tenant.slug,
      subscription: req.tenant.subscription,
      settings: req.tenant.settings
    }
  });
});

export default router;