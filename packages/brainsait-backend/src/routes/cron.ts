/**
 * Cron job endpoints — secured by X-Cron-Secret header.
 * Intended to be called by Cloudflare Workers Cron Triggers or an external scheduler.
 *
 * Routes:
 *   POST /api/cron/mentor-reminders      — weekly session reminder list
 *   POST /api/cron/milestone-deadlines   — notify upcoming/overdue phase milestones
 *   POST /api/cron/cleanup               — purge stale sessions + password resets
 */

import { Router, type Request, type Response } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();
const prisma = new PrismaClient();

function requireCronSecret(req: Request, res: Response, next: () => void): void {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    res.status(503).json({ error: "Cron jobs not configured (CRON_SECRET not set)" });
    return;
  }
  if (req.headers["x-cron-secret"] !== secret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

router.post("/mentor-reminders", requireCronSecret, asyncHandler(async (_req: Request, res: Response) => {
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const staleMentorships = await prisma.mentorship.findMany({
    where: { status: "ACTIVE", sessions: { none: { scheduledAt: { gte: cutoff } } } },
    include: {
      mentor: { include: { user: { select: { email: true, firstName: true, lastName: true } } } },
      sme: { select: { companyName: true } },
    },
  });
  const reminders = staleMentorships.map((m) => ({
    mentorEmail: m.mentor.user.email,
    mentorName: `${m.mentor.user.firstName} ${m.mentor.user.lastName}`.trim(),
    smeCompany: m.sme.companyName,
    mentorshipId: m.id,
    sessionCount: m.sessionCount,
  }));
  res.json({ job: "mentor-reminders", processed: reminders.length, reminders, timestamp: new Date().toISOString() });
}));

router.post("/milestone-deadlines", requireCronSecret, asyncHandler(async (_req: Request, res: Response) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const stalePhases = await prisma.phaseProgress.findMany({
    where: { status: { in: ["NOT_STARTED", "IN_PROGRESS"] }, updatedAt: { lt: thirtyDaysAgo }, enrollment: { status: "ACTIVE" } },
    include: {
      phase: { select: { name: true, order: true } },
      enrollment: { include: { sme: { include: { user: { select: { email: true } } } }, program: { select: { title: true } } } },
    },
  });
  const notifications = stalePhases.map((pp) => ({
    enrollmentId: pp.enrollmentId,
    smeEmail: pp.enrollment.sme.user.email,
    programTitle: pp.enrollment.program.title,
    phaseName: pp.phase.name,
    phaseOrder: pp.phase.order,
    status: pp.status,
    lastUpdated: pp.updatedAt.toISOString(),
  }));
  res.json({ job: "milestone-deadlines", processed: notifications.length, notifications, timestamp: new Date().toISOString() });
}));

router.post("/cleanup", requireCronSecret, asyncHandler(async (_req: Request, res: Response) => {
  const now = new Date();
  const [sessionsDeleted, passwordResetsDeleted] = await Promise.all([
    prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.passwordReset.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]);
  res.json({
    job: "cleanup",
    deletedSessions: sessionsDeleted.count,
    deletedPasswordResets: passwordResetsDeleted.count,
    timestamp: new Date().toISOString(),
  });
}));

export default router;
