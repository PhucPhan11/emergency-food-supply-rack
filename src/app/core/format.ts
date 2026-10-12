// Định dạng hiển thị dùng chung cho cả mẫu giao diện (qua pipe) lẫn câu thông báo.

export function formatQty(value: number): string {
  return value.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
}

/** YYYY-MM-DD thành DD/MM/YYYY. */
export function formatDate(iso: string): string {
  return iso.split('-').reverse().join('/');
}

export function dueLabel(days: number): string {
  if (days < 0) return `quá hạn ${-days} ngày`;
  if (days === 0) return 'hết hạn hôm nay';
  return `còn ${days} ngày`;
}
