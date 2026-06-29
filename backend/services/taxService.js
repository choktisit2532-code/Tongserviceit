export function calculateTotals({ customerType, docType, items }) {
  const subtotal = items.reduce((sum, item) => {
    const qty = Number(item.qty || 0);
    const unitPrice = Number(item.unit_price || 0);
    return sum + qty * unitPrice;
  }, 0);

  let withholdingTax = 0;
  let transferFee = 0;

  if (customerType === 'private' && subtotal > 1000) {
    withholdingTax = subtotal * 0.03;
  }

  if (customerType === 'government' && subtotal > 10000) {
    withholdingTax = subtotal * 0.03;
  }

  if (customerType === 'private' && docType === 'RC') {
    transferFee = 20;
  }

  const netTotal = subtotal - withholdingTax - transferFee;

  return {
    subtotal: round2(subtotal),
    withholding_tax: round2(withholdingTax),
    transfer_fee: round2(transferFee),
    net_total: round2(netTotal)
  };
}

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
