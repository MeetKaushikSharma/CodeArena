# CodeArena

CodeArena is a modern, full-stack, competitive programming and interview preparation platform. It provides a seamless, fast, and interactive environment for developers to solve Data Structures and Algorithms (DSA) problems, get AI-powered hints, and track their progress on a global leaderboard.

## 🚀 Live Demo
**Try it out:** [https://code-arena-army.vercel.app/](https://code-arena-army.vercel.app/)

## ✨ Key Features

- **Robust Problem Solving Environment:**
  - Integrated Monaco Editor (VS Code's editor) for a premium coding experience.
  - Multi-language support executed reliably via Judge1.
  - Real-time compilation and execution against visible and hidden test cases.
- **AI-Powered Learning (Powered by Google Gemini):**
  - Context-aware AI assistant scopes its help directly to the problem at hand.
  - Get hints, debugging assistance, or conceptual explanations without leaving the editor.
- **Competitive & Social:**
  - Weighted difficulty-based scoring system.
  - Paginated global leaderboard.
  - Profile dashboard with activity tracking and streaks.
- **Comprehensive Admin Panel:**
  - Secure, role-based admin dashboard to create, update, and manage problems.
  - Integrated Cloudinary video solution uploads via secure signed URLs.
- **Production-Ready Security:**
  - JWT authentication with HTTP-only, secure cookies.
  - Express global error handling and request payload limits.
  - Redis-backed submission rate limiting to prevent abuse.

## 🏗 Architecture & Tech Stack

This project is structured as a monorepo containing a distinct backend and frontend.

### Frontend (`CodeArena_Frontend`)
- **Framework:** React + Vite
- **State Management:** Redux Toolkit
- **Styling:** Tailwind CSS + DaisyUI
- **Routing:** React Router
- **Editor:** `@monaco-editor/react`
- **Forms & Validation:** React Hook Form + Zod

### Backend (`CodeArena_Backend`)
- **Runtime:** Node.js + Express
- **Database:** MongoDB (Mongoose)
- **Caching & Rate Limiting:** Redis
- **Authentication:** JWT + bcrypt + Passport.js
- **External Integrations:** 
  - Axios (Judge1 API for code execution)
  - `@google/genai` (Google Gemini for AI chat)
  - Cloudinary (Video hosting)

> **Important Architecture Note:**  
> The backend exclusively relies on **Judge1** for all remote code execution. Ensure the `JUDGE1_HOST` is correctly configured in your environment variables.

## 🛠 Local Setup

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd CodeArena

# Install Backend Dependencies
cd CodeArena_Backend
npm install

# Install Frontend Dependencies
cd ../CodeArena_Frontend
npm install
```

### 2. Environment Configuration

#### Backend (`CodeArena_Backend/.env`)
Create a `.env` file in the `CodeArena_Backend` directory. See the provided `.env.example` for reference:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database & Cache
DB_CONNECT_STRING=mongodb+srv://<user>:<password>@cluster.mongodb.net/codearena
REDIS_HOST=redis://<user>:<password>@<host>:<port>
REDIS_PASS=<your_redis_password>

# Security
JWT_KEY=<your_jwt_secret>

# External APIs
JUDGE1_HOST=<your_judge1_api_url>
GEMINI_KEY=<your_gemini_api_key>

# Cloudinary (Admin Video Uploads)
CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_api_key>
CLOUDINARY_API_SECRET=<your_api_secret>
```

#### Frontend (`CodeArena_Frontend/.env`)
Create a `.env` file in the `CodeArena_Frontend` directory:

```env
VITE_API_URL=http://localhost:3000
```

### 3. Run the Development Servers

**Start the Backend:**
```bash
cd CodeArena_Backend
npm run dev
```

**Start the Frontend:**
```bash
cd CodeArena_Frontend
npm run dev
```

## 🔐 Security & Production Considerations

- **CORS & Cookies:** The backend is configured to accept cross-origin requests from the exact `FRONTEND_URL`. Cookies use `sameSite: "none"` and `secure: true` for production compatibility.
- **Admin Access:** Registration strictly forces new users to the `user` role. The `admin` role must be manually assigned directly via the MongoDB database for security.
- **Rate Limiting:** A Redis-backed 10-second cooldown is enforced on code submissions.

## 📜 License
This project is proprietary and intended for demonstration and portfolio purposes.