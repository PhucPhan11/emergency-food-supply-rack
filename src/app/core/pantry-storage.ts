import { Injectable } from '@angular/core';
import { PantryState } from './models';
import { normalize } from './pantry-logic';

const STORE_KEY = 'ke-du-phong.v1';

/** Đọc và ghi trạng thái kệ vào localStorage của trình duyệt. */
@Injectable({ providedIn: 'root' })
export class PantryStorage {
  load(): PantryState | null {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      return saved ? normalize(JSON.parse(saved)) : null;
    } catch (err) {
      console.warn('Không đọc được dữ liệu đã lưu, dùng danh mục mẫu.', err);
      return null;
    }
  }

  /** Trả về false khi trình duyệt không cho lưu (chế độ riêng tư, hết dung lượng). */
  save(state: PantryState): boolean {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }
}
