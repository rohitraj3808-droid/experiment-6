const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = 3000;

// Secret key for JWT signing (In production, use environment variable)
const JWT_SECRET = 'your_jwt_secret_key_here';

// Middleware to parse JSON bodies
app.use(express.json());

// ============================================
// MOCK DATABASE
// Simulating user database and account balances
// ============================================
const users = {
  'user1': {
    username: 'user1',
    password: 'password123',
    accountId: 'ACC001'
  }
};

// Account balances (in-memory storage)
const accounts = {
  'ACC001': {
    balance: 1000,
    owner: 'user1'
  }
};

// ============================================
// MIDDLEWARE: JWT Token Verification
// ============================================
const authenticateToken = (req, res, next) => {
  // Get the Authorization header
  const authHeader = req.headers['authorization'];
  
  // Check if Authorization header exists
  if (!authHeader) {
    return res.status(403).json({
      message: 'Invalid or expired token'
    });
  }
  
  // Extract token from "Bearer <token>"
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(403).json({
      message: 'Invalid or expired token'
    });
  }
  
  // Verify the token
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        message: 'Invalid or expired token'
      });
    }
    
    // Token is valid, attach user info to request
    req.user = decoded;
    next();
  });
};

// ============================================
// PUBLIC ROUTE: Login
// ============================================
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Validate input
  if (!username || !password) {
    return res.status(400).json({
      message: 'Username and password required'
    });
  }
  
  // Check if user exists and password matches
  const user = users[username];
  if (!user || user.password !== password) {
    return res.status(401).json({
      message: 'Invalid credentials'
    });
  }
  
  // Generate JWT token
  const token = jwt.sign(
    { 
      username: user.username,
      accountId: user.accountId
    },
    JWT_SECRET,
    { expiresIn: '1h' } // Token expires in 1 hour
  );
  
  res.status(200).json({
    token: token
  });
});

// ============================================
// PROTECTED ROUTE: Get Account Balance
// ============================================
app.get('/balance', authenticateToken, (req, res) => {
  const accountId = req.user.accountId;
  const account = accounts[accountId];
  
  if (!account) {
    return res.status(404).json({
      message: 'Account not found'
    });
  }
  
  res.status(200).json({
    balance: account.balance
  });
});

// ============================================
// PROTECTED ROUTE: Deposit Money
// ============================================
app.post('/deposit', authenticateToken, (req, res) => {
  const { amount } = req.body;
  const accountId = req.user.accountId;
  const account = accounts[accountId];
  
  // Validate amount
  if (!amount || amount <= 0) {
    return res.status(400).json({
      message: 'Invalid amount'
    });
  }
  
  if (!account) {
    return res.status(404).json({
      message: 'Account not found'
    });
  }
  
  // Process deposit
  account.balance += amount;
  
  res.status(200).json({
    message: `Deposited $${amount}`,
    newBalance: account.balance
  });
});

// ============================================
// PROTECTED ROUTE: Withdraw Money
// ============================================
app.post('/withdraw', authenticateToken, (req, res) => {
  const { amount } = req.body;
  const accountId = req.user.accountId;
  const account = accounts[accountId];
  
  // Validate amount
  if (!amount || amount <= 0) {
    return res.status(400).json({
      message: 'Invalid amount'
    });
  }
  
  if (!account) {
    return res.status(404).json({
      message: 'Account not found'
    });
  }
  
  // Check sufficient balance
  if (account.balance < amount) {
    return res.status(400).json({
      message: 'Insufficient balance'
    });
  }
  
  // Process withdrawal
  account.balance -= amount;
  
  res.status(200).json({
    message: `Withdrew $${amount}`,
    newBalance: account.balance
  });
});

// ============================================
// HOME ROUTE: API Documentation
// ============================================
app.get('/', (req, res) => {
  res.json({
    message: 'Banking API with JWT Authentication',
    endpoints: {
      login: 'POST /login - Get JWT token (username: user1, password: password123)',
      balance: 'GET /balance - View account balance (requires auth)',
      deposit: 'POST /deposit - Deposit money (requires auth)',
      withdraw: 'POST /withdraw - Withdraw money (requires auth)'
    },
    testCredentials: {
      username: 'user1',
      password: 'password123'
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Banking API running on http://localhost:${PORT}`);
  console.log('\n=== Test Credentials ===');
  console.log('Username: user1');
  console.log('Password: password123');
  console.log('Initial Balance: $1000');
  console.log('\n=== Testing Flow ===');
  console.log('1. POST /login to get JWT token');
  console.log('2. Use token in Authorization header: "Bearer <token>"');
  console.log('3. Access protected routes: /balance, /deposit, /withdraw');
});

module.exports = app;