/**
 * Currency formatting utility for InsuredYou
 * Supports Indian Rupee (₹) and US Dollar ($) with fallback to ₹
 */

export function getCurrencySymbol(policyOrItem?: any): string {
  if (!policyOrItem) return '₹';
  if (typeof policyOrItem === 'object' && policyOrItem.currency) {
    return policyOrItem.currency === 'INR' ? '₹' : policyOrItem.currency === 'USD' ? '$' : policyOrItem.currency;
  }
  const str = typeof policyOrItem === 'string' ? policyOrItem : JSON.stringify(policyOrItem);
  if (str.includes('$') || str.includes('USD')) {
    return '$';
  }
  return '₹';
}

export function formatCurrency(
  amount: number | string | undefined | null,
  policyOrItem?: any
): string {
  const num = Number(amount || 0);
  const symbol = getCurrencySymbol(policyOrItem);
  return `${symbol}${num.toLocaleString()}`;
}
