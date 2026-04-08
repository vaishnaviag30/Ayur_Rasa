# 🚀 Ayur_Rasa: Full Backend Implementation - Setup Guide

## ✅ What Was Done

This guide shows you how to set up and run the complete Ayur_Rasa system with a production-ready Express.js backend and PostgreSQL database.

### Backend Created ✨
- ✅ Express.js server with TypeScript
- ✅ PostgreSQL database with Prisma ORM
- ✅ JWT-based authentication system
- ✅ Complete API routes for all features
- ✅ Database schema with relationships
- ✅ Environment configuration
- ✅ CSV food data import functionality
- ✅ Database seeding script

### Frontend Updated 🎨
- ✅ Removed Firebase dependencies
- ✅ Updated login page to use backend API
- ✅ Updated Navbar to use token-based auth
- ✅ Created API service layer for frontend
- ✅ Updated environment configuration

---

## 📋 Prerequisites

### Required Software
- **Node.js 16+** - Download from [nodejs.org](https://nodejs.org)
- **PostgreSQL 12+** - Download from [postgresql.org](https://www.postgresql.org/download)
- **Git** - Download from [git-scm.com](https://git-scm.com)
- **npm or yarn** - Usually comes with Node.js

### Verify Installation
```bash
node --version
npm --version
psql --version
```

---

## 🔧 Setup Instructions

### 1. Create PostgreSQL Database

#### Option A: Local PostgreSQL
```bash
# Create database
createdb ayur_rasa

# Connect to verify
psql ayur_rasa
# Then type \q to exit
```

#### Option B: Managed Services
- **Railway**: https://railway.app (recommended for beginners)
- **Supabase**: https://supabase.com
- **Neon**: https://neon.tech
- **AWS RDS**: https://aws.amazon.com/rds/postgresql
- **Azure Database**: https://azure.microsoft.com/en-us/services/postgresql

### 2. Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file with your database URL
cat > .env << EOF
DATABASE_URL=postgresql://user:password@localhost:5432/ayur_rasa
JWT_SECRET=your_super_secret_key_change_this_in_production_12345
JWT_EXPIRY=24h
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
EOF

# Generate Prisma client
npm run prisma:generate

# Run database migrations (creates tables)
npm run prisma:migrate

# Seed database with initial data (foods, remedies)
npm run seed

# Start backend server
npm run dev
```

**Expected Output:**
```
✅ Backend running on http://localhost:5000
📚 API Documentation available at http://localhost:5000/api/docs
```

### 3. Setup Frontend

```bash
# From root directory
npm install

# Update .env with API URL
cat > .env << EOF
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_API_URL=http://localhost:5000
EOF

# Start frontend in separate terminal
npm run dev
```

**Expected Output:**
```
 ▲ Next.js 15.5.2
  Local: http://localhost:3000
```

---

## 🧪 Testing the Setup

### 1. Test Backend Health Check
```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "Backend is running"
}
```

### 2. Test User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@example.com",
    "password": "password123",
    "name": "Dr. Smith",
    "role": "DOCTOR",
    "phone": "9876543210",
    "licenseNumber": "DOC123456"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "doctor@example.com",
      "name": "Dr. Smith",
      "role": "DOCTOR"
    },
    "token": "eyJhbGc..."
  }
}
```

### 3. Test in Frontend Browser
1. Open http://localhost:3000
2. Click "Sign Up" or "Login"
3. Register a new account
4. Should redirect to Dashboard
5. Profile should show in Navbar

---

## 📊 Database Structure

### Main Tables
- **users** - User authentication & profiles
- **doctors** - Doctor-specific information
- **patients** - Patient health profiles
- **assessments** - Dosha assessment results
- **foods** - Nutritional & Ayurvedic food data
- **diet_plans** - Personalized diet plans
- **meals** - Breakfast/Lunch/Dinner
- **meal_foods** - Foods in each meal
- **remedies** - Ayurvedic remedies

### View Database
```bash
# In backend directory
npm run prisma:studio
# Opens web interface at http://localhost:5555
```

---

## 🔐 API Endpoints Reference

### Authentication
```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login user
GET    /api/auth/verify            Verify JWT token (requires token)
```

### User Management
```
GET    /api/users/me               Get current user profile (requires token)
PUT    /api/users/me               Update user profile (requires token)
```

### Patient Management
```
GET    /api/patients/:id           Get patient profile
PUT    /api/patients/:id           Update patient profile
GET    /api/patients/doctor/patients/list   Get doctor's patients
```

### Dosha Assessment
```
POST   /api/assessments            Submit assessment
GET    /api/assessments/patient/:id   Get patient's assessments
```

### Food Database
```
GET    /api/foods                  Get all foods (with filters)
GET    /api/foods/:id              Get food details
POST   /api/foods/upload/csv       Upload CSV file (requires auth)
```

### Diet Plans
```
POST   /api/diet-plans             Create diet plan (Doctor only)
GET    /api/diet-plans/patient/:id Get patient's diet plans
GET    /api/diet-plans/:id         Get specific diet plan
PUT    /api/diet-plans/:id         Update diet plan (Doctor only)
```

---

## 🐛 Troubleshooting

### Database Connection Error
**Problem:** `Error connecting to database`
**Solution:**
```bash
# Verify database URL is correct in .env
# Make sure PostgreSQL is running
# Test connection:
psql postgresql://user:password@localhost:5432/ayur_rasa
```

### Port Already in Use
**Problem:** `Error: listen EADDRINUSE: address already in use :::5000`
**Solution:**
```bash
# Change PORT in .env or kill process
# Windows: netstat -ano | findstr :5000
# Linux/Mac: lsof -i :5000
```

### Migration Failed
**Problem:** `Error running migrate`
**Solution:**
```bash
cd backend
rm node_modules/.prisma
npm run prisma:generate
npm run prisma:migrate
```

### Frontend Can't Connect to Backend
**Problem:** `Failed to fetch` in browser console
**Solution:**
```bash
# Verify NEXT_PUBLIC_API_URL in .env
# Make sure backend is running on http://localhost:5000
# Check CORS settings in backend/src/server.ts
```

---

## 📦 Production Deployment

### Deploy Backend to Railway
```bash
# 1. Push code to GitHub
# 2. Connect your GitHub repo to Railway
# 3. Set environment variables:
DATABASE_URL=your_railway_postgres_url
JWT_SECRET=generate_a_strong_secret_key

# 4. Railway automatically deploys
```

### Deploy Frontend to Vercel
```bash
# 1. Push code to GitHub
# 2. Import project in Vercel
# 3. Set environment variable:
NEXT_PUBLIC_API_URL=https://your-backend-railway-url

# 4. Vercel automatically deploys
```

---

## 📈 Next Steps

1. **Test all features** - Register, create diet plans, upload foods
2. **Customize** - Add more Ayurvedic foods and remedies
3. **Security** - Change JWT_SECRET in production
4. **Deployment** - Deploy to Railway + Vercel
5. **Monitoring** - Set up error tracking with Sentry

---

## 📞 Support

### Useful Resources
- Express.js: https://expressjs.com
- Prisma: https://prisma.io
- PostgreSQL: https://www.postgresql.org/docs
- Next.js: https://nextjs.org/docs

### Common Issues
- Check backend terminal for error logs
- Check browser console (F12) for frontend errors
- Use Prisma Studio to inspect database: `npm run prisma:studio`

---

## ✨ Features Overview

### For Patients
- ✅ Create account
- ✅ Take Dosha assessment
- ✅ View personalized diet plans
- ✅ Access health information

### For Doctors
- ✅ Create account with license
- ✅ Manage patient profiles
- ✅ Generate personalized diet plans
- ✅ Upload/manage food database
- ✅ Create Ayurvedic recommendations

### System Features
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Nutritional calculations
- ✅ Dosha assessment algorithm
- ✅ CSV food data import
- ✅ Meal planning engine

---

**Congratulations! 🎉 You now have a fully functional Ayur_Rasa backend!**
