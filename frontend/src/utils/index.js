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
