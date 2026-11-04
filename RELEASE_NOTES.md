# NexChat 1.0.0 — Release notes

## Highlights
- Chuẩn hóa sản phẩm về phiên bản 1.0.0 trên package, server, tài nguyên cache và manifest.
- Cập nhật dependency upload và realtime lên các bản vá mới.
- Thu hồi socket đồng bộ với vòng đời session và kiểm tra session trước mỗi sự kiện từ client.
- Bảo vệ Recovery bằng Twilio Verify OTP; không gửi SMS khi số điện thoại/thông tin tài khoản không khớp.
- Thêm quota upload per-user / toàn máy chủ và giới hạn multipart.
- Tách dữ liệu runtime khỏi source/image; dùng `store.seed.json` làm seed sạch và hỗ trợ migration dữ liệu cũ.
- Chuyển Docker sang Node.js 24 LTS, thêm persistent data directory `/data` mặc định.
- Phục vụ chính xác ảnh nền Admin `admin-nebula.jpg`.

## Breaking / deployment requirements
- Production bắt buộc đặt `DATA_DIR` trên persistent disk hoặc volume bền vững.
- Node.js 24 được khuyến nghị; Dockerfile dùng Node 24.
- Recovery SMS cần cấu hình đủ ba biến Twilio Verify. Khi thiếu, chức năng này bị khóa an toàn.
- Backup `DATA_DIR` và upload trước khi nâng cấp; kiểm tra `/health` sau deploy.

## Validation
- `npm test`: 291 static checks + 12 Node tests đã đạt trong môi trường build.
- Cài dependency/audit/Docker/E2E chưa được xác minh do registry npm tạm thời không phân giải DNS (`EAI_AGAIN`). Xem `FINAL_VALIDATION.md`.
