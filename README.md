# CodeArena 🏆

> Full-stack competitive programming platform with real code execution, AI-powered tutoring, and ranking system

![License](https://img.shields.io/badge/license-ISC-blue)
![Node Version](https://img.shields.io/badge/node-%3E%3D16.0.0-green)
![React Version](https://img.shields.io/badge/react-19.2.0-61dafb)

---

## Overview

**CodeArena** is a full-stack online judge platform that allows users to solve coding problems, get AI tutoring, and compete on a global leaderboard. The platform uses real code execution via Judge0/Judge1 APIs, integrated AI assistance via Google Gemini, and secure user authentication with JWT + Redis.

### What Makes CodeArena Different

- **Dual-Judge Architecture**: Intelligently routes C++ to Judge0, other languages to Judge1 for optimal performance
- **Real Code Execution**: Backend tests code against visible AND hidden test cases, with granular feedback
- **AI Tutoring System**: Google Gemini integration for context-aware hints on current problem
- **Secure Authentication**: JWT tokens with Redis-based blocklist for logout; bcrypt password hashing
- **Video Solutions**: Cloudinary integration for hosting solution videos per problem
- **Advanced UI**: Monaco editor with language support, resizable panels, animated tier badges, activity heatmaps

---

## Technology Stack

### Backend

| Component      | Technology        | Purpose                            |
| -------------- | ----------------- | ---------------------------------- |
| Runtime        | Node.js           | Server runtime                     |
| Framework      | Express.js 5.2.1  | HTTP server                        |
| Database       | MongoDB 9.1.5     | Document store                     |
| Cache          | Redis 5.10.0      | Session management & rate limiting |
| Auth           | JWT + bcrypt      | Secure authentication              |
| AI             | Google Gemini API | Code tutoring                      |
| Cloud Storage  | Cloudinary 2.9.0  | Video hosting                      |
| Code Execution | Judge0 + Judge1   | Multi-language code testing        |

### Frontend

| Component        | Technology            | Purpose        |
| ---------------- | --------------------- | -------------- |
| Framework        | React 19.2.0          | UI library     |
| Build Tool       | Vite 7.3.1            | Build system   |
| State Management | Redux Toolkit 2.11.2  | Global state   |
| Code Editor      | Monaco Editor 4.7.0   | IDE experience |
| Styling          | TailwindCSS 4.1.18    | CSS utilities  |
| Routing          | React Router 7.13.0   | Navigation     |
| Validation       | Zod + React Hook Form | Form handling  |

---

## Core Features

### 🔐 Authentication & Authorization

- **JWT-based authentication** with 1-hour expiration
- **Bcrypt password hashing** with salt rounds = 10
- **Role-based access control**: User and Admin roles
- **Redis token blocklist** for logout security
- **Secure HTTP-only cookies** with CORS protection

**Auth Flow:**

```
Register → Hash Password → Create JWT → Set Cookie → Authenticate
Login → Verify Password → Issue Token → Set Cookie → Authenticated
Logout → Add Token to Redis Blocklist → Clear Cookie → Unauthenticated
```

### 🧮 Multi-Language Code Execution (16+ Languages)

**Judge System Architecture:**

| Judge  | Languages                                                               | Reason                                                          |
| ------ | ----------------------------------------------------------------------- | --------------------------------------------------------------- |
| Judge0 | C++, C                                                                  | Optimized for compiled languages, batch submission, low latency |
| Judge1 | Python, Java, JS, TS, Rust, Ruby, PHP, C#, Swift, Kotlin, Bash, R, Perl | Lightweight, dynamic language support, simple API               |

**Execution Flow:**

1. User submits code for a problem
2. Backend routes to appropriate judge based on language
3. Execute against hidden test cases (visible cases shown in UI only)
4. Return: verdict, runtime, memory, error messages
5. If accepted: mark problem as solved in user.problemSolved
6. Store submission record with all metrics

**Test Case Structure:**

```javascript
Problem has:
├── visibleTestCases: {input, output, explanation} - shown to users
└── HiddenTestCases: {input, output} - used for grading
```

### 🤖 AI-Powered Tutoring

**Feature**: Google Gemini API integration for real-time code help

**How it works:**

- User opens chat on problem page
- System sends problem context (title, description, test cases) to Gemini
- AI provides hints, approaches, or code reviews
- Responses are context-restricted to current problem only

**Available Prompts:**

- **Hint**: Guidance without solution
- **Approach**: Algorithm explanation
- **Complexity**: Time/space analysis

### 📹 Video Solutions

**Cloudinary Integration:**

- Admins upload solution videos per problem
- Signed uploads without exposing API keys
- Videos streamed via CDN
- Metadata stored in MongoDB

**Flow:**

```
Admin Request Upload → Backend generates signature →
Cloudinary upload → Verify upload → Store metadata
```

### 📊 Leaderboard System

- Weighted scoring: hard problems = 30pts, medium = 10pts, easy = 5pts
- Top 100 users ranked by score
- Filters users with at least 1 solved problem
- Real-time updates when problems are solved

### ⚡ Rate Limiting

- Per-user submission cooldown: 10 seconds
- Redis-based atomic operations prevent race conditions
- Returns 429 Too Many Requests if cooldown active

---

## Project Structure

```
CodeArena/
├── CodeArena_Backend/
│   ├── src/
│   │   ├── index.js                          # Server entry
│   │   ├── config/
│   │   │   ├── db.js                         # MongoDB
│   │   │   └── redis.js                      # Redis
│   │   ├── models/
│   │   │   ├── user.js                       # User schema
│   │   │   ├── problem.js                    # Problem schema
│   │   │   ├── submission.js                 # Submission schema
│   │   │   └── solutionVideo.js              # Video schema
│   │   ├── controllers/
│   │   │   ├── userAuthent.js                # Auth logic
│   │   │   ├── userProblem.js                # Problem CRUD
│   │   │   ├── userSubmission.js             # Code execution
│   │   │   ├── videoSection.js               # Cloudinary upload
│   │   │   ├── leaderboardController.js      # Ranking
│   │   │   └── solveDoubt.js                 # AI tutoring
│   │   ├── middleware/
│   │   │   ├── userMiddleware.js             # Auth check
│   │   │   ├── adminMiddleware.js            # Admin check
│   │   │   └── submitCooldown.js             # Rate limit
│   │   ├── routes/
│   │   │   ├── userAuth.js                   # /user
│   │   │   ├── problemCreator.js             # /problem
│   │   │   ├── submit.js                     # /submission
│   │   │   ├── aiChatting.js                 # /ai
│   │   │   ├── videoCreator.js               # /video
│   │   │   └── leaderboardRoute.js           # /leaderboard
│   │   └── utils/
│   │       ├── problemUtility.js             # Judge logic
│   │       └── validator.js                  # Validation
│   └── package.json
│
└── CodeArena_Frontend/
    ├── src/
    │   ├── App.jsx                           # Routes
    │   ├── authSlice.js                      # Redux auth
    │   ├── pages/
    │   │   ├── Homepage.jsx                  # Problem list
    │   │   ├── ProblemPage.jsx               # Editor + AI chat
    │   │   ├── ProfileDashboard.jsx          # User profile
    │   │   ├── Leaderboard.jsx               # Rankings
    │   │   ├── Admin.jsx                     # Admin panel
    │   │   ├── Login.jsx                     # Auth
    │   │   └── Signup.jsx                    # Registration
    │   ├── components/
    │   │   ├── ChatAi.jsx                    # AI interface
    │   │   ├── AdminPanel.jsx                # Problem creation
    │   │   ├── SubmissionHistory.jsx         # Past submissions
    │   │   └── ...
    │   ├── utils/
    │   │   └── axiosClient.js                # API client
    │   ├── store/
    │   │   └── store.js                      # Redux config
    │   ├── vite.config.js
    │   └── package.json
    └── public/
```

---

## API Endpoints

### Authentication (`/user`)

| Method | Endpoint          | Middleware      | Description                               |
| ------ | ----------------- | --------------- | ----------------------------------------- |
| POST   | `/register`       | —               | Create new user, hash password, issue JWT |
| POST   | `/login`          | —               | Validate credentials, issue JWT           |
| POST   | `/logout`         | userMiddleware  | Add token to Redis blocklist              |
| GET    | `/check`          | userMiddleware  | Return authenticated user profile         |
| PUT    | `/update`         | userMiddleware  | Update user profile                       |
| POST   | `/admin/register` | adminMiddleware | Create admin user                         |

### Problems (`/problem`)

| Method | Endpoint           | Middleware      | Description                                                  |
| ------ | ------------------ | --------------- | ------------------------------------------------------------ |
| POST   | `/create`          | adminMiddleware | Create problem with test cases, validate reference solutions |
| GET    | `/getAllProblem`   | userMiddleware  | Get all problems                                             |
| GET    | `/problemById/:id` | userMiddleware  | Get single problem with test cases                           |
| PUT    | `/update/:id`      | adminMiddleware | Update problem                                               |
| DELETE | `/delete/:id`      | adminMiddleware | Delete problem                                               |

### Submissions (`/submission`)

| Method | Endpoint      | Middleware                     | Description                          |
| ------ | ------------- | ------------------------------ | ------------------------------------ |
| POST   | `/submit/:id` | userMiddleware, submitCooldown | Test code against ALL test cases     |
| POST   | `/run/:id`    | userMiddleware                 | Test against visible test cases only |

### Videos (`/video`)

| Method | Endpoint             | Middleware      | Description                          |
| ------ | -------------------- | --------------- | ------------------------------------ |
| GET    | `/create/:problemId` | adminMiddleware | Generate Cloudinary upload signature |
| POST   | `/save`              | adminMiddleware | Save video metadata                  |
| DELETE | `/delete/:videoId`   | adminMiddleware | Delete video                         |

### AI Tutoring (`/ai`)

| Method | Endpoint | Middleware     | Description                            |
| ------ | -------- | -------------- | -------------------------------------- |
| POST   | `/chat`  | userMiddleware | Chat with Gemini about current problem |

### Leaderboard (`/leaderboard`)

| Method | Endpoint | Middleware     | Description                       |
| ------ | -------- | -------------- | --------------------------------- |
| GET    | `/`      | userMiddleware | Get top 100 users ranked by score |

---

## Database Models

### User

```javascript
{
  firstName, lastName, emailId (unique)
  password (bcrypt hashed)
  role: "user" | "admin"
  profileImage, age, gender, location, birthday
  github, linkedin, twitter, website
  readme (bio), work, education, skills
  problemSolved: [ObjectId]  // References problems user solved
  showRecentAC, showHeatmap  // Privacy settings
  timestamps
}
```

### Problem

```javascript
{
  title, description, difficulty: "easy" | "medium" | "hard"
  tags: ["array", "linkedlist", "graph", "dp", ...]
  visibleTestCases: [{input, output, explanation}]
  HiddenTestCases: [{input, output}]
  startCode: [{language, initialCode}]  // Starter templates
  referenceSolution: [{language, completeCode}]  // Used for validation
  problemCreator: ObjectId
  timestamps
}
```

### Submission

```javascript
{
  userId: ObjectId
  problemId: ObjectId
  language: "cpp" | "python" | "javascript" | ...
  code: String
  status: "pending" | "accepted" | "wrong" | "error"
  runtime: Number (ms)
  memory: Number (kB)
  testCasesPassed: Number
  testCasesTotal: Number
  errorMessage: String
  timestamps
}
```

### SolutionVideo

```javascript
{
  problemId: ObjectId;
  userId: ObjectId;
  cloudinaryPublicId: String(unique);
  secureUrl: String;
  thumbnailUrl: String;
  duration: Number;
  timestamps;
}
```

---

## Key Implementation Details

### Dual-Judge Strategy

**Why this approach?**

- Judge0: Excellent at C++ batch submissions, atomic operations, proven at scale
- Judge1: Better API, supports more languages, simpler integration

**Implementation:**

```javascript
const submitCode = async (code, language, testCases) => {
  if (language === "cpp") {
    return submitToJudge0(code, testCases);
  } else {
    return submitToJudge1(code, testCases);
  }
};
```

### Reference Solution Validation

When admin creates/updates a problem:

1. All reference solutions are executed against visible test cases
2. At least one must pass ALL visible test cases
3. If validation fails, problem creation is rejected
4. Prevents broken problems from reaching users

### Redis Token Blocklist

Instead of querying database on every auth check:

```javascript
// On logout: add to Redis
redis.setex(`token:${jwtToken}`, 3600, "logged_out");

// On new request: check Redis first (O(1))
const isBlocked = await redis.get(`token:${jwtToken}`);
if (isBlocked) return 401;
```

### Problem-Solved Tracking

User document contains array of problem ObjectIds:

```javascript
user.problemSolved = [ObjectId1, ObjectId2, ...]
```

When user solves a problem (submission accepted):

```javascript
User.findByIdAndUpdate(userId, { $addToSet: { problemSolved: problemId } });
```

The `$addToSet` prevents duplicates if user solves same problem twice.

---

## Frontend Architecture

### Redux State Management

**Auth Slice:**

```javascript
{
  user: null | { _id, firstName, emailId, role, ... },
  isAuthenticated: boolean,
  loading: boolean,
  error: null | string
}
```

### Component Hierarchy

```
App
├── Routes (protected by isAuthenticated)
├── Homepage
│   ├── ProblemList
│   ├── SearchBar
│   └── Filters
├── ProblemPage
│   ├── Monaco Editor
│   ├── Problem Description
│   ├── Test Cases
│   ├── ChatAi
│   └── Submission Results
├── ProfileDashboard
│   ├── User Stats
│   ├── Activity Heatmap
│   ├── Tier Badge
│   └── Profile Form
├── Leaderboard
│   ├── Podium (top 3)
│   └── Ranked List
├── Admin (for admins)
│   ├── Create Problem
│   ├── Upload Video
│   ├── Update Problem
│   └── Delete Problem
└── Login/Signup
```

### Code Persistence

Code is automatically saved to localStorage:

```javascript
// Format: codearena:code:{problemId}:{language}
localStorage.setItem(`codearena:code:${problemId}:${language}`, code);
```

On page load, retrieve code for resumed editing.

---

## What's Actually Implemented

✅ Full user authentication with JWT + Redis blocklist
✅ Real code execution against hidden test cases
✅ Dual-judge system (Judge0 + Judge1)
✅ Role-based access control (User/Admin)
✅ MongoDB schema with proper relationships
✅ Redux state management
✅ Monaco editor integration
✅ AI tutoring with Google Gemini
✅ Cloudinary video hosting
✅ Rate limiting with Redis
✅ Leaderboard with weighted scoring
✅ Admin problem management
✅ User profile with activity heatmap
✅ Submission history tracking
✅ React 19 + Vite + TailwindCSS

---

## What's Not Implemented

❌ **Frontend WebSockets**: Leaderboard updates are HTTP polling, not live WebSocket
❌ **Pagination**: `/getAllProblem` returns all problems (no limit)
❌ **Query Caching**: Redis used only for auth/rate limiting, not for query results
❌ **Unit/Integration Tests**: No automated tests in repository
❌ **CSRF Tokens**: Basic CORS instead of explicit CSRF protection
❌ **Rate Limiting on Auth**: Register/login endpoints have no rate limits
❌ **Error Logging**: No centralized error tracking (Sentry-like service)
❌ **Helm/Kubernetes**: No container orchestration configs
❌ **API Versioning**: Single API version, no v2 support
❌ **Submission Persistence**: Chat messages not persisted across sessions

---

## Environment Variables

### Backend (.env)

```
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/codearena
JWT_KEY=your_jwt_secret_key
REDIS_URL=redis://localhost:6379
JUDGE0_API_KEY=your_judge0_api_key
JUDGE1_API_KEY=your_judge1_api_key
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GOOGLE_GENAI_API_KEY=your_genai_api_key
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```
VITE_API_BASE_URL=http://localhost:5000
```

---

## Running Locally

### Backend

```bash
cd CodeArena_Backend
npm install
# Configure .env file
npm start
```

Server runs on http://localhost:5000

### Frontend

```bash
cd CodeArena_Frontend
npm install
npm run dev
```

App runs on http://localhost:5173

---

## Key Architectural Decisions

| Decision                     | Rationale                                                          |
| ---------------------------- | ------------------------------------------------------------------ |
| **Dual Judge (0 + 1)**       | Different judges optimize for different languages                  |
| **ObjectId Arrays**          | Simple one-to-many relationships work at this scale                |
| **LocalStorage for Code**    | Fast editor refresh without server roundtrip                       |
| **Redis Blocklist**          | O(1) logout check instead of DB query                              |
| **Weighted Leaderboard**     | Incentivizes harder problems over easy ones                        |
| **Gemini System Prompt**     | Prevents AI from helping on unrelated problems                     |
| **Direct Cloudinary Upload** | Backend only generates signature, frontend uploads directly to CDN |

---

## Future Enhancements

- [ ] WebSocket integration for real-time leaderboard
- [ ] Pagination for large product lists
- [ ] Query result caching with Redis
- [ ] Automated test suite (Jest + Mocha)
- [ ] CSRF token implementation
- [ ] Rate limiting on authentication endpoints
- [ ] Error tracking with Sentry
- [ ] Discussion/comments section per problem
- [ ] Problem recommendations based on past submissions
- [ ] Docker containerization
- [ ] Kubernetes deployment configs
- [ ] API versioning (v1, v2, etc.)
- [ ] Message persistence in database
- [ ] Dark mode toggle
- [ ] Mobile app version

---

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a pull request

---

## License

This project is licensed under the ISC License.

---

## Contact & Links

- **GitHub Repository**: [MeetKaushikSharma/CodeArena](https://github.com/MeetKaushikSharma/CodeArena)
- **Demo**: [codearena.vercel.app](https://codearena.vercel.app)
- **Author**: Kaushik Sharma

---

**Last Updated**: March 2026
