// =====================================================
// 輸入驗證工具
// =====================================================
import { config } from '../config/config.js';

/**
 * 驗證 Base64 字串
 */
export function isValidBase64(str) {
  if (!str || typeof str !== 'string') {
    return false;
  }

  // Base64 正則表達式
  const base64Regex = /^data:application\/pdf;base64,([A-Za-z0-9+/=]+)$/;
  return base64Regex.test(str);
}

/**
 * 驗證 PDF 處理請求
 */
export function validateProcessPDFRequest(body) {
  const errors = [];

  // 必填字段
  if (!body.pdfBase64) {
    errors.push('pdfBase64 is required');
  } else if (!isValidBase64(body.pdfBase64)) {
    errors.push('pdfBase64 must be a valid base64-encoded PDF');
  }

  if (!body.contractId) {
    errors.push('contractId is required');
  }

  if (!body.contractNumber) {
    errors.push('contractNumber is required');
  }

  // 驗證 PDF 大小
  if (body.pdfBase64) {
    const base64Data = body.pdfBase64.split(',')[1];
    const sizeInBytes = (base64Data.length * 3) / 4;

    if (sizeInBytes > config.maxPdfSize) {
      errors.push(`PDF file too large (max ${config.maxPdfSize / 1024 / 1024}MB)`);
    }
  }

  // 驗證浮水印配置（可選）
  if (body.watermarkConfig) {
    const { text, opacity, position } = body.watermarkConfig;

    if (opacity !== undefined && (opacity < 0 || opacity > 1)) {
      errors.push('watermarkConfig.opacity must be between 0 and 1');
    }

    if (position && !['center', 'diagonal'].includes(position)) {
      errors.push('watermarkConfig.position must be "center" or "diagonal"');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 清理輸入字串（防止注入）
 */
export function sanitizeString(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }

  // 移除特殊字符，只保留字母、數字、中文、基本標點
  return str.replace(/[<>'"`;]/g, '');
}
