/**
 * 格式化金融大数字（万、亿）
 */
export function formatNumber(value: number | string | undefined | null): string {
  if (value === undefined || value === null || isNaN(Number(value))) return '-';
  const num = Number(value);

  if (Math.abs(num) >= 100000000) {
    return (num / 100000000).toFixed(2) + ' 亿';
  }
  if (Math.abs(num) >= 10000) {
    return (num / 10000).toFixed(2) + ' 万';
  }
  return num.toLocaleString();
}

/**
 * 格式化涨跌幅（带 +/- 号）
 */
export function formatPercent(value: number | string | undefined | null): string {
  if (value === undefined || value === null || isNaN(Number(value))) return '-';
  const num = Number(value) * 100;
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

/**
 * 获取涨跌颜色（红涨绿跌）
 */
export function getChangeColor(value: number | string | undefined | null): string {
  if (value === undefined || value === null || isNaN(Number(value))) return '#a1a1aa';
  const num = Number(value);
  if (num > 0) return '#f43f5e'; // 霓虹红
  if (num < 0) return '#10b981'; // 翡翠绿
  return '#a1a1aa'; // 灰色
}
