import { Router, Request, Response } from 'express';
import { prisma } from '../server';
import { authMiddleware, AuthRequest } from '../utils/auth';

const router = Router();

// Submit dosha assessment
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { patientId, answers, vataScore, pittaScore, kaphaScore } = req.body;

    // Determine primary dosha
    const scores = { vataScore, pittaScore, kaphaScore };
    const primaryDosha = Object.entries(scores).reduce((a, b) => 
      b[1] > a[1] ? b : a
    )[0].replace('Score', '');

    const assessment = await prisma.assessment.create({
      data: {
        patientId,
        vataScore,
        pittaScore,
        kaphaScore,
        primaryDosha,
        answers: typeof answers === 'string' ? answers : JSON.stringify(answers)
      }
    });

    // Update patient dosha
    await prisma.patient.update({
      where: { id: patientId },
      data: {
        dosha: primaryDosha,
        doshaPercentage: JSON.stringify({
          vata: vataScore,
          pitta: pittaScore,
          kapha: kaphaScore
        })
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Assessment submitted successfully',
      data: { assessment }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit assessment'
    });
  }
});

// Get patient assessments
router.get('/patient/:patientId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const assessments = await prisma.assessment.findMany({
      where: { patientId: req.params.patientId },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      data: { assessments }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch assessments'
    });
  }
});

export default router;
