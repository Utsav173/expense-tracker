const {
  Transaction,
  validateTransaction,
  validateEditTransaction,
} = require("../models/Transaction");
const { Account } = require("../models/Account");
const handleAnalytics = require("../utils/handleAnalytics");
const {
  getIntervalValue,
  getDurationLength,
  getDayOfWeekDate,
  getDayOfMonthDate,
  getMonthDate,
} = require("../utils");
const Joi = require("joi");
const { Analytics } = require("../models/Analytics");
const { default: mongoose } = require("mongoose");
const { Category } = require("../models/Category");
const Chance = require("chance");
const chance = new Chance(Math.random());
const xlsx = require("xlsx");

const createTransaction = async (req, res) => {
  try {
    const { error } = validateTransaction(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const { text, amount, isIncome, transfer, category, account } = req.body;
    const validBalance = await Account.findById(account);

    if (!validBalance) {
      return res.status(400).json({ message: "Account not found" });
    }

    if (validBalance.balance < 0) {
      return res.status(400).json({ message: "Insufficient Balance" });
    }

    if (isIncome === false && validBalance.balance - amount < 0) {
      return res.status(400).json({ message: "Insufficient Balance" });
    }

    const helperData = {
      account: account,
      user: req.user.id,
      isIncome: isIncome,
      amount: amount,
    };

    await Transaction.create({
      text,
      amount,
      isIncome,
      transfer,
      category,
      account,
      createdBy: req.user.id,
      updatedBy: req.user.id,
      owner: validBalance.owner,
      createdAt: new Date(req.body.createdAt),
    });
    await handleAnalytics(helperData);

    return res
      .status(200)
      .json({ message: "Transaction created successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const findTransactions = async (req, res) => {
  try {
    const { accountId, duration, page = 1, pageSize = 10, q } = req.query;

    if (!accountId) {
      return res.status(400).json({ message: "Account ID is required" });
    }

    let query = { account: accountId };

    if (duration) {
      const { startDate, endDate } = getIntervalValue(duration);
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    if (q && q.length > 0) {
      query.$or = [
        { text: { $regex: q, $options: "i" } },
        { transfer: { $regex: q, $options: "i" } },
        { amount: parseFloat(q) || undefined },
      ];
    }

    const totalCount = await Transaction.countDocuments(query);

    const transactionData = await Transaction.find(query)
      .populate("category", "_id name")
      .populate("createdBy", "_id name email profilePic")
      .populate("updatedBy", "_id name email profilePic")
      .select("_id createdAt updatedAt text amount isIncome transfer account")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(Number(pageSize));

    return res.status(200).json({
      totalCount,
      totalPages: Math.ceil(totalCount / Number(pageSize)),
      currentPage: Number(page),
      pageSize: Number(pageSize),
      transactions: transactionData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const findIncomeAndExpense = async (req, res) => {
  try {
    const accountId = req.query.accountId;
    const duration = req.query.duration;
    const { startDate, endDate } = getIntervalValue(duration);

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "start and end date is required" });
    }

    let matchQuery = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    if (accountId && mongoose.Types.ObjectId.isValid(accountId)) {
      matchQuery.account = new mongoose.Types.ObjectId(accountId);
    } else {
      matchQuery.owner = new mongoose.Types.ObjectId(req.user.id);
    }

    const result = await Transaction.aggregate([
      {
        $match: matchQuery,
      },
      {
        $lookup: {
          from: "users", // Replace with the actual user collection name
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
        },
      },
      {
        $project: {
          text: true,
          createdAt: true,
          amount: true,
          isIncome: true,
          createdBy: {
            _id: true,
            name: true,
          },
        },
      },
      {
        $sort: { createdAt: 1 },
      },
      {
        $facet: {
          income: [
            {
              $match: { isIncome: true },
            },
          ],
          expense: [
            {
              $match: { isIncome: false },
            },
          ],
        },
      },
      {
        $project: {
          totalIncome: { $sum: "$income.amount" },
          totalExpense: { $sum: "$expense.amount" },
          income: 1,
          expense: 1,
          balance: {
            $map: {
              input: "$income",
              as: "incomeItem",
              in: {
                $let: {
                  vars: {
                    expenseItem: {
                      $arrayElemAt: [
                        "$expense",
                        { $indexOfArray: ["$income", "$$incomeItem"] },
                      ],
                    },
                  },
                  in: {
                    $subtract: ["$$incomeItem.amount", "$$expenseItem.amount"],
                  },
                },
              },
            },
          },
        },
      },
    ]);

    return res.status(200).json(result[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const findIncomeAndExpenseDuration = async (req, res) => {
  try {
    const accountId = req.query.accountId;
    const duration = req.query.duration;
    const { startDate, endDate } = getIntervalValue(duration);

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "start and end date is required" });
    }

    let matchQuery = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    if (accountId && mongoose.Types.ObjectId.isValid(accountId)) {
      matchQuery.account = new mongoose.Types.ObjectId(accountId);
    } else {
      matchQuery.owner = new mongoose.Types.ObjectId(req.user.id);
    }

    let groupBy;
    if (duration === "thisWeek") {
      groupBy = { $dayOfWeek: "$createdAt" };
    } else if (duration === "thisMonth") {
      groupBy = { $dayOfMonth: "$createdAt" };
    } else if (duration === "thisYear") {
      groupBy = { $month: "$createdAt" };
    }

    const result = await Transaction.aggregate([
      {
        $match: matchQuery,
      },
      {
        $group: {
          _id: groupBy,
          totalIncome: {
            $sum: {
              $cond: {
                if: { $eq: ["$isIncome", true] },
                then: "$amount",
                else: 0,
              },
            },
          },
          totalExpense: {
            $sum: {
              $cond: {
                if: { $eq: ["$isIncome", false] },
                then: "$amount",
                else: 0,
              },
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    if (result.length === 0) {
      return res.status(200).json([]);
    }

    const formattedResult = result.map((item) => {
      let dateValue;
      if (duration === "thisWeek") {
        dateValue = getDayOfWeekDate(item._id);
      } else if (duration === "thisMonth") {
        dateValue = getDayOfMonthDate(item._id);
      } else if (duration === "thisYear") {
        dateValue = getMonthDate(item._id);
      }

      return {
        date: dateValue,
        income: item.totalIncome,
        expense: item.totalExpense,
        balance: item.totalIncome - item.totalExpense,
      };
    });

    return res.status(200).json(formattedResult);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const getByCategory = async (req, res) => {
  try {
    const { duration } = req.query;
    const { startDate, endDate } = getIntervalValue(duration);

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "start and end date are required" });
    }

    const result = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
          owner: new mongoose.Types.ObjectId(req.user.id),
        },
      },
      {
        $group: {
          _id: "$category",
          totalIncome: {
            $sum: { $cond: [{ $eq: ["$isIncome", true] }, "$amount", 0] },
          },
          totalExpense: {
            $sum: { $cond: [{ $eq: ["$isIncome", false] }, "$amount", 0] },
          },
        },
      },
      {
        $lookup: {
          from: "categories", // Replace with actual category collection name
          localField: "_id",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 0,
          name: "$categoryInfo.name",
          totalIncome: 1,
          totalExpense: 1,
        },
      },
    ]);

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const getByField = async (req, res) => {
  try {
    const { duration } = req.query;
    const { field } = req.params;
    const { startDate, endDate } = getIntervalValue(duration);

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "start and end date are required" });
    }

    const validateField = Joi.string()
      .required()
      .allow("amount", "transfer", "text", "isIncome")
      .label("Field");

    const { error } = validateField.validate(field);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const query = {
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
      owner: new mongoose.Types.ObjectId(req.user.id),
    };

    const result = await Transaction.aggregate([
      { $match: query },
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $project: { label: "$_id", count: 1, _id: 0 } },
    ]);

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const findOneTransaction = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({ message: "Transaction ID is required" });
    }

    const transactionData = await Transaction.findById(id)
      .populate({
        path: "category",
        select: "_id name",
      })
      .populate({
        path: "createdBy updatedBy",
        select: "_id name email profilePic",
      })
      .select("_id createdAt updatedAt text amount isIncome transfer account");

    if (!transactionData) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    return res.status(200).json(transactionData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({ message: "Transaction ID is required" });
    }

    const validTransaction = await Transaction.findById(
      id,
      "account amount isIncome createdBy"
    );

    if (!validTransaction) {
      return res.status(400).json({ message: "Transaction not found" });
    }

    if (req.user.id !== validTransaction.createdBy.toString()) {
      return res.status(403).json({
        message: "You are not authorized to delete this transaction",
      });
    }

    const accountData = await Account.findById(
      validTransaction.account,
      "balance"
    );
    const analyticsData = await Analytics.findOne(
      { account: validTransaction.account },
      "income expense balance"
    );

    const updatedAccountBalance = accountData.balance - validTransaction.amount;

    if (validTransaction.isIncome) {
      if (updatedAccountBalance < 0) {
        return res.status(400).json({ message: "Insufficient Balance" });
      }
    }

    await Account.findByIdAndUpdate(validTransaction.account, {
      balance: updatedAccountBalance,
    });

    if (validTransaction.isIncome) {
      const updatedIncome = analyticsData.income - validTransaction.amount;
      const updatedBalance = analyticsData.balance - validTransaction.amount;

      await Analytics.findOneAndUpdate(
        { account: validTransaction.account },
        { $set: { income: updatedIncome, balance: updatedBalance } }
      );
    } else {
      const updatedExpense = analyticsData.expense - validTransaction.amount;
      const updatedBalance = analyticsData.balance + validTransaction.amount;

      await Analytics.findOneAndUpdate(
        { account: validTransaction.account },
        { $set: { expense: updatedExpense, balance: updatedBalance } }
      );
    }

    await Transaction.findByIdAndDelete(id);

    return res
      .status(200)
      .json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const editTransaction = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Transaction ID is required" });
    }

    const { error } = await validateEditTransaction(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const transactionData = {
      text: req.body.text,
      amount: req.body.amount,
      isIncome: req.body.isIncome,
      transfer: req.body.transfer,
      category: req.body.category,
      updatedBy: req.user.id,
    };

    if (req.body.createdAt) {
      transactionData.createdAt = new Date(req.body.createdAt);
    }

    const validTransaction = await Transaction.findById(id);
    if (!validTransaction) {
      return res.status(400).json({ message: "Transaction not found" });
    }

    const validBalance = await Account.findById(validTransaction.account);
    const amountDifference = transactionData.amount - validTransaction.amount;
    const typeChanged = validTransaction.isIncome !== transactionData.isIncome;
    const amountChanged = amountDifference !== 0;

    let typeChange = 0;
    let amountChange = 0;

    if (typeChanged) {
      typeChange = transactionData.isIncome
        ? transactionData.amount
        : -transactionData.amount;
    } else if (amountChanged) {
      amountChange = transactionData.isIncome
        ? amountDifference
        : -amountDifference;
    }

    const totalChange = typeChange + amountChange;
    const updatedBalance = validBalance.balance + totalChange;

    if (totalChange !== 0 && updatedBalance < 0) {
      return res.status(400).json({ message: "Insufficient Balance" });
    }

    const updateOperations = {};

    if (typeChange !== 0) {
      const typeChangeField = transactionData.isIncome ? "income" : "expense";
      const typeChangeValue = Math.max(typeChange, 0);

      updateOperations[typeChangeField] = typeChangeValue;
      updateOperations.balance = typeChange;
    }

    if (amountChange !== 0) {
      const amountChangeField = transactionData.isIncome ? "income" : "expense";
      const amountChangeValue = Math.max(amountChange, 0);

      updateOperations[amountChangeField] = amountChangeValue;
      updateOperations.balance = amountChange;
    }

    if (Object.keys(updateOperations).length > 0) {
      await Analytics.findOneAndUpdate(
        { account: validTransaction.account },
        { $inc: updateOperations }
      );

      await Account.findByIdAndUpdate(validTransaction.account, {
        $inc: { balance: totalChange },
      });
    }

    const newUpatedd = await Transaction.updateOne(
      { _id: id },
      { $set: transactionData }
    );

    return res
      .status(200)
      .json({ message: "Transaction updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const getFakeData = async (req, res) => {
  try {
    const { duration, length } = req.query;
    let { startDate, endDate } = getIntervalValue(duration);

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "start and end date are required" });
    }

    if (!length) {
      return res.status(400).json({ message: "length is required" });
    }

    const catIds = await Category.find().distinct("name");

    const exportedArray = [];
    for (let index = 0; index < length; index++) {
      const randomIndex = Math.floor(Math.random() * catIds.length);
      const randomCategory = catIds[randomIndex];

      const randomAmount = (Math.random() * 10000).toFixed(2);

      // Generate random date between startDate and endDate
      const startDateObj = new Date(startDate);
      const endDateObj = new Date();

      const randomDate = new Date(
        startDateObj.getTime() +
          Math.random() * (endDateObj.getTime() - startDateObj.getTime())
      );

      const temp = {
        Text: `Transaction ${chance.cc_type()} ${index} ${chance.word()}`,
        Amount: randomAmount,
        Type: chance.bool() == true ? "Income" : "expense",
        Transfer: chance.name(),
        Category: randomCategory,
        Date: randomDate.toISOString(),
      };

      exportedArray.push(temp);
    }

    // convert exportedArray json to excel file and send to user with xlsx file
    // Convert exportedArray json to excel file
    const ws = xlsx.utils.json_to_sheet(exportedArray);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Transactions_data");
    const excelBuffer = xlsx.write(wb, { type: "buffer" });

    // Send the Excel file to the user
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Transactions_data.xlsx"
    );
    res.type("application/octet-stream");
    res.send(excelBuffer);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getByCategory,
  findIncomeAndExpense,
  createTransaction,
  findTransactions,
  getByField,
  findOneTransaction,
  deleteTransaction,
  editTransaction,
  findIncomeAndExpenseDuration,
  getFakeData,
};
