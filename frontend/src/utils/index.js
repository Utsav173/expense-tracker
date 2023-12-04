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
