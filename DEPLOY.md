# 快速部署指南

## 前置條件

- [x] Cloudflare 帳號（Workers Paid Plan, $5/月）
- [x] wrangler CLI 已安裝
- [x] 代碼已推送到 GitHub

## 部署步驟（5 分鐘）

### 1. 安裝 wrangler 並登入 (1 分鐘)

```bash
# 全域安裝 wrangler（如果還沒有）
npm install -g wrangler

# 登入 Cloudflare
wrangler login
```

### 2. 準備代碼 (1 分鐘)

```bash
# 確保在 pdf-service 目錄
cd pdf-service

# 檢查所有文件是否就緒
ls -la

# 應該看到：
# - Dockerfile
# - wrangler.jsonc
# - package.json
# - src/worker.js
# - src/server.js
# - .env.example
```

### 3. 設定 Secrets (1 分鐘)

```bash
# 設定敏感環境變數（會提示輸入值）
wrangler secret put API_KEY
wrangler secret put PDF_ENCRYPTION_SALT
```

**生成 API_KEY：**

```bash
openssl rand -hex 32
```

### 4. 部署 (2 分鐘)

```bash
# 部署（自動 build Docker + push + 部署 Worker）
npm run deploy
# 或
wrangler deploy
```

Wrangler 會自動：
- 構建 Docker 映像
- 上傳到 Cloudflare Container Registry
- 部署 Worker + Container
- 分配 URL：`https://friend-lending-pdf-service.<subdomain>.workers.dev`

### 5. 驗證部署

```bash
# 替換成你的 Cloudflare URL
curl https://friend-lending-pdf-service.<subdomain>.workers.dev/health
```

應該返回：
```json
{
  "status": "ok",
  "timestamp": "2026-01-30T...",
  "uptime": 123.45,
  "environment": "production"
}
```

**注意：** 首次請求可能需要 2-3 秒（cold start），之後會很快。

## 下一步：更新 Supabase Edge Function 環境變數

在 Supabase Dashboard → Edge Functions → Settings 更新：

```bash
PDF_SERVICE_URL=https://friend-lending-pdf-service.<subdomain>.workers.dev
```

請參考 [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) 了解完整整合流程。

## 故障排除

### 構建失敗

**症狀：** `wrangler deploy` 顯示 build error

**解決方案：**
1. 檢查 `Dockerfile` 是否存在
2. 確認 `wrangler.jsonc` 設定正確
3. 查看 build 日誌中的錯誤訊息

### Container 啟動失敗

**症狀：** 請求返回 502 或超時

**解決方案：**
1. 檢查 Secrets 是否都設定了：`wrangler secret list`
2. 查看日誌：`wrangler tail`
3. 確認 `API_KEY` 和 `PDF_ENCRYPTION_SALT` 已設定

### 健康檢查失敗

**症狀：** `curl /health` 返回錯誤

**解決方案：**
1. 確認 URL 正確（包含 https://）
2. 首次請求等待 2-3 秒（cold start）
3. 查看 `wrangler tail` 日誌

## 檢查清單

部署完成後，確認以下項目：

- [ ] `wrangler deploy` 成功
- [ ] Secrets 已設定（API_KEY, PDF_ENCRYPTION_SALT）
- [ ] 健康檢查通過 (`/health` 返回 200)
- [ ] Supabase Edge Function 的 `PDF_SERVICE_URL` 已更新
- [ ] 端到端測試通過（建立合約 → 簽名 → PDF 加密）

## 成本說明

Cloudflare Workers Paid Plan ($5/月) 包含：
- Container 運行時間按秒計費
- 10 分鐘無請求自動休眠（scale-to-zero）
- 多個微服務共享同一個 Plan

對於朋友借貸系統的使用量（估計每月 10-50 次），成本極低。

## 更新服務

```bash
cd pdf-service

# 修改代碼後，直接重新部署
npm run deploy
```

## 本地開發

```bash
# 使用 wrangler 本地模擬 Cloudflare 環境
npm run cf-dev

# 或直接用 Node.js 開發
npm run dev
```

## 需要幫助？

- Cloudflare Containers 文檔: https://developers.cloudflare.com/containers/
- PDF Service README: [README.md](./README.md)
- 整合指南: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
