# 快速部署指南

## 前置條件

- [x] GitHub 帳號
- [x] Railway.app 帳號（用 GitHub 登入）
- [x] 代碼已推送到 GitHub

## 部署步驟（10 分鐘）

### 1. 準備代碼 (2 分鐘)

```bash
# 確保在 pdf-service 目錄
cd pdf-service

# 檢查所有文件是否就緒
ls -la

# 應該看到：
# - Dockerfile
# - railway.json
# - package.json
# - src/
# - .env.example
```

### 2. 推送到 GitHub (2 分鐘)

```bash
# 如果還沒有 Git 初始化
git init

# 添加所有文件
git add .

# 提交
git commit -m "Add PDF encryption and watermark service"

# 推送到 GitHub（替換成你的倉庫）
git remote add origin https://github.com/YOUR_USERNAME/friend-lending-system.git
git push origin main
```

### 3. 在 Railway 上部署 (3 分鐘)

1. **訪問 Railway**
   - 前往 https://railway.app
   - 點擊 "Login" → 選擇 "Login with GitHub"

2. **創建新專案**
   - 點擊 "New Project"
   - 選擇 "Deploy from GitHub repo"
   - 找到並選擇你的 `friend-lending-system` 倉庫
   - 點擊 "Deploy Now"

3. **Railway 自動偵測**
   - Railway 會自動偵測到 `Dockerfile`
   - 開始構建 Docker 映像
   - 等待構建完成（約 1-2 分鐘）

### 4. 設定環境變數 (2 分鐘)

在 Railway Dashboard 中：

1. 點擊你的專案
2. 點擊 "Variables" 標籤
3. 點擊 "New Variable"
4. 添加以下變數：

```bash
# 1. 生產環境
NODE_ENV=production

# 2. 端口（Railway 會自動設定，但也可以手動指定）
PORT=3001

# 3. API Key（⚠️ 重要：生成一個強隨機密鑰）
API_KEY=<點擊下方生成>

# 4. PDF 加密 Salt（⚠️ 重要：必須和 Supabase 一致）
PDF_ENCRYPTION_SALT=<使用和 Supabase 相同的值>

# 5. 日誌級別
LOG_LEVEL=info
```

**生成 API_KEY：**

在本地終端執行：
```bash
openssl rand -hex 32
```

複製生成的密鑰，貼到 Railway 的 `API_KEY` 變數中。

### 5. 取得服務 URL (1 分鐘)

1. 在 Railway Dashboard 中，點擊 "Settings" 標籤
2. 找到 "Domains" 部分
3. 點擊 "Generate Domain"
4. Railway 會自動生成一個 URL，例如：
   ```
   https://pdf-service-production-abc123.up.railway.app
   ```
5. **複製這個 URL**，稍後會用到

### 6. 驗證部署 (1 分鐘)

在終端測試健康檢查：

```bash
# 替換成你的 Railway URL
curl https://your-service.railway.app/health
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

✅ 如果看到這個響應，部署成功！

## 下一步：整合到 Supabase

請參考 [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) 了解如何將 PDF 服務整合到你的 Supabase Edge Function 中。

## 故障排除

### 構建失敗

**症狀：** Railway 顯示 "Build failed"

**解決方案：**
1. 檢查 `Dockerfile` 是否存在
2. 查看 Railway 的構建日誌
3. 確認 `package.json` 正確

### 服務啟動失敗

**症狀：** Railway 顯示 "Crashed"

**解決方案：**
1. 檢查環境變數是否都設定了
2. 查看 Railway 的運行日誌
3. 確認 `API_KEY` 和 `PDF_ENCRYPTION_SALT` 已設定

### 健康檢查失敗

**症狀：** `curl /health` 返回錯誤

**解決方案：**
1. 確認 URL 正確（包含 https://）
2. 等待幾秒鐘讓服務完全啟動
3. 檢查 Railway 的部署狀態

## 檢查清單

部署完成後，確認以下項目：

- [ ] Railway 專案創建成功
- [ ] Docker 映像構建成功
- [ ] 服務已啟動（狀態為 "Running"）
- [ ] 環境變數已設定（NODE_ENV, API_KEY, PDF_ENCRYPTION_SALT）
- [ ] 域名已生成
- [ ] 健康檢查通過 (`/health` 返回 200)
- [ ] 已複製 Railway URL 和 API_KEY（下一步整合需要）

## 成本預估

根據你的使用量：

| 使用量 | 月成本 |
|--------|--------|
| 10 次/月 | $0.00 |
| 100 次/月 | $0.05 |
| 1,000 次/月 | $0.50 |
| 10,000 次/月 | $5.00 |

Railway 提供 $5 免費額度/月，對於你的使用情況來說綽綽有餘。

## 更新服務

當你需要更新代碼時：

```bash
# 1. 修改代碼
# 2. 提交並推送
git add .
git commit -m "Update: your changes"
git push origin main

# 3. Railway 會自動重新部署
```

## 需要幫助？

- Railway 文檔: https://docs.railway.app
- PDF Service README: [README.md](./README.md)
- 整合指南: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)

---

🎉 恭喜！你的 PDF 加密和浮水印服務已經部署完成！
