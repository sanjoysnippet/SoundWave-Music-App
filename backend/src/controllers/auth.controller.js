const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

function makeToken(user) {
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email and password are required." });
    }
    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });
    const normalizedEmail = email.toLowerCase().trim();
    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({ message: "This email is already registered." });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ username: username.trim(), email: normalizedEmail, password: hashedPassword });
    return res.status(201).json({
      message: "Account created successfully",
      token: makeToken(user),
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error) { next(error); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }
    return res.json({
      message: "Login successful",
      token: makeToken(user),
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error) { next(error); }
}

function logout(_req, res) {
  res.json({ message: "Logged out successfully. Remove the token on the client." });
}

module.exports = { register, login, logout };
