// Chạy: node --test
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../core.js');

const TODAY = '2026-10-12';
const settings = { people: 4, days: 14, warnDays: 30 };
const makeItem = (over) => P.normalize({ items: [{ id: 'x', name: 'X', unit: 'kg', rate: 0.25, step: 1, ...over }] }).items[0];

test('mức tối thiểu = định mức × người × ngày, làm tròn lên theo bước', () => {
  assert.equal(P.minOf(makeItem(), settings), 14);
  assert.equal(P.minOf(makeItem({ rate: 0.03, step: 0.5 }), settings), 2);
  assert.equal(P.minOf(makeItem({ rate: 0.01, step: 0.1 }), settings), 0.6);
  assert.equal(P.minOf(makeItem({ rate: 0.15 }), settings), 9);
});

test('mức cố định thắng mức tự tính, kể cả khi bằng 0', () => {
  assert.equal(P.minOf(makeItem({ minOverride: 5 }), settings), 5);
  assert.equal(P.minOf(makeItem({ minOverride: 0 }), settings), 0);
  assert.equal(makeItem({ minOverride: '' }).minOverride, null);
});

test('lô quá hạn không tính vào tồn kho, lô hết hạn hôm nay vẫn tính', () => {
  const item = makeItem({ lots: [
    { id: 'a', qty: 2, exp: '2026-10-11' },
    { id: 'b', qty: 3, exp: TODAY },
    { id: 'c', qty: 1.5 },
  ] });
  assert.equal(P.stockOf(item, TODAY), 4.5);
  assert.equal(P.coverDays(item, settings, TODAY), 4.5);
});

test('lấy ra theo hạn gần nhất trước, không đụng lô quá hạn', () => {
  const item = makeItem({ lots: [
    { id: 'none', qty: 2 },
    { id: 'late', qty: 2, exp: '2027-06-01' },
    { id: 'soon', qty: 1, exp: '2026-11-01' },
    { id: 'dead', qty: 4, exp: '2026-01-01' },
  ] });
  assert.equal(P.consume(item, 2, TODAY), 2);
  assert.deepEqual(item.lots.map((l) => [l.id, l.qty]), [['none', 2], ['late', 1], ['dead', 4]]);
  assert.equal(P.consume(item, 10, TODAY), 3);
  assert.deepEqual(item.lots.map((l) => l.id), ['dead']);
});

test('danh sách cần mua chỉ gồm món dưới mức, kèm lượng còn thiếu', () => {
  const state = P.normalize({ settings, items: [
    { id: 'gao', name: 'Gạo', rate: 0.25, step: 1, lots: [{ qty: 9.5 }] },
    { id: 'mi', name: 'Mì', rate: 0.5, step: 1, lots: [{ qty: 28 }] },
  ] });
  const list = P.shoppingList(state, TODAY);
  assert.deepEqual(list.map(({ item, need }) => [item.id, need]), [['gao', 4.5]]);
});

test('ăn trước: lô quá hạn và lô trong ngưỡng báo, gần hạn nhất đứng đầu', () => {
  const state = P.normalize({ settings, items: [{ id: 'ca', name: 'Cá hộp', rate: 0.25, lots: [
    { id: 'far', qty: 1, exp: '2027-10-12' },
    { id: 'edge', qty: 1, exp: '2026-11-11' },
    { id: 'gone', qty: 1, exp: '2026-10-09' },
    { id: 'none', qty: 1 },
  ] }] });
  assert.deepEqual(P.eatFirst(state, TODAY).map(({ lot, days }) => [lot.id, days]), [['gone', -3], ['edge', 30]]);
});

test('normalize dọn dữ liệu hỏng thay vì làm sập app', () => {
  const state = P.normalize({ settings: { people: 0, days: 'abc' }, items: [
    { name: '', rate: -1, step: 0, lots: [{ qty: 0 }, { qty: '2', exp: 'mai' }] },
  ] });
  assert.deepEqual(state.settings, { people: 4, days: 14, warnDays: 30 });
  const [item] = state.items;
  assert.equal(item.rate, 0);
  assert.equal(item.step, 1);
  assert.deepEqual(item.lots.map((l) => [l.qty, l.exp]), [[2, null]]);
  assert.deepEqual(P.normalize(null).items, []);
});

test('isoDate dùng ngày theo giờ máy', () => {
  assert.equal(P.isoDate(new Date(2026, 0, 5, 23, 30)), '2026-01-05');
});
