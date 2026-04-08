import { Router, Request, Response } from 'express';
import { prisma } from '../server';
import { authMiddleware, AuthRequest, authorizeRole } from '../utils/auth';
import { hashPassword } from '../utils/auth';

const router = Router();

// Get patient profile for current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.userId },
      include: {
        user: true,
        doctor: true,
        assessments: true,
        dietPlans: true
      }
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    return res.status(200).json({ success: true, data: { patient } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch patient profile' });
  }
});

// Get patient profile
router.get('/:patientId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.patientId },
      include: {
        user: true,
        doctor: true,
        assessments: true
      }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: { patient }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch patient'
    });
  }
});

// Update patient profile
router.put('/:patientId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      age,
      gender,
      height,
      weight,
      dosha,
      prakriti,
      vikriti,
      constitution,
      address,
      bloodPressure,
      pulseRate,
      dietaryHabits,
      mealFrequency,
      bowelMovements,
      waterIntake,
      physicalActivity,
      stressLevel,
      medicalConditions,
      allergies,
      currentMedications,
      lastConsultation,
      bmiHistory,
    } = req.body;

    // Calculate BMI
    let bmi = undefined;
    if (height && weight) {
      bmi = weight / ((height / 100) * (height / 100));
    }

    const updatedPatient = await prisma.patient.update({
      where: { id: req.params.patientId },
      data: {
        ...(age && { age }),
        ...(gender && { gender }),
        ...(height && { height }),
        ...(weight && { weight }),
        ...(bmi && { bmi }),
        ...(dosha && { dosha }),
        ...(prakriti && { prakriti }),
        ...(vikriti && { vikriti }),
        ...(constitution && { constitution }),
        ...(address && { address }),
        ...(bloodPressure && { bloodPressure }),
        ...(pulseRate && { pulseRate }),
        ...(dietaryHabits && { dietaryHabits }),
        ...(mealFrequency && { mealFrequency }),
        ...(bowelMovements && { bowelMovements }),
        ...(waterIntake && { waterIntake }),
        ...(physicalActivity && { physicalActivity }),
        ...(stressLevel && { stressLevel }),
        ...(medicalConditions && { medicalConditions }),
        ...(allergies && { allergies }),
        ...(currentMedications && { currentMedications }),
        ...(lastConsultation && { lastConsultation }),
        ...(bmiHistory && { bmiHistory: typeof bmiHistory === 'string' ? bmiHistory : JSON.stringify(bmiHistory) }),
      },
      include: {
        user: true,
        doctor: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Patient profile updated',
      data: { patient: updatedPatient }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update patient'
    });
  }
});

// Get patients for a doctor
router.get('/doctor/patients/list', authMiddleware, authorizeRole('DOCTOR'), async (req: AuthRequest, res: Response) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user?.userId }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    const patients = await prisma.patient.findMany({
      where: { doctorId: doctor.id },
      include: { user: true }
    });

    return res.status(200).json({
      success: true,
      data: { patients }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch patients'
    });
  }
});

// Doctor can create a new patient
router.post('/doctor/patients/create', authMiddleware, authorizeRole('DOCTOR'), async (req: AuthRequest, res: Response) => {
  try {
    const { email, name, password, age, gender, height, weight, dosha } = req.body;

    if (!email || !name || !password || !age || !gender || !height || !weight || !dosha) {
      return res.status(400).json({ success: false, message: 'Missing required patient fields' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Patient email already exists' });
    }

    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user?.userId } });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const hashedPassword = await hashPassword(password);

    const patientUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'PATIENT'
      }
    });

    const patient = await prisma.patient.create({
      data: {
        userId: patientUser.id,
        age,
        gender,
        height,
        weight,
        dosha,
        doctorId: doctor.id
      },
      include: { user: true }
    });

    return res.status(201).json({ success: true, message: 'Patient added successfully', data: { patient } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to create patient' });
  }
});

export default router;
