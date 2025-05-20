// This file is for general utility functions related to data formatting as per the frontend structure guide.
// You can add functions here for formatting dates, numbers, strings, etc. in a specific way for the UI.

// Example formatting function (can be expanded or modified)
export const formatCurrency = (amount, currency = 'THB') => {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: currency }).format(amount);
};

export const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};
