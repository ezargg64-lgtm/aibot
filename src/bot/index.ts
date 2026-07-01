import { makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { Server } from 'socket.io';
import { handleIncomingMessage } from './handlers/messageHandler';
import { config } from './config/config';

// Store sockets by serverId
const sockets = new Map<string, ReturnType<typeof makeWASocket>>();

export async function requestWhatsAppPairingCode(serverId: string, phoneNumber: string, io: Server) {
    const sock = sockets.get(serverId);
    if (!sock) {
        throw new Error(`Bot socket is not initialized for server ${serverId}.`);
    }
    try {
        const code = await sock.requestPairingCode(phoneNumber);
        io.emit('pairingCode', { serverId, code });
        io.emit('log', { serverId, message: `Pairing code requested for ${phoneNumber}: ${code}` });
        return code;
    } catch (err: any) {
        console.error('Failed to request pairing code:', err);
        throw new Error(`Failed to get pairing code: ${err.message}`);
    }
}

export async function resetWhatsAppBot(serverId: string, io: Server) {
    const authDir = path.join(config.paths.auth, serverId);
    const sock = sockets.get(serverId);
    
    if (sock) {
        sock.logout();
        sock.end(undefined);
        sockets.delete(serverId);
    }
    
    // Clear existing session data
    if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true });
    }
    
    io.emit('log', { serverId, message: 'Bot session cleared. Reinitializing...' });
    io.emit('status', { serverId, status: 'disconnected' });
    io.emit('qr', { serverId, qr: null });
    
    // Give some time before restarting
    setTimeout(() => {
        startWhatsAppBot(serverId, io);
    }, 2000);
}

export async function stopWhatsAppBot(serverId: string, io: Server) {
    const authDir = path.join(config.paths.auth, serverId);
    const sock = sockets.get(serverId);
    
    if (sock) {
        sock.logout();
        sock.end(undefined);
        sockets.delete(serverId);
    }
    
    // Clear existing session data
    if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true });
    }
    
    io.emit('log', { serverId, message: 'Bot server deleted and session cleared.' });
}

export async function startWhatsAppBot(serverId: string, io: Server) {
    const authDir = path.join(config.paths.auth, serverId);
    if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }) as any,
        browser: Browsers.ubuntu('Chrome'),
        syncFullHistory: false,
    });
    
    sockets.set(serverId, sock);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            try {
                const qrDataURL = await QRCode.toDataURL(qr);
                io.emit('qr', { serverId, qr: qrDataURL });
                io.emit('log', { serverId, message: 'Please scan the QR code to connect WhatsApp.' });
            } catch (err) {
                console.error('Failed to generate QR code:', err);
            }
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
            io.emit('log', { serverId, message: `Connection closed due to ${lastDisconnect?.error}. Reconnecting: ${shouldReconnect}` });
            io.emit('status', { serverId, status: 'disconnected' });
            if (shouldReconnect) {
                startWhatsAppBot(serverId, io);
            } else {
                io.emit('log', { serverId, message: 'Logged out. Please delete the auth folder and scan again.' });
                fs.rmSync(authDir, { recursive: true, force: true });
            }
        } else if (connection === 'open') {
            io.emit('status', { serverId, status: 'connected' });
            io.emit('log', { serverId, message: 'WhatsApp Bot is connected and ready!' });
            io.emit('qr', { serverId, qr: null }); // Clear QR
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify') {
            for (const msg of m.messages) {
                if (!msg.key.fromMe && msg.message) {
                    await handleIncomingMessage(sock, msg, io);
                }
            }
        }
    });
}
