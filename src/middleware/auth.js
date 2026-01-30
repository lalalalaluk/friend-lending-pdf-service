// =====================================================
// API Key 認證中間件
// =====================================================
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

/**
 * API Key 驗證中間件
 */
export function authenticateApiKey(req, res, next) {
  // 開發環境跳過認證
  if (config.nodeEnv === 'development' && !config.apiKey) {
    logger.warn('API Key authentication disabled in development mode');
    return next();
  }

  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    logger.warn({ ip: req.ip, path: req.path }, 'Missing API key');
    return res.status(401).json({
      success: false,
      error: 'Missing API key'
    });
  }

  if (apiKey !== config.apiKey) {
    logger.warn({ ip: req.ip, path: req.path }, 'Invalid API key');
    return res.status(403).json({
      success: false,
      error: 'Invalid API key'
    });
  }

  // API Key 驗證成功
  next();
}
