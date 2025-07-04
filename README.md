# Open Toilet - Public Restroom Finder

A mobile-first web application that helps people find public restrooms with access codes.

## Features

- Interactive map showing nearby restrooms
- Community-driven restroom submissions
- Access code sharing and validation
- Anonymous usage

## Project Structure

```
open-toilet/
├── backend/     # Node.js/Express API server
├── frontend/    # React TypeScript web app
└── README.md
```

## Development Setup

### Prerequisites
- Node.js (v20+)
- npm

### Backend
```bash
cd backend
npm install
npm run dev
```
Server runs on http://localhost:3001

### Frontend
```bash
cd frontend
npm install
npm start
```
App runs on http://localhost:3000

## API Endpoints

- `GET /api/health` - Health check

## Deployment

This project is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Vercel will automatically build and deploy both frontend and backend
3. The frontend will be served as a static site
4. The backend API will be served as serverless functions

### Environment Variables

Set these in your Vercel dashboard:
- Add any required environment variables for production