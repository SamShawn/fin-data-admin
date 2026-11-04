import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // 爬坡
    { duration: '1m', target: 100 }, // 稳定
    { duration: '30s', target: 0 }, // 降坡
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 强制要求 P95 小于 200ms
    http_req_failed: ['rate<0.01'], // 错误率低于 1%
  },
};

// 这里需要你从系统里复制一个真实的 Token
const TOKEN = __ENV.TOKEN;

export default function () {
  const url = `${__ENV.BASE_URL}/api/market-data?limit=200&sort=pctChange:desc`;
  const res = http.get(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has items': (r) => JSON.parse(r.body).data.items.length > 0,
  });
  sleep(0.1);
}
