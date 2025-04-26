import { format as formatDateFn } from 'date-fns';

export const fetchHistoricalPricesForSymbol = async (
  symbol: string,
  startDate: Date,
  endDate: Date,
): Promise<Map<string, number | null>> => {
  const priceMap = new Map<string, number | null>();
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Set to start of day for comparison

  // Compare only the date part
  const endDateOnly = new Date(endDate);
  endDateOnly.setHours(0, 0, 0, 0);

  if (endDateOnly > now) {
    console.warn(
      `Skipping historical fetch for ${symbol}: End date ${formatDateFn(
        endDate,
        'yyyy-MM-dd',
      )} is in the future relative to system time ${formatDateFn(now, 'yyyy-MM-dd HH:mm:ss')}.`,
    );
    return priceMap;
  }

  try {
    const period1 = Math.floor(startDate.getTime() / 1000);
    const period2 = Math.floor(endDate.getTime() / 1000);

    // Fetch daily data for the entire range
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        symbol,
      )}?period1=${period1}&period2=${period2}&interval=1d&events=history`,
    );

    if (!response.ok) {
      console.error(
        `Yahoo Historical API Error (${response.status}) for ${symbol} [${formatDateFn(
          startDate,
          'yyyy-MM-dd',
        )} - ${formatDateFn(endDate, 'yyyy-MM-dd')}]`,
      );
      // Don't throw, just return map possibly empty
      return priceMap;
    }

    const data = await response.json();

    if (
      !data.chart?.result?.[0]?.timestamp ||
      !data.chart.result[0].indicators?.quote?.[0]?.close
    ) {
      console.warn(`No valid historical data structure from Yahoo for ${symbol} in range.`);
      return priceMap;
    }

    const timestamps: number[] = data.chart.result[0].timestamp;
    const closePrices: (number | null)[] = data.chart.result[0].indicators.quote[0].close;

    for (let i = 0; i < timestamps.length; i++) {
      const date = new Date(timestamps[i] * 1000);
      const dateString = formatDateFn(date, 'yyyy-MM-dd');
      priceMap.set(dateString, closePrices[i]);
    }
  } catch (err) {
    console.error(
      `Failed to fetch historical data range for ${symbol}:`,
      err instanceof Error ? err.message : err,
    );
  }

  return priceMap;
};
