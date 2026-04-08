import { Router, Request, Response } from 'express';
import { prisma } from '../server';
import { 
  generateToken, 
  hashPassword, 
  comparePassword,
  authMiddleware 
} from '../utils/auth';

const router = Router();

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: 'PATIENT' | 'DOCTOR';
  phone?: string;
  licenseNumber?: string; // For doctors
}

interface LoginRequest {
  email: string;
  password: string;
}

// Register endpoint
router.post('/register', async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
  try {
    const { email, password, name, role, phone, licenseNumber } = req.body;

    // Validation
    if (!email || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        phone,
      }
    });

    // If doctor, create doctor profile
    if (role === 'DOCTOR') {
      await prisma.doctor.create({
        data: {
          userId: user.id,
          licenseNumber: licenseNumber || ''
        }
      });
    }

    // If patient, create patient profile
    if (role === 'PATIENT') {
      await prisma.patient.create({
        data: {
          userId: user.id,
          age: 0,
          gender: '',
          height: 0,
          weight: 0,
          dosha: 'Vata'
        }
      });
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// Login endpoint
router.post('/login', async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Verify token endpoint
router.get('/verify', authMiddleware, async (req: Request, res: Response) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: (req as any).user
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Verification failed'
    });
  }
});

export default router;
