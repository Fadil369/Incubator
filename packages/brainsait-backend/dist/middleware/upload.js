import multer, { MulterError } from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
// Ensure upload directories exist
const uploadDirs = {
    documents: path.join(process.cwd(), 'uploads', 'documents'),
    avatars: path.join(process.cwd(), 'uploads', 'avatars'),
    certificates: path.join(process.cwd(), 'uploads', 'certificates'),
    temp: path.join(process.cwd(), 'uploads', 'temp'),
};
// Create upload directories if they don't exist
Object.values(uploadDirs).forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});
// File type validators
const isImage = (mimetype) => {
    return ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(mimetype);
};
const isDocument = (mimetype) => {
    return [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ].includes(mimetype);
};
const isAllowedFile = (mimetype) => {
    return config.uploads.allowedMimeTypes.includes(mimetype);
};
// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = uploadDirs.temp;
        // Determine upload path based on field name or custom path
        if (req.body.uploadType) {
            switch (req.body.uploadType) {
                case 'avatar':
                    uploadPath = uploadDirs.avatars;
                    break;
                case 'document':
                    uploadPath = uploadDirs.documents;
                    break;
                case 'certificate':
                    uploadPath = uploadDirs.certificates;
                    break;
                default:
                    uploadPath = uploadDirs.temp;
            }
        }
        else {
            // Fallback based on field name
            if (file.fieldname.includes('avatar')) {
                uploadPath = uploadDirs.avatars;
            }
            else if (file.fieldname.includes('document') || file.fieldname.includes('file')) {
                uploadPath = uploadDirs.documents;
            }
            else if (file.fieldname.includes('certificate')) {
                uploadPath = uploadDirs.certificates;
            }
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp and random string
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const extension = path.extname(file.originalname);
        const filename = `${timestamp}-${randomString}${extension}`;
        cb(null, filename);
    },
});
// File filter
const fileFilter = (req, file, cb) => {
    // Check if file type is allowed
    if (!isAllowedFile(file.mimetype)) {
        const error = new Error(`File type ${file.mimetype} is not allowed`);
        error.code = 'INVALID_FILE_TYPE';
        return cb(error, false);
    }
    // Additional validation based on upload type
    if (req.body.uploadType === 'avatar' && !isImage(file.mimetype)) {
        const error = new Error('Avatar must be an image file');
        error.code = 'INVALID_AVATAR_TYPE';
        return cb(error, false);
    }
    if (req.body.uploadType === 'document' && !isDocument(file.mimetype) && !isImage(file.mimetype)) {
        const error = new Error('Document must be a PDF, Word document, Excel file, or image');
        error.code = 'INVALID_DOCUMENT_TYPE';
        return cb(error, false);
    }
    cb(null, true);
};
// Base multer configuration
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: config.uploads.maxFileSize,
        files: 10, // Maximum 10 files per request
    },
});
/**
 * Middleware for handling single file upload
 */
export const uploadSingle = (fieldName) => {
    return (req, res, next) => {
        const uploadHandler = upload.single(fieldName);
        uploadHandler(req, res, (err) => {
            if (err) {
                return handleUploadError(err, req, res, next);
            }
            next();
        });
    };
};
/**
 * Middleware for handling multiple file upload
 */
export const uploadMultiple = (fieldName, maxCount = 5) => {
    return (req, res, next) => {
        const uploadHandler = upload.array(fieldName, maxCount);
        uploadHandler(req, res, (err) => {
            if (err) {
                return handleUploadError(err, req, res, next);
            }
            next();
        });
    };
};
/**
 * Middleware for handling multiple fields with file uploads
 */
export const uploadFields = (fields) => {
    return (req, res, next) => {
        const uploadHandler = upload.fields(fields);
        uploadHandler(req, res, (err) => {
            if (err) {
                return handleUploadError(err, req, res, next);
            }
            next();
        });
    };
};
/**
 * Handle upload errors
 */
const handleUploadError = (err, req, res, next) => {
    logger.error('File upload error:', err);
    if (err instanceof MulterError) {
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'File size too large',
                        details: `Maximum file size is ${config.uploads.maxFileSize / (1024 * 1024)}MB`,
                    },
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Too many files',
                        details: 'Maximum number of files exceeded',
                    },
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Unexpected file field',
                        details: 'File field name is not allowed',
                    },
                });
            default:
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'File upload error',
                        details: err.message,
                    },
                });
        }
    }
    // Custom errors
    if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Invalid file type',
                details: err.message,
            },
        });
    }
    if (err.code === 'INVALID_AVATAR_TYPE') {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Invalid avatar file type',
                details: err.message,
            },
        });
    }
    if (err.code === 'INVALID_DOCUMENT_TYPE') {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Invalid document file type',
                details: err.message,
            },
        });
    }
    // Generic error
    res.status(500).json({
        success: false,
        error: {
            message: 'Internal server error during file upload',
        },
    });
};
/**
 * Utility function to get file URL
 */
export const getFileUrl = (filename, type = 'documents') => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    return `${baseUrl}/uploads/${type}/${filename}`;
};
/**
 * Utility function to delete file
 */
export const deleteFile = async (filepath) => {
    try {
        if (fs.existsSync(filepath)) {
            await fs.promises.unlink(filepath);
            logger.info(`File deleted: ${filepath}`);
        }
    }
    catch (error) {
        logger.error(`Error deleting file: ${filepath}`, error);
    }
};
/**
 * Utility function to move file from temp to permanent location
 */
export const moveFile = async (sourcePath, destinationPath) => {
    try {
        // Ensure destination directory exists
        const destinationDir = path.dirname(destinationPath);
        if (!fs.existsSync(destinationDir)) {
            fs.mkdirSync(destinationDir, { recursive: true });
        }
        await fs.promises.rename(sourcePath, destinationPath);
        logger.info(`File moved from ${sourcePath} to ${destinationPath}`);
    }
    catch (error) {
        logger.error(`Error moving file from ${sourcePath} to ${destinationPath}`, error);
        throw error;
    }
};
/**
 * Cleanup old temporary files (should be run periodically)
 */
export const cleanupTempFiles = async () => {
    try {
        const tempDir = uploadDirs.temp;
        const files = await fs.promises.readdir(tempDir);
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        for (const file of files) {
            const filePath = path.join(tempDir, file);
            const stats = await fs.promises.stat(filePath);
            if (now - stats.mtime.getTime() > maxAge) {
                await deleteFile(filePath);
            }
        }
        logger.info(`Cleaned up temporary files older than 24 hours`);
    }
    catch (error) {
        logger.error('Error cleaning up temporary files:', error);
    }
};
/**
 * Validate file requirements for SME documents
 */
export const validateSMEDocuments = (files) => {
    const errors = [];
    const requiredTypes = ['business_license', 'tax_certificate', 'company_profile'];
    const uploadedTypes = files.map(file => file.fieldname);
    // Check if all required document types are present
    for (const type of requiredTypes) {
        if (!uploadedTypes.includes(type)) {
            errors.push(`Missing required document: ${type.replace('_', ' ')}`);
        }
    }
    // Check file sizes and types
    for (const file of files) {
        if (file.size > config.uploads.maxFileSize) {
            errors.push(`File ${file.originalname} is too large`);
        }
        if (!isAllowedFile(file.mimetype)) {
            errors.push(`File ${file.originalname} has invalid type`);
        }
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
};
// Export upload directories for reference
export { uploadDirs };
//# sourceMappingURL=upload.js.map