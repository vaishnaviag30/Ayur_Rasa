# Ayur_Rasa Backend API

Full-featured Express.js backend for the Ayurvedic Diet Management System.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup PostgreSQL Database**

Create a new PostgreSQL database:
```bash
createdb ayur_rasa
```

Or use a managed service like Railway, Supabase, Neon, etc.

4. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/ayur_rasa
JWT_SECRET=your_super_secret_key_here
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

5. **Setup Prisma and Database**
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with initial data
npm run seed
```

6. **Start the backend**
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify token

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update user profile

### Patients
- `GET /api/patients/:patientId` - Get patient profile
- `PUT /api/patients/:patientId` - Update patient profile
- `GET /api/patients/doctor/patients/list` - Get doctor's patients

### Assessments
- `POST /api/assessments` - Submit dosha assessment
- `GET /api/assessments/patient/:patientId` - Get patient assessments

### Foods
- `GET /api/foods` - Get all foods (with filters)
- `GET /api/foods/:foodId` - Get food details
- `POST /api/foods/upload/csv` - Upload food data from CSV

### Diet Plans
- `POST /api/diet-plans` - Create diet plan (Doctor only)
- `GET /api/diet-plans/patient/:patientId` - Get patient's diet plans
- `GET /api/diet-plans/:planId` - Get specific diet plan
- `PUT /api/diet-plans/:planId` - Update diet plan (Doctor only)

## 📊 Database Schema

### Models
- **User** - Authentication & user profiles
- **Doctor** - Doctor specific information
- **Patient** - Patient profiles & health data
- **Assessment** - Dosha assessment results
- **Food** - Food database with nutritional & Ayurvedic properties
- **DietPlan** - Personalized diet plans
- **Meal** - Individual meals (Breakfast/Lunch/Dinner)
- **MealFood** - Foods included in meals
- **Remedy** - Ayurvedic remedies & recommendations

## 🔐 Authentication

Uses JWT (JSON Web Tokens) for authentication:

1. User registers/logs in
2. Backend returns JWT token
3. Token stored in localStorage on frontend
4. Token included in Authorization header for protected routes
5. Backend validates token and processes request

### Protected Routes
All routes except `/api/auth/register` and `/api/auth/login` require:
- Valid JWT token in Authorization header
- Format: `Authorization: Bearer <token>`

## 🔄 Development Workflow

### Database Migrations
```bash
# Create new migration
npm run prisma:migrate

# View database in Prisma Studio
npm run prisma:studio
```

### Building
```bash
npm run build
```

### Production
```bash
# Build
npm run build

# Start
npm start
```

## 📦 Dependencies

- **express** - Web framework
- **@prisma/client** - Database ORM
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **cors** - Cross-origin requests
- **dotenv** - Environment variables
- **multer** - File uploads
- **csv-parse** - CSV parsing

## 🐛 Troubleshooting

### Database connection error
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Verify database exists

### Migration errors
- Delete `node_modules/.prisma`
- Run `npm run prisma:generate` again
- Check migration files in `prisma/migrations`

### Port already in use
- Change PORT in .env
- Or kill process using port 5000

## 📖 API Documentation

For detailed API documentation, refer to the route files:
- `src/routes/auth.routes.ts`
- `src/routes/patients.routes.ts`
- `src/routes/diet-plans.routes.ts`
- etc.

## 🚢 Deployment

### Deploy to Railway
1. Push code to GitHub
2. Connect Railway to GitHub repo
3. Set environment variables in Railway dashboard
4. Deploy

### Deploy to Render
1. Push code to GitHub
2. Create new Web Service on Render
3. Connect to GitHub repo
4. Set environment variables
5. Deploy

### Deploy to Heroku
```bash
heroku login
heroku create your-app-name
git push heroku main
heroku config:set DATABASE_URL=your_postgres_url
```

## 📞 Support

For issues or questions, refer to the main project README.
