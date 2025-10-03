export function getCurrentWeek() {
  const today = new Date();
  const year = today.getFullYear();
  const weekNumber = String(getWeekNumber(today)).padStart(2, '0');

  return `${year}-${weekNumber}`; // e.g. 2021-25, 2022-05
}

export function getPreviousWeek() {
  const today = new Date();
  const previousWeek = new Date(today);
  previousWeek.setDate(today.getDate() - 7);

  const year = previousWeek.getFullYear();
  const weekNumber = String(getWeekNumber(previousWeek)).padStart(2, '0');

  return `${year}-${weekNumber}`; // e.g. 2021-25, 2022-05
}

export function getTodayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Add leading zero for single-digit months
  const day = String(date.getDate()).padStart(2, '0'); // Add leading zero for single-digit days

  return `${year}-${month}-${day}`; // e.g. 2021-12-15, 2022-03-04
}

export function getYesterdayDate() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0'); // Add leading zero for single-digit months
  const day = String(yesterday.getDate()).padStart(2, '0'); // Add leading zero for single-digit days

  return `${year}-${month}-${day}`; // e.g. 2021-12-15, 2022-03-04
}

function getWeekNumber(date: Date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const millisecondsInWeek = 604800000; // 7 * 24 * 60 * 60 * 1000
  const weekNumber = Math.ceil(((date.getTime() - firstDayOfYear.getTime()) / millisecondsInWeek) + 1);

  if (weekNumber < 2) {
    return 1;
  }

  return weekNumber-1;
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}