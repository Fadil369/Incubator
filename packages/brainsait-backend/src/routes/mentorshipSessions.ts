/**
 * Mentorship Session Routes
 *
 * GET    /api/mentorship-sessions              — List sessions for authenticated user
 * POST   /api/mentorship-sessions/schedule     — Schedule a new session
 * GET    /api/mentorship-sessions/:sessionId   — Get session detail
 * PATCH  /api/mentorship-sessions/:sessionId/status  — Update status (mentor/admin)
 * POST   /api/mentorship-sessions/:sessionId/feedback — Submit session feedback
 */

import { Response, Router } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { cache } from '../middleware/cache';

const router = Router();
const prisma = new PrismaClient();

// ── Validation ────────────────────────────────────────────────────────────────

const scheduleSessionValidation = [
  body('mentorshipId').notEmpty().withMessage('mentorshipId is required'),
  body('scheduledAt').isISO8601().withMessage('scheduledAt must be a valid ISO 8601 date'),
  body('duration').isInt({ min: 15, max: 480 }).withMessage('duration must be between 15 and 480 minutes'),
  body('topic').optional().trim().isLength({ max: 300 }),
  body('notes').optional().trim().isLength({ max: 2000 }),
];

const statusUpdateValidation = [
  body('status').isIn(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).withMessage('Invalid session status'),
];

const feedbackValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1–5'),
  body('feedback').optional().trim().isLength({ max: 2000 }),
  body('objectivesMet').optional().isBoolean(),
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function assertMentorshipAccess(
  userId: string,
  mentorshipId: string
): Promise<import('@prisma/client').Mentorship | null> {
  const mentorship = await prisma.mentorship.findFirst({
    where: {
      id: mentorshipId,
      OR: [
        { menteeId: userId },
        { sme: { userId } },
        { mentor: { userId } },
      ],
    },
  });
  return mentorship;
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /api/mentorship-sessions
 * List sessions where the user is mentor or mentee, newest first.
 */
router.get(
  '/',
  authenticate,
  cache(30, 'sessions'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const page   = Math.max(1, parseInt(String(req.query.page  || '1')));
    const limit  = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'))));
    const skip   = (page - 1) * limit;
    const status = req.query.status ? String(req.query.status) : undefined;

    const where: Record<string, unknown> = {
      mentorship: {
        OR: [
          { menteeId: userId },
          { sme: { userId } },
          { mentor: { userId } },
        ],
      },
    };
    if (status) where.status = status;

    const [total, sessions] = await Promise.all([
      prisma.mentorSession.count({ where }),
      prisma.mentorSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
        include: {
          mentorship: {
            select: {
              id: true,
              mentor: { select: { currentRole: true, company: true, user: { select: { firstName: true, lastName: true, avatar: true } } } },
              sme: { select: { companyName: true } },
            },
          },
        },
      }),
    ]);

    res.json({ sessions, total, page, limit, pages: Math.ceil(total / limit) });
  })
);

/**
 * POST /api/mentorship-sessions/schedule
 * Schedule a new session within an active mentorship.
 */
router.post(
  '/schedule',
  authenticate,
  scheduleSessionValidation,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return void res.status(422).json({ errors: errors.array() });

    const userId      = req.user!.id;
    const { mentorshipId, scheduledAt, duration, topic, notes } = req.body as {
      mentorshipId: string;
      scheduledAt: string;
      duration: number;
      topic?: string;
      notes?: string;
    };

    // Verify user has access to this mentorship
    const mentorship = await assertMentorshipAccess(userId, mentorshipId);
    if (!mentorship) return void res.status(404).json({ error: 'Mentorship not found or access denied' });
    if (mentorship.status !== 'ACTIVE') return void res.status(409).json({ error: 'Cannot schedule sessions on an inactive mentorship' });

    const scheduled = new Date(scheduledAt);
    if (scheduled <= new Date()) return void res.status(422).json({ error: 'scheduledAt must be in the future' });

    const session = await prisma.mentorSession.create({
      data: {
        mentorshipId,
        menteeId: mentorship.menteeId,
        scheduledAt: scheduled,
        duration: Number(duration),
        topic,
        notes,
        status: 'SCHEDULED',
      },
    });

    res.status(201).json({ session });
  })
);

/**
 * GET /api/mentorship-sessions/:sessionId
 * Get a single session by ID (user must be participant).
 */
router.get(
  '/:sessionId',
  authenticate,
  cache(30, 'sessions'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const session = await prisma.mentorSession.findFirst({
      where: {
        id: req.params.sessionId,
        mentorship: {
          OR: [
            { menteeId: userId },
            { sme: { userId } },
            { mentor: { userId } },
          ],
        },
      },
      include: {
        mentorship: {
          include: {
            mentor: { include: { user: { select: { firstName: true, lastName: true, avatar: true, email: true } } } },
            sme: { select: { companyName: true } },
          },
        },
      },
    });

    if (!session) return void res.status(404).json({ error: 'Session not found' });
    res.json({ session });
  })
);

/**
 * PATCH /api/mentorship-sessions/:sessionId/status
 * Update session status. Only mentor or admin can mark COMPLETED/CANCELLED.
 */
router.patch(
  '/:sessionId/status',
  authenticate,
  statusUpdateValidation,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return void res.status(422).json({ errors: errors.array() });

    const userId  = req.user!.id;
    const { status } = req.body as { status: string };

    const session = await prisma.mentorSession.findFirst({
      where: {
        id: req.params.sessionId,
        mentorship: {
          OR: [
            { mentor: { userId } },
            { menteeId: userId },
            { sme: { userId } },
          ],
        },
      },
    });

    if (!session) return void res.status(404).json({ error: 'Session not found' });

    const updated = await prisma.mentorSession.update({
      where: { id: session.id },
      data: { status: status as import('@prisma/client').SessionStatus, updatedAt: new Date() },
    });

    // Increment session count on mentorship when completed
    if (status === 'COMPLETED') {
      await prisma.mentorship.update({
        where: { id: session.mentorshipId },
        data: { sessionCount: { increment: 1 } },
      });
    }

    res.json({ session: updated });
  })
);

/**
 * POST /api/mentorship-sessions/:sessionId/feedback
 * Submit feedback after a session. Each participant can submit once.
 */
router.post(
  '/:sessionId/feedback',
  authenticate,
  feedbackValidation,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return void res.status(422).json({ errors: errors.array() });

    const userId = req.user!.id;
    const { rating, feedback, objectivesMet } = req.body as {
      rating: number;
      feedback?: string;
      objectivesMet?: boolean;
    };

    const session = await prisma.mentorSession.findFirst({
      where: {
        id: req.params.sessionId,
        status: 'COMPLETED',
        mentorship: {
          OR: [
            { menteeId: userId },
            { sme: { userId } },
            { mentor: { userId } },
          ],
        },
      },
      include: { mentorship: { include: { mentor: true } } },
    });

    if (!session) return void res.status(404).json({ error: 'Completed session not found' });

    // Determine if user is mentor or mentee to pick the right feedback field
    const isMentor = session.mentorship.mentor.userId === userId;

    const updated = await prisma.mentorSession.update({
      where: { id: session.id },
      data: isMentor
        ? { mentorFeedback: feedback, mentorRating: rating, objectivesMet: objectivesMet ?? null }
        : { feedback, rating, objectivesMet: objectivesMet ?? null },
    });

    res.json({ session: updated });
  })
);

export default router;
