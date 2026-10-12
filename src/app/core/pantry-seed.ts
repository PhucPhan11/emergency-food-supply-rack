import { PantryState } from './models';
import { normalize } from './pantry-logic';

// Danh mục mẫu. rate = lượng ước tính cho 1 người lớn trong 1 ngày, tính theo đơn vị của món.
// Mức tối thiểu = rate × số người × số ngày, làm tròn lên theo step.
// prettier-ignore
const SEED_ITEMS = [
  { id: 'gao', name: 'Gạo', category: 'Tinh bột', unit: 'kg', rate: 0.25, step: 1 },
  { id: 'mi-goi', name: 'Mì gói, phở gói', category: 'Tinh bột', unit: 'gói', rate: 0.5, step: 1 },
  { id: 'bun-kho', name: 'Bún, miến, nui khô', category: 'Tinh bột', unit: 'kg', rate: 0.03, step: 0.5 },

  { id: 'trung', name: 'Trứng', category: 'Đạm', unit: 'quả', rate: 0.5, step: 1, note: 'Để tủ lạnh, ăn trong 3–4 tuần' },
  { id: 'ca-hop', name: 'Cá hộp', category: 'Đạm', unit: 'hộp', rate: 0.25, step: 1, note: 'Hộp khoảng 155 g' },
  { id: 'thit-hop', name: 'Thịt hộp, pa-tê', category: 'Đạm', unit: 'hộp', rate: 0.15, step: 1 },
  { id: 'dau-kho', name: 'Đậu khô', category: 'Đạm', unit: 'kg', rate: 0.03, step: 0.5, note: 'Đậu xanh, đậu đen, đậu phộng' },
  { id: 'do-kho', name: 'Đồ khô', category: 'Đạm', unit: 'kg', rate: 0.02, step: 0.5, note: 'Cá khô, tôm khô, lạp xưởng, chà bông' },

  { id: 'cu', name: 'Củ để lâu', category: 'Rau củ', unit: 'kg', rate: 0.1, step: 0.5, note: 'Khoai tây, cà rốt, hành tây, bí đỏ' },
  { id: 'hanh-toi', name: 'Hành, tỏi khô', category: 'Rau củ', unit: 'kg', rate: 0.01, step: 0.1 },
  { id: 'rau-hop', name: 'Rau củ đóng hộp', category: 'Rau củ', unit: 'hộp', rate: 0.1, step: 1, note: 'Bắp, đậu Hà Lan, nấm' },
  { id: 'rong-bien', name: 'Rong biển, nấm khô', category: 'Rau củ', unit: 'gói', rate: 0.05, step: 1 },

  { id: 'nuoc', name: 'Nước uống', category: 'Sữa và nước', unit: 'bình', rate: 0.1, step: 1, note: 'Bình 20 lít, tính 2 lít mỗi người mỗi ngày' },
  { id: 'sua', name: 'Sữa tiệt trùng', category: 'Sữa và nước', unit: 'hộp', rate: 0.5, step: 1, note: 'Hộp 180 ml' },

  { id: 'dau-an', name: 'Dầu ăn', category: 'Gia vị', unit: 'lít', rate: 0.025, step: 0.5 },
  { id: 'nuoc-mam', name: 'Nước mắm', category: 'Gia vị', unit: 'lít', rate: 0.015, step: 0.5 },
  { id: 'muoi', name: 'Muối', category: 'Gia vị', unit: 'kg', rate: 0.005, step: 0.5 },
  { id: 'duong', name: 'Đường', category: 'Gia vị', unit: 'kg', rate: 0.015, step: 0.5 },
  { id: 'hat-nem', name: 'Hạt nêm, bột ngọt', category: 'Gia vị', unit: 'gói', rate: 0.01, step: 1 },
  { id: 'nuoc-tuong', name: 'Nước tương, tương ớt', category: 'Gia vị', unit: 'chai', rate: 0.01, step: 1 },

  { id: 'chao-goi', name: 'Cháo gói, súp ăn liền', category: 'Ăn liền', unit: 'gói', rate: 0.2, step: 1 },
  { id: 'banh-quy', name: 'Bánh quy, lương khô', category: 'Ăn liền', unit: 'gói', rate: 0.1, step: 1 },
  { id: 'hat-kho', name: 'Hạt và trái cây khô', category: 'Ăn liền', unit: 'kg', rate: 0.01, step: 0.1 },
];

export function seedState(): PantryState {
  return normalize({ items: SEED_ITEMS });
}
