import { Request, Response, NextFunction } from 'express';
declare const uploadDirs: {
    documents: string;
    avatars: string;
    certificates: string;
    temp: string;
};
/**
 * Middleware for handling single file upload
 */
export declare const uploadSingle: (fieldName: string) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware for handling multiple file upload
 */
export declare const uploadMultiple: (fieldName: string, maxCount?: number) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware for handling multiple fields with file uploads
 */
export declare const uploadFields: (fields: {
    name: string;
    maxCount?: number;
}[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Utility function to get file URL
 */
export declare const getFileUrl: (filename: string, type?: "documents" | "avatars" | "certificates") => string;
/**
 * Utility function to delete file
 */
export declare const deleteFile: (filepath: string) => Promise<void>;
/**
 * Utility function to move file from temp to permanent location
 */
export declare const moveFile: (sourcePath: string, destinationPath: string) => Promise<void>;
/**
 * Cleanup old temporary files (should be run periodically)
 */
export declare const cleanupTempFiles: () => Promise<void>;
/**
 * Validate file requirements for SME documents
 */
export declare const validateSMEDocuments: (files: Express.Multer.File[]) => {
    isValid: boolean;
    errors: string[];
};
export { uploadDirs };
//# sourceMappingURL=upload.d.ts.map