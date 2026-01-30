// =====================================================
// PDF 處理路由
// =====================================================
import express from 'express';
import { validateProcessPDFRequest } from '../utils/validator.js';
import { generatePDFPassword } from '../services/passwordGen.js';
import { addWatermark } from '../services/pdfWatermark.js';
import { encryptPDF } from '../services/pdfEncryption.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/pdf/process
 * 處理 PDF（僅加密，浮水印已在前端照片上處理）
 */
router.post('/process', async (req, res) => {
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}`;
  const startTime = Date.now();

  try {
    logger.info({ requestId, body: { ...req.body, pdfBase64: '[REDACTED]' } }, 'Processing PDF request');

    // 1. 驗證輸入
    const validation = validateProcessPDFRequest(req.body);
    if (!validation.valid) {
      logger.warn({ requestId, errors: validation.errors }, 'Invalid request');
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: validation.errors
      });
    }

    const {
      pdfBase64,
      contractId,
      contractNumber,
      watermarkConfig = {},
      metadata = {}
    } = req.body;

    // 2. 解碼 Base64 PDF
    const base64Data = pdfBase64.split(',')[1];
    const pdfBuffer = Buffer.from(base64Data, 'base64');

    logger.info({ requestId, size: pdfBuffer.length }, 'PDF decoded');

    // 3. 生成密碼
    const password = generatePDFPassword(contractId, contractNumber);
    logger.info({ requestId, password: '***' }, 'Password generated');

    // 4. 加密 PDF（浮水印已在前端照片上處理，PDF 本身不需要浮水印）
    const encryptedPdf = await encryptPDF(pdfBuffer, password);
    logger.info({ requestId, size: encryptedPdf.length }, 'PDF encrypted');

    // 6. 轉換為 Base64
    const encryptedPdfBase64 = `data:application/pdf;base64,${encryptedPdf.toString('base64')}`;

    const processingTime = Date.now() - startTime;

    logger.info(
      {
        requestId,
        contractId,
        contractNumber,
        processingTime,
        inputSize: pdfBuffer.length,
        outputSize: encryptedPdf.length
      },
      'PDF encrypted successfully (watermarks already on images)'
    );

    // 7. 返回結果
    res.status(200).json({
      success: true,
      data: {
        encryptedPdfBase64,
        password,
        fileSize: encryptedPdf.length,
        processingTime
      }
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;

    logger.error(
      {
        requestId,
        error: error.message,
        stack: error.stack,
        processingTime
      },
      'Failed to process PDF'
    );

    res.status(500).json({
      success: false,
      error: 'Failed to process PDF',
      message: error.message
    });
  }
});

/**
 * POST /api/pdf/encrypt
 * 僅加密 PDF（不添加浮水印）
 */
router.post('/encrypt', async (req, res) => {
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}`;

  try {
    const { pdfBase64, contractId, contractNumber } = req.body;

    if (!pdfBase64 || !contractId || !contractNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // 解碼 Base64
    const base64Data = pdfBase64.split(',')[1];
    const pdfBuffer = Buffer.from(base64Data, 'base64');

    // 生成密碼
    const password = generatePDFPassword(contractId, contractNumber);

    // 加密
    const encryptedPdf = await encryptPDF(pdfBuffer, password);

    // 轉換為 Base64
    const encryptedPdfBase64 = `data:application/pdf;base64,${encryptedPdf.toString('base64')}`;

    res.status(200).json({
      success: true,
      data: {
        encryptedPdfBase64,
        password,
        fileSize: encryptedPdf.length
      }
    });
  } catch (error) {
    logger.error({ requestId, error: error.message }, 'Failed to encrypt PDF');

    res.status(500).json({
      success: false,
      error: 'Failed to encrypt PDF'
    });
  }
});

/**
 * POST /api/pdf/watermark
 * 僅添加浮水印（不加密）
 */
router.post('/watermark', async (req, res) => {
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}`;

  try {
    const { pdfBase64, watermarkConfig = {} } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({
        success: false,
        error: 'Missing pdfBase64'
      });
    }

    // 解碼 Base64
    const base64Data = pdfBase64.split(',')[1];
    const pdfBuffer = Buffer.from(base64Data, 'base64');

    // 添加浮水印
    const watermarkedPdf = await addWatermark(pdfBuffer, watermarkConfig);

    // 轉換為 Base64
    const watermarkedPdfBase64 = `data:application/pdf;base64,${watermarkedPdf.toString('base64')}`;

    res.status(200).json({
      success: true,
      data: {
        watermarkedPdfBase64: watermarkedPdfBase64,
        fileSize: watermarkedPdf.length
      }
    });
  } catch (error) {
    logger.error({ requestId, error: error.message }, 'Failed to add watermark');

    res.status(500).json({
      success: false,
      error: 'Failed to add watermark'
    });
  }
});

export default router;
