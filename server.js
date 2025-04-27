// server.js

// Importing required dependencies
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { OAuth2Client } = require('google-auth-library'); // Added for Google Auth

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // To handle JSON body data

// MongoDB Connection URI (You can replace it with your own MongoDB URI directly here)
const MONGO_URI = "mongodb+srv://arivu:1234@cluster0.jdkdlsa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";  // Replace with your actual MongoDB URI

// MongoDB connection setup using Mongoose
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Error connecting to MongoDB:", err));

// MongoDB User Schema
const userSchema = new mongoose.Schema({
  name: String,
  userId: String,
});

const User = mongoose.model("User", userSchema);

// POST Route: To save user data (name and userId)
app.post("/add-user", async (req, res) => {
  const { name, userId } = req.body;
  try {
    const newUser = new User({ name, userId });
    await newUser.save();
    res.status(201).json({ message: "User added successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Error adding user", error: err.message });
  }
});

// GET Route: To fetch user by userId
app.get("/get-user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ name: user.name });
  } catch (err) {
    res.status(500).json({ message: "Error fetching user", error: err.message });
  }
});

// POST Route: Google Register/Login
const client = new OAuth2Client('167652175288-rrsgo740sbsecv9tuond77vt05fsamfm.apps.googleusercontent.com'); // Replace with your actual Google Client ID

app.post('/google-auth', async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: '167652175288-rrsgo740sbsecv9tuond77vt05fsamfm.apps.googleusercontent.com', // Replace with your actual Google Client ID
    });

    const payload = ticket.getPayload();
    const { sub, email, name } = payload;

    let user = await User.findOne({ userId: sub });

    if (!user) {
      user = new User({
        name: name || email,
        userId: sub,
      });
      await user.save();
    }

    res.status(200).json({ message: "User authenticated successfully", name: user.name });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Invalid Google token", error: error.message });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('Hello, this is the backend server!');
});

// Start the Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
