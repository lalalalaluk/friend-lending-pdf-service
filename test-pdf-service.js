// =====================================================
// PDF 服務測試腳本
// =====================================================
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PDF_SERVICE_URL = 'http://localhost:3001';

/**
 * 創建一個簡單的測試 PDF（使用 pdf-lib）
 */
async function createTestPDF() {
  const { PDFDocument, rgb } = await import('pdf-lib');

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const { width, height } = page.getSize();

  page.drawText('Test Contract Document', {
    x: 50,
    y: height - 50,
    size: 20,
    color: rgb(0, 0, 0),
  });

  page.drawText('This is a test PDF for encryption.', {
    x: 50,
    y: height - 100,
    size: 12,
    color: rgb(0, 0, 0),
  });

  page.drawText('Contract Number: TEST-2026-001', {
    x: 50,
    y: height - 130,
    size: 12,
    color: rgb(0, 0, 0),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * 測試 PDF 服務
 */
async function testPDFService() {
  console.log('\n🧪 開始測試 PDF 服務...\n');

  try {
    // 1. 檢查服務健康狀態
    console.log('1️⃣ 檢查服務健康狀態...');
    const healthResponse = await fetch(`${PDF_SERVICE_URL}/health`);
    const healthData = await healthResponse.json();

    if (healthData.status !== 'ok') {
      throw new Error('服務不健康: ' + JSON.stringify(healthData));
    }
    console.log('✅ 服務健康狀態正常');
    console.log('   - 運行時間:', Math.floor(healthData.uptime), '秒');
    console.log('   - 環境:', healthData.environment);

    // 2. 創建測試 PDF
    console.log('\n2️⃣ 創建測試 PDF...');
    const testPdfBuffer = await createTestPDF();
    const testPdfBase64 = `data:application/pdf;base64,${testPdfBuffer.toString('base64')}`;
    console.log('✅ 測試 PDF 已創建');
    console.log('   - 大小:', testPdfBuffer.length, 'bytes');

    // 3. 調用 PDF 處理端點
    console.log('\n3️⃣ 調用 PDF 加密服務...');
    const processResponse = await fetch(`${PDF_SERVICE_URL}/api/pdf/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'dev-api-key-for-testing',
        'X-Request-ID': `test-${Date.now()}`
      },
      body: JSON.stringify({
        pdfBase64: testPdfBase64,
        contractId: 'test-contract-id-123',
        contractNumber: 'TEST-2026-001',
        watermarkConfig: {
          text: 'For Friend Lending Platform Use Only',
          opacity: 0.3,
          position: 'diagonal',
          date: '2026/01/30'
        },
        metadata: {
          lenderName: '測試出借人',
          borrowerName: '測試借款人',
          signedDate: new Date().toISOString()
        }
      })
    });

    if (!processResponse.ok) {
      const errorText = await processResponse.text();
      throw new Error(`服務返回錯誤 (${processResponse.status}): ${errorText}`);
    }

    const result = await processResponse.json();

    if (!result.success) {
      throw new Error('處理失敗: ' + (result.error || 'Unknown error'));
    }

    console.log('✅ PDF 加密成功');
    console.log('   - 處理時間:', result.data.processingTime, 'ms');
    console.log('   - 輸出大小:', result.data.fileSize, 'bytes');
    console.log('   - PDF 密碼:', result.data.password);

    // 4. 驗證返回的數據
    console.log('\n4️⃣ 驗證返回的數據...');

    if (!result.data.encryptedPdfBase64) {
      throw new Error('缺少加密後的 PDF');
    }

    if (!result.data.password) {
      throw new Error('缺少密碼');
    }

    if (result.data.password.length < 8) {
      throw new Error('密碼長度不足');
    }

    console.log('✅ 數據驗證通過');

    // 5. 保存加密後的 PDF 到本地（用於手動測試）
    console.log('\n5️⃣ 保存加密後的 PDF...');
    const encryptedBase64 = result.data.encryptedPdfBase64.split(',')[1];
    const encryptedBuffer = Buffer.from(encryptedBase64, 'base64');
    const outputPath = path.join(__dirname, 'test-output-encrypted.pdf');
    fs.writeFileSync(outputPath, encryptedBuffer);

    console.log('✅ 加密 PDF 已保存');
    console.log('   - 路徑:', outputPath);
    console.log('   - 密碼:', result.data.password);
    console.log('   - 提示: 使用 PDF 閱讀器打開此文件，輸入上述密碼進行驗證');

    // 6. 測試總結
    console.log('\n✅ ========================================');
    console.log('✅ 所有測試通過！PDF 服務運行正常');
    console.log('✅ ========================================\n');

    return true;

  } catch (error) {
    console.error('\n❌ ========================================');
    console.error('❌ 測試失敗:', error.message);
    console.error('❌ ========================================');

    if (error.stack) {
      console.error('\n錯誤堆疊:');
      console.error(error.stack);
    }

    return false;
  }
}

// 運行測試
testPDFService()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('未捕獲的錯誤:', error);
    process.exit(1);
  });
