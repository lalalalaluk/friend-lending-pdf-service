// =====================================================
// 錯誤處理中間件
// =====================================================
import { logger } from '../utils/logger.js';

/**
 * 全局錯誤處理中間件
 */
export function errorHandler(err, req, res, next) {
  // 記錄錯誤
  logger.error(
    {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip
    },
    'Unhandled error'
  );

  // 返回錯誤響應
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * 404 處理中間件
 */
export function notFoundHandler(req, res) {
  logger.warn({ path: req.path, method: req.method }, 'Route not found');

  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
}
