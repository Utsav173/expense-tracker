import toast from "react-hot-toast";

export const currencyFormat = (value, notation) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "INR",
    notation: notation,
  }).format(value);
};
export const dateFormater = (date) => {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(new Date(date));
};

export const calculateBalanceData = (data) => {
  const { income, expense } = data;

  const combinedData = [...income, ...expense].map((item) => ({
    x: new Date(item.createdAt).getTime(),
    y: item.amount,
    isIncome: item.isIncome,
  }));

  combinedData.sort((a, b) => a.x - b.x);

  const balanceData = [];
  let balance = 0;

  for (let i = 0; i < combinedData.length; i++) {
    const item = combinedData[i];

    if (i === 0 || item.x !== combinedData[i - 1].x) {
      balanceData.push({ x: item.x, y: parseFloat(balance.toFixed(2)) });
    }

    const parsedAmount = parseFloat(item.y.toFixed(2));
    balance = item.isIncome ? balance + parsedAmount : balance - parsedAmount;
  }

  return balanceData;
};

export const handleValidation = (formData) => {
  const { name, email, password } = formData;

  if (!name || !name.trim()) {
    toast.error("Name is required");
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !email.trim()) {
    toast.error("Email is required");
    return false;
  }
  if (!emailRegex.test(email.trim())) {
    toast.error("Please enter a valid email address");
    return false;
  }

  if (!password || !password.trim()) {
    toast.error("Password is required");
    return false;
  }
  if (password.trim().length < 8) {
    toast.error("Password should be at least 8 characters long");
    return false;
  }

  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password.trim())) {
    toast.error(
      "Password should contain at least one letter, one digit, and one special character",
    );
    return false;
  }

  return true;
};

export const validateForm = (email, password) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !email.trim()) {
    toast.error("Email is required");
    return false;
  }
  if (!emailRegex.test(email.trim())) {
    toast.error("Please enter a valid email address");
    return false;
  }
  if (!password || !password.trim()) {
    toast.error("Password is required");
    return false;
  }

  return true;
};

export const createTransactionValidation = (formData) => {
  try {
    const text = formData.get("text");
    const amount = formData.get("amount");
    const isIncome = formData.get("isIncome") === "true";
    const transfer = formData.get("transfer");
    const category = formData.get("category");

    if (!text || !text.trim()) {
      toast.error("Text is required");
      return false;
    }
    if (!amount || !amount.trim()) {
      toast.error("Amount is required");
      return false;
    }
    if (!category) {
      toast.error("Category is required");
      return false;
    }
    if (transfer && transfer.trim() === "") {
      toast.error("Transfer is required");
      return false;
    }
    if ((isIncome && amount < 0) || (!isIncome && amount > 0)) {
      toast.error("Invalid amount");
      return false;
    }
    return true;
  } catch (error) {
    console.log(error);
  }
};
