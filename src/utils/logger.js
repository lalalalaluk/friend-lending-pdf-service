// =====================================================
// 日誌工具
// =====================================================
import pino from 'pino';
import { config } from '../config/config.js';

// 開發環境嘗試使用 pino-pretty，如果不可用則使用預設格式
let transport;
if (config.nodeEnv === 'development') {
  try {
    // 嘗試載入 pino-pretty
    await import('pino-pretty');
    transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    };
  } catch (e) {
    // pino-pretty 不可用，使用預設格式
    transport = undefined;
  }
}

export const logger = pino({
  level: config.logLevel,
  transport
});
