const mongoose = require("mongoose");

const AnalyticsSchema = new mongoose.Schema(
  {
    account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    income: { type: Number, default: 0 },
    expense: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    previousIncome: { type: Number, default: 0 },
    previousExpense: { type: Number, default: 0 },
    previousBalance: { type: Number, default: 0 },
    incomePercentageChange: { type: Number, default: 100 },
    expensePercentageChange: { type: Number, default: 100 },
  },
  { timestamps: true },
);

module.exports.Analytics = mongoose.model("Analytics", AnalyticsSchema);
