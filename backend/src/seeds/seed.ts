import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  try {
    // Clean existing data
    console.log('Cleaning existing data...');
    await prisma.mealFood.deleteMany();
    await prisma.meal.deleteMany();
    await prisma.dietPlan.deleteMany();
    await prisma.assessment.deleteMany();
    await prisma.food.deleteMany();
    await prisma.remedy.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.doctor.deleteMany();
    await prisma.user.deleteMany();

    // Import foods from CSV
    console.log('Importing foods from CSV...');
    const csvPath = path.join(__dirname, '../new_foods.csv');
    
    if (fs.existsSync(csvPath)) {
      const fileContent = fs.readFileSync(csvPath, 'utf-8');
      const records = parse(fileContent, {
      });

      for (const record of records) {
        const rec = record as any;
        await prisma.food.upsert({
          where: { name: rec['Food Name'] || rec.name },
          update: {},
          create: {
            name: rec['Food Name'] || rec.name,
            calories: parseFloat(rec.Calories || rec.calories || '0'),
            protein: parseFloat(rec['Protein (g)'] || rec.protein || '0'),
            carbs: parseFloat(rec['Carbs (g)'] || rec.carbs || '0'),
            fats: parseFloat(rec['Fats (g)'] || rec.fats || '0'),
            vataEffect: rec.Vata || '=',
            pittaEffect: rec.Pitta || '=',
            kaphaEffect: rec.Kapha || '=',
            mealTypes: rec['Meal Type'] || 'All'
          }
        });
      }

      console.log(`✅ Imported foods from CSV`);
    }

    // Create sample remedies
    const remedies = [
      {
        name: 'Ginger Tea',
        description: 'Warm ginger tea to balance Vata',
        dosha: 'Vata',
        ingredients: 'Ginger, Water, Honey',
        preparation: 'Boil water, add ginger, simmer for 10 minutes',
        benefits: 'Improves digestion, reduces bloating'
      },
      {
        name: 'Coconut Water',
        description: 'Cooling coconut water for Pitta',
        dosha: 'Pitta',
        ingredients: 'Coconut',
        preparation: 'Fresh coconut water',
        benefits: 'Cools the system, hydrates'
      },
      {
        name: 'Warm Oil Massage',
        description: 'Sesame oil massage for Kapha',
        dosha: 'Kapha',
        ingredients: 'Sesame Oil',
        preparation: 'Warm oil and massage body',
        benefits: 'Stimulates circulation, energizes'
      }
    ];

    for (const remedy of remedies) {
      await prisma.remedy.create({
        data: remedy
      });
    }

    console.log('✅ Seeded remedies');
    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
