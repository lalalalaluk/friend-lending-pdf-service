# =====================================================
# PDF 加密與浮水印服務 - Dockerfile
# =====================================================

FROM node:20-alpine

# 安裝 qpdf（用於 PDF 加密）
RUN apk add --no-cache qpdf

# 設置工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴（僅 production）
RUN npm ci --only=production

# 複製源碼
COPY src/ ./src/

# 創建臨時目錄
RUN mkdir -p /tmp/pdf-service && chmod 777 /tmp/pdf-service

# 暴露端口
EXPOSE 3001

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 啟動服務
CMD ["node", "src/server.js"]
