/**
 * Utility to calculate standard delivery dates from the current date,
 * displaying the exact expected delivery date like Flipkart / Amazon.
 */

export interface StandardDeliveryDateInfo {
  startDate: Date;
  endDate: Date;
  /** e.g. "Friday, 11 Sep" */
  formattedDate: string;
  /** e.g. "11 Sep, Friday" */
  flipkartFormat: string;
  /** e.g. "11–12 Sep" */
  rangeFormat: string;
  /** e.g. "Fri, 11 Sep" */
  shortFormat: string;
  /** e.g. "Delivery by Friday, 11 Sep" */
  deliveryByText: string;
}

export function getStandardDeliveryDateInfo(baseDate: Date = new Date(), deliveryDays: number = 3): StandardDeliveryDateInfo {
  const time = baseDate.getTime();
  const startDate = new Date(time + deliveryDays * 24 * 60 * 60 * 1000);
  const endDate = new Date(time + (deliveryDays + 2) * 24 * 60 * 60 * 1000);

  const timeZone = 'Asia/Kolkata';

  let startDay = '';
  let startMonth = '';
  let startDayName = '';
  let startShortDay = '';
  let endDay = '';
  let endMonth = '';

  try {
    startDay = new Intl.DateTimeFormat('en-IN', { timeZone, day: 'numeric' }).format(startDate);
    startMonth = new Intl.DateTimeFormat('en-IN', { timeZone, month: 'short' }).format(startDate);
    startDayName = new Intl.DateTimeFormat('en-IN', { timeZone, weekday: 'long' }).format(startDate);
    startShortDay = new Intl.DateTimeFormat('en-IN', { timeZone, weekday: 'short' }).format(startDate);

    endDay = new Intl.DateTimeFormat('en-IN', { timeZone, day: 'numeric' }).format(endDate);
    endMonth = new Intl.DateTimeFormat('en-IN', { timeZone, month: 'short' }).format(endDate);
  } catch {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    startDay = String(startDate.getDate());
    startMonth = months[startDate.getMonth()];
    startDayName = days[startDate.getDay()];
    startShortDay = shortDays[startDate.getDay()];

    endDay = String(endDate.getDate());
    endMonth = months[endDate.getMonth()];
  }

  const formattedDate = `${startDayName}, ${startDay} ${startMonth}`;
  const flipkartFormat = `${startDay} ${startMonth}, ${startDayName}`;
  const shortFormat = `${startShortDay}, ${startDay} ${startMonth}`;
  const rangeFormat = startMonth === endMonth
    ? `${startDay}–${endDay} ${startMonth}`
    : `${startDay} ${startMonth} – ${endDay} ${endMonth}`;

  const deliveryByText = `Delivery by ${formattedDate}`;

  return {
    startDate,
    endDate,
    formattedDate,
    flipkartFormat,
    rangeFormat,
    shortFormat,
    deliveryByText
  };
}
