import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTotals } from './taxService.js';
import { assertDueDateRule, assertItems } from './documentRuleService.js';
import { validateCustomer, validateProduct } from './validationService.js';

test('private customer WHT is 3% when subtotal exceeds 1000', () => {
  const result = calculateTotals({
    customerType: 'private', docType: 'IN',
    items: [{ qty: 2, unit_price: 1000 }]
  });
  assert.equal(result.withholding_tax, 60);
  assert.equal(result.net_total, 1940);
});

test('private receipt includes transfer fee', () => {
  const result = calculateTotals({
    customerType: 'private', docType: 'RC',
    items: [{ qty: 1, unit_price: 500 }]
  });
  assert.equal(result.transfer_fee, 20);
  assert.equal(result.net_total, 480);
});

test('QT due date must be at least 15 days', () => {
  assert.throws(() => assertDueDateRule('QT', '2026-06-01', '2026-06-10'));
  assert.doesNotThrow(() => assertDueDateRule('QT', '2026-06-01', '2026-06-16'));
});

test('document requires positive item quantity', () => {
  assert.throws(() => assertItems([{ description: 'x', qty: 0, unit_price: 1 }]));
});

test('customer and product input is normalized', () => {
  assert.equal(validateCustomer({ name: '  Acme ', customer_type: 'private' }).name, 'Acme');
  assert.equal(validateProduct({ name: ' Service ', price: '100', stock_qty: '2' }).price, 100);
});
