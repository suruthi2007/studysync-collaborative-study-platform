# 📚 StudySync — Real-Time Collaborative Study Platform

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://react.dev/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-black.svg)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Embedded-brightgreen.svg)](https://www.mongodb.com/)
[![WebRTC](https://img.shields.io/badge/WebRTC-Peer--to--Peer-orange.svg)](https://webrtc.org/)

[![Vercel Deployment](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://studysync-collaborative-study-platf.vercel.app)

> **Full-Stack Internship Capstone Project**: Recreating the vibrant "library study group" vibe digitally through real-time virtual rooms, synchronized collaborative whiteboards, shared resource drives, gamified peer quizzing, and a tutor marketplace.

---

### 🔗 Project Links
- 🌐 **Live Application**: [https://studysync-collaborative-study-platf.vercel.app](https://studysync-collaborative-study-platf.vercel.app)
- 💻 **GitHub Repository**: [https://github.com/suruthi2007/studysync-collaborative-study-platform](https://github.com/suruthi2007/studysync-collaborative-study-platform)
- 📺 **Demo Video Walkthrough**: [Watch on Google Drive](https://drive.google.com/file/d/1m9ai4sW3XU7calVZMfBTl7EGY8MGm6e1/view?usp=sharing)

---

## 🌟 Architecture & Completed Phases

### 🔹 Phase 1: Study Groups & Resource Hub
- **Group Management**: Create study groups (e.g. *Calculus 101*, *CS 50 - Algorithms*) with unique invite codes (e.g., `calc-101`) for 1-click sharing.
- **Resource Repository**: Secure, member-only file drive for lecture notes, problem sets, and diagrams.
- **Storage Layer**: AWS S3 integration via `@aws-sdk/client-s3` with automatic local file upload fallback.
- **Permission Guard**: Only authenticated group members can view, upload, or download resources.

### 🔹 Phase 2: The Virtual Study Room (Real-Time)
- **Collaborative Whiteboard (`/socket/whiteboardHandler.js`)**:
  - Built with HTML5 Canvas 2D API + Socket.io broadcasting coordinates (`moveTo`, `lineTo`).
  - Real-time brush strokes, shapes (rectangles, circles, lines), eraser, color palette, undo, and PNG exports.
  - Room stroke caching ensures new joiners immediately sync to the existing board state.
  - Live cursor tracking shows classmates' mouse pointers moving in real-time.
- **Synchronized Group Chat (`/socket/chatHandler.js`)**:
  - Room-isolated live messaging powered by Socket.io.
  - Active participants presence and real-time typing indicators (*"Bob is typing..."*).
- **WebRTC Video & Audio Conferencing (`/socket/webrtcHandler.js`)**:
  - Peer-to-peer audio/video calling mesh.
  - Camera toggle, mic mute, screen sharing, and graceful fallback for hardware-limited machines.

### 🔹 Phase 3: Peer-to-Peer Quizzing Engine
- **Quiz & Flashcard Builder**: Create multiple-choice quizzes with explanations or interactive 3D flip card decks.
- **Interactive Quiz Player**: Instant scoring, question breakdown, and celebratory confetti upon high scores.
- **Interactive 3D Flashcards**: 3D flip card animations with question prompts, hints, and answers.
- **Gamified Group Leaderboard**: Real-time aggregation of total points, quiz attempts, and accuracy percentages.

### 🔹 Phase 4: Tutor Marketplace & Booking Engine (Monetization)
- **Verified Tutor Directory**: Filter tutors by subject, bio, hourly rate ($/hr), and star rating.
- **Calendly-Style Booking System**: Interactive date picker and time-slot selector.
- **Anti-Double-Booking Protection**:
  - Database compound index `{ tutor: 1, date: 1, timeSlot: 1 }` prevents concurrent reservation collisions.
  - Real-time booked slot gray-out prevents students from picking occupied times.
  - Automatic meeting room generation (`session-sarah-XXXXXX`) for instant study room entry.

---

## 📁 Repository Structure

```
studysync/
├── package.json               # Root orchestrator (runs client & server together)
├── README.md                  # Project documentation & demo guidelines
├── .gitignore
├── server/
│   ├── package.json
│   ├── server.js              # Express app & Socket.io server entry
│   ├── .env                   # Environment config (MongoDB URI, JWT secret, AWS S3)
│   ├── socket/                # ⚡ Dedicated folder for Socket.io logic
│   │   ├── index.js           # Socket routing & room management
│   │   ├── whiteboardHandler.js # Clean drawing broadcasting logic (moveTo, lineTo)
│   │   ├── chatHandler.js     # Live group messaging & typing indicators
│   │   └── webrtcHandler.js   # WebRTC signaling (offers, answers, ICE candidates)
│   ├── models/                # Mongoose Models
│   │   ├── User.js
│   │   ├── Group.js
│   │   ├── Resource.js
│   │   ├── Quiz.js
│   │   ├── QuizAttempt.js
│   │   ├── Tutor.js
│   │   └── Booking.js
│   ├── routes/                # REST API Routes
│   │   ├── authRoutes.js      # Auth & instant demo persona switcher
│   │   ├── groupRoutes.js     # Group CRUD & invite links
│   │   ├── resourceRoutes.js  # File upload & S3 storage
│   │   ├── quizRoutes.js      # Quiz builder, grading & leaderboard
│   │   ├── tutorRoutes.js     # Marketplace profiles
│   │   └── bookingRoutes.js   # Anti-double-booking appointment system
│   ├── config/
│   │   ├── db.js              # Robust DB connection (Atlas / Auto In-Memory Mongo)
│   │   └── storage.js         # AWS S3 client + local uploads engine
│   └── seedData.js            # Auto-seeds Calculus 101, tutors, and sample quizzes
└── client/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx            # Main app router & layout
        ├── index.css          # Design system, glassmorphism & 3D card styling
        ├── context/
        │   ├── AuthContext.jsx   # Auth state & quick persona switcher
        │   └── SocketContext.jsx # Real-time Socket.io provider
        └── components/
            ├── Navbar.jsx        # Navigation & multi-window demo switcher
            ├── groups/
            │   ├── GroupsView.jsx    # Study groups & invite links
            │   └── ResourceDrive.jsx # Shared PDF/image file repository
            ├── room/
            │   ├── StudyRoomView.jsx # Virtual Room orchestrator
            │   ├── Whiteboard.jsx    # Collaborative HTML5 Canvas
            │   ├── LiveChat.jsx      # Socket.io chat & presence
            │   └── VideoCall.jsx     # WebRTC video mesh & screen share
            ├── quiz/
            │   └── QuizHub.jsx       # Quizzing, 3D Flashcards & Leaderboard
            └── tutors/
                ├── TutorMarketplace.jsx # Tutor listings & Calendly booking
                └── MyBookings.jsx       # Scheduled appointments & room launch
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **NPM**: v9+

### 2. Quick Installation
```bash
# Clone the repository
git clone https://github.com/suruthi2007/studysync-collaborative-study-platform.git
cd studysync-collaborative-study-platform

# Install root, backend, and frontend dependencies
npm run install:all
```

### 3. Run Development Mode
To start both the Express/Socket.io backend (port `5000`) and the Vite React frontend (port `5173`):
```bash
npm run dev
```

The app will be available at:
- Frontend: **`http://localhost:5173`**
- Backend & Socket: **`http://localhost:5000`**

*(Note: If local MongoDB is not running, the backend automatically boots an in-memory database and seeds demo data for zero-configuration testing!)*

---

## 🎥 Video Demonstration & Live Walkthrough

### 🔗 Quick Access
- 🌐 **Live App**: [https://studysync-collaborative-study-platf.vercel.app](https://studysync-collaborative-study-platf.vercel.app)
- 📺 **Watch Demo Video**: [StudySync Video Sample on Google Drive](https://drive.google.com/file/d/1m9ai4sW3XU7calVZMfBTl7EGY8MGm6e1/view?usp=sharing)
- 💻 **GitHub Repo**: [suruthi2007/studysync-collaborative-study-platform](https://github.com/suruthi2007/studysync-collaborative-study-platform)

### 👥 Steps to Replicate the Collaborative Multi-User Demo:
Demonstrating real-time synchronization between two different users can be done on the **[Live App](https://studysync-collaborative-study-platf.vercel.app)** or locally:

1. Open **Window A** (e.g. Standard Chrome) and visit the [Live App](https://studysync-collaborative-study-platf.vercel.app) (or `http://localhost:5173`).
   - In the top navbar, confirm persona is set to **👩 Alice**.
   - Click **"Virtual Study Room"** on *Calculus 101*.
2. Open **Window B** (e.g. Chrome Incognito or Edge) side-by-side with Window A and visit the [Live App](https://studysync-collaborative-study-platf.vercel.app) (or `http://localhost:5173`).
   - In the top navbar demo switcher, click **👨 Bob**.
   - Click **"Virtual Study Room"** on *Calculus 101*.
3. **Show Real-Time Drawing Sync**:
   - Draw on the Whiteboard in Window A — watch the brush strokes immediately appear on Window B!
   - Draw shapes or use the eraser in Window B — observe real-time coordinate broadcasting.
4. **Show Live Chat & Typing Sync**:
   - Start typing in Window A — Window B will display *"Alice is typing..."*.
   - Send a message — it appears instantly across both screens.
5. **Show Peer Quizzing & Leaderboard**:
   - Navigate to **"Quizzes & Rank"** in Window B, take the Calculus Quiz, and submit answers to watch scores update live on the Leaderboard.
6. **Show Tutor Marketplace & Anti-Double-Booking**:
   - Navigate to **"Tutor Marketplace"**, pick Dr. Sarah Lin, book a slot (e.g., `14:00 - 15:00`), and see that the slot immediately disables for other students.
