# Kệ dự phòng

Web app nhỏ để giữ một kệ thực phẩm dự phòng cho gia đình theo kiểu ăn xoay vòng: mọi thứ trên kệ đều là đồ nhà vẫn ăn hằng ngày, chỉ khác là mỗi món luôn có một mức tối thiểu. Lấy ra ăn thì mua bù.

## Dùng

Mở `index.html` bằng trình duyệt. Không cần cài đặt hay máy chủ.

- **Kệ**: tồn kho từng món so với mức tối thiểu. `−` là lấy ra ăn (trừ vào lô gần hết hạn nhất), `+ Nhập` là thêm một lô mới kèm hạn sử dụng. Bấm tên món để sửa.
- **Cần mua**: các món đang dưới mức và lượng cần mua bù. Có nút sao chép để gửi cho người đi chợ.
- **Ăn trước**: các lô đã quá hạn hoặc sắp hết hạn, gần hạn nhất đứng đầu.
- **Cài đặt**: số người, số ngày, ngưỡng báo hết hạn, sao lưu và khôi phục.

Mức tối thiểu của một món = định mức mỗi người mỗi ngày × số người × số ngày, làm tròn lên. Mặc định là 4 người, 14 ngày. Định mức trong `seed.js` là ước lượng cho người lớn ăn uống bình thường, nên chỉnh lại theo thói quen của nhà.

## Dữ liệu

Dữ liệu lưu trong `localStorage` của trình duyệt trên đúng máy đó, không đồng bộ giữa các máy. Dùng **Sao lưu ra tệp** trong Cài đặt để chuyển máy hoặc đề phòng mất dữ liệu.

## Mã nguồn

| Tệp | Vai trò |
| --- | --- |
| `core.js` | Logic thuần: định mức, tồn kho, hạn dùng, danh sách cần mua |
| `seed.js` | Danh mục món mẫu và định mức |
| `app.js` | Giao diện, lưu trữ, sự kiện |
| `test/core.test.js` | Kiểm thử cho `core.js`, chạy bằng `node --test` |
