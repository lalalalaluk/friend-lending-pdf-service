# 整合指南：將 PDF 服務整合到 Supabase Edge Function

本指南說明如何將 Railway.app 上的 PDF 服務整合到現有的 Supabase Edge Function 中。

## 整合架構

```
Client (瀏覽器)
    ↓
    生成未加密 PDF
    ↓
Supabase Edge Function (encrypt-and-upload-pdf)
    ↓
    POST PDF 到 Railway PDF Service
    ↓
Railway PDF Service
    ├─ 添加浮水印
    ├─ 加密 PDF
    └─ 返回加密 PDF + 密碼
    ↓
Supabase Edge Function
    ↓
    上傳到 Supabase Storage
    ↓
    返回密碼給客戶端
```

## 步驟 1: 部署 PDF 服務到 Railway

### 1.1 推送代碼到 GitHub

```bash
cd pdf-service

# 初始化 Git（如果還沒有）
git init
git add .
git commit -m "Initial commit: PDF encryption and watermark service"

# 推送到 GitHub
git remote add origin https://github.com/YOUR_USERNAME/friend-lending-system.git
git push origin main
```

### 1.2 在 Railway 上部署

1. 訪問 https://railway.app
2. 使用 GitHub 登入
3. 點擊 "New Project" → "Deploy from GitHub repo"
4. 選擇 `friend-lending-system` 倉庫
5. Railway 會自動檢測到 Dockerfile 並開始構建

### 1.3 設定環境變數

在 Railway Dashboard → Settings → Variables 添加：

```bash
NODE_ENV=production
PORT=3001
API_KEY=<生成一個強隨機密鑰>
PDF_ENCRYPTION_SALT=<和 Supabase 一致的 Salt>
LOG_LEVEL=info
```

生成 API_KEY：
```bash
openssl rand -hex 32
```

### 1.4 取得服務 URL

部署成功後，Railway 會提供一個 URL：
```
https://pdf-service-production-xxxx.up.railway.app
```

複製這個 URL，下一步會用到。

## 步驟 2: 創建或修改 Supabase Edge Function

### 2.1 創建新的 Edge Function

```bash
cd supabase/functions
supabase functions new encrypt-and-upload-pdf
```

### 2.2 實作 Edge Function

編輯 `supabase/functions/encrypt-and-upload-pdf/index.ts`：

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RAILWAY_PDF_SERVICE = Deno.env.get('RAILWAY_PDF_SERVICE_URL')!;
const PDF_SERVICE_API_KEY = Deno.env.get('PDF_SERVICE_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 處理 CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. 從請求中取得 PDF 和合約資訊
    const {
      pdfBase64,
      contractId,
      contractNumber,
      watermarkConfig,
      metadata
    } = await req.json();

    console.log('📄 收到 PDF 處理請求:', { contractId, contractNumber });

    // 2. 發送到 Railway PDF Service 進行加密和浮水印
    console.log('🔄 發送到 PDF 服務進行處理...');

    const pdfServiceResponse = await fetch(`${RAILWAY_PDF_SERVICE}/api/pdf/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': PDF_SERVICE_API_KEY,
        'X-Request-ID': crypto.randomUUID()
      },
      body: JSON.stringify({
        pdfBase64,
        contractId,
        contractNumber,
        watermarkConfig: watermarkConfig || {
          text: '機密文件',
          opacity: 0.3,
          position: 'diagonal'
        },
        metadata
      })
    });

    if (!pdfServiceResponse.ok) {
      const errorText = await pdfServiceResponse.text();
      console.error('❌ PDF 服務處理失敗:', errorText);
      throw new Error(`PDF processing failed: ${errorText}`);
    }

    const result = await pdfServiceResponse.json();

    if (!result.success) {
      throw new Error(result.error || 'PDF processing failed');
    }

    console.log('✅ PDF 處理成功');

    const { encryptedPdfBase64, password, fileSize, processingTime } = result.data;

    // 3. 上傳加密的 PDF 到 Supabase Storage
    console.log('📤 上傳加密 PDF 到 Storage...');

    // 創建 Supabase 客戶端
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 從 Base64 解碼 PDF
    const base64Data = encryptedPdfBase64.split(',')[1];
    const pdfBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // 生成檔案路徑
    const timestamp = Date.now();
    const fileName = `${timestamp}_${contractNumber}.pdf`;
    const filePath = `contracts/${contractId}/${fileName}`;

    // 上傳到 Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('contracts')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ 上傳 PDF 失敗:', uploadError);
      throw uploadError;
    }

    console.log('✅ PDF 已上傳到 Storage:', filePath);

    // 4. 更新合約記錄
    const { error: updateError } = await supabaseClient
      .from('contracts')
      .update({
        contract_pdf_url: filePath
      })
      .eq('id', contractId);

    if (updateError) {
      console.error('❌ 更新合約記錄失敗:', updateError);
      throw updateError;
    }

    // 5. 生成簽名 URL
    const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
      .from('contracts')
      .createSignedUrl(filePath, 3600); // 1 小時有效

    if (signedUrlError) {
      console.error('❌ 生成簽名 URL 失敗:', signedUrlError);
      throw signedUrlError;
    }

    console.log('✅ Edge Function 處理完成');

    // 6. 返回結果
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          pdfUrl: signedUrlData.signedUrl,
          password: password,
          fileSize: fileSize,
          processingTime: processingTime
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Edge Function 錯誤:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
```

### 2.3 設定 Supabase 環境變數

在 Supabase Dashboard → Settings → Edge Functions → Secrets 添加：

```bash
RAILWAY_PDF_SERVICE_URL=https://pdf-service-production-xxxx.up.railway.app
PDF_SERVICE_API_KEY=<Railway 上設定的 API_KEY>
```

### 2.4 部署 Edge Function

```bash
supabase functions deploy encrypt-and-upload-pdf
```

## 步驟 3: 修改前端代碼

### 3.1 修改 `pdfGenerator.jsx`

```javascript
export const generateAndUploadPDF = async (contract, lenderName, privateData = null) => {
  try {
    console.log('開始生成 PDF...', contract.contract_number);

    // 1. 生成未加密的 PDF Blob
    const pdfBlob = await generatePDFBlob(contract, lenderName, privateData);

    // 2. 轉換為 Base64
    const base64PDF = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(pdfBlob);
    });

    console.log('調用 Edge Function 進行加密和上傳...');

    // 3. 調用 Edge Function（會自動調用 Railway PDF Service）
    const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions
      .invoke('encrypt-and-upload-pdf', {
        body: {
          pdfBase64: base64PDF,
          contractId: contract.id,
          contractNumber: contract.contract_number,
          watermarkConfig: {
            text: '機密文件',
            opacity: 0.3,
            position: 'diagonal'
          },
          metadata: {
            lenderName,
            borrowerName: contract.borrower_name,
            signedDate: new Date().toISOString()
          }
        }
      });

    if (edgeFunctionError) {
      console.error('Edge Function 調用失敗:', edgeFunctionError);
      throw edgeFunctionError;
    }

    if (!edgeFunctionData.success) {
      throw new Error(edgeFunctionData.error || 'PDF 處理失敗');
    }

    console.log('✅ PDF 加密和上傳成功');

    const { pdfUrl, password } = edgeFunctionData.data;

    // 返回 PDF URL 和密碼
    return { pdfUrl, password };

  } catch (error) {
    console.error('❌ 生成並上傳 PDF 失敗:', error);
    throw error;
  }
};
```

### 3.2 修改 `CreateContract.jsx`

```javascript
// 在合約創建成功後
const result = await generateAndUploadPDF(updatedContract, lenderName, privateData);

// 顯示密碼給用戶
setPdfPassword(result.password);

console.log('✅ 合約 PDF 已生成並加密');
console.log('   PDF 密碼:', result.password);
```

## 步驟 4: 測試整合

### 4.1 本地測試（可選）

如果要在本地測試，需要：

1. 啟動 PDF 服務：
```bash
cd pdf-service
npm start
```

2. 設定本地 Edge Function 環境變數：
```bash
# supabase/functions/.env
RAILWAY_PDF_SERVICE_URL=http://localhost:3001
PDF_SERVICE_API_KEY=dev-api-key-for-testing
```

3. 啟動 Supabase：
```bash
supabase start
```

### 4.2 端到端測試

1. 在前端創建一個新合約
2. 確認 PDF 生成成功
3. 確認收到 PDF 密碼
4. 嘗試下載並開啟 PDF（需要密碼）
5. 確認 PDF 有浮水印

### 4.3 檢查日誌

**Railway 日誌：**
- Railway Dashboard → Deployments → View Logs

**Supabase Edge Function 日誌：**
- Supabase Dashboard → Edge Functions → Logs

## 步驟 5: 監控和維護

### 5.1 設定告警

在 Railway Dashboard 設定告警：
- CPU 使用率 > 80%
- 內存使用率 > 80%
- 錯誤率 > 5%

### 5.2 定期檢查

- 每週檢查 Railway 日誌
- 每月檢查成本使用
- 每季度更新依賴套件

## 故障排除

### PDF 服務無響應

1. 檢查 Railway 服務狀態
2. 檢查環境變數是否正確
3. 查看 Railway 日誌

### Edge Function 調用失敗

1. 確認 RAILWAY_PDF_SERVICE_URL 正確
2. 確認 PDF_SERVICE_API_KEY 正確
3. 檢查 Edge Function 日誌

### PDF 加密失敗

1. 檢查 PDF_ENCRYPTION_SALT 是否一致
2. 確認 qpdf 已正確安裝在 Docker 中
3. 查看 Railway 日誌中的錯誤訊息

## 成本監控

定期檢查 Railway Dashboard 的成本使用：
- Project → Usage

預期成本：
- 每月 10 次處理：< $0.01
- 每月 100 次處理：< $0.10
- 每月 1000 次處理：< $1.00

## 完成！

現在你的 PDF 加密和浮水印功能已經完整整合到系統中了。🎉
