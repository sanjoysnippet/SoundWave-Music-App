const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ message: "Please log in first." });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select("_id username email");
    if (!user) return res.status(401).json({ message: "User not found." });
    req.user = user;
    next();
  } catch (_error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}
module.exports = requireAuth;
