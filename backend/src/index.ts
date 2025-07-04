import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database';
import restroomRoutes from './routes/restrooms';

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS to only allow requests from your frontend
const allowedOrigins = [
  'http://localhost:3000', // Local development
  'https://open-toilet.vercel.app', // Production domain
  'https://open-toilet-alexcjwei-alexcjweis-projects.vercel.app', // Your Vercel domain
  /^https:\/\/open-toilet-.*\.vercel\.app$/, // All Vercel URLs (previews and custom domains)
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or matches regex pattern
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      }
      return allowed.test(origin);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // Allow cookies if needed later
}));
app.use(express.json());

// Initialize database
initializeDatabase();

// Routes
app.use('/api/restrooms', restroomRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});