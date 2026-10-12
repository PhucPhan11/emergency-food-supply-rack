import { PantryState } from './models';
import { normalize } from './pantry-logic';

export function backupFileName(today: string): string {
  return `ke-du-phong-${today}.json`;
}

export function serializeBackup(state: PantryState): string {
  return JSON.stringify(state, null, 2);
}

/** Ném lỗi nếu nội dung không phải tệp sao lưu của kệ dự phòng. */
export function parseBackup(content: string): PantryState {
  const data: unknown = JSON.parse(content);
  const items =
    typeof data === 'object' && data !== null ? (data as { items?: unknown }).items : null;
  if (!Array.isArray(items)) throw new Error('Tệp sao lưu thiếu danh sách items');
  return normalize(data);
}
