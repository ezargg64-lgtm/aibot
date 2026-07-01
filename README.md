# WhatsApp Bot Fleet Manager

**Live Demo:** [https://ai-bot-dashboard-678575625983.asia-southeast1.run.app](https://ai-bot-dashboard-678575625983.asia-southeast1.run.app)

A full-stack web application for provisioning, monitoring, and managing a fleet of AI-powered WhatsApp bots. The platform includes a real-time command center dashboard to track server health (CPU, Memory, Bandwidth, Uptime) and a seamless interface to connect and manage WhatsApp instances via QR code or Phone Number pairing.

AI capabilities for the bots are powered by the **Google Gemini API**, enabling intelligent, context-aware automated responses.

## Key Features

- **Real-Time Command Center:** Monitor fleet telemetry including global uptime, active bandwidth, average response time, and error rates using smooth Recharts visualizations.
- **Multi-Instance Management:** Create, monitor, and delete multiple independent WhatsApp bot instances from a single dashboard.
- **Seamless Connectivity:** Connect your WhatsApp accounts to the bots using either a QR code scan or an 8-digit phone number pairing code.
- **AI-Powered:** Integrated with Google Gemini for advanced conversational capabilities.
- **Real-Time Logs & Status:** Socket.IO integration provides instant feedback on bot connection status, incoming logs, and pairing events without needing to refresh the page.

## Tech Stack

- **Frontend:** React, Tailwind CSS, Recharts, Lucide Icons, Socket.IO Client.
- **Backend:** Node.js, Express, Vite (Middleware), Socket.IO.
- **WhatsApp Integration:** `@whiskeysockets/baileys`
- **AI Integration:** `@google/genai` (Gemini API)

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- A **Google Gemini API Key** (Get one from [Google AI Studio](https://aistudio.google.com/))

## Local Development Setup

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <your-repository-url>
   cd <repository-folder>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Rename or copy the `.env.example` file to a new file named `.env` in the root directory. Add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will start with hot-reloading enabled. Open [http://localhost:3000](http://localhost:3000) in your browser to view the dashboard.

## Production Build

To build and run the application for production:

1. **Build the project:**
   ```bash
   npm run build
   ```
   This command bundles both the React frontend (via Vite) and the Express backend (via ESBuild) into the `dist/` folder.

2. **Start the production server:**
   ```bash
   npm start
   ```

## Folder Structure Highlights

- `/src/App.tsx`: The main React dashboard and telemetry UI.
- `/server.ts`: The Express backend entry point that handles API routes and Vite middleware.
- `/src/bot/`: Contains the core WhatsApp bot logic.
  - `/src/bot/index.ts`: Connection and session management for Baileys.
  - `/src/bot/handlers/messageHandler.ts`: Logic for processing incoming WhatsApp messages.
  - `/src/bot/services/geminiService.ts`: Integration with the Google Gemini API.

## Notes on `.gitignore`

The repository is configured to ignore sensitive runtime directories that get generated when bots are provisioned or when logs are written:
- `auth_info/`: Contains sensitive WhatsApp session credentials.
- `database/`, `uploads/`, `logs/`: Application-specific runtime data.
- `.env`: Contains your private API keys.

**Never commit your `.env` file or the `auth_info` directory to version control.**
