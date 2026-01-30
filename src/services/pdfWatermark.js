// =====================================================
// PDF 浮水印服務
// =====================================================
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import { logger } from '../utils/logger.js';

/**
 * 為 PDF 添加浮水印
 * @param {Buffer} pdfBuffer - PDF Buffer
 * @param {Object} watermarkConfig - 浮水印配置
 * @returns {Promise<Buffer>} 處理後的 PDF Buffer
 */
export async function addWatermark(pdfBuffer, watermarkConfig = {}) {
  const startTime = Date.now();

  try {
    const {
      text = 'For Friend Lending Platform Use Only',
      opacity = 0.3,
      position = 'diagonal',
      date = null
    } = watermarkConfig;

    // 如果有日期，添加到浮水印文字中
    const watermarkText = date
      ? `${text} - ${date}`
      : text;

    logger.info({ text: watermarkText, opacity, position }, 'Adding watermark to PDF');

    // 載入 PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    // 為每一頁添加浮水印
    for (const page of pages) {
      const { width, height } = page.getSize();
      const fontSize = 60;

      if (position === 'diagonal') {
        // 對角線浮水印
        page.drawText(watermarkText, {
          x: width / 2 - (watermarkText.length * fontSize) / 4,
          y: height / 2,
          size: fontSize,
          color: rgb(0.5, 0.5, 0.5),
          opacity: opacity,
          rotate: degrees(45)
        });
      } else {
        // 中央浮水印
        page.drawText(watermarkText, {
          x: width / 2 - (watermarkText.length * fontSize) / 4,
          y: height / 2,
          size: fontSize,
          color: rgb(0.5, 0.5, 0.5),
          opacity: opacity
        });
      }
    }

    // 儲存 PDF
    const watermarkedPdfBytes = await pdfDoc.save();
    const processingTime = Date.now() - startTime;

    logger.info({ processingTime, pages: pages.length }, 'Watermark added successfully');

    return Buffer.from(watermarkedPdfBytes);
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Failed to add watermark');
    throw new Error('Failed to add watermark to PDF');
  }
}

/**
 * 添加元數據到 PDF
 * @param {Buffer} pdfBuffer - PDF Buffer
 * @param {Object} metadata - 元數據
 * @returns {Promise<Buffer>} 處理後的 PDF Buffer
 */
export async function addMetadata(pdfBuffer, metadata = {}) {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    // 設置元數據
    if (metadata.title) pdfDoc.setTitle(metadata.title);
    if (metadata.author) pdfDoc.setAuthor(metadata.author);
    if (metadata.subject) pdfDoc.setSubject(metadata.subject);
    if (metadata.creator) pdfDoc.setCreator(metadata.creator);
    if (metadata.producer) pdfDoc.setProducer(metadata.producer);

    // 儲存 PDF
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to add metadata');
    throw new Error('Failed to add metadata to PDF');
  }
}
