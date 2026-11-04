# NexChat 1.0.0 — Hướng dẫn triển khai và vận hành

## Yêu cầu phát hành

- Node.js 24 LTS (Dockerfile dùng `node:24-alpine`); Node.js 22 trở lên được khai báo trong `engines` để hỗ trợ môi trường phát triển hiện tại.
- npm đi kèm Node.js; cài đúng lockfile bằng `npm ci`.
- Production phải có vùng lưu trữ bền vững riêng, truy cập đọc/ghi được bởi tiến trình Node.
- Khôi phục tài khoản bằng SMS chỉ hoạt động sau khi cấu hình Twilio Verify. Không có cấu hình thì luồng recovery trả về trạng thái tạm khóa an toàn, không tự bỏ qua OTP.

## Kiểm tra trước khi deploy

```bash
npm ci
npm test
npm audit --omit=dev
```

Chỉ triển khai khi cả ba lệnh hoàn tất thành công. Nếu npm registry không truy cập được, không được coi `npm audit` hoặc cài đặt dependency là đã hoàn tất.

## Triển khai bằng Docker / Render

1. Dùng Dockerfile đi kèm. Image dựa trên Node.js 24 LTS.
2. Gắn Persistent Disk, ví dụ mount tại `/var/data/nexchat`, và đặt `DATA_DIR=/var/data/nexchat` trong cấu hình dịch vụ. Docker cục bộ có mặc định `/data`; cần mount volume tại `/data`.
3. Đặt `NODE_ENV=production`, `PORT` phù hợp và `SESSION_SECRET` ngẫu nhiên tối thiểu 32 ký tự.
4. Đặt `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SECOND_PASSWORD`, `ADMIN_AUDIT_DELETE_PASSWORD`. Mỗi mật khẩu ít nhất 12 ký tự và không dùng chung.
5. Đặt các khóa VAPID cố định nếu bật Web Push.
6. Nếu bật khôi phục SMS, cấu hình đủ `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` từ Twilio Verify. Không commit các giá trị thật vào Git.
7. Giới hạn lưu trữ upload mặc định: 500 MiB mỗi tài khoản và 5 GiB toàn máy chủ. Có thể chỉnh bằng `MAX_USER_UPLOAD_BYTES` và `MAX_TOTAL_UPLOAD_BYTES` (đơn vị byte).
8. Sau deploy, gọi `/health`; yêu cầu `status: ok`, `storageWritable: true`, `persistenceConfigured: true` và `version: 1.0.0`.
9. Sau nâng phiên bản, xóa cache build khi cần và tải lại trang để Service Worker nhận tài nguyên mới.

Nếu chạy production mà thiếu thông tin Admin đủ mạnh, hệ thống tạo bộ thông tin ngẫu nhiên trong `DATA_DIR/.admin-credentials.json`. Hãy lấy thông tin từ vùng lưu trữ có kiểm soát và đổi/cấu hình mật khẩu cố định trước khi bàn giao vận hành. Không đưa tệp này lên Git hoặc gửi trong ZIP công khai.

## Dữ liệu và di chuyển

- `store.seed.json` chỉ chứa cấu trúc khởi tạo trống, được phép đóng gói.
- `store.json`, bản sao lưu, tệp tải lên, session và khóa sinh tự động là dữ liệu runtime; không được commit hoặc đóng gói.
- Khi `DATA_DIR` mới chưa có dữ liệu, NexChat ưu tiên di chuyển `store.json` cũ ở thư mục ứng dụng (nếu còn), sau đó mới dùng seed sạch.
- Trước khi nâng cấp từ bản đang chạy, hãy sao lưu toàn bộ `DATA_DIR` và thư mục upload. Không xóa volume cũ cho tới khi xác nhận `/health` và dữ liệu đã được kiểm tra.

## Recovery bằng SMS

Recovery được bảo vệ bằng Twilio Verify. Luồng chỉ gửi SMS sau khi số điện thoại và thông tin tài khoản khớp dữ liệu đã đăng ký; mã hết hạn sau 10 phút và tối đa 6 lần nhập sai cho mỗi phiên. Rate limit theo IP và số điện thoại cũng được áp dụng. Không cấu hình Twilio thì Recovery bị khóa an toàn; Admin vẫn cần cung cấp kênh hỗ trợ thay thế ngoài hệ thống.

## Bảo mật V1.0.0

- Cookie phiên dùng `HttpOnly`, `SameSite=Lax`, `Secure` tự động trên HTTPS và được xoay sau đăng nhập.
- Mọi API thay đổi dữ liệu của phiên đã xác thực yêu cầu CSRF token riêng theo phiên.
- Phản hồi API và trang đã đăng nhập dùng `no-store` để giảm lưu thông tin nhạy cảm trong cache.
- CSP chặn script inline, object, frame và script attribute; hệ thống cũng bật HSTS, chống MIME sniffing, clickjacking và giảm quyền trình duyệt không cần thiết.
- Đăng nhập dùng so sánh bcrypt kể cả khi tài khoản không tồn tại để giảm rò rỉ thời gian; có giới hạn theo IP và định danh đã băm.
- Tên tệp, MIME, phần mở rộng và magic bytes đều được kiểm tra trước khi lưu.
- Tệp tải lên chỉ được trả cho chủ sở hữu, người nhận hợp lệ hoặc Admin.
- Dữ liệu nháp tin nhắn được giữ trong `sessionStorage`, không tồn tại lâu sau khi đóng tab.
- API không gửi `passwordHash`, khóa phiên, CSRF token nội bộ hoặc bí mật máy chủ trong dữ liệu người dùng.

DevTools/F12 là quyền của chủ thiết bị và không thể bị vô hiệu hóa một cách đáng tin cậy. Bảo mật đúng là không gửi bí mật máy chủ xuống trình duyệt, giới hạn dữ liệu theo quyền, dùng cookie HttpOnly, CSRF, CSP và kiểm tra phía máy chủ. Không thêm mã “chặn F12” vì kiểu mã đó dễ vượt qua và thường gây lỗi cho người dùng hợp lệ.

## Đồ họa và chuyển động

- **Sinh động tối đa** có tinh vân nhiều lớp, dải cực quang, trường sao, thấu kính năng lượng, lưới chiều sâu và parallax nhẹ theo con trỏ.
- Hiệu ứng chỉ chạy đầy đủ khi thiết bị và tùy chọn người dùng cho phép.
- Cân bằng giảm mật độ; Tiết kiệm và Tĩnh tắt lớp GPU nặng.
- `prefers-reduced-motion`, Save-Data, RAM/CPU thấp, mobile và tab ẩn đều được tôn trọng.
- Popup dùng một lượt opacity + scale tại đúng vị trí; không trượt từ nơi khác và không chạy hai animation chồng nhau.

## Tương thích thiết bị

- Hỗ trợ màn hình từ 280 px, mobile dọc/ngang, tablet, laptop, desktop, ultrawide và thiết bị cảm ứng lớn.
- Runtime dùng `visualViewport`, `dvh`, safe-area và trạng thái bàn phím ảo.
- Các nút cảm ứng có vùng chạm tối thiểu, composer không bị bàn phím che và modal không vượt viewport.
- Màn hình thấp ở chế độ ngang tự rút gọn header, composer và hiệu ứng nền.

## Đồng bộ tính năng đa thiết bị V1.0.0

- Nền hội thoại hoạt động thống nhất trong Chat thế giới, tin riêng, nhóm và hỗ trợ; lựa chọn được lưu riêng theo đúng cuộc trò chuyện.
- Khi đổi breakpoint, Chat tự đóng sidebar, bảng thao tác mobile và bảng chọn giao diện để tránh lớp phủ còn sót trên desktop.
- Home không còn tràn nút ở màn hình 320 px; Support dùng một workspace cố định theo viewport và giữ nút giao diện/ngôn ngữ thẳng hàng.
- Ngăn kéo Admin mở ổn định trên điện thoại, tablet và thiết bị Performance Lite; overlay được dọn đúng sau khi đóng.
- Mobile vẫn có đủ thông báo, tìm kiếm, kho media, hình nền chat, chuyển động, tỉ lệ giao diện và sáng/tối như desktop.
- Các thay đổi chỉ điều chỉnh cách trình bày và đồng bộ trạng thái; API, quyền người dùng, dữ liệu và luồng realtime dùng chung trên mọi breakpoint.

Bản kiểm tra trình duyệt đại diện dùng các viewport 320×568, 430×932, 768×1024 và 1440×900. Đây là kiểm tra đại diện theo nhóm thiết bị, không phải cam kết rằng mọi mẫu máy và mọi trình duyệt trên thị trường đều có hành vi tuyệt đối giống nhau.

## Hệ giao diện thanh bên thống nhất V1.0.0

- Toàn bộ phần liên quan đã dùng chung một hệ màu, khoảng cách và bo góc: đầu thanh bên, bộ chọn không gian, hồ sơ, tìm kiếm, điều hướng, danh sách và tiện ích tài khoản.
- Điều hướng trở về danh sách dọc rõ ràng, mỗi mục có biểu tượng, tiêu đề và mô tả; mục đang chọn có vạch nhấn bên trái thay vì các khối màu rời rạc.
- Bảng chọn Vũ trụ/Thiên đường dùng hai hàng ngang dễ đọc, không còn thẻ nhỏ 2 cột hoặc popup chiếm gần hết màn hình.
- Khu tài khoản cuối thanh bên chia theo ba cấp: trạng thái realtime, ngôn ngữ, sau đó Cài đặt/Đăng xuất. Danh sách nội dung cuộn riêng và không bị chân trang che.
- Vũ trụ và Thiên đường giữ cùng cấu trúc, chỉ thay hệ màu; chế độ sáng không còn thẻ xám trên nền xanh đen.
- Màn hình thấp tự rút mô tả và thu gọn nút, nhưng không ẩn tính năng. Safe-area và reduced motion vẫn được giữ.
- Sau khi deploy, dùng **Clear build cache & deploy** và nhấn `Ctrl + Shift + R` một lần.

## Đồng bộ ngôn ngữ hoàn chỉnh V1.0.0

- Trang Admin dùng một gói dịch riêng cho đủ 9 ngôn ngữ: Việt, Anh, Trung, Nga, Đức, Thái, Tây Ban Nha, Pháp và Nhật.
- Các khu vực tĩnh và động cùng đổi ngay khi chọn ngôn ngữ: bảng thống kê, giới hạn tài khoản, nhật ký, tố cáo, cấu hình Chat thế giới, thông báo toàn hệ thống, cấp hiệu ứng, VIP/LEGEND, hồ sơ người dùng, hỗ trợ và toàn bộ modal.
- Placeholder, tooltip, `aria-label`, trạng thái rỗng, nút thao tác, thông báo thành công/lỗi và nội dung được dựng lại bằng JavaScript đều đi qua cùng hệ thống dịch.
- Nút Chuyển động đọc trực tiếp ngôn ngữ hiện tại thay vì phụ thuộc chuỗi `html.lang` cũ, nên không còn trường hợp chọn tiếng Trung nhưng nút vẫn hiện tiếng Anh.
- Trang chủ và bước xác minh Admin cấp 2 đã được bổ sung bản dịch bản địa đầy đủ, không còn tự rơi về tiếng Anh ở các khối nội dung dài.
- Lựa chọn ngôn ngữ thủ công được lưu lâu dài và luôn ưu tiên hơn nhận diện tự động. Các lựa chọn lưu từ phiên bản cũ được tự chuyển sang chế độ thủ công để không bị ghi đè sau nâng cấp.

## Ngôn ngữ mặc định tự động theo quốc gia

Thứ tự nhận diện ở lần truy cập đầu tiên:

1. Quốc gia do hạ tầng CDN/proxy gửi qua các header chuẩn như `CF-IPCountry`, `X-Vercel-IP-Country` hoặc `CloudFront-Viewer-Country`.
2. Múi giờ IANA của trình duyệt, ví dụ `Asia/Ho_Chi_Minh` → Tiếng Việt, `Asia/Tokyo` → Tiếng Nhật.
3. Danh sách ngôn ngữ ưu tiên của trình duyệt (`Accept-Language` / `navigator.languages`).
4. Ngôn ngữ dự phòng của hệ thống.

Kết quả tự động được cache 30 ngày để tránh đổi ngôn ngữ liên tục. Khi người dùng tự chọn một ngôn ngữ, lựa chọn đó được đánh dấu là thủ công và API `/api/locale` không được phép ghi đè. Trên miền `onrender.com`, Render có thể không cung cấp header quốc gia; khi đó hệ thống dùng múi giờ rồi mới dùng ngôn ngữ trình duyệt. Không gọi dịch vụ định vị IP bên thứ ba nên không phát sinh phụ thuộc ngoài hoặc gửi IP người dùng sang dịch vụ khác.

## Dữ liệu không được đóng gói

Không commit hoặc gửi kèm:

- `.env`
- `.session-secret`
- `.admin-credentials.json`
- `.vapid-keys.json`
- `.sessions/`
- `store.json.bak`
- store lỗi/quarantine
- nội dung tải lên thật của người dùng
- `node_modules/`

## Giới hạn bàn giao

Gói ZIP mã nguồn mục tiêu dưới 5 MB. Bản bàn giao phải chạy `npm test`, `npm audit --omit=dev` và smoke test máy chủ trước khi gửi.


## Sửa đa ngôn ngữ V1.0.0
- Hai thẻ bảo mật cuối trang đăng nhập và nhãn trợ năng của chúng dùng chung hệ thống i18n.
- Đã bổ sung đầy đủ bản dịch cho Việt, Anh, Trung, Nga, Đức, Thái, Tây Ban Nha, Pháp và Nhật.


## Bộ chọn hình nền V1.0.0
- Thay ô trắng bằng ảnh xem trước SVG thật cho đủ 7 hình nền.
- Hiển thị rõ tên, mô tả, trạng thái đang dùng và áp dụng tức thì.
- Bố cục 3 cột trên desktop, 2 cột trên mobile; thẻ cuối tự căn giữa.
- Đồng bộ bản dịch đủ 9 ngôn ngữ và hỗ trợ chế độ sáng/tối.

## Sửa DevTools và tương thích trình duyệt V1.0.0

- CSP giữ nguyên việc chặn inline script và `eval`, nhưng khai báo riêng `script-src-elem 'self' blob:` để script phần tử dùng Blob URL hợp lệ không còn bị chặn.
- Sự kiện `beforeinstallprompt` chỉ bị trì hoãn trên trang có nút **Cài ứng dụng**. Trang đăng nhập, trang chủ, Admin và Support dùng luồng cài đặt mặc định của trình duyệt.
- Tất cả bộ chọn ngôn ngữ có `id`, `name` và `autocomplete="language"` ổn định.
- Trường điện thoại đăng ký/khôi phục dùng `autocomplete="tel"`; trường biệt danh không gọi nhầm dữ liệu Autofill.
- Không đổi API, Socket.IO, CSRF, phân quyền, PWA, chat, upload, hiệu ứng hoặc dữ liệu hiện có.


## Sửa đồng bộ hộp thoại đăng xuất V1.0.0

- Toàn bộ nhãn bảo mật, tiêu đề, nội dung xác nhận, nút và trạng thái “đang đăng xuất” đổi theo 9 ngôn ngữ.
- Hộp thoại quản trị dùng nội dung riêng đã dịch, không còn câu tiếng Việt viết cứng khi giao diện đang ở ngôn ngữ khác.
- Trạng thái ngữ cảnh của hộp thoại được giữ riêng để thay đổi ngôn ngữ không ghi đè các xác nhận chức năng khác.

## Sửa căn chỉnh và kích thước bóng chat V1.0.0

- Tin gửi được neo về mép phải, tin nhận được neo về mép trái bằng hàng tin nhắn toàn chiều rộng.
- Bóng chat co theo nội dung và chỉ mở rộng đến giới hạn đọc; không còn trôi vào giữa hoặc kéo dài bất thường.
- Không thay đổi API, Socket.IO, dữ liệu, quyền hiệu ứng, VIP/LEGEND, upload hay thao tác tin nhắn.

## Sửa trạng thái danh sách rỗng V1.0.0

- Các danh sách rỗng trong thanh bên dùng hàng trạng thái có biểu tượng và màu trung tính, không còn dải nền xám/đen bất hợp lý.
- Giao diện Vũ trụ và Thiên đường có màu riêng nhưng giữ cùng cấu trúc, khoảng cách và độ tương phản.
- Trạng thái đã ghim, lời mời, bạn bè, nhóm và lưu trữ dùng chung thành phần để tránh lệch giao diện ở các thiết bị.
- Không thay đổi luồng chấp nhận/từ chối lời mời, realtime, API hoặc dữ liệu người dùng.

## Tối ưu độ mượt V1.0.0

- Runtime đo nhịp khung hình sau khi giao diện ổn định và tự phân loại `smooth`, `balanced` hoặc `limited` khi chế độ hiệu năng đang để Tự động.
- Hiệu ứng trang trí được gắn sau khung hình đầu tiên bằng `requestIdleCallback` để không chặn thao tác đăng nhập, mở Chat hoặc Admin.
- Sao, bụi sáng và sao băng tự dùng mật độ phù hợp với bộ nhớ, số luồng CPU và chế độ tiết kiệm dữ liệu; người dùng chọn Full vẫn giữ mức hiệu ứng cao nhất.
- Khi người dùng đang cuộn, hệ thống chỉ tạm dừng các lớp trang trí nặng; nút, biểu mẫu, realtime, tin nhắn, modal và mọi thao tác vẫn hoạt động bình thường.
- Khi tab bị ẩn, animation được tạm dừng và tự tiếp tục khi quay lại nhằm giảm CPU/GPU và tránh giật sau khi chuyển tab.
- Các khu Admin dài dùng `content-visibility:auto`, lớp nền Chat không còn ép repaint toàn viewport, đồng thời modal/sidebar chỉ bật `will-change` khi thật sự mở.
- Tôn trọng `prefers-reduced-motion`, thiết bị cảm ứng và chế độ Economy mà không xóa hay vô hiệu hóa chức năng.

## V1.0.0 — Điều chỉnh cảnh báo gửi tin nhanh

Thông báo chống spam ở chat thế giới đã được viết lại theo hướng lịch sự, không tiết lộ ngưỡng kỹ thuật và hiển thị dưới dạng cảnh báo thay vì lỗi nghiêm trọng.

## Giao diện kiểm soát liên hệ Admin V1.0.0

Thẻ kiểm soát liên hệ đã được tái cấu trúc thành bố cục gọn, dễ đọc và tương thích toàn bộ chủ đề. Không thay đổi API hoặc dữ liệu lưu trữ.

## Tối ưu nhắn tin realtime V1.0.0

Bản này tối ưu hoàn toàn phía client và không yêu cầu thay đổi biến môi trường hay cấu trúc dữ liệu. Sau khi triển khai, nên xóa cache cũ hoặc tải lại mạnh để Service Worker nhận tài nguyên `1.0.0`. Cơ chế mới giữ nguyên bóng optimistic khi máy chủ xác nhận, gộp thao tác cuộn và giảm số lớp hiệu ứng phải repaint khi người dùng gửi nhiều tin liên tục.
