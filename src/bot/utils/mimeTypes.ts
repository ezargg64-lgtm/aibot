export const MIME_TYPES: Record<string, { ext: string[], category: string, maxSizeMB: number }> = {
    // Images
    'image/jpeg': { ext: ['.jpg', '.jpeg'], category: 'image', maxSizeMB: 20 },
    'image/png': { ext: ['.png'], category: 'image', maxSizeMB: 20 },
    'image/webp': { ext: ['.webp'], category: 'image', maxSizeMB: 20 },
    'image/gif': { ext: ['.gif'], category: 'image', maxSizeMB: 20 },

    // Microsoft Office Documents
    'application/msword': { ext: ['.doc'], category: 'document', maxSizeMB: 50 },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { 
        ext: ['.docx'], category: 'document', maxSizeMB: 50 
    },
    'application/vnd.ms-excel': { ext: ['.xls'], category: 'document', maxSizeMB: 50 },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { 
        ext: ['.xlsx'], category: 'document', maxSizeMB: 50 
    },
    'application/vnd.ms-powerpoint': { ext: ['.ppt'], category: 'document', maxSizeMB: 50 },
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': { 
        ext: ['.pptx'], category: 'document', maxSizeMB: 50 
    },

    // PDF and Text
    'application/pdf': { ext: ['.pdf'], category: 'document', maxSizeMB: 50 },
    'text/plain': { ext: ['.txt'], category: 'text', maxSizeMB: 10 },
    'text/csv': { ext: ['.csv'], category: 'text', maxSizeMB: 10 },
    'text/markdown': { ext: ['.md'], category: 'text', maxSizeMB: 10 },
    'text/html': { ext: ['.html', '.htm'], category: 'text', maxSizeMB: 10 },
    'application/json': { ext: ['.json'], category: 'text', maxSizeMB: 10 },
    'application/xml': { ext: ['.xml'], category: 'text', maxSizeMB: 10 },

    // Archives
    'application/zip': { ext: ['.zip'], category: 'archive', maxSizeMB: 50 },
    'application/x-zip-compressed': { ext: ['.zip'], category: 'archive', maxSizeMB: 50 },
    'application/x-rar-compressed': { ext: ['.rar'], category: 'archive', maxSizeMB: 50 },
    'application/x-7z-compressed': { ext: ['.7z'], category: 'archive', maxSizeMB: 50 },
    'application/gzip': { ext: ['.gz'], category: 'archive', maxSizeMB: 50 },
    'application/x-tar': { ext: ['.tar'], category: 'archive', maxSizeMB: 50 },

    // Audio
    'audio/mpeg': { ext: ['.mp3'], category: 'audio', maxSizeMB: 30 },
    'audio/wav': { ext: ['.wav'], category: 'audio', maxSizeMB: 30 },
    'audio/ogg': { ext: ['.ogg'], category: 'audio', maxSizeMB: 30 },

    // Video
    'video/mp4': { ext: ['.mp4'], category: 'video', maxSizeMB: 100 },
    'video/quicktime': { ext: ['.mov'], category: 'video', maxSizeMB: 100 },
};

export function isAllowedMimeType(mimeType: string) {
    return MIME_TYPES.hasOwnProperty(mimeType);
}

export function getFileCategory(mimeType: string) {
    return MIME_TYPES[mimeType]?.category || 'unknown';
}

export function getValidExtensions(mimeType: string) {
    return MIME_TYPES[mimeType]?.ext || [];
}

export function getMaxFileSize(mimeType: string) {
    const mb = MIME_TYPES[mimeType]?.maxSizeMB || 50;
    return mb * 1024 * 1024;
}

export function getFileTypeDescription(mimeType: string) {
    const descriptions: Record<string, string> = {
        'image': '🖼️ Gambar',
        'document': '📄 Dokumen',
        'text': '📝 Teks',
        'archive': '📦 Arsip',
        'audio': '🎵 Audio',
        'video': '🎬 Video',
        'unknown': '📎 File'
    };
    return descriptions[getFileCategory(mimeType)] || descriptions['unknown'];
}
