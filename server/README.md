# QuickPoll Backend - Real-time Polling System

A production-ready real-time polling system built with Express.js, Socket.io, and TypeScript.

## 🚀 Features

### Core Features
- ✅ Real-time polling with Socket.io
- ✅ Teacher can create polls and manage questions
- ✅ Students can join polls and submit answers
- ✅ Configurable question timeout (10-300 seconds)
- ✅ Auto-end questions when all students answer
- ✅ Live answer tracking and results
- ✅ Student join/leave notifications

### Bonus Features
- ✅ Real-time chat system (Teacher ↔ Students)
- ✅ Remove student functionality
- ✅ Poll history and statistics
- ✅ RESTful API endpoints
- ✅ Comprehensive error handling
- ✅ Input validation with Zod
- ✅ Winston logging

## 📋 Prerequisites

- Node.js v16 or higher
- npm or yarn

## 🛠️ Installation

```bash
# Clone the repository
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Build the project
npm run build

# Start the server
npm start
```

## 🔧 Development

```bash
# Run in development mode with hot reload
npm run dev

# Build and run
npm run dev:build

# Lint code
npm run lint
```

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# CORS - Add your frontend URL
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Socket.io Configuration
SOCKET_PATH=/socket.io
SOCKET_PING_TIMEOUT=60000
SOCKET_PING_INTERVAL=25000

# Poll Configuration
DEFAULT_POLL_TIMEOUT=60
MAX_POLL_TIMEOUT=300
MIN_POLL_TIMEOUT=10

# Logging
LOG_LEVEL=info
```

## 🌐 API Endpoints

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/polls` | Get all polls |
| GET | `/api/polls/:pollId` | Get poll details |
| GET | `/api/polls/:pollId/results` | Get current results |
| GET | `/api/polls/:pollId/history` | Get question history |
| GET | `/api/polls/:pollId/stats` | Get poll statistics |
| DELETE | `/api/polls/:pollId` | Delete a poll |

### Socket.io Events

#### Teacher Events
- `createPoll` - Create a new poll
- `startQuestion` - Start a new question
- `endQuestion` - End current question early
- `removeStudent` - Remove a student from poll

#### Student Events
- `joinPoll` - Join a poll
- `submitAnswer` - Submit answer to question
- `leavePoll` - Leave the poll

#### Broadcast Events
- `newQuestion` - New question started
- `answerReceived` - Answer received from student
- `timeUp` - Timer expired
- `showResults` - Display results
- `studentJoined` - Student joined poll
- `studentLeft` - Student left poll
- `studentRemoved` - Student removed by teacher

#### Chat Events (Bonus)
- `sendMessage` - Send a chat message
- `newMessage` - Receive a chat message

## 🎯 Usage Examples

### Creating a Poll (Teacher)

```javascript
// Connect to Socket.io
const socket = io('http://localhost:5000');

// Create poll
socket.emit('createPoll', {}, (response) => {
  console.log(response.data.pollId); // Use this ID for students
});

// Start question
socket.emit('startQuestion', {
  question: 'What is 2+2?',
  options: ['2', '3', '4', '5'],
  timeout: 60 // seconds
}, (response) => {
  console.log(response);
});
```

### Joining a Poll (Student)

```javascript
// Connect to Socket.io
const socket = io('http://localhost:5000');

// Join poll
socket.emit('joinPoll', {
  pollId: 'abc123',
  studentName: 'John Doe'
}, (response) => {
  console.log(response);
});

// Listen for new questions
socket.on('newQuestion', (data) => {
  console.log(data.question);
  console.log(data.options);
});

// Submit answer
socket.emit('submitAnswer', {
  questionId: 'question_123',
  answer: 'option_2'
}, (response) => {
  console.log(response);
});

// Listen for results
socket.on('showResults', (data) => {
  console.log(data.results);
});
```

### Chat Feature

```javascript
// Send message
socket.emit('sendMessage', {
  message: 'Hello everyone!'
}, (response) => {
  console.log(response);
});

// Listen for messages
socket.on('newMessage', (data) => {
  console.log(`${data.sender} (${data.role}): ${data.message}`);
});
```

## 🏗️ Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── socket.config.ts      # Socket.io configuration
│   ├── controllers/
│   │   ├── poll.controller.ts    # REST API controllers
│   │   └── socket.controller.ts  # Socket.io event handlers
│   ├── middleware/
│   │   ├── error.middleware.ts   # Error handling
│   │   └── validation.middleware.ts # Input validation
│   ├── models/
│   │   └── poll.model.ts         # Data models & in-memory store
│   ├── routes/
│   │   └── poll.routes.ts        # API routes
│   ├── services/
│   │   ├── poll.service.ts       # Business logic
│   │   └── timer.service.ts      # Timer management
│   ├── utils/
│   │   ├── constants.ts          # App constants
│   │   └── logger.ts             # Winston logger
│   ├── app.ts                    # Express app setup
│   └── index.ts                  # Entry point
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## 🔒 Security Features

- CORS configuration
- Input validation with Zod
- Error handling middleware
- Request logging
- Socket authentication middleware (ready for JWT)

## 📊 Monitoring

The application includes:
- Winston logging with configurable levels
- Health check endpoint
- Poll statistics API
- Connection tracking

## 🚀 Production Deployment

### Recommended Enhancements for Production

1. **Database**: Replace in-memory storage with Redis/MongoDB
2. **Authentication**: Implement JWT authentication
3. **Rate Limiting**: Add rate limiting middleware
4. **Horizontal Scaling**: Use Redis adapter for Socket.io
5. **Monitoring**: Integrate with Sentry/DataDog
6. **Load Balancing**: Configure sticky sessions
7. **Security**: Add Helmet.js, compression
8. **CI/CD**: Setup automated testing and deployment

### Example Production Start

```bash
# Set production environment
export NODE_ENV=production

# Build
npm run build

# Start with PM2
pm2 start dist/index.js --name quickpoll-server
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm run test:coverage
```

## 📖 API Documentation

Full API documentation is available when the server is running:
- Base URL: `http://localhost:5000`
- Socket.io: `http://localhost:5000/socket.io`



Built with ❤️ for real-time education