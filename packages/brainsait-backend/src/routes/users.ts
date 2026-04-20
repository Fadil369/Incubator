import { Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/users — admin-only list of all users (paginated)
 */
const getUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page   = Math.max(1, parseInt(String(req.query.page  || '1')));
  const limit  = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'))));
  const skip   = (page - 1) * limit;
  const search = String(req.query.search || '').trim();

  const where = search
    ? {
        OR: [
          { email:     { contains: search, mode: 'insensitive' as const } },
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName:  { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : undefined;

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isActive: true, isVerified: true, createdAt: true,
        smeProfile: { select: { companyName: true, verificationStatus: true } },
      },
    }),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

/**
 * GET /api/users/:id — admins can fetch any user; users can only fetch themselves
 */
const getUserById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

  if (!isAdmin && req.user?.id !== id) {
    return res.status(403).json({ success: false, error: { message: 'Access denied.' } });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, email: true, firstName: true, lastName: true, role: true,
      isActive: true, isVerified: true, phoneNumber: true, avatar: true,
      createdAt: true, updatedAt: true,
      smeProfile: { select: { id: true, companyName: true, companyType: true, verificationStatus: true } },
    },
  });

  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'User not found.' } });
  }

  res.json({ success: true, data: user });
});

/**
 * PUT /api/users/:id — users update their own profile; admins can update any user
 */
const updateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

  if (!isAdmin && req.user?.id !== id) {
    return res.status(403).json({ success: false, error: { message: 'Access denied.' } });
  }

  // Only allow a safe subset of fields to be updated
  const allowedFields = ['firstName', 'lastName', 'phoneNumber', 'avatar'] as const;
  const adminOnlyFields = ['isActive', 'role', 'isVerified'] as const;

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  if (isAdmin) {
    for (const field of adminOnlyFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, error: { message: 'No valid fields to update.' } });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updates,
    select: {
      id: true, email: true, firstName: true, lastName: true,
      role: true, isActive: true, isVerified: true, updatedAt: true,
    },
  });

  logger.info('User updated', { userId: id, by: req.user?.id, fields: Object.keys(updates) });
  res.json({ success: true, data: updated });
});

/**
 * DELETE /api/users/:id — admin-only soft delete (deactivate)
 */
const deleteUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  if (req.user?.id === id) {
    return res.status(400).json({ success: false, error: { message: 'Cannot delete your own account.' } });
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  logger.warn('User deactivated', { userId: id, by: req.user?.id });
  res.json({ success: true, message: 'User deactivated successfully.' });
});

// Routes — all require authentication
router.get('/',    authenticate, authorize('ADMIN', 'SUPER_ADMIN'), getUsers);
router.get('/:id', authenticate, getUserById);
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), deleteUser);

export default router;
