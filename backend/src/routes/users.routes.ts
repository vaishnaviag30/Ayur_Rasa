import { Router, Request, Response } from 'express';
import { prisma } from '../server';
import { authMiddleware, AuthRequest } from '../utils/auth';

const router = Router();

// Get current user profile
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      include: {
        doctorProfile: true,
        patientProfile: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

// Update user profile
router.put('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, profilePicture } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user?.userId },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(profilePicture && { profilePicture })
      },
      include: {
        doctorProfile: true,
        patientProfile: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

export default router;
