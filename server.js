// server.js

// Importing required dependencies
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // To handle JSON body data

// MongoDB Connection URI (You can replace it with your own MongoDB URI directly here)
const MONGO_URI = "mongodb+srv://arivu:1234@cluster0.jdkdlsa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";  // Replace with your actual MongoDB URI
const PORT = 5000;  // Set the port to 5000 or any other port you prefer

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
    // Creating a new user and saving to MongoDB
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
    // Find user by userId in MongoDB
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ name: user.name });
  } catch (err) {
    res.status(500).json({ message: "Error fetching user", error: err.message });
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
