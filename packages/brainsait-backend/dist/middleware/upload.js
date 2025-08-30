"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDirs = exports.validateSMEDocuments = exports.cleanupTempFiles = exports.moveFile = exports.deleteFile = exports.getFileUrl = exports.uploadFields = exports.uploadMultiple = exports.uploadSingle = void 0;
const multer_1 = __importStar(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const environment_1 = require("../config/environment");
const logger_1 = require("../utils/logger");
// Ensure upload directories exist
const uploadDirs = {
    documents: path_1.default.join(process.cwd(), 'uploads', 'documents'),
    avatars: path_1.default.join(process.cwd(), 'uploads', 'avatars'),
    certificates: path_1.default.join(process.cwd(), 'uploads', 'certificates'),
    temp: path_1.default.join(process.cwd(), 'uploads', 'temp'),
};
exports.uploadDirs = uploadDirs;
// Create upload directories if they don't exist
Object.values(uploadDirs).forEach(dir => {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
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
    return environment_1.config.uploads.allowedMimeTypes.includes(mimetype);
};
// Storage configuration
const storage = multer_1.default.diskStorage({
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
        const extension = path_1.default.extname(file.originalname);
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
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: environment_1.config.uploads.maxFileSize,
        files: 10, // Maximum 10 files per request
    },
});
/**
 * Middleware for handling single file upload
 */
const uploadSingle = (fieldName) => {
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
exports.uploadSingle = uploadSingle;
/**
 * Middleware for handling multiple file upload
 */
const uploadMultiple = (fieldName, maxCount = 5) => {
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
exports.uploadMultiple = uploadMultiple;
/**
 * Middleware for handling multiple fields with file uploads
 */
const uploadFields = (fields) => {
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
exports.uploadFields = uploadFields;
/**
 * Handle upload errors
 */
const handleUploadError = (err, req, res, next) => {
    logger_1.logger.error('File upload error:', err);
    if (err instanceof multer_1.MulterError) {
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'File size too large',
                        details: `Maximum file size is ${environment_1.config.uploads.maxFileSize / (1024 * 1024)}MB`,
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
const getFileUrl = (filename, type = 'documents') => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    return `${baseUrl}/uploads/${type}/${filename}`;
};
exports.getFileUrl = getFileUrl;
/**
 * Utility function to delete file
 */
const deleteFile = async (filepath) => {
    try {
        if (fs_1.default.existsSync(filepath)) {
            await fs_1.default.promises.unlink(filepath);
            logger_1.logger.info(`File deleted: ${filepath}`);
        }
    }
    catch (error) {
        logger_1.logger.error(`Error deleting file: ${filepath}`, error);
    }
};
exports.deleteFile = deleteFile;
/**
 * Utility function to move file from temp to permanent location
 */
const moveFile = async (sourcePath, destinationPath) => {
    try {
        // Ensure destination directory exists
        const destinationDir = path_1.default.dirname(destinationPath);
        if (!fs_1.default.existsSync(destinationDir)) {
            fs_1.default.mkdirSync(destinationDir, { recursive: true });
        }
        await fs_1.default.promises.rename(sourcePath, destinationPath);
        logger_1.logger.info(`File moved from ${sourcePath} to ${destinationPath}`);
    }
    catch (error) {
        logger_1.logger.error(`Error moving file from ${sourcePath} to ${destinationPath}`, error);
        throw error;
    }
};
exports.moveFile = moveFile;
/**
 * Cleanup old temporary files (should be run periodically)
 */
const cleanupTempFiles = async () => {
    try {
        const tempDir = uploadDirs.temp;
        const files = await fs_1.default.promises.readdir(tempDir);
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        for (const file of files) {
            const filePath = path_1.default.join(tempDir, file);
            const stats = await fs_1.default.promises.stat(filePath);
            if (now - stats.mtime.getTime() > maxAge) {
                await (0, exports.deleteFile)(filePath);
            }
        }
        logger_1.logger.info(`Cleaned up temporary files older than 24 hours`);
    }
    catch (error) {
        logger_1.logger.error('Error cleaning up temporary files:', error);
    }
};
exports.cleanupTempFiles = cleanupTempFiles;
/**
 * Validate file requirements for SME documents
 */
const validateSMEDocuments = (files) => {
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
        if (file.size > environment_1.config.uploads.maxFileSize) {
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
exports.validateSMEDocuments = validateSMEDocuments;
//# sourceMappingURL=upload.js.map