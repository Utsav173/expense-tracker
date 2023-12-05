const express = require("express");
const {
  createTransaction,
  findTransactions,
  findIncomeAndExpense,
  getByCategory,
  deleteTransaction,
  editTransaction,
  getByField,
  findIncomeAndExpenseDuration,
  getFakeData,
  findOneTransaction,
} = require("../controllers/transactions");
const { authenticateToken } = require("../middlewares");
const transactionRoutes = express.Router();

transactionRoutes.post("/", authenticateToken, createTransaction);
transactionRoutes.get("/", authenticateToken, findTransactions);
transactionRoutes.get("/:id", authenticateToken, findOneTransaction);
transactionRoutes.delete("/:id", authenticateToken, deleteTransaction);
transactionRoutes.put("/:id", authenticateToken, editTransaction);
transactionRoutes.get(
  "/by/income/expense",
  authenticateToken,
  findIncomeAndExpense,
);
transactionRoutes.get("/by/category", authenticateToken, getByCategory);
transactionRoutes.get("/by/:field", authenticateToken, getByField);
transactionRoutes.get(
  "/by/income/expense/chart",
  authenticateToken,
  findIncomeAndExpenseDuration,
);
transactionRoutes.get("/fakeData/by", getFakeData);

module.exports = transactionRoutes;
