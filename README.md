# Multi-Tenant Notes Application

A secure multi-tenant notes application with strict tenant isolation, JWT-based authentication, and subscription-based feature gating.

## Architecture Overview

### Multi-Tenancy Approach: Shared Schema with Tenant ID

This application uses a **shared schema with tenant ID column** approach for multi-tenancy:

- **Single Database**: All tenants share the same MongoDB database
- **Tenant Isolation**: Every document includes a `tenantId` field for strict data separation
- **Security**: Middleware ensures users can only access data from their own tenant
- **Performance**: Efficient querying with compound indexes on `tenantId`
- **Scalability**: Easy to add new tenants without database schema changes

**Why this approach?**
- **Simplicity**: Easier to maintain and deploy compared to separate schemas/databases
- **Cost-effective**: Single database instance for all tenants
- **Performance**: MongoDB's indexing provides excellent query performance
- **Security**: Application-level isolation with proper middleware enforcement

### Security Features

- **Strict Tenant Isolation**: Users can only see data from their own tenant
- **JWT Authentication**: Secure token-based authentication
- **Role-based Authorization**: Admin and Member roles with different permissions
- **Password Hashing**: Secure password storage with bcrypt
- **Request Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive data validation and sanitization

## Features

### 1. Multi-Tenancy
- **Two Tenants**: Acme Corporation and Globex Corporation
- **Strict Isolation**: Complete data separation between tenants
- **Tenant Context**: All operations are scoped to the authenticated user's tenant

### 2. Authentication & Authorization
- **JWT-based Authentication**: Secure login with token-based sessions
- **Role-based Access Control**:
  - **Admin**: Can invite users, manage subscriptions, and perform all note operations
  - **Member**: Can create, view, edit, and delete notes only

### 3. Subscription Feature Gating
- **Free Plan**: Limited to 3 notes maximum
- **Pro Plan**: Unlimited notes
- **Upgrade Functionality**: Admins can upgrade their tenant's subscription
- **Real-time Limits**: Subscription limits are enforced immediately

### 4. Notes Management
- **Full CRUD Operations**: Create, Read, Update, Delete notes
- **Search Functionality**: Search notes by title, content, or tags
- **Tagging System**: Organize notes with custom tags
- **Tenant Scoped**: All operations respect tenant boundaries

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - User logout

### Notes (All require authentication)
- `POST /api/notes` - Create a new note
- `GET /api/notes` - List all notes for current tenant
- `GET /api/notes/:id` - Get specific note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Tenants (Admin only)
- `POST /api/tenants/:slug/upgrade` - Upgrade subscription to Pro
- `GET /api/tenants/current` - Get current tenant info

## Test Accounts

The application comes with pre-seeded test accounts:

| Email | Password | Role | Tenant | Plan |
|-------|----------|------|--------|------|
| admin@acme.test | password | Admin | Acme | Free |
| user@acme.test | password | Member | Acme | Free |
| admin@globex.test | password | Admin | Globex | Free |
| user@globex.test | password | Member | Globex | Free |

## Technology Stack

### Backend
- **Node.js** with **Express.js** - Server framework
- **MongoDB** with **Mongoose** - Database and ODM
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Request throttling

### Frontend
- **React 18** with **TypeScript** - UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling framework
- **Lucide React** - Icon library

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or cloud instance)
- npm or yarn package manager

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

2. **Environment Setup**
   ```bash
   # Copy and configure environment variables
   cp .env.example .env
   # Update MONGODB_URI and JWT_SECRET in .env file
   ```

3. **Database Setup**
   ```bash
   # Start MongoDB service
   # For macOS: brew services start mongodb/brew/mongodb-community
   # For Linux: sudo systemctl start mongod
   # For Windows: Start MongoDB service from Services panel

   # Seed the database with test accounts
   npm run seed
   ```

4. **Start Development Servers**
   ```bash
   # Start both backend and frontend concurrently
   npm run dev

   # Or start individually:
   # Backend: npm run server
   # Frontend: npm run client
   ```

5. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

### Production Build

```bash
npm run build
```

## Database Schema

### Users Collection
```javascript
{
  email: String, // Unique identifier
  password: String, // Hashed with bcrypt
  role: 'admin' | 'member',
  tenantId: ObjectId, // Reference to tenant
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Tenants Collection
```javascript
{
  name: String, // Display name
  slug: String, // Unique identifier
  subscription: {
    plan: 'free' | 'pro',
    upgradeDate: Date
  },
  settings: {
    maxNotes: Number
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Notes Collection
```javascript
{
  title: String,
  content: String,
  tags: [String],
  tenantId: ObjectId, // Tenant isolation
  createdBy: ObjectId, // User reference
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Security Considerations

1. **Tenant Isolation**: Every database query includes tenantId filter
2. **Authentication**: All protected routes require valid JWT tokens
3. **Authorization**: Role-based access control for different operations
4. **Input Validation**: Comprehensive validation on all inputs
5. **Password Security**: Passwords are hashed with bcrypt (12 rounds)
6. **Rate Limiting**: Protection against brute force and abuse
7. **Security Headers**: Helmet.js for security headers
8. **Soft Deletes**: Notes are marked inactive rather than hard deleted

## Development Notes

- All API responses include proper error handling and status codes
- Frontend includes loading states and error boundaries
- Database indexes optimize query performance for tenant-scoped operations
- Comprehensive logging for debugging and monitoring
- Environment-specific configurations for development and production

## License

This project is licensed under the MIT License.