# Kệ dự phòng

Web app giúp gia đình giữ một kệ thực phẩm dự phòng theo kiểu ăn xoay vòng: mọi thứ trên kệ đều là đồ nhà vẫn ăn hằng ngày, chỉ khác là mỗi món luôn có một mức tối thiểu. Lấy ra ăn thì mua bù.

Viết bằng Angular 22 (standalone component, signal, không dùng zone.js). Cần Node 22.22 trở lên hoặc Node 24.

## Lệnh thường dùng

| Lệnh | Tác dụng |
| --- | --- |
| `npm install` | Cài thư viện, chạy một lần sau khi tải mã về |
| `npm start` | Chạy bản phát triển tại `http://localhost:4200`, tự tải lại khi sửa mã |
| `npm test` | Chạy kiểm thử đơn vị bằng Vitest |
| `npm run build` | Tạo bản phát hành trong `dist/ke-du-phong/browser` |

Bản phát hành là trang tĩnh, đặt lên máy chủ tĩnh nào cũng được (kể cả trong thư mục con), vì ứng dụng dùng đường dẫn dạng `#/ke` và `<base href="./">`.

## Cách dùng

- **Kệ** (`#/ke`): tồn kho từng món so với mức tối thiểu. `−` là lấy ra ăn, trừ vào lô gần hết hạn nhất. `+ Nhập` thêm một lô mới kèm hạn sử dụng. Bấm tên món để sửa.
- **Cần mua** (`#/can-mua`): các món đang dưới mức và lượng cần mua bù, có nút sao chép để gửi cho người đi chợ.
- **Ăn trước** (`#/an-truoc`): các lô đã quá hạn hoặc sắp hết hạn, gần hạn nhất đứng đầu.
- **Cài đặt** (`#/cai-dat`): số người, số ngày, ngưỡng báo hết hạn, sao lưu và khôi phục.

Mức tối thiểu của một món = định mức mỗi người mỗi ngày × số người × số ngày, làm tròn lên. Mặc định là 4 người, 14 ngày. Định mức trong `core/pantry-seed.ts` là ước lượng cho người lớn ăn uống bình thường, nên chỉnh lại theo thói quen của nhà.

Dữ liệu lưu trong `localStorage` của trình duyệt trên đúng máy đó, không đồng bộ giữa các máy. Dùng **Sao lưu ra tệp** trong Cài đặt để chuyển máy hoặc đề phòng mất dữ liệu.

## Cấu trúc mã nguồn

```text
src/
  styles.css              Biến màu và các khối giao diện dùng chung (.btn, .badge, .list, dialog...)
  app/
    app.ts, app.html      Khung trang: header + nội dung của mục đang mở + thông báo
    app.routes.ts         Khai báo các mục, mỗi mục tải riêng khi được mở
    app.config.ts         Cấu hình ứng dụng (router)

    core/                 Dữ liệu và nghiệp vụ, không có giao diện
      models.ts             Kiểu dữ liệu: Item, Lot, Settings, PantryState...
      pantry-logic.ts       Hàm thuần: mức tối thiểu, tồn kho, hạn dùng, làm sạch dữ liệu
      pantry-seed.ts        Danh mục món mẫu và định mức
      pantry-store.ts       Nguồn dữ liệu duy nhất (signal) và mọi thao tác thay đổi
      pantry-storage.ts     Đọc, ghi localStorage
      pantry-backup.ts      Xuất, đọc tệp sao lưu
      toaster.ts            Thông báo ngắn cuối màn hình
      format.ts             Định dạng số lượng, ngày, nhãn hạn dùng

    layout/               Phần khung luôn hiện
      header/               Tên, tiến độ tổng, thanh chuyển mục
      toast/                Hiển thị thông báo và nút hoàn tác

    shared/               Thành phần giao diện dùng ở nhiều mục
      lot-dialog/           Hộp nhập một lô hàng (dùng ở Kệ và Cần mua)
      pipes/                qty, viDate, dueLabel

    features/             Mỗi mục của trang là một thư mục
      shelf/                Mục Kệ: shelf-page, item-card, item-dialog
      shopping/             Mục Cần mua
      expiring/             Mục Ăn trước
      settings/             Mục Cài đặt
```

### Quy tắc phụ thuộc

- `core/` không nhập gì từ `shared/`, `layout/` hay `features/`.
- `shared/` và `layout/` chỉ nhập từ `core/` (và `layout/` có thể dùng `shared/`).
- Các thư mục trong `features/` không nhập lẫn nhau. Thứ gì hai mục cùng cần thì đưa lên `shared/` (giao diện) hoặc `core/` (dữ liệu, nghiệp vụ).
- Component không tự sửa dữ liệu: đọc qua các signal của `PantryStore`, thay đổi qua các phương thức của nó. Nhờ vậy mọi thay đổi đều được lưu và hoàn tác được.
- Phép tính nghiệp vụ đặt trong `pantry-logic.ts` dưới dạng hàm thuần để kiểm thử không cần trình duyệt.

### Việc thường gặp

| Muốn làm gì | Sửa ở đâu |
| --- | --- |
| Đổi danh mục món mẫu hoặc định mức | `core/pantry-seed.ts` |
| Đổi cách tính mức tối thiểu, thứ tự lấy ra, ngưỡng cảnh báo | `core/pantry-logic.ts`, kèm kiểm thử trong `pantry-logic.spec.ts` |
| Thêm một thao tác trên dữ liệu | Thêm phương thức vào `core/pantry-store.ts` |
| Thêm một mục mới | Tạo thư mục trong `features/`, thêm một dòng vào `app.routes.ts` và một dòng vào `tabs` trong `layout/header/header.ts` |
| Đổi màu sắc, kiểu nút, kiểu hộp thoại | `src/styles.css` |
| Đổi giao diện của riêng một component | Tệp `.html` và `.css` nằm cạnh component đó |
