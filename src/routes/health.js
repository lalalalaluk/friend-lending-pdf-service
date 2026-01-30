// =====================================================
// 健康檢查路由
// =====================================================
import express from 'express';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /health
 * 健康檢查端點
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * GET /ready
 * 就緒檢查端點（用於 Kubernetes/Railway）
 */
router.get('/ready', (req, res) => {
  // 可以在這裡檢查依賴服務的狀態
  const isReady = true; // 簡化版本，直接返回就緒

  if (isReady) {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
