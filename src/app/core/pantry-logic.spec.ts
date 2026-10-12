import { Item, Settings } from './models';
import {
  consume,
  coverDays,
  eatFirst,
  isoDate,
  levelOf,
  minOf,
  normalize,
  normalizeItem,
  shoppingList,
  stockOf,
  withLot,
} from './pantry-logic';

const TODAY = '2026-10-12';
const settings: Settings = { people: 4, days: 14, warnDays: 30 };

const makeItem = (over: Record<string, unknown> = {}): Item =>
  normalizeItem({ id: 'x', name: 'X', unit: 'kg', rate: 0.25, step: 1, ...over }, 0);

describe('pantry-logic', () => {
  it('mức tối thiểu = định mức × người × ngày, làm tròn lên theo bước', () => {
    expect(minOf(makeItem(), settings)).toBe(14);
    expect(minOf(makeItem({ rate: 0.03, step: 0.5 }), settings)).toBe(2);
    expect(minOf(makeItem({ rate: 0.01, step: 0.1 }), settings)).toBe(0.6);
    expect(minOf(makeItem({ rate: 0.15 }), settings)).toBe(9);
  });

  it('mức cố định thắng mức tự tính, kể cả khi bằng 0', () => {
    expect(minOf(makeItem({ minOverride: 5 }), settings)).toBe(5);
    expect(minOf(makeItem({ minOverride: 0 }), settings)).toBe(0);
    expect(makeItem({ minOverride: '' }).minOverride).toBeNull();
    expect(makeItem({ minOverride: null }).minOverride).toBeNull();
  });

  it('lô quá hạn không tính vào tồn kho, lô hết hạn hôm nay vẫn tính', () => {
    const item = makeItem({
      lots: [
        { id: 'a', qty: 2, exp: '2026-10-11' },
        { id: 'b', qty: 3, exp: TODAY },
        { id: 'c', qty: 1.5 },
      ],
    });
    expect(stockOf(item, TODAY)).toBe(4.5);
    expect(coverDays(item, settings, TODAY)).toBe(4.5);
  });

  it('mức độ thiếu: đủ, dưới mức, dưới một nửa', () => {
    expect(levelOf(14, 14)).toBe('ok');
    expect(levelOf(7, 14)).toBe('low');
    expect(levelOf(6.9, 14)).toBe('short');
  });

  it('lấy ra theo hạn gần nhất trước, không đụng lô quá hạn và không sửa dữ liệu gốc', () => {
    const item = makeItem({
      lots: [
        { id: 'none', qty: 2 },
        { id: 'late', qty: 2, exp: '2027-06-01' },
        { id: 'soon', qty: 1, exp: '2026-11-01' },
        { id: 'dead', qty: 4, exp: '2026-01-01' },
      ],
    });
    const afterTwo = consume(item, 2, TODAY);
    expect(afterTwo.lots.map((lot) => [lot.id, lot.qty])).toEqual([
      ['none', 2],
      ['late', 1],
      ['dead', 4],
    ]);
    expect(item.lots).toHaveLength(4);

    const afterAll = consume(afterTwo, 10, TODAY);
    expect(afterAll.lots.map((lot) => lot.id)).toEqual(['dead']);
  });

  it('nhập lô mới trả về món mới, làm tròn số lượng', () => {
    const item = makeItem();
    const next = withLot(item, { id: 'n', qty: 0.30000000000000004, exp: null });
    expect(next.lots).toEqual([{ id: 'n', qty: 0.3, exp: null }]);
    expect(item.lots).toEqual([]);
  });

  it('danh sách cần mua chỉ gồm món dưới mức, kèm lượng còn thiếu', () => {
    const state = normalize({
      settings,
      items: [
        { id: 'gao', name: 'Gạo', rate: 0.25, step: 1, lots: [{ qty: 9.5 }] },
        { id: 'mi', name: 'Mì', rate: 0.5, step: 1, lots: [{ qty: 28 }] },
      ],
    });
    expect(shoppingList(state, TODAY).map(({ item, need }) => [item.id, need])).toEqual([
      ['gao', 4.5],
    ]);
  });

  it('ăn trước: lô quá hạn và lô trong ngưỡng báo, gần hạn nhất đứng đầu', () => {
    const state = normalize({
      settings,
      items: [
        {
          id: 'ca',
          name: 'Cá hộp',
          rate: 0.25,
          lots: [
            { id: 'far', qty: 1, exp: '2027-10-12' },
            { id: 'edge', qty: 1, exp: '2026-11-11' },
            { id: 'gone', qty: 1, exp: '2026-10-09' },
            { id: 'none', qty: 1 },
          ],
        },
      ],
    });
    expect(eatFirst(state, TODAY).map(({ lot, days }) => [lot.id, days])).toEqual([
      ['gone', -3],
      ['edge', 30],
    ]);
  });

  it('normalize dọn dữ liệu hỏng thay vì làm sập ứng dụng', () => {
    const state = normalize({
      settings: { people: 0, days: 'abc' },
      items: [{ name: '  ', rate: -1, step: 0, lots: [{ qty: 0 }, { qty: '2', exp: 'mai' }] }],
    });
    expect(state.settings).toEqual({ people: 4, days: 14, warnDays: 30 });
    const [item] = state.items;
    expect(item.name).toBe('Món chưa đặt tên');
    expect(item.rate).toBe(0);
    expect(item.step).toBe(1);
    expect(item.lots.map((lot) => [lot.qty, lot.exp])).toEqual([[2, null]]);
    expect(normalize(null).items).toEqual([]);
  });

  it('isoDate dùng ngày theo giờ máy', () => {
    expect(isoDate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});
