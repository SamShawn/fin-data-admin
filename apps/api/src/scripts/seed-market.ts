/* eslint-disable no-console */

import { Client } from 'pg';

const STOCK_COUNT = 5000; // 5000 支股票
const START_DATE = '2023-01-01';
const DAYS = 200; // 生成约 200 个交易日 -> 约 100 万行数据

async function seed() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'fin',
    password: 'fin_dev',
    database: 'fin_data',
  });

  await client.connect();
  console.log('🚀 开始生成测试数据...');

  // 1. 生成 5000 支股票基础信息
  console.log('📈 生成股票基础信息...');
  const stockValues: string[] = [];
  const industries = ['银行', '电子', '医药', '汽车', '计算机', '食品饮料', '房地产'];
  const exchanges = ['SZ', 'SH', 'BJ'];

  for (let i = 1; i <= STOCK_COUNT; i++) {
    const code = `${String(i).padStart(6, '0')}.${exchanges[i % 3]}`;
    const name = `股票${i}`;
    const industry = industries[i % industries.length];
    stockValues.push(
      `('${code}', '${name}', '${exchanges[i % 3]}', '${industry}', '2020-01-01', 1)`,
    );
  }

  await client.query(
    `INSERT INTO stocks (stock_code, stock_name, exchange, industry, list_date, status) VALUES ${stockValues.join(',')}`,
  );

  // 2. 生成行情数据 (使用 COPY 协议，极速插入)
  console.log('🕒 生成行情数据 (100万行)...');

  // 注意：真正的百万级批量插入建议用 COPY，这里为了简单用批量 INSERT，每批 5000 条
  let totalRows = 0;
  const startDate = new Date(START_DATE);

  for (let d = 0; d < DAYS; d++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + d);

    // 跳过周末
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue;

    const dateStr = currentDate.toISOString().split('T')[0];
    const values: string[] = [];

    for (let s = 1; s <= STOCK_COUNT; s++) {
      const code = `${String(s).padStart(6, '0')}.${exchanges[s % 3]}`;
      const close = (Math.random() * 100 + 10).toFixed(4);
      const open = (Number(close) * (0.95 + Math.random() * 0.1)).toFixed(4);
      const high = (Math.max(Number(open), Number(close)) * (1 + Math.random() * 0.05)).toFixed(4);
      const low = (Math.min(Number(open), Number(close)) * (1 - Math.random() * 0.05)).toFixed(4);
      const volume = Math.floor(Math.random() * 100000000);
      const amount = (volume * Number(close)).toFixed(4);
      const pctChange = (Math.random() * 0.2 - 0.1).toFixed(4);
      const turnover = (Math.random() * 0.2).toFixed(4);

      values.push(
        `('${dateStr}', '${code}', ${open}, ${high}, ${low}, ${close}, ${volume}, ${amount}, ${pctChange}, ${turnover})`,
      );
    }

    // 分批插入，每批 1000 行
    const batchSize = 1000;
    for (let i = 0; i < values.length; i += batchSize) {
      const batch = values.slice(i, i + batchSize);
      await client.query(
        `INSERT INTO daily_quotes (trade_date, stock_code, open, high, low, close, volume, amount, pct_change, turnover_rate) VALUES ${batch.join(',')} ON CONFLICT DO NOTHING`,
      );
    }

    totalRows += values.length;
    if (d % 10 === 0) {
      console.log(`  已生成 ${dateStr}，累计 ${totalRows} 行...`);
    }
  }

  console.log(`✅ 测试数据生成完毕，共 ${totalRows} 行！`);
  await client.end();
}

seed().catch(console.error);
