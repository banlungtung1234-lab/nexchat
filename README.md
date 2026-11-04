# NexChat 1.0.0

Ứng dụng mạng xã hội và nhắn tin realtime dựa trên Express 5, Socket.IO và giao diện web/PWA.

## Yêu cầu

- Node.js 24 LTS (khuyến nghị; Node.js 22+ được khai báo trong `package.json`).
- npm đi kèm Node.js.
- Persistent disk hoặc ổ đĩa bền vững có quyền đọc/ghi cho dữ liệu production.

## Chạy local

```bash
npm ci
npm test
npm start
```

Mặc định ở môi trường development, NexChat sử dụng `./store.json`, `./.sessions` và `./uploads`. Các dữ liệu runtime này đã được loại khỏi Git và gói phát hành.

## Chạy production

1. Sao chép `.env.example` sang `.env` và đặt `NODE_ENV=production`.
2. Đặt `DATA_DIR` vào ổ đĩa bền vững, ví dụ `/var/data/nexchat`.
3. Cấu hình các mật khẩu Admin riêng biệt, mạnh; đặt `SESSION_SECRET` ngẫu nhiên tối thiểu 32 ký tự.
4. Cấu hình cặp VAPID ổn định nếu dùng Web Push.
5. Cấu hình đủ ba biến Twilio Verify nếu muốn bật khôi phục tài khoản bằng SMS. Không cấu hình Twilio thì luồng này sẽ bị khóa an toàn.
6. Cài dependency bằng `npm ci`, chạy `npm test`, rồi chạy `npm start`.

Dockerfile dùng Node 24 và mặc định `DATA_DIR=/data`. Khi dùng Docker, gắn persistent volume vào `/data`.

## Dữ liệu

- `store.seed.json` chỉ là dữ liệu khởi tạo trống, được đóng gói cùng mã nguồn.
- `store.json`, bản sao lưu, session, upload, session secret, VAPID keys và thông tin Admin được tạo trong `DATA_DIR`.
- Sao lưu `DATA_DIR` và thư mục upload trước mỗi lần nâng cấp. Không xóa volume cũ trước khi xác minh dữ liệu sau migration.

## Kiểm thử

`npm test` chạy 291 kiểm tra cấu trúc/mã nguồn và 12 kiểm tra bảo vệ phát hành. Các bài kiểm tra này không thay thế kiểm thử HTTP, trình duyệt, tải đồng thời hoặc kiểm thử khôi phục trên môi trường triển khai thật.
