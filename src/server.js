// =====================================================
// PDF 加密與浮水印服務 - 主服務器
// =====================================================
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { config, validateConfig } from './config/config.js';
import { logger } from './utils/logger.js';
import { authenticateApiKey } from './middleware/auth.js';
import { createRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import healthRouter from './routes/health.js';
import pdfRouter from './routes/pdfRouter.js';

// 驗證配置
try {
  validateConfig();
  logger.info('Configuration validated successfully');
} catch (error) {
  logger.error({ error: error.message }, 'Configuration validation failed');
  process.exit(1);
}

// 創建 Express 應用
const app = express();

// =====================================================
// 中間件
// =====================================================

// 安全頭
app.use(helmet());

// JSON 解析（限制 20MB）
app.use(express.json({ limit: '20mb' }));

// HTTP 日誌
app.use(pinoHttp({ logger }));

// CORS（允許所有來源，生產環境應限制）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Request-ID');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// =====================================================
// 路由
// =====================================================

// 健康檢查（不需要認證）
app.use('/health', healthRouter);

// PDF 處理 API（需要認證和限流）
app.use('/api/pdf', authenticateApiKey, createRateLimiter(), pdfRouter);

// =====================================================
// 錯誤處理
// =====================================================

// 404 處理
app.use(notFoundHandler);

// 全局錯誤處理
app.use(errorHandler);

// =====================================================
// 啟動服務器
// =====================================================

const port = config.port;

app.listen(port, '0.0.0.0', () => {
  logger.info(
    {
      port,
      environment: config.nodeEnv,
      nodeVersion: process.version
    },
    'PDF Service started successfully'
  );
});

// 優雅關閉
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// 未捕獲的異常
process.on('uncaughtException', (error) => {
  logger.fatal({ error: error.message, stack: error.stack }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'Unhandled rejection');
  process.exit(1);
});
