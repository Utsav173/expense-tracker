const { Account, validateAccount } = require("../models/Account");
const { Analytics } = require("../models/Analytics");
const Joi = require("joi");
const nodemailer = require("nodemailer");
const { User } = require("../models/User");
const {
  predictFutureData,
  calculatePercentageChange,
  calculateTotalPercentageChange,
  getIntervalValue,
  calculateBalanceData,
} = require("../utils");
const { Transaction } = require("../models/Transaction");
const { default: mongoose } = require("mongoose");
const xlsx = require("xlsx");
const { ImportData } = require("../models/ImportData");
const { Category } = require("../models/Category");
const path = require("path");
const handleAnalytics = require("../utils/handleAnalytics");
const fs = require("fs");
const ejs = require("ejs");
const { default: puppeteer } = require("puppeteer");
require("dotenv").config();

const createAccount = async (req, res) => {
  try {
    const { error } = validateAccount(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const { name, balance } = req.body;
    // Create the account in the database
    const accountData = new Account({
      name,
      balance,
      owner: req.user.id,
      createdBy: req.user.id,
    });

    // Create analytics data for the account
    const analyticsData = await Analytics.create({
      account: accountData.id,
      balance,
      user: req.user.id,
      createdBy: req.user.id,
    });

    accountData.analytics = analyticsData.id;

    await accountData.save();

    return res.status(200).json({
      message: "Account created successfully",
      data: accountData,
    });
  } catch (error) {
    console.error(1, error.message);
    return res.status(500).json({ error: error.message });
  }
};

const editAccount = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, balance } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Account ID" });
    }

    // Define the validation schema
    const schema = Joi.object({
      name: Joi.string().required(),
      balance: Joi.number().required(),
      id: Joi.string().required(),
    });

    // Validate the data
    const { error } = schema.validate({ name, balance, id });

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Find the account with the given ID
    const accountData = await Account.findById(id);

    // If no account is found, return an error message
    if (!accountData) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Update the account with the new values from the request body
    await Account.findByIdAndUpdate(id, { name, balance });

    // Update the balance in the analytics collection (assuming you have an Analytics model)
    await Analytics.findOneAndUpdate({ account: id }, { balance });

    // Return a success response with a message
    return res.status(200).json({ message: "Account updated successfully" });
  } catch (error) {
    console.error(2, error);
    return res.status(500).json({ error: error.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Account ID is required" });
    }

    // Find the account with the given ID
    const accountData = await Account.findById(id);

    // If no account is found, return an error message
    if (!accountData) {
      return res.status(404).json({ message: "Account not found" });
    }

    // delete the account transactions
    await Transaction.deleteMany({ account: id });

    // Delete the analytics data
    await Analytics.deleteMany({ account: id });

    // Delete the account
    await Account.findByIdAndDelete(id);

    // Return a success response with a message
    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error(3, error.message);
    return res.status(500).json({ error: error.message });
  }
};

const findAccountOne = async (req, res) => {
  try {
    const id = req.params.id;

    // Check if the provided ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Account ID" });
    }

    const accountData = await Account.findById(id)
      .populate({
        path: "owner",
        select: "_id name email profilePic",
      })
      .populate("analytics")
      .select("_id name balance createdAt updatedAt createdBy updatedBy");

    if (!accountData) {
      return res.status(404).json({ message: "Account not found" });
    }

    return res.status(200).json(accountData);
  } catch (error) {
    console.error(4, error.message);
    return res.status(500).json({ error: error.message });
  }
};

const findBySearch = async (req, res) => {
  try {
    const searchTerm = req.query.q;

    if (!searchTerm || searchTerm.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const categories = await Category.find({
      name: { $regex: searchTerm, $options: "i" },
      owner: req.user.id,
    }).lean();
    const categoryIds = categories.map((category) => category._id);

    let customOR = {};

    if (!isNaN(parseFloat(searchTerm))) {
      customOR = {
        $or: [
          { amount: parseFloat(searchTerm) },
          { text: { $regex: searchTerm, $options: "i" } },
          { transfer: { $regex: searchTerm, $options: "i" } },
        ],
      };
    } else {
      customOR = {
        $or: [
          { text: { $regex: searchTerm, $options: "i" } },
          { transfer: { $regex: searchTerm, $options: "i" } },
        ],
      };

      if (categoryIds.length > 0) {
        customOR["$or"].push({ category: { $in: categoryIds } });
      }
    }

    const transactions = await Transaction.aggregate([
      {
        $match: {
          $and: [
            customOR,
            {
              $or: [
                { owner: new mongoose.Types.ObjectId(req.user.id) },
                { createdBy: new mongoose.Types.ObjectId(req.user.id) },
                { updatedBy: new mongoose.Types.ObjectId(req.user.id) },
              ],
            },
          ],
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          updatedAt: 1,
          text: 1,
          amount: 1,
          isIncome: 1,
          transfer: 1,
          account: 1,
          category: { $arrayElemAt: ["$categoryDetails", 0] },
        },
      },
    ]);
    return res.status(200).json(transactions);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

const findPreviousShare = async (req, res) => {
  try {
    const accountId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ message: "Account ID is required" });
    }

    const accountData = await Account.findById(accountId)
      .populate({
        path: "users",
        select: "_id name email profilePic",
      })
      .select("_id name users");

    return res.status(200).json(accountData);
  } catch (error) {
    console.error(5, error.message);
    return res.status(500).json({ error: error.message });
  }
};

const findUserAccounts = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(404).json({ message: "ID not found" });
    }

    // Define default values for pagination and sorting
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      search = "",
    } = req.query;

    // Construct the search condition
    const searchCondition = {
      owner: userId,
      $or: [{ name: { $regex: new RegExp(search, "i") } }],
    };

    // Find accounts with pagination and sorting
    const accountData = await Account.find(searchCondition)
      .populate({
        path: "owner",
        select: "_id name email profilePic",
      })
      .populate("analytics")
      .select("_id name balance createdAt")
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    if (!accountData || accountData.length === 0) {
      return res.status(404).json({ message: "Accounts not found" });
    }

    return res.status(200).json(accountData);
  } catch (error) {
    console.error(6, error.message);
    return res.status(500).json({ error: error.message });
  }
};

const userDropdown = async (req, res) => {
  try {
    const userData = await User.find({
      role: "user",
      _id: { $ne: req.user.id },
    }).select("id name email profilePic");
    return res.status(200).json(userData);
  } catch (error) {
    console.error(7, error.message);
    return res.status(500).json({ error: error.message });
  }
};

const shareAccount = async (req, res) => {
  try {
    const { accountId, userId } = req.body;
    const schema = Joi.object({
      accountId: Joi.string().required(),
      userId: Joi.string().required(),
    });
    const { error } = schema.validate({ accountId, userId });

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const isValidAccount = await Account.findById(accountId);

    if (!isValidAccount) {
      return res.status(404).json({ error: "Account not found" });
    }

    const isValidUser = await User.findById(userId);

    if (!isValidUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // check if the account is already shared with the user otherAccount field
    const isAccountShared = isValidUser.otherAccount.includes(accountId);

    if (isAccountShared) {
      return res
        .status(400)
        .json({ error: "Account is already shared with the user" });
    } else {
      isValidUser.otherAccount.push(accountId);

      //check user already share to same user by
      const isUserExist = isValidAccount.users.includes(userId);
      if (isUserExist) {
        return res
          .status(400)
          .json({ error: "Account is already shared with the user" });
      } else {
        isValidAccount.users.push(userId);
        await isValidAccount.save();
        await isValidUser.save();
      }

      const trapmail = {
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: "bde7259ba0b2a4",
          pass: "77b9c19e118ee0",
        },
      };

      const google = {
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USERNAME,
          pass: process.env.GMAIL_PASS,
        },
      };

      const transporter = nodemailer.createTransport(trapmail);
      // const acceptInviteUrl = `${req.protocol}://${req.headers.host}/api/account/invite/accept/${inviteData.id}`;
      const mailOptions = {
        from: "expenssManger1234@gmail.com",
        to: isValidUser.email,
        subject: "Invitation to account",
        html: `
              <!DOCTYPE html>
              <html lang="en">        
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Account Invitation</title>
              </head>        
              <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0;">        
                  <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 10px;">        
                      <h2 style="text-align: center; color: #007bff;">Account Invitation</h2>        
                      <p>Hello,</p>        
                      <p>Account ${isValidAccount.name} has been shared with you.</p>             
                  </div>        
              </body>        
              </html>
            `,
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.log(err);
        } else {
          // console.log(info.response);
        }
      });

      return res.status(200).json({ message: "Account shared successfully" });
    }
  } catch (error) {
    console.error(8, error.message);
    return res.status(500).json({ error: error.message });
  }
};

const findShareAccounts = async (req, res) => {
  try {
    const userId = req.user.id;

    const userData = await User.findById(userId);

    if (!userData || userData?.otherAccount?.length === 0) {
      return res.status(404).json([]);
    }

    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      search = "",
    } = req.query;

    // Construct the search condition
    let searchCondition = {
      _id: { $in: userData.otherAccount }, // Change 'id' to '_id'
    };

    if (search.length > 0) {
      searchCondition["$or"] = [{ name: { $regex: new RegExp(search, "i") } }];
    }

    // Find accounts with pagination and sorting
    const accountData = await Account.find(searchCondition)
      .populate({
        path: "owner",
        select: "_id name email profilePic",
      })
      .populate("analytics")
      .select("_id name balance createdAt")
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    if (accountData.length === 0 || !accountData) {
      return res.status(404).json({ message: "Accounts not found" });
    }

    return res.status(200).json(accountData);
  } catch (error) {
    console.error("000000000", error.message);
    return res.status(500).json({ error: error.message });
  }
};

const getCustomAnalytics = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Account ID" });
    }

    const duration = req.query.duration;

    if (!id || !duration) {
      return res.status(400).json({ message: "id and duration are required" });
    }

    const { startDate, endDate } = getIntervalValue(duration);

    const account = await Account.findById(id);

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const accountId = account._id;

    const db = mongoose.connection.db; // Access the native MongoDB database object

    const result = await db
      .collection("transactions")
      .aggregate([
        {
          $match: {
            account: new mongoose.Types.ObjectId(accountId), // Use mongoose.Types.ObjectId
            createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }, // Use new Date()
          },
        },
        {
          $group: {
            _id: null,
            totalIncome: {
              $sum: { $cond: [{ $eq: ["$isIncome", true] }, "$amount", 0] },
            },
            totalExpense: {
              $sum: { $cond: [{ $eq: ["$isIncome", false] }, "$amount", 0] },
            },
          },
        },
      ])
      .toArray();

    const analyticsData = result[0] || { totalIncome: 0, totalExpense: 0 };
    analyticsData.totalBalance =
      analyticsData.totalIncome - analyticsData.totalExpense;

    const totalIncome = await Transaction.find({
      account: accountId,
      createdAt: { $gte: startDate, $lte: endDate },
      isIncome: true,
    })
      .select("amount")
      .sort({ createdAt: 0 });

    const totalExpense = await Transaction.find({
      account: accountId,
      createdAt: { $gte: startDate, $lte: endDate },
      isIncome: false,
    })
      .select("amount")
      .sort({ createdAt: 0 });

    if (
      !totalIncome ||
      !totalExpense ||
      totalIncome.length < 2 ||
      totalExpense.length < 2
    ) {
      return res.status(200).json({});
    }

    const TIPChange = calculateTotalPercentageChange(totalIncome);
    const TEPChange = calculateTotalPercentageChange(totalExpense);

    const latestIncomeTransaction = totalIncome
      .slice(-3)
      .map((transaction) => transaction.amount);

    const predictedIncomes = predictFutureData(latestIncomeTransaction);
    const FIPChange = calculatePercentageChange(...predictedIncomes);

    const latestExpenseTransaction = totalExpense
      .slice(-3)
      .map((transaction) => transaction.amount);

    const predictedExpenses = predictFutureData(latestExpenseTransaction);
    const FEPChange = calculatePercentageChange(...predictedExpenses);

    const response = {
      income: analyticsData.totalIncome,
      expense: analyticsData.totalExpense,
      balance: analyticsData.totalBalance,
      IncomePercentageChange: parseFloat(TIPChange.toFixed(2)),
      futurePredictedIncome: predictedIncomes.map((e) =>
        parseFloat(e.toFixed(2))
      ),
      futureIncomePercentageChange: parseFloat(FIPChange.toFixed(2)),
      ExpensePercentageChange: parseFloat(TEPChange.toFixed(2)),
      futurePredictedExpense: predictedExpenses.map((e) =>
        parseFloat(e.toFixed(2))
      ),
      futureExpensePercentageChange: parseFloat(FEPChange.toFixed(2)),
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error(9, error);
    return res.status(500).json({ error: error.message });
  }
};

const importTransactions = async (req, res) => {
  try {
    const accountId = req.body.accountId;
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const validAccount = await Account.findById(accountId);
    if (!validAccount) {
      return res.status(404).json({ error: "Account not found" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return res.status(400).json({ error: "No sheets found in the workbook" });
    }
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      return res.status(400).json({ error: "No sheet found in the workbook" });
    }

    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    const requiredHeaders = [
      "Text",
      "Amount",
      "Type",
      "Transfer",
      "Category",
      "Date",
    ];
    const fileHeaders = Object.keys(jsonData[0]);

    // check if fileHeaders contains all requiredHeaders
    const containsAllHeaders = requiredHeaders.every((header) =>
      fileHeaders.includes(header)
    );

    if (!containsAllHeaders) {
      return res
        .status(400)
        .json({ error: "File headers do not contain all required headers" });
    }

    if (!containsAllHeaders) {
      return res
        .status(400)
        .json({ error: "File headers do not contain all required headers" });
    }

    const finalArray = [];
    let totalRecords = 0;
    let errorRecords = 0;

    for (const item of jsonData) {
      totalRecords++;

      const temp = {
        account: accountId,
        owner: req.user.id,
        createdBy: req.user.id,
        updatedBy: req.user.id,
      };

      for (const key in item) {
        if (requiredHeaders.includes(key)) {
          switch (key.toLowerCase()) {
            case "type":
              temp["isIncome"] =
                item[key].toLowerCase() === "income" ? true : false;
              break;
            case "date":
              temp["createdAt"] = new Date(item[key]) || new Date();
              break;
            case "category":
              // find category by name with regex pattern
              const isExist = await Category.findOne({
                name: { $regex: item[key], $options: "i" },
                $or: [
                  { owner: { $in: [null, undefined] } },
                  { owner: req.user.id },
                ],
              });
              if (isExist) {
                temp["category"] = isExist.id;
              } else {
                const categoryData = await Category.create({
                  name: item[key],
                  owner: req.user.id,
                });
                if (categoryData) {
                  temp["category"] = categoryData.id;
                } else {
                  errorRecords++; // Increment errorRecords for failed category creation
                }
              }
              break;
            default:
              temp[key.toLowerCase()] = item[key];
          }
        }
      }

      finalArray.push(temp);
    }

    const insertedData = {
      account: accountId,
      user: req.user.id,
      data: JSON.stringify(finalArray),
      totalRecords,
      errorRecords,
    };

    if (errorRecords > 0) {
      return res
        .status(400)
        .json({ error: "invalid data import during process" });
    }

    const data = await ImportData.create(insertedData);

    return res.status(200).json({
      message: "Data process successfully",
      successId: data.id,
      totalRecords,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

const getImprtedData = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const dataImport = await ImportData.findById(id);

    if (!dataImport || !dataImport.data) {
      return res.status(404).json({ message: "Data not found" });
    }

    const parsedData = JSON.parse(dataImport.data);

    const response = {
      length: parsedData.length,
      data: parsedData,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

const confirmImport = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const dataImport = await ImportData.findById(id);

    if (!dataImport) {
      return res.status(404).json({ message: "Data not found" });
    }
    const finalData = JSON.parse(dataImport.data);

    //loop over the data and create the transactions
    for (const item of finalData) {
      const helperData = {
        account: item.account,
        user: req.user.id,
        isIncome: item.isIncome,
        amount: item.amount,
      };
      await Transaction.create(item);
      await handleAnalytics(helperData);
    }
    return res.status(200).json({ message: "Data imported successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

const getSampleFile = async (req, res) => {
  try {
    // get file from public/sample and send it to the client
    return res
      .status(200)
      .sendFile(
        path.join(__dirname, "../public/sample/sample_transactions.xlsx")
      );
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

const fetchTransactionsByDateRange = async (startDate, endDate, accountId) => {
  try {
    const transactions = await Transaction.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
      account: accountId,
    })
      .populate("category")
      .populate("createdBy", "_id name email profilePic")
      .select("_id createdAt updatedAt text amount isIncome transfer account");

    return transactions;
  } catch (error) {
    throw new Error(error.message);
  }
};

const fetchRecentTransactions = async (numTransactions, accountId) => {
  try {
    const transactions = await Transaction.find({
      account: accountId,
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(numTransactions))
      .populate("category")
      .populate("createdBy", "_id name email profilePic")
      .select("_id createdAt updatedAt text amount isIncome transfer account");

    return transactions;
  } catch (error) {
    throw new Error(error.message);
  }
};

const fetchPreviousAnalytics = async (accountId) => {
  try {
    // Assuming you have an Analytics model
    const previousAnalytics = await Analytics.findOne({ account: accountId })
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order to get the most recent data
      .select("income expense"); // Select only the income and expense fields

    return previousAnalytics;
  } catch (error) {
    console.error(90, error);
    throw new Error("Error fetching previous analytics");
  }
};

const generateStatement = async (req, res) => {
  try {
    const { startDate, endDate, numTransactions } = req.query;
    const accountId = req.params.id;

    if (!startDate && !endDate && !numTransactions) {
      return res.status(400).json({
        message: "Please provide startDate, endDate, or numTransactions",
      });
    }

    const validAccount = await Account.findById(accountId);

    if (!validAccount) {
      return res.status(404).json({ message: "Account not found" });
    }

    let transactions;

    // Fetch transactions based on user input
    if (startDate && endDate) {
      transactions = await fetchTransactionsByDateRange(
        startDate,
        endDate,
        accountId
      );
    } else if (numTransactions) {
      transactions = await fetchRecentTransactions(numTransactions, accountId);
    }

    if (!transactions.length) {
      return res.status(404).json({ message: "No transactions found" });
    }

    // Calculate analytics
    const totalIncome = transactions.reduce((acc, transaction) => {
      if (transaction.isIncome) {
        return acc + transaction.amount;
      }
      return acc;
    }, 0);

    const totalExpense = transactions.reduce((acc, transaction) => {
      if (!transaction.isIncome) {
        return acc + transaction.amount;
      }
      return acc;
    }, 0);

    const balance = totalIncome - totalExpense;

    // Fetch previous analytics data
    const previousAnalytics = await fetchPreviousAnalytics(accountId);

    if (previousAnalytics) {
      const previousIncome = previousAnalytics.income;
      const previousExpense = previousAnalytics.expense;

      const incomePercentageChange =
        ((totalIncome - previousIncome) / previousIncome) * 100;
      const expensePercentageChange =
        ((totalExpense - previousExpense) / previousExpense) * 100;

      // Compile EJS template
      const ejsTemplate = fs.readFileSync(
        path.join(__dirname, "../public/template/statement.ejs"),
        "utf-8"
      );
      const html = ejs.render(ejsTemplate, {
        transactions,
        totalIncome,
        totalExpense,
        balance,
        incomePercentageChange,
        expensePercentageChange,
      });

      // Create PDF using Puppeteer
      const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage({ format: "A4" });
      await page.setContent(html);
      const pdfBuffer = await page.pdf();
      await browser.close();

      // Send the generated PDF to the user
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=statement.pdf"
      );
      res.send(pdfBuffer);
    }
  } catch (error) {
    console.error(97, error);
    return res.status(500).json({ error: error.message });
  }
};

const getDailyData = async (userId) => {
  try {
    // Group transactions by date using MongoDB aggregation
    const dailyData = await Transaction.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          income: {
            $sum: {
              $cond: [{ $eq: ["$isIncome", true] }, "$amount", 0],
            },
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ["$isIncome", false] }, "$amount", 0],
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const incomeData = [];
    const expenseData = [];
    const balanceData = [];

    dailyData.forEach((data) => {
      const formattedDate = new Date(data._id).getTime(); // Assuming _id holds the date
      incomeData.push({ x: formattedDate, y: data.income });
      expenseData.push({ x: formattedDate, y: data.expense });
      balanceData.push({ x: formattedDate, y: data.income - data.expense });
    });

    return { incomeData, expenseData, balanceData };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getDashBoardData = async (req, res) => {
  try {
    const userId = req.user.id;

    const accountInfo = await Account.find({ owner: userId })
      .populate("analytics")
      .select("-__v");
    const accountIds = accountInfo.map((account) => account._id);

    const transactionsCountByAccount = await Transaction.aggregate([
      {
        $match: {
          account: { $in: accountIds },
        },
      },
      {
        $group: {
          _id: "$account",
          transactionsCount: { $sum: 1 },
        },
      },
    ]);

    const totalTransaction = await Transaction.find({
      owner: userId,
    }).select("_id");

    const [
      mostExpensiveExpense,
      cheapestExpense,
      mostExpensiveIncome,
      cheapestIncome,
    ] = await Promise.all([
      Transaction.findOne({
        owner: userId,
        isIncome: false,
      })
        .sort({ amount: -1 })
        .limit(1),
      Transaction.findOne({
        owner: userId,
        isIncome: false,
      })
        .sort({ amount: 1 })
        .limit(1),
      Transaction.findOne({
        owner: userId,
        isIncome: true,
      })
        .sort({ amount: -1 })
        .limit(1),
      Transaction.findOne({
        owner: userId,
        isIncome: true,
      })
        .sort({ amount: 1 })
        .limit(1),
    ]);

    // Calculate chart data for income, expense, and balance
    const { incomeData, expenseData, balanceData } = await getDailyData(userId);

    let overallIncome = 0;
    let overallExpense = 0;
    let overallBalance = 0;
    let overallIncomePercentageChange = 0;
    let overallExpensePercentageChange = 0;

    if (accountInfo.length > 0) {
      overallIncome = accountInfo.reduce(
        (acc, account) => acc + parseFloat(account.analytics.income),
        0
      );
      overallExpense = accountInfo.reduce(
        (acc, account) => acc + parseFloat(account.analytics.expense),
        0
      );
      overallBalance = accountInfo.reduce(
        (acc, account) => acc + parseFloat(account.analytics.balance),
        0
      );

      overallIncome = parseFloat(overallIncome.toFixed(2));
      overallExpense = parseFloat(overallExpense.toFixed(2));
      overallBalance = parseFloat(overallBalance.toFixed(2));

      overallIncomePercentageChange = accountInfo.reduce(
        (acc, account) => acc + account.analytics.incomePercentageChange,
        0
      );

      overallExpensePercentageChange = accountInfo.reduce(
        (acc, account) => acc + account.analytics.expensePercentageChange,
        0
      );

      overallIncomePercentageChange /= accountInfo.length;
      overallExpensePercentageChange /= accountInfo.length;
    }

    const response = {
      accountsInfo: accountInfo,
      transactionsCountByAccount: transactionsCountByAccount.reduce(
        (obj, item) => {
          obj[item._id] = item.transactionsCount;
          return obj;
        },
        {}
      ),
      totalTransaction: totalTransaction.length,
      overallIncome: parseFloat(overallIncome.toFixed(2)),
      overallExpense: parseFloat(overallExpense.toFixed(2)),
      overallBalance: parseFloat(overallBalance.toFixed(2)),
      overallIncomePercentageChange: parseFloat(
        overallIncomePercentageChange.toFixed(2)
      ),
      overallExpensePercentageChange: parseFloat(
        overallExpensePercentageChange.toFixed(2)
      ),
      incomeChartData: incomeData,
      expenseChartData: expenseData,
      balanceChartData: balanceData,
      mostExpensiveExpense,
      cheapestExpense,
      mostExpensiveIncome,
      cheapestIncome,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error(97, error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  findAccountOne,
  findUserAccounts,
  createAccount,
  editAccount,
  deleteAccount,
  userDropdown,
  shareAccount,
  findShareAccounts,
  getCustomAnalytics,
  importTransactions,
  confirmImport,
  getSampleFile,
  generateStatement,
  findPreviousShare,
  findBySearch,
  getDashBoardData,
  getImprtedData,
};
