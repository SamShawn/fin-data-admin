export interface SortKey {
  column: string;
  order: 'ASC' | 'DESC';
}

/**
 * 编码游标值（Base64）
 */
export function encodeCursor(values: unknown[]): string {
  return Buffer.from(JSON.stringify(values)).toString('base64url');
}

/**
 * 解码游标值
 */
export function decodeCursor(cursor: string): unknown[] {
  return JSON.parse(Buffer.from(cursor, 'base64url').toString());
}

/**
 * 构建多列排序的游标条件 SQL
 * 例如: (trade_date < '2024-01-15') OR (trade_date = '2024-01-15' AND stock_code > '000001.SZ')
 */
export function buildCursorCondition(
  sortKeys: SortKey[],
  cursorValues: unknown[],
  alias: string,
): { sql: string; params: Record<string, unknown> } {
  if (cursorValues.some((v) => v === null || v === undefined)) {
    return { sql: '1=1', params: {} };
  }

  const conditions: string[] = [];
  const params: Record<string, unknown> = {}; // 👈 改用对象存参数

  for (let i = 0; i < sortKeys.length; i++) {
    const parts: string[] = [];
    for (let j = 0; j < i; j++) {
      // 👇 使用命名参数 :p0, :p1 ...
      parts.push(`${alias}.${sortKeys[j].column} = :p${j}`);
      params[`p${j}`] = cursorValues[j];
    }

    const op = sortKeys[i].order === 'DESC' ? '<' : '>';
    parts.push(`${alias}.${sortKeys[i].column} ${op} :p${i}`);
    params[`p${i}`] = cursorValues[i];

    conditions.push(`(${parts.join(' AND ')})`);
  }

  return {
    sql: conditions.join(' OR '),
    params,
  };
}
