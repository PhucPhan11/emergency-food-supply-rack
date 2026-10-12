import { TestBed } from '@angular/core/testing';
import { parseBackup, serializeBackup } from './pantry-backup';
import { PantryStorage } from './pantry-storage';
import { PantryStore } from './pantry-store';
import { Toaster } from './toaster';

describe('PantryStore', () => {
  let store: PantryStore;

  const gao = () => store.items().find((item) => item.id === 'gao')!;

  beforeEach(() => {
    vi.useFakeTimers({ now: new Date(2026, 9, 12, 9, 0) });
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(PantryStore);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('bắt đầu bằng danh mục mẫu, mọi món đều cần mua', () => {
    expect(store.today()).toBe('2026-10-12');
    expect(store.items()).toHaveLength(23);
    expect(store.shoppingList()).toHaveLength(23);
    expect(store.eatFirst()).toEqual([]);
  });

  it('nhập đủ mức thì món rời danh sách cần mua, lô gần hạn vào danh sách ăn trước', () => {
    store.addLot('gao', 14, '2026-10-22');
    expect(store.shoppingList().some(({ item }) => item.id === 'gao')).toBe(false);
    expect(store.eatFirst().map(({ item, days }) => [item.id, days])).toEqual([['gao', 10]]);
    expect(TestBed.inject(Toaster).current()).toEqual({
      text: 'Đã nhập 14 kg Gạo',
      canUndo: true,
    });
  });

  it('lấy ra một bước rồi hoàn tác', () => {
    store.addLot('gao', 14, null);
    store.takeOut('gao');
    expect(gao().lots.map((lot) => lot.qty)).toEqual([13]);

    store.undo();
    expect(gao().lots.map((lot) => lot.qty)).toEqual([14]);
  });

  it('hết hàng thì lấy ra không làm gì', () => {
    const before = store.state();
    store.takeOut('gao');
    expect(store.state()).toBe(before);
  });

  it('thêm, sửa rồi xoá một món', () => {
    store.saveItem(null, {
      name: ' Cà phê ',
      category: '',
      unit: 'gói',
      note: '',
      rate: null,
      step: null,
      minOverride: 3,
    });
    const added = store.items().at(-1)!;
    expect(added).toMatchObject({ name: 'Cà phê', category: 'Khác', step: 1, minOverride: 3 });

    store.addLot(added.id, 2, null);
    store.saveItem(added.id, { ...added, name: 'Cà phê hoà tan' });
    const edited = store.items().at(-1)!;
    expect(edited.name).toBe('Cà phê hoà tan');
    expect(edited.lots.map((lot) => lot.qty)).toEqual([2]);

    store.deleteItem(added.id);
    expect(store.items()).toHaveLength(23);
  });

  it('đổi số ngày thì mức tối thiểu tính lại', () => {
    store.addLot('gao', 7, null);
    expect(store.shoppingList().find(({ item }) => item.id === 'gao')?.need).toBe(7);
    store.updateSettings({ days: 7 });
    expect(store.shoppingList().some(({ item }) => item.id === 'gao')).toBe(false);
  });

  it('mọi thay đổi được lưu lại và đọc lên được ở lần mở sau', () => {
    store.addLot('gao', 5, '2027-01-01');
    const saved = TestBed.inject(PantryStorage).load();
    expect(saved).toEqual(store.state());
  });

  it('sao lưu rồi khôi phục cho ra đúng dữ liệu cũ', () => {
    store.addLot('gao', 5, '2027-01-01');
    const backup = serializeBackup(store.state());
    store.reset();
    expect(gao().lots).toEqual([]);

    store.restore(parseBackup(backup));
    expect(gao().lots.map((lot) => [lot.qty, lot.exp])).toEqual([[5, '2027-01-01']]);
    expect(() => parseBackup('{"foo": 1}')).toThrow();
  });
});
