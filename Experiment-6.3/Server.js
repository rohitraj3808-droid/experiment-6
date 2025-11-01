const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// ============================================
// MONGODB CONNECTION
// ============================================
const MONGODB_URI = 'mongodb://localhost:27017/bankingDB';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✓ Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// ============================================
// USER SCHEMA AND MODEL
// ============================================
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  __v: {
    type: Number,
    default: 0
  }
}, {
  versionKey: '__v'
});

const User = mongoose.model('User', userSchema);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create initial users in database
 */
async function initializeUsers() {
  try {
    const count = await User.countDocuments();
    
    if (count === 0) {
      const users = [
        { name: 'Alice', balance: 1000, __v: 0 },
        { name: 'Bob', balance: 500, __v: 0 }
      ];
      
      await User.insertMany(users);
      console.log('✓ Initial users created');
    }
  } catch (error) {
    console.error('Error initializing users:', error);
  }
}

// Initialize users on startup
initializeUsers();

// ============================================
// API ENDPOINTS
// ============================================

/**
 * POST /create-users
 * Create sample users in database
 */
app.post('/create-users', async (req, res) => {
  try {
    // Clear existing users
    await User.deleteMany({});
    
    // Create new users
    const users = [
      { name: 'Alice', balance: 1000, __v: 0 },
      { name: 'Bob', balance: 500, __v: 0 }
    ];
    
    const createdUsers = await User.insertMany(users);
    
    res.status(201).json({
      message: 'Users created',
      users: createdUsers.map(user => ({
        name: user.name,
        balance: user.balance,
        _id: user._id.toString(),
        __v: user.__v
      }))
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating users',
      error: error.message
    });
  }
});

/**
 * POST /transfer
 * Transfer money from one user to another
 * Request body: { fromUserId, toUserId, amount }
 */
app.post('/transfer', async (req, res) => {
  try {
    const { fromUserId, toUserId, amount } = req.body;
    
    if (!fromUserId || !toUserId || !amount) {
      return res.status(400).json({ message: 'Missing required fields: fromUserId, toUserId, amount' });
    }
    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }
    if (fromUserId === toUserId) {
      return res.status(400).json({ message: 'Cannot transfer to same account' });
    }
    
    const sender = await User.findById(fromUserId);
    if (!sender) return res.status(404).json({ message: 'Sender account not found' });
    
    const receiver = await User.findById(toUserId);
    if (!receiver) return res.status(404).json({ message: 'Receiver account not found' });
    
    if (sender.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });
    
    sender.balance -= amount;
    await sender.save();
    
    receiver.balance += amount;
    await receiver.save();
    
    res.status(200).json({
      message: `Transferred $${amount} from ${sender.name} to ${receiver.name}`,
      senderBalance: sender.balance,
      receiverBalance: receiver.balance
    });
    
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid user ID format' });
    res.status(500).json({ message: 'Transfer failed', error: error.message });
  }
});

/**
 * GET /users
 * Get all users and their balances
 */
app.get('/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json({
      users: users.map(user => ({ _id: user._id.toString(), name: user.name, balance: user.balance, __v: user.__v }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

/**
 * GET /users/:id
 * Get specific user by ID
 */
app.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ _id: user._id.toString(), name: user.name, balance: user.balance, __v: user.__v });
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid user ID format' });
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

/**
 * DELETE /users
 * Delete all users (for testing)
 */
app.delete('/users', async (req, res) => {
  try {
    await User.deleteMany({});
    res.json({ message: 'All users deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting users', error: error.message });
  }
});

/**
 * GET /
 * API documentation
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Banking Transfer API',
    endpoints: {
      'POST /create-users': 'Create sample users (Alice and Bob)',
      'POST /transfer': 'Transfer money between accounts',
      'GET /users': 'Get all users',
      'GET /users/:id': 'Get specific user',
      'DELETE /users': 'Delete all users'
    },
    transferFlow: [
      '1. Create users with POST /create-users',
      '2. Note the user IDs from response',
      '3. Transfer with POST /transfer { fromUserId, toUserId, amount }',
      '4. Check balances with GET /users'
    ]
  });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`\n🚀 Banking API running on http://localhost:${PORT}`);
  console.log('\n📝 Quick Start:');
  console.log('1. POST /create-users - Create Alice and Bob');
  console.log('2. Copy user IDs from response');
  console.log('3. POST /transfer - Transfer money between accounts');
  console.log('\n💡 Make sure MongoDB is running on localhost:27017\n');
});

module.exports = app;