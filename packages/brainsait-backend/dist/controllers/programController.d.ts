import { Request, Response } from 'express';
/**
 * Get all programs with filtering and pagination
 */
export declare const getPrograms: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get program by ID
 */
export declare const getProgramById: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Create new program (Admin only)
 */
export declare const createProgram: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update program (Admin only)
 */
export declare const updateProgram: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Delete program (Admin only)
 */
export declare const deleteProgram: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Enroll SME in program
 */
export declare const enrollInProgram: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get user's program enrollments
 */
export declare const getMyEnrollments: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update enrollment status (Admin only)
 */
export declare const updateEnrollmentStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update enrollment progress
 */
export declare const updateEnrollmentProgress: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get program statistics (Admin only)
 */
export declare const getProgramStatistics: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=programController.d.ts.map