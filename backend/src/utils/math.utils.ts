/**
 * Calculates the average percentage change between consecutive numbers in an array.
 * Skips pairs where the 'previous' value is zero.
 * @param array - An array of numbers.
 * @returns The average percentage change, or 0 if no valid pairs are found.
 */
export function calcPercentageChange(array: number[]): number {
  if (!array || array.length < 2) {
    return 0; // Not enough data points to calculate change
  }

  let sumPercentageChange = 0;
  let validPairsCount = 0;

  for (let i = 1; i < array.length; i++) {
    const current = Number(array[i]);
    const previous = Number(array[i - 1]);

    // Ensure both are valid numbers and previous is not zero
    if (!isNaN(current) && !isNaN(previous) && previous !== 0) {
      const percentageChange = ((current - previous) / Math.abs(previous)) * 100;
      // Check if percentageChange is a valid number (might be NaN/Infinity if values are extreme)
      if (!isNaN(percentageChange) && isFinite(percentageChange)) {
        sumPercentageChange += percentageChange;
        validPairsCount++;
      } else {
        console.warn(
          `Skipping invalid percentage change calculation: current=${current}, previous=${previous}`,
        );
      }
    }
  }

  if (validPairsCount === 0) {
    return 0; // Avoid division by zero if no valid pairs were found
  }

  const finalChange = sumPercentageChange / validPairsCount;
  // Final check for NaN just in case
  return isNaN(finalChange) ? 0 : finalChange;
}
