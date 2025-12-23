export const formatCurrency = (amount) => {
  if (isNaN(amount) || amount === null) return '₺0,00';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount);
}; 