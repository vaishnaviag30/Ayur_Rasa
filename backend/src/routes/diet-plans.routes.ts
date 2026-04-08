import { Router, Request, Response } from 'express';
import { prisma } from '../server';
import { authMiddleware, AuthRequest, authorizeRole } from '../utils/auth';

const router = Router();

// Create diet plan
router.post('/', authMiddleware, authorizeRole('DOCTOR'), async (req: AuthRequest, res: Response) => {
  try {
    const { patientId, startDate, endDate, weekNumber, meals, recommendations, notes } = req.body;

    // Get doctor profile
    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user?.userId }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Create diet plan
    const dietPlan = await prisma.dietPlan.create({
      data: {
        patientId,
        doctorId: doctor.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        weekNumber: weekNumber || 1,
        recommendations,
        notes
      }
    });

    // Create meals
    if (meals && meals.length > 0) {
      for (const meal of meals) {
        const createdMeal = await prisma.meal.create({
          data: {
            planId: dietPlan.id,
            mealType: meal.mealType,
            dayOfWeek: meal.dayOfWeek,
            time: meal.time
          }
        });

        // Add foods to meal
        if (meal.foods && meal.foods.length > 0) {
          for (const foodItem of meal.foods) {
            await prisma.mealFood.create({
              data: {
                mealId: createdMeal.id,
                foodId: foodItem.foodId,
                portion: foodItem.portion,
                calories: foodItem.calories,
                protein: foodItem.protein,
                carbs: foodItem.carbs,
                fats: foodItem.fats
              }
            });
          }
        }
      }
    }

    // Fetch complete diet plan with meals
    const completePlan = await prisma.dietPlan.findUnique({
      where: { id: dietPlan.id },
      include: {
        meals: {
          include: {
            foods: {
              include: { food: true }
            }
          }
        },
        patient: { include: { user: true } }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Diet plan created successfully',
      data: { dietPlan: completePlan }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create diet plan'
    });
  }
});

// Get diet plans for patient
router.get('/patient/:patientId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const dietPlans = await prisma.dietPlan.findMany({
      where: { patientId: req.params.patientId },
      include: {
        meals: {
          include: {
            foods: {
              include: { food: true }
            }
          }
        },
        doctor: { include: { user: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      data: { dietPlans }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch diet plans'
    });
  }
});

// Get specific diet plan
router.get('/:planId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const dietPlan = await prisma.dietPlan.findUnique({
      where: { id: req.params.planId },
      include: {
        meals: {
          include: {
            foods: {
              include: { food: true }
            }
          }
        },
        patient: { include: { user: true } },
        doctor: { include: { user: true } }
      }
    });

    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        message: 'Diet plan not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: { dietPlan }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch diet plan'
    });
  }
});

// Update diet plan
router.put('/:planId', authMiddleware, authorizeRole('DOCTOR'), async (req: AuthRequest, res: Response) => {
  try {
    const { recommendations, notes } = req.body;

    const updatedPlan = await prisma.dietPlan.update({
      where: { id: req.params.planId },
      data: {
        ...(recommendations && { recommendations }),
        ...(notes && { notes })
      },
      include: {
        meals: {
          include: {
            foods: {
              include: { food: true }
            }
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Diet plan updated successfully',
      data: { dietPlan: updatedPlan }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update diet plan'
    });
  }
});

export default router;
