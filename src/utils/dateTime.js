export const addMinutes = (date, minutes) => {
  return new Date(date.getTime() + minutes * 60000);
};

export const addHours = (date, hours) => {
  return new Date(date.getTime() + hours * 60 * 60000);
};

export const addDays = (date, days) => {
  return new Date(date.getTime() + days * 24 * 60 * 60000);
};

export const isExpired = (expiryDate) => {
  return new Date() > new Date(expiryDate);
};

export const getExpiryDate = (minutes) => {
  return addMinutes(new Date(), minutes);
};
