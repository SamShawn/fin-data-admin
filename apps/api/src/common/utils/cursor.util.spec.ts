import { describe, it, expect } from 'vitest';
import { encodeCursor, decodeCursor, buildCursorCondition, SortKey } from './cursor.util';

describe('Cursor Pagination Utils', () => {
  it('应正确编码与解码游标数组', () => {
    const values = ['2024-01-15', '000001.SZ'];
    expect(decodeCursor(encodeCursor(values))).toEqual(values);
  });

  it('应处理包含特殊字符的游标', () => {
    const values = ['2024-01-15', '000001.SZ', 123.45];
    expect(decodeCursor(encodeCursor(values))).toEqual(values);
  });

  it('应生成正确的多列排序 SQL 条件', () => {
    const sortKeys: SortKey[] = [
      { column: 'trade_date', order: 'DESC' },
      { column: 'stock_code', order: 'ASC' },
    ];
    const cursorValues = ['2024-01-15', '000001.SZ'];
    const { sql, params } = buildCursorCondition(sortKeys, cursorValues, 'q');

    expect(sql).toContain('OR');
    expect(sql).toContain('AND');
    expect(params).toEqual({
      p0: '2024-01-15',
      p1: '000001.SZ',
    });
  });
});
