// =====================================================
// PDF 加密服務
// =====================================================
import qpdf from 'node-qpdf';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

/**
 * 加密 PDF
 * @param {Buffer} pdfBuffer - PDF Buffer
 * @param {string} password - 密碼
 * @returns {Promise<Buffer>} 加密後的 PDF Buffer
 */
export async function encryptPDF(pdfBuffer, password) {
  const startTime = Date.now();
  const tempInputPath = path.join(config.tempDir, `input-${Date.now()}.pdf`);
  const tempOutputPath = path.join(config.tempDir, `output-${Date.now()}.pdf`);

  try {
    // 確保臨時目錄存在
    await fs.mkdir(config.tempDir, { recursive: true });

    // 寫入臨時文件
    await fs.writeFile(tempInputPath, pdfBuffer);

    logger.info({ password: '***', tempInputPath }, 'Starting PDF encryption');

    // 使用 qpdf 加密（返回 Promise）
    const options = {
      keyLength: 256, // AES-256 加密
      password: password,
      outputFile: tempOutputPath,  // 輸出文件必須在 options 中
      restrictions: {
        print: 'full',
        modify: 'none',
        extract: 'n'
      }
    };

    await qpdf.encrypt(tempInputPath, options);

    // 讀取加密後的文件
    const encryptedBuffer = await fs.readFile(tempOutputPath);
    const processingTime = Date.now() - startTime;

    logger.info(
      {
        processingTime,
        inputSize: pdfBuffer.length,
        outputSize: encryptedBuffer.length
      },
      'PDF encrypted successfully'
    );

    return encryptedBuffer;
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Failed to encrypt PDF');
    throw new Error('Failed to encrypt PDF');
  } finally {
    // 清理臨時文件
    try {
      await fs.unlink(tempInputPath).catch(() => {});
      await fs.unlink(tempOutputPath).catch(() => {});
    } catch (err) {
      logger.warn({ error: err.message }, 'Failed to cleanup temp files');
    }
  }
}

/**
 * 設置 PDF 權限
 * @param {Buffer} pdfBuffer - PDF Buffer
 * @param {string} password - 密碼
 * @param {Object} permissions - 權限設置
 * @returns {Promise<Buffer>} 加密後的 PDF Buffer
 */
export async function encryptPDFWithPermissions(pdfBuffer, password, permissions = {}) {
  const tempInputPath = path.join(config.tempDir, `input-${Date.now()}.pdf`);
  const tempOutputPath = path.join(config.tempDir, `output-${Date.now()}.pdf`);

  try {
    // 確保臨時目錄存在
    await fs.mkdir(config.tempDir, { recursive: true });

    // 寫入臨時文件
    await fs.writeFile(tempInputPath, pdfBuffer);

    // 默認權限：可打印、不可修改、不可提取
    const defaultPermissions = {
      print: 'full',
      modify: 'none',
      extract: 'n',
      ...permissions
    };

    const options = {
      keyLength: 256,
      password: password,
      outputFile: tempOutputPath,  // 輸出文件必須在 options 中
      restrictions: defaultPermissions
    };

    await qpdf.encrypt(tempInputPath, options);

    // 讀取加密後的文件
    const encryptedBuffer = await fs.readFile(tempOutputPath);

    logger.info({ permissions: defaultPermissions }, 'PDF encrypted with permissions');

    return encryptedBuffer;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to encrypt PDF with permissions');
    throw new Error('Failed to encrypt PDF with permissions');
  } finally {
    // 清理臨時文件
    try {
      await fs.unlink(tempInputPath).catch(() => {});
      await fs.unlink(tempOutputPath).catch(() => {});
    } catch (err) {
      logger.warn({ error: err.message }, 'Failed to cleanup temp files');
    }
  }
}
