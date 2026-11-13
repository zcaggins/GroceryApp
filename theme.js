export const colors = {
  green: '#1F5E3B',
  greenLight: '#E6F0E9',
  orange: '#E07A2E',
  cream: '#FBF8F2',
  ink: '#1C1C1C',
  muted: '#6B6B6B',
  border: '#E5E0D6',
  white: '#FFFFFF',
  red: '#B3261E',
};

export const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;
