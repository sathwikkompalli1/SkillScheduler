# AI-Powered Student Skill & Routine Planner

A full-stack MERN application that helps college students plan and track their skill learning journey using AI-powered scheduling.

## 🚀 Features

- **AI-Powered Learning Plans**: Automatically generates daily topics and learning paths
- **Smart Scheduling**: Respects your daily learning hours and preferences
- **Auto-Replanning**: Missed tasks are automatically redistributed
- **YouTube Resources**: AI suggests relevant learning videos
- **Workout Integration**: Optional daily workout tasks
- **Progress Tracking**: Visual progress bars and statistics

## 📁 Project Structure

```
vibeathon/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── profileController.js
│   │   ├── skillController.js
│   │   ├── taskController.js
│   │   └── aiController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Skill.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── profile.js
│   │   ├── skills.js
│   │   ├── tasks.js
│   │   └── ai.js
│   ├── services/
│   │   ├── aiPlanner.js
│   │   └── aiReplanner.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.js
    │   │   └── PrivateRoute.js
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   ├── Onboarding.js
    │   │   ├── Dashboard.js
    │   │   ├── Skills.js
    │   │   └── DailyTodo.js
    │   ├── services/
    │   │   └── api.js
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    ├── package.json
    ├── tailwind.config.js
    └── postcss.config.js
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- OpenAI API Key

### Backend Setup

```bash
cd backend
npm install
```

Edit `.env` with your credentials:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/skill-planner
JWT_SECRET=your-super-secret-key
JWT_EXPIRE=7d
OPENAI_API_KEY=sk-your-openai-key
```

Start the server:
```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

The app will open at `http://localhost:3000`

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get user profile |
| PUT | `/api/profile` | Update profile |
| PUT | `/api/profile/onboard` | Complete onboarding |

### Skills
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/skills` | Get all skills |
| POST | `/api/skills` | Create skill |
| GET | `/api/skills/:id` | Get single skill |
| PUT | `/api/skills/:id` | Update skill |
| DELETE | `/api/skills/:id` | Delete skill |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/today` | Get today's tasks |
| GET | `/api/tasks/missed` | Get missed tasks |
| GET | `/api/tasks/date/:date` | Get tasks by date |
| PUT | `/api/tasks/:id/complete` | Mark complete |
| PUT | `/api/tasks/:id/reschedule` | Reschedule task |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/generate-plan/:skillId` | Generate AI learning plan |
| POST | `/api/ai/replan` | Replan missed tasks |
| POST | `/api/ai/resources` | Get YouTube suggestions |
| POST | `/api/ai/preview-topics` | Preview topic breakdown |

## 📝 Example API Calls

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Create Skill
```bash
curl -X POST http://localhost:5000/api/skills \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Machine Learning",
    "description": "Learn ML fundamentals",
    "targetDays": 30
  }'
```

### Generate AI Plan
```bash
curl -X POST http://localhost:5000/api/ai/generate-plan/SKILL_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🤖 AI Prompt Example

The AI planner uses the following prompt structure:

```
You are an expert curriculum designer. Create a structured learning plan for the skill: "Machine Learning".

User Context:
- Available days: 30
- Daily learning hours: 2
- Existing skills: Python, Statistics

Generate a day-by-day learning plan with specific topics. For each day, provide:
1. Topic name (concise)
2. Brief description
3. Estimated hours needed

Respond ONLY with a valid JSON array in this format:
[
  {
    "day": 1,
    "topic": "Introduction to ML",
    "description": "Understanding what machine learning is and its applications",
    "estimatedHours": 2
  }
]
```

## 🎨 Tech Stack

- **Frontend**: React.js, Tailwind CSS, React Router, Axios
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Authentication**: JWT
- **AI**: OpenAI GPT-3.5/4

## 📄 License

MIT License
