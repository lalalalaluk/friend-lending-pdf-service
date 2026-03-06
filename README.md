# PDF 加密與浮水印服務

這是一個獨立的 PDF 處理服務，為朋友借貸系統提供 PDF 加密和浮水印功能。

## 功能特性

- ✅ **PDF 加密**：使用 256-bit AES 加密
- ✅ **PDF 浮水印**：支持對角線和中央浮水印
- ✅ **密碼生成**：基於合約資訊自動生成密碼
- ✅ **API 認證**：API Key 驗證機制
- ✅ **請求限流**：防止濫用
- ✅ **結構化日誌**：使用 pino 記錄所有操作

## 技術棧

- **Node.js 20** - 運行環境
- **Express** - Web 框架
- **node-qpdf** - PDF 加密（包裝 qpdf）
- **pdf-lib** - PDF 浮水印
- **pino** - 高效能日誌
- **helmet** - 安全頭
- **express-rate-limit** - 請求限流

## 快速開始

### 本地開發

1. **安裝依賴**
```bash
npm install
```

2. **安裝 qpdf**（系統依賴）
```bash
# macOS
brew install qpdf

# Ubuntu/Debian
sudo apt-get install qpdf

# Alpine Linux (Docker)
apk add qpdf
```

3. **配置環境變數**
```bash
cp .env.example .env
# 編輯 .env 文件，設置你的 API_KEY 和 PDF_ENCRYPTION_SALT
```

4. **啟動服務**
```bash
npm run dev
```

服務將在 `http://localhost:3001` 啟動。

### Docker 本地測試

```bash
# 構建映像
docker build -t pdf-service .

# 運行容器
docker run -p 3001:3001 --env-file .env pdf-service
```

## API 文檔

### 處理 PDF（加密 + 浮水印）

**Endpoint:** `POST /api/pdf/process`

**Headers:**
```
Content-Type: application/json
X-API-Key: your-api-key
X-Request-ID: unique-request-id (optional)
```

**Request Body:**
```json
{
  "pdfBase64": "data:application/pdf;base64,JVBERi0xLjQK...",
  "contractId": "uuid",
  "contractNumber": "C20260130-0001",
  "watermarkConfig": {
    "text": "機密文件",
    "opacity": 0.3,
    "position": "diagonal"
  },
  "metadata": {
    "lenderName": "張三",
    "borrowerName": "李四",
    "signedDate": "2026-01-30"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "encryptedPdfBase64": "data:application/pdf;base64,JVBERi0xLjQK...",
    "password": "a1b2c3d4e5f6",
    "fileSize": 123456,
    "processingTime": 2000
  }
}
```

### 僅加密 PDF

**Endpoint:** `POST /api/pdf/encrypt`

**Request Body:**
```json
{
  "pdfBase64": "data:application/pdf;base64,JVBERi0xLjQK...",
  "contractId": "uuid",
  "contractNumber": "C20260130-0001"
}
```

### 僅添加浮水印

**Endpoint:** `POST /api/pdf/watermark`

**Request Body:**
```json
{
  "pdfBase64": "data:application/pdf;base64,JVBERi0xLjQK...",
  "watermarkConfig": {
    "text": "機密文件",
    "opacity": 0.3,
    "position": "diagonal"
  }
}
```

### 健康檢查

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-30T10:00:00.000Z",
  "uptime": 123.45,
  "environment": "production"
}
```

## Cloudflare Containers 部署

### 1. 準備工作

安裝 wrangler CLI 並登入 Cloudflare：

```bash
npm install -g wrangler
wrangler login
```

### 2. 部署步驟

1. **設定 Secrets**
   ```bash
   cd pdf-service
   wrangler secret put API_KEY
   wrangler secret put PDF_ENCRYPTION_SALT
   ```

2. **部署**
   ```bash
   npm run deploy
   # 或
   wrangler deploy
   ```

   Wrangler 會自動：
   - 構建 Docker 映像
   - 上傳到 Cloudflare
   - 部署 Worker + Container
   - 分配 URL

3. **取得服務 URL**

   部署成功後，Cloudflare 會提供一個 URL：
   ```
   https://friend-lending-pdf-service.<subdomain>.workers.dev
   ```

### 3. 測試部署

```bash
# 測試健康檢查
curl https://friend-lending-pdf-service.<subdomain>.workers.dev/health

# 測試 PDF 處理（需要 API Key）
curl -X POST https://friend-lending-pdf-service.<subdomain>.workers.dev/api/pdf/process \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"pdfBase64":"...","contractId":"...","contractNumber":"..."}'
```

## 整合到 Supabase Edge Function

在你的 Edge Function 中調用 PDF 服務：

```typescript
// supabase/functions/encrypt-and-upload-pdf/index.ts

const PDF_SERVICE = Deno.env.get('PDF_SERVICE_URL')!;
const PDF_SERVICE_API_KEY = Deno.env.get('PDF_SERVICE_API_KEY')!;

const response = await fetch(`${PDF_SERVICE}/api/pdf/process`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': PDF_SERVICE_API_KEY,
    'X-Request-ID': crypto.randomUUID()
  },
  body: JSON.stringify({
    pdfBase64: base64PDF,
    contractId,
    contractNumber,
    watermarkConfig: {
      text: '機密文件',
      opacity: 0.3,
      position: 'diagonal'
    },
    metadata: {
      lenderName,
      borrowerName,
      signedDate: new Date().toISOString()
    }
  })
});

const result = await response.json();

if (!result.success) {
  throw new Error('PDF processing failed');
}

const { encryptedPdfBase64, password } = result.data;
```

## 成本估算

Cloudflare Workers Paid Plan ($5/月) 包含：

- **Container 運行時間**：按秒計費
- **Scale-to-zero**：10 分鐘無請求自動休眠（不計費）
- **多個微服務共享** 同一個 $5/月 Plan

**實際場景估算：**
```
每次處理時間：2 秒
每月處理次數：10 次
Cold start：首次約 2-3 秒

結論：遠低於 $5/月的 Plan 上限
```

## 監控與日誌

### Cloudflare Dashboard 監控

Workers & Pages Dashboard 提供：
- 請求次數
- 錯誤率
- Container 狀態
- 實時日誌

### 查看日誌

```bash
# 使用 wrangler 查看即時日誌
wrangler tail
```

## 疑難排解

### qpdf 找不到

如果遇到 `qpdf: command not found` 錯誤：

1. 確認 Dockerfile 中有 `RUN apk add --no-cache qpdf`
2. 重新構建 Docker 映像

### 請求被限流

如果收到 `429 Too Many Requests`：

- 每個 IP 每分鐘最多 10 次請求
- 等待 1 分鐘後重試
- 或聯繫管理員調整限流設置

### 冷啟動慢

首次請求可能需要 2-3 秒冷啟動時間：

- 這是 Cloudflare Containers 的 scale-to-zero 機制（10 分鐘無請求後休眠）
- 後續請求會很快（<1 秒）
- Container 在活躍期間保持 warm 狀態

## 安全建議

1. **保護 API Key**：不要提交到 Git
2. **使用 HTTPS**：生產環境必須使用 HTTPS
3. **限制來源**：在 CORS 設置中限制允許的來源
4. **定期更新**：定期更新依賴套件
5. **監控日誌**：定期檢查異常請求

## 授權

MIT License
