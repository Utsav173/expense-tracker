const express = require("express");
const {
  createAccount,
  findUserAccounts,
  findAccountOne,
  editAccount,
  deleteAccount,
  userDropdown,
  shareAccount,
  findShareAccounts,
  getCustomAnalytics,
  importTransactions,
  getSampleFile,
  confirmImport,
  generateStatement,
  findPreviousShare,
  findBySearch,
  getDashBoardData,
  getImprtedData,
} = require("../controllers/accounts");
const { authenticateToken } = require("../middlewares");
const multer = require("multer");
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });
const accountRoutes = express.Router();

accountRoutes.post("/", authenticateToken, createAccount);
accountRoutes.get("/dashboard", authenticateToken, getDashBoardData);
accountRoutes.get("/", authenticateToken, findUserAccounts);
accountRoutes.get("/searchTerm", authenticateToken, findBySearch);
accountRoutes.get("/dropdown/user", authenticateToken, userDropdown);
accountRoutes.post("/share", authenticateToken, shareAccount);
accountRoutes.post(
  "/import/transaction",
  upload.single("document"),
  authenticateToken,
  importTransactions,
);
accountRoutes.get("/sampleFile/import", authenticateToken, getSampleFile);
accountRoutes.get("/get-shares", authenticateToken, findShareAccounts);
accountRoutes.get("/previous/share/:id", authenticateToken, findPreviousShare);
accountRoutes.post("/confirm/import/:id", authenticateToken, confirmImport);
accountRoutes.get(
  "/customAnalytics/:id",
  authenticateToken,
  getCustomAnalytics,
);
accountRoutes.get("/:id/statement", authenticateToken, generateStatement);
accountRoutes.put("/:id", authenticateToken, editAccount);
accountRoutes.delete("/:id", authenticateToken, deleteAccount);
accountRoutes.get("/:id", authenticateToken, findAccountOne);
accountRoutes.get("/get/import/:id", authenticateToken, getImprtedData);

module.exports = accountRoutes;
