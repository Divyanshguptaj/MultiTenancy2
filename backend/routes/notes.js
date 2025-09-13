import express from 'express';
import Note from '../models/Note.js';
import { authenticate, tenantIsolation } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication and tenant isolation to all routes
router.use(authenticate, tenantIsolation);

// Create a note
router.post('/', async (req, res) => {
  try {
    const { title, content, tags = [] } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Check subscription limits for free plan
    if (req.tenant.subscription.plan === 'free') {
      const noteCount = await Note.countDocuments({ 
        tenantId: req.tenant._id, 
        isActive: true 
      });
      
      if (noteCount >= req.tenant.settings.maxNotes) {
        return res.status(403).json({ 
          error: 'Note limit reached for free plan. Upgrade to Pro for unlimited notes.',
          limit: req.tenant.settings.maxNotes
        });
      }
    }

    const note = new Note({
      title,
      content,
      tags: tags.filter(tag => tag.trim()),
      tenantId: req.tenant._id,
      createdBy: req.user._id
    });

    await note.save();
    await note.populate('createdBy', 'email');

    res.status(201).json(note);
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Get all notes for current tenant
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = { 
      tenantId: req.tenant._id, 
      isActive: true 
    };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const notes = await Note.find(query)
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Note.countDocuments(query);

    res.json({
      notes,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      },
      subscription: req.tenant.subscription
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Get a specific note
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id,
      isActive: true
    }).populate('createdBy', 'email');

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(note);
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// Update a note
router.put('/:id', async (req, res) => {
  try {
    const { title, content, tags = [] } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const note = await Note.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.tenant._id,
        isActive: true
      },
      {
        title,
        content,
        tags: tags.filter(tag => tag.trim())
      },
      { new: true }
    ).populate('createdBy', 'email');

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(note);
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete a note
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.tenant._id,
        isActive: true
      },
      { isActive: false },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;