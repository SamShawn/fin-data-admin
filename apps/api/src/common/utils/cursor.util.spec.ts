import { describe, it, expect } from 'vitest';
import { encodeCursor, decodeCursor, buildCursorCondition, SortKey } from './cursor.util';

describe('Cursor Pagination Utils', () => {
  describe('encode & decode', () => {
    it('should correctly encode and decode array values', () => {
      const values = ['2024-01-15', '000001.SZ'];
      const encoded = encodeCursor(values);
      expect(typeof encoded).toBe('string');

      const decoded = decodeCursor(encoded);
      expect(decoded).toEqual(values);
    });

    it('should handle special characters', () => {
      const values = ['2024-01-15', '000001.SZ', 123.45];
      expect(decodeCursor(encodeCursor(values))).toEqual(values);
    });
  });

  describe('buildCursorCondition', () => {
    it('should build correct SQL for single column sort', () => {
      const sortKeys: SortKey[] = [{ column: 'trade_date', order: 'DESC' }];
      const cursorValues = ['2024-01-15'];
      const { sql, params } = buildCursorCondition(sortKeys, cursorValues, 'q');

      expect(sql).toContain('q.trade_date <');
      // 👇 改成对象断言
      expect(params).toEqual({ p0: '2024-01-15' });
    });

    it('should build correct SQL for multi-column sort', () => {
      const sortKeys: SortKey[] = [
        { column: 'trade_date', order: 'DESC' },
        { column: 'stock_code', order: 'ASC' },
      ];
      const cursorValues = ['2024-01-15', '000001.SZ'];
      const { sql, params } = buildCursorCondition(sortKeys, cursorValues, 'q');

      expect(sql).toContain('OR');
      expect(sql).toContain('AND');
      // 👇 删掉关于 p2 和 length === 3 的断言
      expect(params).toEqual({
        p0: '2024-01-15',
        p1: '000001.SZ',
      });
    });
  });
});
