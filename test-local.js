// =====================================================
// 本地測試腳本
// =====================================================
// 用於測試 PDF 服務是否正常運作

import fs from 'fs';

console.log('🧪 PDF 服務本地測試');
console.log('='.repeat(50));

// 測試 1: 檢查必要依賴
console.log('\n1️⃣ 檢查依賴...');
try {
  await import('express');
  console.log('  ✅ express');

  await import('pdf-lib');
  console.log('  ✅ pdf-lib');

  await import('node-qpdf');
  console.log('  ✅ node-qpdf');

  await import('helmet');
  console.log('  ✅ helmet');

  await import('pino');
  console.log('  ✅ pino');
} catch (error) {
  console.error('  ❌ 依賴檢查失敗:', error.message);
  process.exit(1);
}

// 測試 2: 檢查配置
console.log('\n2️⃣ 檢查配置...');
try {
  const { config } = await import('./src/config/config.js');
  console.log('  ✅ 配置載入成功');
  console.log('    - PORT:', config.port);
  console.log('    - NODE_ENV:', config.nodeEnv);
  console.log('    - LOG_LEVEL:', config.logLevel);
} catch (error) {
  console.error('  ❌ 配置檢查失敗:', error.message);
  process.exit(1);
}

// 測試 3: 檢查服務模組
console.log('\n3️⃣ 檢查服務模組...');
try {
  await import('./src/services/passwordGen.js');
  console.log('  ✅ passwordGen');

  await import('./src/services/pdfWatermark.js');
  console.log('  ✅ pdfWatermark');

  await import('./src/services/pdfEncryption.js');
  console.log('  ✅ pdfEncryption');
} catch (error) {
  console.error('  ❌ 服務模組檢查失敗:', error.message);
  process.exit(1);
}

// 測試 4: 檢查路由
console.log('\n4️⃣ 檢查路由...');
try {
  await import('./src/routes/health.js');
  console.log('  ✅ health');

  await import('./src/routes/pdfRouter.js');
  console.log('  ✅ pdfRouter');
} catch (error) {
  console.error('  ❌ 路由檢查失敗:', error.message);
  process.exit(1);
}

// 測試 5: 檢查臨時目錄
console.log('\n5️⃣ 檢查臨時目錄...');
try {
  const tempDir = '/tmp/pdf-service';
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log('  ✅ 臨時目錄創建成功:', tempDir);
  } else {
    console.log('  ✅ 臨時目錄已存在:', tempDir);
  }
} catch (error) {
  console.error('  ❌ 臨時目錄檢查失敗:', error.message);
}

console.log('\n' + '='.repeat(50));
console.log('✅ 所有檢查通過！服務可以啟動。');
console.log('\n啟動命令:');
console.log('  npm start     # 生產模式');
console.log('  npm run dev   # 開發模式（自動重啟）');
console.log('\n測試健康檢查:');
console.log('  curl http://localhost:3001/health');
