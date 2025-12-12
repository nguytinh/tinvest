# Tinvest - Real-Time Stock Portfolio Tracker

## Overview
Tinvest is a full-stack, real-time stock tracking application that enables users to monitor their investment portfolios with live market data. The application features an innovative physics-based visualization system, personalized watchlists, and seamless authentication through Google OAuth 2.0.

## Live Demo Features
- **Real-time stock price tracking** with automatic data refresh
- **Interactive 3D ball visualization** using physics simulation
- **Personalized watchlists** with favorites and custom stock additions
- **Google OAuth 2.0 authentication** for secure, passwordless login
- **Responsive dark/light theme** with modern UI/UX
- **Multiple view modes**: Grid, List, and Physics-based Ball view
- **AI-powered stock analysis** integration with custom ChatGPT model

---

## Technical Highlights

### Frontend Architecture
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool for lightning-fast HMR and optimized production builds
- **React Router v6** for client-side routing and navigation
- **Custom Context API** implementation for theme management
- **Matter.js physics engine** for interactive 3D ball visualization with gravity simulation
- **Canvas API** for custom rendering with radial gradients and drop shadows
- **Recharts** for data visualization and stock charts

### Backend Architecture
- **Node.js + Express** RESTful API with TypeScript
- **MySQL** database with connection pooling for optimized performance
- **JWT (JSON Web Tokens)** for stateless authentication
- **bcryptjs** for secure password hashing with salt rounds
- **Google OAuth 2.0** server-side token verification
- **express-validator** middleware for input sanitization and validation
- **CORS** configuration for secure cross-origin requests

### Database Design
- **Relational schema** with proper foreign key constraints
- **User authentication** supporting both traditional and OAuth flows
- **Per-user data isolation** with user-scoped queries
- **Optimized indexing** for performance on frequently queried columns
- **Connection pooling** with configurable limits and keep-alive settings

### Security Implementation
- **Parameterized SQL queries** to prevent SQL injection
- **JWT token-based authentication** with 7-day expiration
- **Password hashing** with bcrypt (10 salt rounds)
- **Environment variable management** for sensitive credentials
- **OAuth 2.0 token verification** with Google's auth library
- **CORS whitelist** for controlled API access

### Advanced Features

#### Physics-Based Visualization
- **Matter.js integration** for realistic physics simulation
- **Custom rendering pipeline** using Canvas 2D context
- **3D sphere rendering** with radial gradients for depth perception
- **Dynamic sizing** based on stock performance metrics
- **Color-coded visualization** (green for gains, red for losses)
- **Interactive drag-and-drop** with mouse constraints
- **Collision detection** and boundary containment

#### Real-Time Data Management
- **Parallel API requests** using Promise.all for instant data fetching
- **Rate limit handling** with graceful degradation
- **Client-side caching** with localStorage for offline persistence
- **User-specific cache keys** for multi-user support
- **Optimistic UI updates** for better user experience

#### State Management
- **React Hooks** (useState, useEffect, useRef) for component state
- **Custom hooks** for token parsing and user authentication
- **Context API** for global theme state
- **Local storage integration** for data persistence
- **Efficient re-rendering** with proper dependency arrays

### API Integration
- **Finnhub API** for real-time stock market data
- **RESTful endpoints** with proper HTTP methods (GET, POST, PUT, DELETE)
- **Error handling** with appropriate status codes
- **Request validation** with express-validator
- **Async/await** patterns for clean asynchronous code

### DevOps & Tooling
- **npm workspaces** for monorepo management
- **Concurrent development** with concurrently package
- **TypeScript strict mode** for maximum type safety
- **ESLint** for code quality and consistency
- **Hot Module Replacement** for rapid development
- **Environment-based configuration** for dev/prod environments

### UI/UX Design
- **Modern dark mode** as default with light mode toggle
- **Responsive design** with mobile-first approach
- **CSS custom properties** for theming
- **Smooth animations** and transitions
- **Loading states** and error handling
- **Accessible UI** with proper ARIA labels and semantic HTML

---

## Technical Stack Summary

### Frontend
```
- React 18.2 (UI Library)
- TypeScript 5.2 (Type Safety)
- Vite 5.0 (Build Tool)
- React Router 6.20 (Routing)
- Matter.js (Physics Engine)
- Recharts 3.3 (Charts)
- @react-oauth/google (OAuth)
```

### Backend
```
- Node.js (Runtime)
- Express 4.18 (Web Framework)
- TypeScript 5.3 (Type Safety)
- MySQL2 3.15 (Database Driver)
- JWT 9.0 (Authentication)
- bcryptjs 2.4 (Password Hashing)
- google-auth-library 9.4 (OAuth)
```

### Development Tools
```
- npm workspaces (Monorepo)
- ESLint (Linting)
- Nodemon (Auto-reload)
- ts-node (TypeScript Execution)
- Concurrently (Parallel Scripts)
```

---

## Key Technical Achievements

### 1. Physics-Based Data Visualization
Implemented a unique stock visualization system using Matter.js physics engine where:
- Each stock is represented as a 3D sphere
- Ball size correlates with percentage change magnitude
- Real-time physics simulation with gravity, friction, and collision detection
- Custom Canvas rendering with radial gradients for 3D effect
- Interactive drag-and-drop functionality

### 2. Dual Authentication System
Built a flexible authentication system supporting:
- Traditional email/password with bcrypt hashing
- Google OAuth 2.0 integration
- Unified user model with nullable fields
- Account linking for existing users
- JWT token generation for both flows

### 3. Real-Time Data Pipeline
Optimized data fetching with:
- Parallel API requests using Promise.all
- Client-side caching with user-specific keys
- Graceful error handling and retry logic
- Rate limit detection and handling
- Instant UI updates with optimistic rendering

### 4. Database Architecture
Designed a scalable database schema with:
- Per-user watchlist isolation
- Favorite stocks functionality
- Efficient indexing strategy
- Connection pooling for performance
- Migration scripts for schema evolution

### 5. Type-Safe Full-Stack Development
Maintained type safety across the entire stack:
- Shared TypeScript interfaces
- Strict mode enabled
- Type-safe database queries with generics
- Proper error typing and handling
- Type guards for runtime validation

---

## Performance Optimizations

- **Parallel data fetching** reduces load time from 15+ seconds to < 2 seconds
- **Connection pooling** with 10 concurrent connections
- **Client-side caching** eliminates redundant API calls
- **Lazy loading** and code splitting potential
- **Optimized re-renders** with proper React patterns
- **Canvas rendering** for smooth 60 FPS physics simulation

---

## Scalability Considerations

- **Stateless JWT authentication** for horizontal scaling
- **Database connection pooling** for concurrent users
- **User-scoped data isolation** for multi-tenancy
- **Environment-based configuration** for different deployment targets
- **Modular architecture** with separation of concerns
- **RESTful API design** for easy integration and extension

---

## Future Enhancements

- WebSocket integration for true real-time updates
- Portfolio performance analytics and charts
- Stock comparison tools
- Price alerts and notifications
- Social features (share watchlists)
- Mobile app with React Native
- Advanced charting with technical indicators
- News sentiment analysis integration

---

## Development Workflow

```bash
# Install dependencies
npm run install:all

# Run development servers (frontend + backend)
npm run dev

# Frontend: http://localhost:3000
# Backend: http://localhost:5001
```

---

## Project Structure

```
tinvest/
├── frontend/              # React + TypeScript frontend
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Route components
│   │   ├── context/      # React Context providers
│   │   └── App.tsx       # Main application
│   └── package.json
├── backend/              # Express + TypeScript backend
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── config/       # Database configuration
│   │   └── index.ts      # Server entry point
│   └── package.json
└── package.json          # Root workspace config
```

---

## What Makes This Project Stand Out

1. **Innovative Visualization**: Physics-based stock visualization is unique and demonstrates creative problem-solving
2. **Full-Stack Proficiency**: Complete ownership from database to UI
3. **Modern Tech Stack**: Uses current industry-standard tools and patterns
4. **Security-First**: Implements best practices for authentication and data protection
5. **Performance-Focused**: Optimized for speed with parallel processing and caching
6. **Type Safety**: Comprehensive TypeScript usage across the entire stack
7. **Production-Ready**: Includes error handling, validation, and scalability considerations
8. **Clean Architecture**: Well-organized, maintainable codebase with separation of concerns

---

## Learning Outcomes

Through building Tinvest, I gained hands-on experience with:
- Full-stack TypeScript development
- Real-time data integration and API management
- Physics engine integration for creative visualizations
- OAuth 2.0 implementation and JWT authentication
- Database design and optimization
- Modern React patterns and hooks
- RESTful API design and implementation
- Security best practices for web applications
- Performance optimization techniques
- Monorepo management with npm workspaces

---

*Built with ❤️ using React, TypeScript, Node.js, Express, and MySQL*

