// Importing required dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const axios = require('axios');

// Initialize Express
const app = express();

// Middleware setup
app.use(cors({
  origin: 'http://localhost:3000', // Update with your frontend URL
  credentials: true
}));
app.use(express.json()); // Parse JSON bodies
app.use(cookieParser()); // Parse cookies

// MongoDB connection URI (Replace with your MongoDB URI)
const MONGO_URI = 'mongodb+srv://arivu:1234@cluster0.jdkdlsa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// MongoDB connection setup using Mongoose
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('Error connecting to MongoDB:', err));

// MongoDB User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  mobile: String,
  googleId: { type: String, unique: true }
});

const User = mongoose.model('User', userSchema);

// Google OAuth Client ID (Replace with your actual Google Client ID)
const GOOGLE_CLIENT_ID = '167652175288-rrsgo740sbsecv9tuond77vt05fsamfm.apps.googleusercontent.com';

// POST Route: Google OAuth login (Login/Register)
app.post('/google-auth', async (req, res) => {
  const { token } = req.body;

  try {
    // Verify the Google token
    const googleData = await axios.post(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    const { sub: googleId, name, email } = googleData.data;

    // Check if the user exists in the database
    let user = await User.findOne({ googleId });

    if (!user) {
      // If the user doesn't exist, create a new user
      user = new User({ name, email, googleId });
      await user.save();
    }

    // Generate a JWT token for session management
    const jwtToken = jwt.sign({ userId: user._id }, 'your-secret-key', { expiresIn: '1h' });

    // Send the JWT token as a cookie
    res.cookie('auth_token', jwtToken, { httpOnly: true, secure: true, sameSite: 'None' });
    
    res.status(200).json({ user, message: 'Login/Register successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error during Google authentication', error: err.message });
  }
});

// Middleware to check if the user is authenticated
const authMiddleware = (req, res, next) => {
  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(403).json({ message: 'Authentication required' });
  }

  jwt.verify(token, 'your-secret-key', (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.userId = decoded.userId;
    next();
  });
};

// GET Route: Fetch user profile (user-specific data)
app.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user profile', error: err.message });
  }
});

// PUT Route: Update user profile (editable fields like name, mobile)
app.put('/profile', authMiddleware, async (req, res) => {
  const { name, mobile } = req.body;
  try {
    const user = await User.findByIdAndUpdate(req.userId, { name, mobile }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
});

// POST Route: Add user data for other forms (e.g., name, userId)
app.post('/add-user', async (req, res) => {
  const { name, userId } = req.body;
  try {
    const newUser = new User({ name, userId });
    await newUser.save();
    res.status(201).json({ message: 'User added successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding user', error: err.message });
  }
});

// POST Route: Logout (clear session cookie)
app.post('/logout', (req, res) => {
  res.clearCookie('auth_token', { httpOnly: true, secure: true, sameSite: 'None' });
  res.status(200).json({ message: 'Logged out successfully' });
});

// Start the Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
