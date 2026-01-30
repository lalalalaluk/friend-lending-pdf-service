// =====================================================
// 密碼生成測試
// =====================================================
import { test } from 'node:test';
import assert from 'node:assert';
import { generatePDFPassword, generateRandomPassword } from '../../src/services/passwordGen.js';

test('generatePDFPassword should generate consistent password', () => {
  const contractId = 'test-uuid-123';
  const contractNumber = 'C20260130-0001';

  const password1 = generatePDFPassword(contractId, contractNumber);
  const password2 = generatePDFPassword(contractId, contractNumber);

  // 相同輸入應產生相同密碼
  assert.strictEqual(password1, password2);

  // 密碼長度應為 12
  assert.strictEqual(password1.length, 12);
});

test('generatePDFPassword should generate different passwords for different inputs', () => {
  const password1 = generatePDFPassword('uuid-1', 'C001');
  const password2 = generatePDFPassword('uuid-2', 'C002');

  // 不同輸入應產生不同密碼
  assert.notStrictEqual(password1, password2);
});

test('generateRandomPassword should generate password of specified length', () => {
  const password = generateRandomPassword(16);

  assert.strictEqual(password.length, 16);
});

test('generateRandomPassword should generate different passwords each time', () => {
  const password1 = generateRandomPassword();
  const password2 = generateRandomPassword();

  assert.notStrictEqual(password1, password2);
});
