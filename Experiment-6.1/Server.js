const express = require('express');
const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// ============================================
// MIDDLEWARE 1: Request Logger
// Logs HTTP method, URL, and timestamp for every request
// ============================================
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  
  console.log(`[${timestamp}] ${method} ${url}`);
  
  // Call next() to pass control to the next middleware
  next();
};

// Apply logging middleware globally to all routes
app.use(requestLogger);

// ============================================
// MIDDLEWARE 2: Bearer Token Authentication
// Validates Authorization header with Bearer token
// ============================================
const authenticateToken = (req, res, next) => {
  // Get the Authorization header
  const authHeader = req.headers['authorization'];
  
  // Check if Authorization header exists
  if (!authHeader) {
    return res.status(401).json({
      message: 'Authorization header missing or incorrect'
    });
  }
  
  // Expected format: "Bearer mysecrettoken"
  const token = authHeader.split(' ')[1];
  
  // Validate the token
  if (token === 'mysecrettoken') {
    // Token is valid, proceed to the route
    next();
  } else {
    // Token is invalid
    return res.status(401).json({
      message: 'Authorization header missing or incorrect'
    });
  }
};

// ============================================
// ROUTES
// ============================================

// PUBLIC ROUTE - No authentication required
app.get('/public', (req, res) => {
  res.status(200).json({
    message: 'This is a public route. No authentication required.'
  });
});

// PROTECTED ROUTE - Requires Bearer token authentication
app.get('/protected', authenticateToken, (req, res) => {
  res.status(200).json({
    message: 'You have accessed a protected route with a valid Bearer token!'
  });
});

// Additional public route for testing
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the Express Middleware Demo',
    routes: {
      public: '/public - No authentication required',
      protected: '/protected - Requires Bearer token: mysecrettoken'
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('\nAvailable routes:');
  console.log(`  GET http://localhost:${PORT}/public (no auth required)`);
  console.log(`  GET http://localhost:${PORT}/protected (requires Bearer token)`);
  console.log('\nTest with curl:');
  console.log(`  curl http://localhost:${PORT}/public`);
  console.log(`  curl http://localhost:${PORT}/protected`);
  console.log(`  curl -H "Authorization: Bearer mysecrettoken" http://localhost:${PORT}/protected`);
});

module.exports = app;