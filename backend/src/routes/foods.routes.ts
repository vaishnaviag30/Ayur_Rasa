import { Router, Request, Response } from 'express';
import { prisma } from '../server';
import { authMiddleware, AuthRequest } from '../utils/auth';
import multer from 'multer';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Get all foods
router.get('/', async (req: Request, res: Response) => {
  try {
    const { dosha, search } = req.query;

    const foods = await prisma.food.findMany({
      where: {
        ...(dosha && {
          OR: [
            { vataEffect: { contains: dosha as string } },
            { pittaEffect: { contains: dosha as string } },
            { kaphaEffect: { contains: dosha as string } }
          ]
        }),
        ...(search && {
          name: { contains: search as string }
        })
      },
      take: 100
    });

    return res.status(200).json({
      success: true,
      data: { foods, count: foods.length }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch foods'
    });
  }
});

// Get food by ID
router.get('/:foodId', async (req: Request, res: Response) => {
  try {
    const food = await prisma.food.findUnique({
      where: { id: req.params.foodId }
    });

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: { food }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch food'
    });
  }
});

// Upload CSV food data
router.post('/upload/csv', authMiddleware, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    let createdCount = 0;

    for (const record of records) {
      const rec = record as any;
      await prisma.food.upsert({
        where: { name: rec['Food Name'] || rec.name },
        update: {},
        create: {
          name: rec['Food Name'] || rec.name,
          calories: parseFloat(rec.Calories || rec.calories),
          protein: parseFloat(rec['Protein (g)'] || rec.protein),
          carbs: parseFloat(rec['Carbs (g)'] || rec.carbs),
          fats: parseFloat(rec['Fats (g)'] || rec.fats),
          vataEffect: rec.Vata,
          pittaEffect: rec.Pitta,
          kaphaEffect: rec.Kapha,
          mealTypes: rec['Meal Type'] || 'All',
          taste: rec.taste,
          digestion: rec.digestion,
          temperature: rec.temperature
        }
      });
      createdCount++;
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    return res.status(201).json({
      success: true,
      message: `${createdCount} foods imported successfully`,
      data: { count: createdCount }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload foods'
    });
  }
});

export default router;
