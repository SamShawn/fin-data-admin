#!/bin/bash
set -e

BASE_URL=${1:-http://localhost:3000}

echo "🚀 开始冒烟测试: $BASE_URL"

# 1. 检查后端健康状态
echo "Checking API Health..."
RESPONSE=$(curl -f -s "$BASE_URL/api/health")
echo "$RESPONSE" | grep -q '"status":"ok"' || (echo "❌ API 健康检查失败: $RESPONSE" && exit 1)

# 2. 模拟登录
echo "Checking Admin Login..."
TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.data.accessToken')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ 登录失败，未获取到 Token"
  exit 1
fi

# 3. 检查核心查询接口
echo "Checking Market Data Query..."
curl -f -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/market-data?limit=5" | grep -q '"hasMore":' || (echo "❌ 行情查询接口失败" && exit 1)

echo "✅ 冒烟测试全部通过！"
