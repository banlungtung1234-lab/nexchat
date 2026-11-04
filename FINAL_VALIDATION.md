# NexChat 1.0.0 — Báo cáo kiểm thử phát hành

Ngày kiểm tra: 04/11/2026

## Kết quả đã chạy trong môi trường hiện tại

| Hạng mục | Kết quả |
|---|---:|
| `node verify.js` | 291 đạt / 0 lỗi |
| `node --test test/*.test.js` | 12 đạt / 0 lỗi |
| `npm test` | Thành công: cả hai bộ trên đều đạt |
| `node --check server.js` | Đạt |
| `node --check login.js` | Đạt |
| `node --check i18n.js` | Đạt |
| Kiểm tra cú pháp JS trong bộ verify | 15 tệp đạt |
| Cấu trúc CSS / khóa dịch / ID HTML | Đạt theo bộ verify |

Bộ 291 kiểm tra xác minh cấu trúc, tài nguyên, phiên bản, dịch thuật, CSS/JS và các điều kiện phát hành. 12 test Node.js mới kiểm tra các quy tắc bảo mật/phát hành trọng yếu như dependency lock, `DATA_DIR`, di chuyển dữ liệu, recovery OTP, thu hồi Socket.IO, quota upload và dữ liệu seed. Đây không phải kiểm thử E2E với trình duyệt thật.

## Các thay đổi bảo mật và vận hành

- Cập nhật Multer 2.5.0, Socket.IO 4.8.4; khóa Engine.IO 6.6.11 và socket.io-parser 4.2.7 bằng npm overrides.
- Production yêu cầu `DATA_DIR`; Docker mặc định lưu dữ liệu tại `/data` và dùng Node.js 24 Alpine.
- Bỏ `store.json` runtime khỏi source package; chỉ đóng gói `store.seed.json` rỗng. Giữ đường di chuyển từ `store.json` cũ sang `DATA_DIR` khi còn nguồn dữ liệu.
- Không tự cắt lịch sử tin nhắn, upload metadata và báo cáo khi lưu store.
- Logout, thu hồi session và các sự kiện realtime kiểm tra hiệu lực session; phiên user bị từ chối khi không có trong danh sách session đang hoạt động hoặc tài khoản bị hạn chế.
- Recovery yêu cầu Twilio Verify OTP; xác minh số điện thoại/tài khoản trước khi gửi SMS, giới hạn thời gian và số lần nhập.
- Upload có giới hạn multipart, quota mặc định theo tài khoản và tổng dung lượng metadata.
- Bổ sung route phục vụ ảnh `admin-nebula.jpg`.

## Những gì chưa thể xác minh

**Cài dependency và audit trực tuyến chưa hoàn tất.** Lệnh `npm ci --omit=dev --ignore-scripts --no-audit --no-fund` đã thử chạy nhưng registry trả lỗi DNS `EAI_AGAIN`; npm cũng kết thúc bằng thông báo `Exit handler never called`. Vì vậy:

- Chưa xác nhận cài đặt lockfile hoàn chỉnh bằng `npm ci`.
- Chưa chạy được server thực tế do thiếu các dependency đã cài.
- Chưa chạy `npm audit --omit=dev` thành công.
- Chưa chạy Docker build, HTTP/Socket.IO integration test, browser E2E, kiểm thử tải hoặc khôi phục bản sao lưu trên volume thật.
- Recovery SMS chưa thể thử gửi mã thật nếu không có bộ khóa Twilio hợp lệ.

Không được diễn giải các kiểm tra tĩnh đạt là bằng chứng không còn lỗ hổng. Trước khi công khai, cần chạy lại `npm ci`, `npm test`, `npm audit --omit=dev`, Docker build và smoke test trên môi trường có mạng; cấu hình Twilio và Persistent Disk; thử đăng ký/đăng nhập, logout nhiều thiết bị, chat realtime, upload, Recovery và restore backup.

## Điều kiện công khai

Bản mã nguồn được chuẩn bị ở mức release candidate 1.0.0. GitHub connector đã xác thực tài khoản `hoangminhtuan-2322` nhưng không trả về repository nào, vì vậy chưa thể đối chiếu remote, tạo tag/release hoặc push công khai. Không có thao tác publish nào được thực hiện trong lần bàn giao này.

## Kiểm tra gói bàn giao

- Tạo ZIP nguồn sạch với 54 tệp; không đóng gói `.env`, `node_modules`, session, khóa bí mật, `store.json` runtime hoặc thư mục upload.
- `ZipFile.testzip()` xác nhận archive không có lỗi CRC; đã giải nén ZIP vào thư mục mới và chạy lại `npm test` thành công (291 kiểm tra + 12 test).
- Lockfile có SHA-512 integrity cho bốn dependency trọng yếu đã nâng cấp: Multer, Socket.IO, Engine.IO và socket.io-parser.
- Môi trường kiểm tra đang dùng Node.js 22.16.0; Docker CLI không được cài sẵn nên không thể thực hiện Docker build tại đây.
