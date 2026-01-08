
export const getWeekInfo = (date: Date): { weekNumber: number; year: number } => {
  // Use UTC to avoid timezone issues
  const dateUtc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const currentYear = dateUtc.getUTCFullYear();

  let savingsYear = currentYear;
  let savingsYearStartDate = new Date(Date.UTC(savingsYear, 0, 5)); // Jan 5 of current year

  // If the date is before Jan 5th, it belongs to the previous savings year
  if (dateUtc < savingsYearStartDate) {
    savingsYear = currentYear - 1;
    savingsYearStartDate = new Date(Date.UTC(savingsYear, 0, 5)); // Jan 5 of previous year
  }

  // Calculate the difference in time (milliseconds)
  const timeDiff = dateUtc.getTime() - savingsYearStartDate.getTime();
  
  // Calculate the number of full days passed
  const daysPassed = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  
  // Calculate the week number (weeks start at 1)
  // Days 0-6 -> week 1
  const weekNumber = Math.floor(daysPassed / 7) + 1;

  return { weekNumber, year: savingsYear };
};

export const getCurrentYear = (): number => {
    // This correctly returns the current *savings* year based on the rule (starts Jan 5)
    return getWeekInfo(new Date()).year;
};

export const getMonthsPassed = (isoDateString: string, untilIsoDateString?: string): number => {
  const startDate = new Date(isoDateString);
  const currentDate = untilIsoDateString ? new Date(untilIsoDateString) : new Date();
  
  let months;
  months = (currentDate.getFullYear() - startDate.getFullYear()) * 12;
  months -= startDate.getMonth();
  months += currentDate.getMonth();
  
  // If the current day of the month is less than the start day, it's not a full month yet.
  if (currentDate.getDate() < startDate.getDate()) {
    months--;
  }
  
  // Interest is caused upfront, so we always count the first month.
  // If 0 months have fully passed, it's still the first month of the loan.
  return (months < 0 ? 0 : months) + 1;
};
