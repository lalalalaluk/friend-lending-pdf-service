// =====================================================
// PDF 密碼生成服務
// =====================================================
import crypto from 'crypto';
import { config } from '../config/config.js';

/**
 * 生成 PDF 密碼
 * @param {string} contractId - 合約 UUID
 * @param {string} contractNumber - 合約編號
 * @returns {string} 12位密碼
 */
export function generatePDFPassword(contractId, contractNumber) {
  const data = `${contractId}-${contractNumber}-${config.pdfEncryptionSalt}`;
  const hash = crypto.createHash('sha256').update(data).digest('hex');

  // 取前12位作為密碼
  return hash.substring(0, 12);
}

/**
 * 生成隨機密碼（備用方案）
 * @param {number} length - 密碼長度
 * @returns {string} 隨機密碼
 */
export function generateRandomPassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    password += chars[randomIndex];
  }

  return password;
}
