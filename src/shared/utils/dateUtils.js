/**
 * Format a date to a readable string
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  const d = new Date(date);
  const now = new Date();
  
  // Check if date is today
  if (d.toDateString() === now.toDateString()) {
    return formatTime(d);
  }
  
  // Check if date is yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${formatTime(d)}`;
  }
  
  // Check if date is within the last week
  const lastWeek = new Date(now);
  lastWeek.setDate(now.getDate() - 7);
  if (d > lastWeek) {
    return `${getDayName(d)} at ${formatTime(d)}`;
  }
  
  // Otherwise, show full date
  return `${d.toLocaleDateString()} at ${formatTime(d)}`;
};

/**
 * Format a time to a readable string
 * @param {Date} date - Date to format
 * @returns {string} Formatted time
 */
export const formatTime = (date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Get the name of the day from a date
 * @param {Date} date - Date to get day name from
 * @returns {string} Day name
 */
export const getDayName = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};
