const express = require("express");
const authRouter = express.Router();
const {
  signup,
  login,
  me,
  logout,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth");
const { authenticateToken } = require("../middlewares");
const multer = require("multer");
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

authRouter.post("/login", login);
authRouter.post("/signup", upload.single("profilePic"), signup);
authRouter.post("/logout", authenticateToken, logout);
authRouter.get("/me", authenticateToken, me);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);
authRouter.get("/test", (req, res) => {
  return res.send("test " + req.ip);
});

module.exports = authRouter;
