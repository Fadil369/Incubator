import { Response, Router } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { cache } from '../middleware/cache';

const router = Router();
const prisma = new PrismaClient();

const createMentorValidation = [
  body('expertise').isArray({ min: 1 }).withMessage('At least one expertise area required'),
  body('yearsExperience').isInt({ min: 0, max: 60 }).withMessage('Valid years of experience required'),
  body('currentRole').trim().notEmpty().withMessage('Current role is required'),
  body('company').trim().notEmpty().withMessage('Company is required'),
  body('bio').optional().trim().isLength({ max: 2000 }),
  body('linkedinUrl').optional().isURL().withMessage('Invalid LinkedIn URL'),
  body('hourlyRate').optional().isFloat({ min: 0 }).withMessage('Hourly rate must be positive'),
];

/**
 * GET /api/mentors — public list of verified mentors (paginated, filterable)
 */
const getMentors = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page    = Math.max(1, parseInt(String(req.query.page  || '1')));
  const limit   = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'))));
  const skip    = (page - 1) * limit;
  const search  = String(req.query.search || '').trim();
  const expertise = req.query.expertise ? String(req.query.expertise) : undefined;

  const where: Record<string, unknown> = { isVerified: true };
  if (search) {
    where.OR = [
      { currentRole: { contains: search, mode: 'insensitive' } },
      { company:     { contains: search, mode: 'insensitive' } },
      { user: { OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName:  { contains: search, mode: 'insensitive' } },
      ]}},
    ];
  }
  if (expertise) {
    where.expertise = { has: expertise };
  }

  const [total, mentors] = await Promise.all([
    prisma.mentorProfile.count({ where }),
    prisma.mentorProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ rating: 'desc' }, { totalSessions: 'desc' }],
      select: {
        id: true, expertise: true, yearsExperience: true, currentRole: true,
        company: true, bio: true, linkedinUrl: true, rating: true,
        totalSessions: true, hourlyRate: true, isVerified: true,
        user: { select: { firstName: true, lastName: true, avatar: true } },
      },
    }),
  ]);

  res.json({ success: true, data: mentors, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

/**
 * POST /api/mentors — create mentor profile (authenticated, one per user)
 */
const createMentor = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: { message: 'Authentication required.' } });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: { message: 'Validation failed', details: errors.array() } });
  }

  const existing = await prisma.mentorProfile.findUnique({ where: { userId: req.user.id } });
  if (existing) {
    return res.status(409).json({ success: false, error: { message: 'Mentor profile already exists.' } });
  }

  const { expertise, yearsExperience, currentRole, company, bio, linkedinUrl, hourlyRate, availability } = req.body;

  const mentor = await prisma.mentorProfile.create({
    data: {
      userId: req.user.id,
      expertise,
      yearsExperience: parseInt(yearsExperience),
      currentRole,
      company,
      bio,
      linkedinUrl,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      availability: availability || {},
    },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });

  logger.info('Mentor profile created', { mentorId: mentor.id, userId: req.user.id });
  res.status(201).json({ success: true, data: mentor });
});

/**
 * GET /api/mentors/:id — get mentor profile by id
 */
const getMentorById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const mentor = await prisma.mentorProfile.findUnique({
    where: { id: req.params.id },
    include: {
      user:    { select: { firstName: true, lastName: true, avatar: true } },
      reviews: { where: { isPublic: true }, orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });

  if (!mentor) {
    return res.status(404).json({ success: false, error: { message: 'Mentor not found.' } });
  }

  res.json({ success: true, data: mentor });
});

/**
 * PUT /api/mentors/:id — update mentor profile (own profile or admin)
 */
const updateMentor = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const mentor = await prisma.mentorProfile.findUnique({ where: { id: req.params.id } });
  if (!mentor) return res.status(404).json({ success: false, error: { message: 'Mentor not found.' } });

  const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
  if (!isAdmin && mentor.userId !== req.user?.id) {
    return res.status(403).json({ success: false, error: { message: 'Access denied.' } });
  }

  const allowed = ['bio', 'linkedinUrl', 'hourlyRate', 'availability', 'expertise', 'currentRole', 'company'];
  const adminOnly = ['isVerified', 'rating'];
  const updates: Record<string, unknown> = {};

  for (const f of allowed) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  if (isAdmin) {
    for (const f of adminOnly) {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    }
  }

  const updated = await prisma.mentorProfile.update({ where: { id: req.params.id }, data: updates });
  res.json({ success: true, data: updated });
});

// Routes
router.get('/',    cache(120, 'mentors'), getMentors);
router.get('/:id', cache(60,  'mentors'), getMentorById);
router.post('/',   authenticate, createMentorValidation, createMentor);
router.put('/:id', authenticate, updateMentor);

export default router;
