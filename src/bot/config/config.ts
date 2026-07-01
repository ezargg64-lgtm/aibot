import dotenv from 'dotenv';
dotenv.config();

export const config = {
    gemini: {
        apiKey: process.env.GEMINI_API_KEY || '',
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '2048', 10),
        temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
    },
    bot: {
        name: process.env.BOT_NAME || 'GeminiBot',
        prefix: process.env.BOT_PREFIX || '!',
        adminNumber: process.env.ADMIN_NUMBER || '',
    },
    upload: {
        maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10),
        allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,application/zip,application/x-zip-compressed,application/x-rar-compressed').split(','),
        timeoutMs: parseInt(process.env.UPLOAD_TIMEOUT_MS || '30000', 10),
    },
    database: {
        path: process.env.DB_PATH || './database/chat_history.db',
        maxHistoryPerUser: parseInt(process.env.MAX_HISTORY_PER_USER || '50', 10),
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || './logs/bot.log',
    },
    paths: {
        uploads: {
            images: './uploads/images',
            documents: './uploads/documents',
            temp: './uploads/temp',
        },
        auth: './auth_info',
    }
};
