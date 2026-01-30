// =====================================================
// 請求限流中間件
// =====================================================
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';

/**
 * 創建請求限流器
 */
export const createRateLimiter = () => {
  return rateLimit({
    windowMs: 60 * 1000, // 1 分鐘
    max: 10, // 最多 10 次請求
    message: {
      success: false,
      error: 'Too many requests, please try again later.'
    },
    standardHeaders: true, // 返回 RateLimit-* headers
    legacyHeaders: false, // 禁用 X-RateLimit-* headers
    handler: (req, res) => {
      logger.warn(
        {
          ip: req.ip,
          path: req.path,
          limit: 10,
          window: '1 minute'
        },
        'Rate limit exceeded'
      );

      res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later.'
      });
    }
  });
};
