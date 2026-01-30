#!/bin/bash

# =====================================================
# API 測試腳本
# =====================================================
# 用於測試 PDF 服務 API

API_URL="${API_URL:-http://localhost:3001}"
API_KEY="${API_KEY:-dev-api-key-for-testing}"

echo "🧪 PDF 服務 API 測試"
echo "======================================================"
echo "API URL: $API_URL"
echo ""

# 測試 1: 健康檢查
echo "1️⃣ 測試健康檢查..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")

if [ "$HTTP_CODE" == "200" ]; then
  echo "  ✅ 健康檢查通過 (HTTP $HTTP_CODE)"
  curl -s "$API_URL/health" | python3 -m json.tool
else
  echo "  ❌ 健康檢查失敗 (HTTP $HTTP_CODE)"
  exit 1
fi

echo ""

# 測試 2: 沒有 API Key 的請求（應該失敗）
echo "2️⃣ 測試未認證請求（應該被拒絕）..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$API_URL/api/pdf/process" \
  -H "Content-Type: application/json" \
  -d '{}')

if [ "$HTTP_CODE" == "401" ] || [ "$HTTP_CODE" == "403" ]; then
  echo "  ✅ 未認證請求被正確拒絕 (HTTP $HTTP_CODE)"
else
  echo "  ⚠️  未認證請求返回: HTTP $HTTP_CODE"
fi

echo ""

# 測試 3: 無效請求（缺少必填字段）
echo "3️⃣ 測試無效請求（缺少必填字段）..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$API_URL/api/pdf/process" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{}')

if [ "$HTTP_CODE" == "400" ]; then
  echo "  ✅ 無效請求被正確拒絕 (HTTP $HTTP_CODE)"
else
  echo "  ⚠️  無效請求返回: HTTP $HTTP_CODE"
fi

echo ""
echo "======================================================"
echo "✅ 基礎 API 測試完成"
echo ""
echo "注意: 完整的 PDF 處理測試需要實際的 PDF 檔案。"
echo "      請使用以下命令手動測試 PDF 處理功能："
echo ""
echo "curl -X POST $API_URL/api/pdf/process \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'X-API-Key: $API_KEY' \\"
echo "  -d '{\"pdfBase64\":\"data:application/pdf;base64,...\",\"contractId\":\"test-uuid\",\"contractNumber\":\"C001\"}'"
