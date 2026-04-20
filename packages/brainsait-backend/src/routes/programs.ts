import { Router, type Request, type Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, type AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { cache, invalidateCache } from '../middleware/cache';
import {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  enrollInProgram,
  getMyEnrollments,
  updateEnrollmentStatus,
  updateEnrollmentProgress,
  getProgramStatistics,
} from '../controllers/programController';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createProgramValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('type').isIn(['INCUBATION', 'ACCELERATION', 'MENTORSHIP', 'WORKSHOP', 'MASTERCLASS']).withMessage('Invalid program type'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer (weeks)'),
  body('maxParticipants').isInt({ min: 1 }).withMessage('Max participants must be a positive integer'),
  body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
  body('startDate').optional().isISO8601().withMessage('Invalid start date'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date'),
  body('requirements').optional().isObject().withMessage('Requirements must be an object'),
  body('curriculum').optional().isObject().withMessage('Curriculum must be an object'),
  body('resources').optional().isObject().withMessage('Resources must be an object'),
];

const updateProgramValidation = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('type').optional().isIn(['INCUBATION', 'ACCELERATION', 'MENTORSHIP', 'WORKSHOP', 'MASTERCLASS']).withMessage('Invalid program type'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer (weeks)'),
  body('maxParticipants').optional().isInt({ min: 1 }).withMessage('Max participants must be a positive integer'),
  body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
  body('startDate').optional().isISO8601().withMessage('Invalid start date'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date'),
  body('status').optional().isIn(['DRAFT', 'PUBLISHED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status'),
  body('requirements').optional().isObject().withMessage('Requirements must be an object'),
  body('curriculum').optional().isObject().withMessage('Curriculum must be an object'),
  body('resources').optional().isObject().withMessage('Resources must be an object'),
];

const enrollmentStatusValidation = [
  body('status').isIn(['PENDING', 'APPROVED', 'ACTIVE', 'COMPLETED', 'WITHDRAWN', 'REJECTED']).withMessage('Invalid enrollment status'),
  body('rejectionReason').optional().isString().withMessage('Rejection reason must be a string'),
];

const progressUpdateValidation = [
  body('progress').isFloat({ min: 0, max: 100 }).withMessage('Progress must be a number between 0 and 100'),
];

// Public routes (cached)
router.get('/', cache(120, 'programs'), getPrograms);
router.get('/:id', cache(60, 'programs'), getProgramById);

// Protected routes (authenticated users)
router.post('/:id/enroll', authenticate, enrollInProgram);
router.get('/my/enrollments', authenticate, getMyEnrollments);
router.put('/enrollments/:enrollmentId/progress', authenticate, progressUpdateValidation, updateEnrollmentProgress);

// Admin-only routes
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createProgramValidation, async (req, res, next) => {
  await invalidateCache('programs:GET:/api/programs*');
  next();
}, createProgram);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), updateProgramValidation, async (req, res, next) => {
  await invalidateCache('programs:GET:/api/programs*');
  next();
}, updateProgram);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  await invalidateCache('programs:GET:/api/programs*');
  next();
}, deleteProgram);
router.put('/enrollments/:enrollmentId/status', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), enrollmentStatusValidation, updateEnrollmentStatus);
router.get('/admin/statistics', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), getProgramStatistics);

// ── Milestone / progress endpoints (used by portal page) ─────────────────────

/**
 * GET /api/programs/:enrollmentId/milestones
 * Return phase-based milestones for the given enrollment.
 * The portal page passes the SME's enrollment ID as :enrollmentId.
 */
router.get(
  '/:enrollmentId/milestones',
  authenticate,
  cache(30, 'milestones'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { enrollmentId } = req.params;

    const enrollment = await prisma.programEnrollment.findFirst({
      where: { id: enrollmentId },
      include: {
        program: {
          select: {
            title: true,
            curriculum: true,
            phases: {
              orderBy: { order: 'asc' },
              select: { id: true, name: true, description: true, order: true, type: true, duration: true },
            },
          },
        },
        sme:    { select: { userId: true, companyName: true } },
        phaseProgress: {
          select: { phaseId: true, status: true, progress: true, completedDate: true },
        },
      },
    });

    if (!enrollment) {
      // Frontend falls back to hardcoded milestones
      return void res.json({ milestones: [], source: 'fallback' });
    }

    // Only the enrolled user or admins can see progress
    const userId = req.user!.id;
    const isOwner = enrollment.sme.userId === userId;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role);
    if (!isOwner && !isAdmin) {
      return void res.status(403).json({ error: 'Forbidden' });
    }

    // Build progress map
    const progressByPhase: Record<string, { status: string; progress: number; completedDate: Date | null }> = {};
    for (const pp of enrollment.phaseProgress) {
      progressByPhase[pp.phaseId] = {
        status: pp.status,
        progress: pp.progress,
        completedDate: pp.completedDate,
      };
    }

    // Shape phases as milestone objects (compatible with portal Milestone interface)
    const milestones = enrollment.program.phases.map((phase, idx) => {
      const pp = progressByPhase[phase.id];
      return {
        id:          idx + 1,
        phase:       phase.order,
        title:       phase.name,
        description: phase.description ?? '',
        dueDate:     pp?.completedDate?.toISOString() ?? '',
        status:      pp ? mapPhaseStatus(pp.status) : 'pending' as const,
        progress:    pp?.progress ?? 0,
      };
    });

    res.json({
      milestones,
      enrollmentId:   enrollment.id,
      program:        enrollment.program.title,
      overallProgress: enrollment.progress,
    });
  })
);

/** Map PhaseStatus enum to portal milestone status */
function mapPhaseStatus(s: string): 'completed' | 'in_progress' | 'pending' {
  if (s === 'COMPLETED') return 'completed';
  if (s === 'IN_PROGRESS') return 'in_progress';
  return 'pending';
}

/**
 * PATCH /api/programs/:enrollmentId/milestones/:phaseId
 * Update the progress status of a specific phase (portal milestone).
 */
router.patch(
  '/:enrollmentId/milestones/:phaseId',
  authenticate,
  [body('status').isIn(['completed', 'in_progress', 'pending']).withMessage('Invalid status')],
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return void res.status(422).json({ errors: errors.array() });

    const { enrollmentId, phaseId } = req.params;
    const { status } = req.body as { status: string };

    const enrollment = await prisma.programEnrollment.findFirst({
      where: { id: enrollmentId },
      include: { sme: { select: { userId: true } } },
    });
    if (!enrollment) return void res.status(404).json({ error: 'Enrollment not found' });

    const isOwner = enrollment.sme.userId === req.user!.id;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role);
    if (!isOwner && !isAdmin) return void res.status(403).json({ error: 'Forbidden' });

    const phaseStatusMap: Record<string, 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'> = {
      pending:     'NOT_STARTED',
      in_progress: 'IN_PROGRESS',
      completed:   'COMPLETED',
    };

    const phaseStatus = phaseStatusMap[status] ?? 'NOT_STARTED';

    const updated = await prisma.phaseProgress.upsert({
      where:  { enrollmentId_phaseId: { enrollmentId, phaseId } },
      create: { enrollmentId, phaseId, status: phaseStatus, progress: phaseStatus === 'COMPLETED' ? 100 : 0 },
      update: { status: phaseStatus, progress: phaseStatus === 'COMPLETED' ? 100 : undefined },
    });

    await invalidateCache(`milestones:GET:/api/programs/${enrollmentId}*`);

    res.json({ phaseProgress: updated });
  })
);

export default router;