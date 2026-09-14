/**
 * Utility to calculate real-time countdown for Same-Day Delivery cutoff in Asia/Kolkata (IST).
 */

export interface SameDayCountdownInfo {
  isBeforeCutoff: boolean;
  diffMinutes: number;
  hoursLeft: number;
  minutesLeft: number;
  countdownText: string;
  targetDeliveryTime: string;
  headline: string;
  mobileHeadline: string;
  subtext: string;
  cutoffDisplay: string;
}

export function getSameDayCountdownInfo(
  cutoffTimeStr: string = '17:00:00',
  targetDeliveryTime: string = '6:30 PM'
): SameDayCountdownInfo {
  let cutoffHour = 17;
  let cutoffMinute = 0;

  if (cutoffTimeStr) {
    const parts = cutoffTimeStr.split(':');
    if (parts.length >= 2) {
      cutoffHour = parseInt(parts[0], 10) || 17;
      cutoffMinute = parseInt(parts[1], 10) || 0;
    }
  }

  // Format cutoffDisplay (e.g. 5:00 PM)
  const cutoffAmPm = cutoffHour >= 12 ? 'PM' : 'AM';
  const cutoffH12 = cutoffHour % 12 || 12;
  const cutoffDisplay = `${cutoffH12}:${cutoffMinute < 10 ? '0' + cutoffMinute : cutoffMinute} ${cutoffAmPm}`;

  // Current time in Asia/Kolkata (IST)
  let currentHour = 12;
  let currentMinute = 0;

  try {
    const istTimeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).format(new Date());

    const [h, m] = istTimeStr.split(':').map(Number);
    if (!isNaN(h)) currentHour = h;
    if (!isNaN(m)) currentMinute = m;
  } catch {
    const now = new Date();
    currentHour = now.getHours();
    currentMinute = now.getMinutes();
  }

  const currentTotalMinutes = currentHour * 60 + currentMinute;
  const cutoffTotalMinutes = cutoffHour * 60 + cutoffMinute;
  const diffMinutes = cutoffTotalMinutes - currentTotalMinutes;

  if (diffMinutes > 0) {
    const hoursLeft = Math.floor(diffMinutes / 60);
    const minutesLeft = diffMinutes % 60;
    const countdownText =
      hoursLeft > 0
        ? `${hoursLeft} hr ${minutesLeft} min`
        : `${minutesLeft} min`;

    return {
      isBeforeCutoff: true,
      diffMinutes,
      hoursLeft,
      minutesLeft,
      countdownText,
      targetDeliveryTime,
      headline: `Order in next ${countdownText} to get this by ${targetDeliveryTime} today`,
      mobileHeadline: `Order in ${countdownText} to get by ${targetDeliveryTime}`,
      subtext: `Orders placed before ${cutoffDisplay} arrive today evening`,
      cutoffDisplay,
    };
  }

  return {
    isBeforeCutoff: false,
    diffMinutes: 0,
    hoursLeft: 0,
    minutesLeft: 0,
    countdownText: '',
    targetDeliveryTime,
    headline: `Order now to get this by ${targetDeliveryTime} tomorrow`,
    mobileHeadline: `Order now to get by ${targetDeliveryTime} tomorrow`,
    subtext: `Orders placed after ${cutoffDisplay} arrive tomorrow evening`,
    cutoffDisplay,
  };
}

export interface ExpressDeliveryInfo {
  isOpen: boolean;
  timeStr: string;
  headline: string;
  mobileHeadline: string;
  stickyHeadline: string;
}

/**
 * Calculates the real-time ETA for 20-minute Express Delivery in Asia/Kolkata (IST).
 * E.g., at 2:10 PM -> "2:30 PM", giving "20-Min Delivery · Get by 2:30 PM".
 */
export function getExpressDeliveryInfo(deliveryMinutes: number = 20): ExpressDeliveryInfo {
  let istHour = 12;
  let istMinute = 0;
  const now = new Date();

  try {
    const istTimeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).format(now);

    const [h, m] = istTimeStr.split(':').map(Number);
    if (!isNaN(h)) istHour = h;
    if (!isNaN(m)) istMinute = m;
  } catch {
    istHour = now.getHours();
    istMinute = now.getMinutes();
  }

  // Operating showroom window in IST: 9:00 AM to 9:00 PM
  const isShopOpen = istHour >= 9 && istHour < 21;

  if (isShopOpen) {
    const targetDate = new Date(now.getTime() + deliveryMinutes * 60 * 1000);
    let timeFormatted = '';
    try {
      timeFormatted = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(targetDate);
    } catch {
      let h = (istHour + Math.floor((istMinute + deliveryMinutes) / 60)) % 24;
      const m = (istMinute + deliveryMinutes) % 60;
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      timeFormatted = `${h}:${m < 10 ? '0' + m : m} ${ampm}`;
    }

    return {
      isOpen: true,
      timeStr: timeFormatted,
      headline: `20-Minute Express Delivery · Get by ${timeFormatted}`,
      mobileHeadline: `20-Min Delivery · Get by ${timeFormatted}`,
      stickyHeadline: `Get by ${timeFormatted} (~20 mins)`,
    };
  }

  if (istHour < 9) {
    return {
      isOpen: false,
      timeStr: '10:00 AM',
      headline: `Morning Express · Get today by 10:00 AM`,
      mobileHeadline: `Get today by 10:00 AM (Express)`,
      stickyHeadline: `Get today by 10:00 AM (Express)`,
    };
  }

  return {
    isOpen: false,
    timeStr: '10:00 AM tomorrow',
    headline: `Morning Express · Get tomorrow by 10:00 AM`,
    mobileHeadline: `Get tomorrow by 10:00 AM (Express)`,
    stickyHeadline: `Get tomorrow by 10:00 AM (Express)`,
  };
}

