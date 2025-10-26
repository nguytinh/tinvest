# Tinvest - Stock Tracking Application

A modern, full-stack web application for tracking stock investments built with TypeScript, React, and Node.js.

## Features

- 🔐 Google OAuth 2.0 authentication
- 📊 Real-time stock data from Alpha Vantage API
- 🏠 Dashboard with major market indexes and ETFs
- 🎨 Clean, modern dark mode UI
- 📱 Fully responsive design
- 🚀 Fast and efficient with Vite
- 💪 Type-safe with TypeScript throughout
- 🧭 Navigation bar with Home, Watchlists, News, and Crypto tabs

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Navigation
- **CSS3** - Styling (no framework for simplicity)

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Project Structure

```
tinvest/
├── frontend/           # React frontend
│   ├── src/
│   │   ├── pages/     # Page components
│   │   ├── App.tsx    # Main app component
│   │   ├── main.tsx   # Entry point
│   │   └── index.css  # Global styles
│   └── package.json
├── backend/           # Express backend
│   ├── src/
│   │   ├── routes/    # API routes
│   │   └── index.ts   # Server entry point
│   └── package.json
└── package.json       # Root workspace config
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd tinvest
```

2. Install dependencies for all packages:
```bash
npm run install:all
```

Or install manually:
```bash
# Root dependencies
npm install

# Frontend dependencies
cd frontend
npm install

# Backend dependencies
cd ../backend
npm install
```

3. Set up Google OAuth 2.0:
   
   **See [SETUP_OAUTH.md](SETUP_OAUTH.md) for detailed instructions**
   
   Quick setup:
   - Get your Google Client ID and Secret from [Google Cloud Console](https://console.cloud.google.com/)
   - Create `frontend/.env` with `VITE_GOOGLE_CLIENT_ID=your-client-id`
   - Update `backend/.env` with `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

4. (Optional) Get a free Alpha Vantage API key:
   - Visit https://www.alphavantage.co/support/#api-key
   - Sign up for a free API key
   - Replace the `demo` API key in `frontend/src/pages/Dashboard.tsx` with your key
   - Note: The app works with mock data if API calls fail

### Running the Application

#### Development Mode (Recommended)

Run both frontend and backend concurrently:
```bash
npm run dev
```

This will start:
- Frontend at `http://localhost:3000`
- Backend at `http://localhost:5000`

#### Run Separately

Frontend only:
```bash
npm run dev:frontend
```

Backend only:
```bash
npm run dev:backend
```

### Building for Production

Frontend:
```bash
cd frontend
npm run build
```

Backend:
```bash
cd backend
npm run build
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login existing user
- `GET /api/health` - Health check

## Current Status

✅ Project structure set up  
✅ Frontend with React + TypeScript  
✅ Modern dark mode login and signup pages  
✅ **Google OAuth 2.0 authentication implemented**
✅ Dashboard with major market indexes and ETFs  
✅ Navigation bar with multiple sections  
✅ Backend with Express + TypeScript  
✅ JWT token-based sessions
✅ Alpha Vantage API integration  

### Next Steps

- [ ] Add database (PostgreSQL/MongoDB)
- [ ] Implement Watchlists page
- [ ] Implement News page
- [ ] Implement Crypto page
- [ ] Add portfolio management
- [ ] Add charts and analytics
- [ ] Implement real-time updates
- [ ] Connect authentication with dashboard

## Development Notes

- The app uses a monorepo structure with workspaces
- Frontend proxies API requests to backend during development
- Currently using in-memory storage (add a database for production)
- Dark mode theme: black backgrounds (#0a0a0a) with white text

## Contributing

This is a personal project, but suggestions and improvements are welcome!

## License

MIT

