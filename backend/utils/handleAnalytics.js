const { calculatePercentageChange } = require(".");
const { Account } = require("../models/Account");
const { Analytics } = require("../models/Analytics");
const { Transaction } = require("../models/Transaction");

const handleAnalytics = async function (payload) {
  try {
    const { account, user, isIncome, amount } = payload;
    const analytics = await Analytics.findOne({ account });
    const latestTransaction = await Transaction.findOne({
      account,
      createdBy: user,
      isIncome,
    }).sort({ createdAt: -1 });

    if (analytics && latestTransaction) {
      const { income, expense, balance } = analytics;
      const oldValue = isIncome ? income : expense;
      const parsedAmount = parseFloat(amount); // Convert amount to a number
      const newValue = parseFloat(oldValue) + parsedAmount;

      if (isNaN(parsedAmount)) {
        throw new Error("Invalid amount: not a number");
      }

      const percentageChange = calculatePercentageChange(oldValue, newValue);

      const updatedAnalytics = {
        updatedBy: user,
        [isIncome ? "income" : "expense"]: parseFloat(newValue.toFixed(2)),
        balance:
          parseFloat(balance) + (isIncome ? parsedAmount : -parsedAmount),
        [isIncome ? "previousIncome" : "previousExpense"]: parseFloat(
          parsedAmount.toFixed(2)
        ),
        [isIncome ? "incomePercentageChange" : "expensePercentageChange"]:
          percentageChange,
      };

      await Analytics.updateOne({ account }, updatedAnalytics);
      await Account.findByIdAndUpdate(account, {
        $inc: {
          balance: isIncome ? parsedAmount : -parsedAmount,
        },
      });
    }

    return "success";
  } catch (error) {
    console.log(error);
    return error;
  }
};

module.exports = handleAnalytics;
