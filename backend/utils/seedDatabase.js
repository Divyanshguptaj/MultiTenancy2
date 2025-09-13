import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import Note from '../models/Note.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/multitenantapp');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Tenant.deleteMany({});
    await Note.deleteMany({});
    console.log('Cleared existing data');

    // Create tenants
    const acmeTenant = await Tenant.create({
      name: 'Acme Corporation',
      slug: 'acme',
      subscription: {
        plan: 'free'
      },
      settings: {
        maxNotes: 3
      }
    });

    const globexTenant = await Tenant.create({
      name: 'Globex Corporation',
      slug: 'globex',
      subscription: {
        plan: 'free'
      },
      settings: {
        maxNotes: 3
      }
    });

    console.log('Created tenants');

    // Create users
    const users = [
      {
        email: 'admin@acme.test',
        password: 'password',
        role: 'admin',
        tenantId: acmeTenant._id
      },
      {
        email: 'user@acme.test',
        password: 'password',
        role: 'member',
        tenantId: acmeTenant._id
      },
      {
        email: 'admin@globex.test',
        password: 'password',
        role: 'admin',
        tenantId: globexTenant._id
      },
      {
        email: 'user@globex.test',
        password: 'password',
        role: 'member',
        tenantId: globexTenant._id
      }
    ];

    const createdUsers = await User.create(users);
    console.log('Created users');

    // Create sample notes
    const sampleNotes = [
      {
        title: 'Welcome to Acme Notes',
        content: 'This is your first note in the Acme tenant. You can create, edit, and delete notes here.',
        tags: ['welcome', 'acme'],
        tenantId: acmeTenant._id,
        createdBy: createdUsers.find(u => u.email === 'user@acme.test')._id
      },
      {
        title: 'Meeting Notes - Q1 Planning',
        content: 'Discussed Q1 goals and objectives. Need to focus on customer acquisition and product development.',
        tags: ['meeting', 'planning'],
        tenantId: acmeTenant._id,
        createdBy: createdUsers.find(u => u.email === 'admin@acme.test')._id
      },
      {
        title: 'Welcome to Globex Notes',
        content: 'This is your first note in the Globex tenant. Notice how this is completely separate from Acme\'s data.',
        tags: ['welcome', 'globex'],
        tenantId: globexTenant._id,
        createdBy: createdUsers.find(u => u.email === 'user@globex.test')._id
      }
    ];

    await Note.create(sampleNotes);
    console.log('Created sample notes');

    console.log('\n=== SEEDING COMPLETE ===');
    console.log('\nTest Accounts:');
    console.log('admin@acme.test / password (Admin, Acme)');
    console.log('user@acme.test / password (Member, Acme)');
    console.log('admin@globex.test / password (Admin, Globex)');
    console.log('user@globex.test / password (Member, Globex)');
    console.log('\nAll tenants start on Free plan (3 notes max)');
    console.log('Admins can upgrade to Pro plan via the API');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();