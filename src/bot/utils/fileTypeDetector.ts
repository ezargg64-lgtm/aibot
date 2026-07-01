import * as mimeTypes from './mimeTypes';
import path from 'path';
import fs from 'fs';
import * as pdfParseModule from 'pdf-parse';
const pdfParse = (pdfParseModule as any).default || pdfParseModule;
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import AdmZip from 'adm-zip';

export class FileTypeDetector {
    static validateFile(mimeType: string, fileSize: number, fileName: string) {
        const errors: string[] = [];

        if (!mimeTypes.isAllowedMimeType(mimeType)) {
            errors.push(`Tipe file "${mimeType}" tidak diizinkan.`);
            return { valid: false, errors, category: 'unknown' };
        }

        const maxSize = mimeTypes.getMaxFileSize(mimeType);
        if (fileSize > maxSize) {
            errors.push(`Ukuran file terlalu besar. Maksimum: ${maxSize / (1024*1024)}MB`);
        }

        const ext = path.extname(fileName).toLowerCase();
        const validExts = mimeTypes.getValidExtensions(mimeType);
        if (validExts.length > 0 && !validExts.includes(ext)) {
            errors.push(`Ekstensi file "${ext}" tidak cocok dengan tipe MIME "${mimeType}".`);
        }

        return {
            valid: errors.length === 0,
            errors,
            category: mimeTypes.getFileCategory(mimeType),
            description: mimeTypes.getFileTypeDescription(mimeType),
            maxSize,
            extension: ext,
        };
    }

    static generateUniqueFileName(originalName: string, userId: string) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const ext = path.extname(originalName);
        const baseName = path.basename(originalName, ext);
        const sanitized = baseName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
        return `${userId}_${timestamp}_${random}_${sanitized}${ext}`;
    }

    static getStorageFolder(category: string) {
        const folders: Record<string, string> = {
            image: './uploads/images',
            document: './uploads/documents',
            text: './uploads/documents',
            archive: './uploads/documents',
            audio: './uploads/temp',
            video: './uploads/temp',
            unknown: './uploads/temp',
        };
        return folders[category] || './uploads/temp';
    }

    static async extractTextFromFile(filePath: string, mimeType: string) {
        const category = mimeTypes.getFileCategory(mimeType);

        try {
            switch (category) {
                case 'text':
                    return await this.readTextFile(filePath);
                case 'document':
                    return await this.extractDocumentText(filePath);
                case 'archive':
                    return await this.listArchiveContents(filePath);
                default:
                    return null;
            }
        } catch (error: any) {
            return `[Gagal mengekstrak konten: ${error.message}]`;
        }
    }

    static async readTextFile(filePath: string) {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        return content.substring(0, 10000);
    }

    static async extractDocumentText(filePath: string) {
        const ext = path.extname(filePath).toLowerCase();

        if (ext === '.pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            return data.text.substring(0, 10000);
        }

        if (ext === '.docx') {
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value.substring(0, 10000);
        }

        if (ext === '.xlsx' || ext === '.xls') {
            const workbook = xlsx.readFile(filePath);
            let text = '';
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                text += `--- Sheet: ${sheetName} ---\n`;
                text += xlsx.utils.sheet_to_csv(sheet) + '\n';
            });
            return text.substring(0, 10000);
        }

        return `[Dokumen ${ext} terdeteksi. Konten akan dianalisis oleh AI.]`;
    }

    static async listArchiveContents(filePath: string) {
        const zip = new AdmZip(filePath);
        const entries = zip.getEntries();
        let text = `Isi arsip (${entries.length} file):\n`;
        entries.slice(0, 50).forEach(entry => {
            text += `- ${entry.entryName} (${(entry.header.size / 1024).toFixed(2)} KB)\n`;
        });
        if (entries.length > 50) {
            text += `... dan ${entries.length - 50} file lainnya\n`;
        }
        return text;
    }
}
