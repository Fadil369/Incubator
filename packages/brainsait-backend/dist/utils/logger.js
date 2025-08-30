"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerStream = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const environment_1 = require("../config/environment");
// Define log levels
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
// Define log colors
const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
winston_1.default.addColors(logColors);
// Define log format
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf((info) => {
    if (info.stack) {
        return `${info.timestamp} ${info.level}: ${info.message}\n${info.stack}`;
    }
    return `${info.timestamp} ${info.level}: ${info.message}`;
}));
// Define transports
const transports = [
    new winston_1.default.transports.Console(),
];
// Add file transports in production
if (environment_1.config.server.nodeEnv === 'production') {
    transports.push(new winston_1.default.transports.File({
        filename: 'logs/error.log',
        level: 'error',
    }), new winston_1.default.transports.File({
        filename: 'logs/combined.log',
    }));
}
// Create logger instance
exports.logger = winston_1.default.createLogger({
    level: environment_1.config.server.nodeEnv === 'development' ? 'debug' : 'info',
    levels: logLevels,
    format: logFormat,
    transports,
    exitOnError: false,
});
// Stream for Morgan HTTP logger
exports.loggerStream = {
    write: (message) => {
        exports.logger.http(message.trim());
    },
};
//# sourceMappingURL=logger.js.map