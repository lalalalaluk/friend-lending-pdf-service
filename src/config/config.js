// =====================================================
// 配置管理
// =====================================================
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // 服務器配置
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  // API 安全
  apiKey: process.env.API_KEY,

  // PDF 處理配置
  pdfEncryptionSalt: process.env.PDF_ENCRYPTION_SALT || 'default-salt-change-in-production',

  // 限制配置
  maxPdfSize: 10 * 1024 * 1024, // 10MB

  // 日誌配置
  logLevel: process.env.LOG_LEVEL || 'info',

  // 臨時文件目錄
  tempDir: '/tmp/pdf-service'
};

// 驗證必要的環境變數
export function validateConfig() {
  const errors = [];

  if (!config.apiKey && config.nodeEnv === 'production') {
    errors.push('API_KEY is required in production');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}
