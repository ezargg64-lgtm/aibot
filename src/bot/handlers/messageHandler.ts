import { downloadMediaMessage, WAMessage, WASocket } from '@whiskeysockets/baileys';
import { geminiService } from '../services/geminiService';
import { FileTypeDetector } from '../utils/fileTypeDetector';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';

export async function handleIncomingMessage(sock: WASocket, msg: WAMessage, io: Server) {
    const remoteJid = msg.key.remoteJid;
    if (!remoteJid) return;

    if (msg.key.fromMe) return;

    const messageContent = msg.message;
    if (!messageContent) return;

    const text = messageContent.conversation || 
                 messageContent.extendedTextMessage?.text || 
                 messageContent.imageMessage?.caption || 
                 messageContent.documentMessage?.caption || '';

    if (remoteJid.endsWith('@g.us')) {
        const botId = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
        const mentionedJid = messageContent.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const isMentioned = botId && mentionedJid.includes(botId);
        const hasCommand = text.toLowerCase().startsWith('.ai');
        
        if (!isMentioned && !hasCommand) {
            return;
        }
    }

    if (!text && !messageContent.imageMessage && !messageContent.documentMessage) return;

    io.emit('log', `Received message from ${remoteJid}: ${text.substring(0, 50)}...`);

    try {
        if (messageContent.imageMessage) {
            io.emit('log', `Processing image from ${remoteJid}...`);
            const buffer = await downloadMediaMessage(msg, 'buffer', { }, { reuploadRequest: sock.updateMediaMessage, logger: console as any });
            const tmpPath = path.join(FileTypeDetector.getStorageFolder('image'), `tmp_${Date.now()}.jpg`);
            if (!fs.existsSync(path.dirname(tmpPath))) {
                fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
            }
            fs.writeFileSync(tmpPath, buffer as Buffer);

            const result = await geminiService.analyzeImage(tmpPath, text, messageContent.imageMessage.mimetype || 'image/jpeg');
            
            if (result.success && result.text) {
                await sock.sendMessage(remoteJid, { text: result.text }, { quoted: msg });
            } else {
                await sock.sendMessage(remoteJid, { text: `Maaf, terjadi kesalahan saat memproses gambar: ${result.error}` }, { quoted: msg });
            }
            fs.unlinkSync(tmpPath);

        } else if (messageContent.documentMessage) {
            io.emit('log', `Processing document from ${remoteJid}...`);
            const mimeType = messageContent.documentMessage.mimetype || '';
            const fileName = messageContent.documentMessage.fileName || 'document';
            const buffer = await downloadMediaMessage(msg, 'buffer', { }, { reuploadRequest: sock.updateMediaMessage, logger: console as any });
            
            const category = FileTypeDetector.validateFile(mimeType, (buffer as Buffer).length, fileName).category;
            const tmpPath = path.join(FileTypeDetector.getStorageFolder(category), `tmp_${Date.now()}_${fileName}`);
            
            if (!fs.existsSync(path.dirname(tmpPath))) {
                fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
            }
            fs.writeFileSync(tmpPath, buffer as Buffer);

            const extractedText = await FileTypeDetector.extractTextFromFile(tmpPath, mimeType);
            
            let result;
            if (extractedText) {
                result = await geminiService.analyzeFileWithExtraction(tmpPath, mimeType, text, extractedText);
            } else {
                result = await geminiService.analyzeFile(tmpPath, mimeType, text);
            }

            if (result.success && result.text) {
                await sock.sendMessage(remoteJid, { text: result.text }, { quoted: msg });
            } else {
                await sock.sendMessage(remoteJid, { text: `Maaf, terjadi kesalahan saat memproses dokumen: ${result.error}` }, { quoted: msg });
            }
            fs.unlinkSync(tmpPath);

        } else if (text) {
            io.emit('log', `Processing text from ${remoteJid}...`);
            const result = await geminiService.sendTextMessage(text);
            if (result.success && result.text) {
                await sock.sendMessage(remoteJid, { text: result.text }, { quoted: msg });
            } else {
                await sock.sendMessage(remoteJid, { text: `Maaf, terjadi kesalahan: ${result.error}` }, { quoted: msg });
            }
        }
    } catch (err: any) {
        console.error('Error handling message:', err);
        io.emit('log', `Error handling message: ${err.message}`);
    }
}
