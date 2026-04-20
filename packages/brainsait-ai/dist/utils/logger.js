import winston from 'winston';
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};
winston.addColors(logColors);
const format = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.errors({ stack: true }), winston.format.splat(), winston.format.json(), winston.format.colorize({ all: true }), winston.format.printf((info) => {
    const { timestamp, level, message, ...metadata } = info;
    let msg = `${timestamp} [AI-SERVICE] ${level}: ${message}`;
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
}));
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels: logLevels,
    format,
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: 'logs/ai-service-error.log',
            level: 'error',
        }),
        new winston.transports.File({
            filename: 'logs/ai-service-combined.log',
        }),
    ],
});
//# sourceMappingURL=logger.js.map