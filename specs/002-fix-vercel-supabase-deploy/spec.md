# Feature Specification: Chuẩn hóa deploy Production trên Vercel với Supabase

**Feature Branch**: `002-execute-feature-hook`
**Created**: 2026-04-15
**Status**: Draft
**Input**: User description: "Tôi muốn code deploy lên PRODTION thì trên vercel hãy chỉnh sửa nó, ngoài ra tôi đã deploy lên vercel theo default nhưng có vẻ env chưa connect được đến DB SUPABASE(chưa set env) . Hãy xem xét update lại hướng dẫn deploy, bổ sung code nếu cần thiêt"

## Clarifications

### Session 2026-04-15

- Q: Khi thiếu env bắt buộc thì hệ thống nên fail theo chiến lược nào? -> A: Fail fast khi khởi tạo server/runtime; thiếu env thì deployment ở trạng thái không healthy ngay.

- Q: Các môi trường nào cần bắt buộc kiểm tra env trước khi phục vụ? -> A: Bắt buộc ở Production và Preview (Option B).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Cấu hình production environment đúng chuẩn (Priority: P1)

Là người vận hành hệ thống, tôi muốn có bộ biến môi trường production rõ ràng cho Vercel và Supabase để ứng dụng kết nối cơ sở dữ liệu ổn định sau deploy.

**Why this priority**: Nếu chưa cấu hình đúng biến môi trường, ứng dụng không thể hoạt động đầy đủ trên production dù deploy thành công.

**Independent Test**: Có thể kiểm thử độc lập bằng cách triển khai lên Vercel với bộ env được khai báo, sau đó gọi các luồng chính (rút gọn link, chuyển hướng, dashboard) và xác nhận không lỗi cấu hình.

**Acceptance Scenarios**:

1. **Given** dự án đã deploy lên Vercel, **When** quản trị viên thiết lập đầy đủ biến môi trường theo tài liệu cập nhật, **Then** ứng dụng kết nối được tới Supabase và các API chính phản hồi thành công.
2. **Given** thiếu một biến môi trường bắt buộc, **When** runtime khởi tạo trên production, **Then** deployment bị đánh dấu không healthy ngay và log chỉ rõ biến còn thiếu để quản trị viên khắc phục.

---

### User Story 2 - Hướng dẫn deploy production dễ làm theo (Priority: P2)

Là người triển khai, tôi muốn tài liệu deploy mô tả từng bước cấu hình Vercel + Supabase để giảm lỗi khi release.

**Why this priority**: Tài liệu rõ ràng giúp giảm sai sót thao tác thủ công, rút ngắn thời gian xử lý sự cố production.

**Independent Test**: Một thành viên chưa quen dự án có thể deploy thành công chỉ bằng tài liệu mà không cần hỏi thêm tác giả code.

**Acceptance Scenarios**:

1. **Given** người dùng mới đọc tài liệu deploy, **When** làm theo từng bước được liệt kê, **Then** họ hoàn thành deploy và xác thực kết nối DB thành công.
2. **Given** hệ thống có lỗi cấu hình env trong production, **When** người vận hành mở phần troubleshooting, **Then** họ tìm được nguyên nhân và hướng xử lý tương ứng.

---

### User Story 3 - Kiểm tra sau deploy có thể xác nhận nhanh (Priority: P3)

Là người vận hành production, tôi muốn có checklist kiểm tra sau deploy để xác nhận các luồng cốt lõi hoạt động ổn định.

**Why this priority**: Đây là lớp bảo vệ cuối giúp phát hiện sớm lỗi cấu hình trước khi ảnh hưởng người dùng.

**Independent Test**: Chạy checklist hậu deploy và xác nhận tất cả mục kiểm tra đều pass trên môi trường production.

**Acceptance Scenarios**:

1. **Given** một bản deploy mới đã hoàn tất, **When** người vận hành chạy checklist xác thực, **Then** họ nhận được kết luận pass/fail cho từng hạng mục (API, redirect, analytics/dashboard).

### Edge Cases

- Điều gì xảy ra khi Vercel có env key đúng tên nhưng giá trị rỗng hoặc sai định dạng?
- Hệ thống xử lý thế nào khi Supabase tạm thời không truy cập được từ production?
- Điều gì xảy ra khi người vận hành dùng nhầm URL/credentials của local thay vì production?
- Điều gì xảy ra khi thay đổi env trên Vercel nhưng chưa redeploy?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Hệ thống MUST xác định và công bố danh sách biến môi trường bắt buộc để chạy production trên Vercel với Supabase.
- **FR-002**: Hệ thống MUST fail fast tại thời điểm khởi tạo runtime khi thiếu biến môi trường bắt buộc, và không phục vụ request nghiệp vụ khi cấu hình chưa hợp lệ.
 - **FR-008**: Hệ thống MUST enforce presence of required env variables for both Production and Preview on Vercel; Preview deployments lacking required env MUST be marked unhealthy and fail fast as well.
- **FR-003**: Người vận hành MUST có thể theo tài liệu để thiết lập biến môi trường production trong Vercel mà không cần suy đoán.
- **FR-004**: Tài liệu deploy MUST bao gồm quy trình kiểm tra kết nối Supabase sau deploy.
- **FR-005**: Tài liệu deploy MUST bao gồm phần khắc phục sự cố cho các lỗi env phổ biến (thiếu key, sai giá trị, không redeploy, nhầm endpoint).
- **FR-006**: Hệ thống MUST cung cấp tín hiệu lỗi nhất quán, dễ hiểu trong health check/log khi cấu hình env kết nối Supabase không hợp lệ.
- **FR-007**: Tài liệu và template cấu hình môi trường MUST phân biệt rõ giá trị local và production để tránh dùng nhầm.

### Quality & Experience Requirements _(mandatory)_

- **QR-001 (Code Quality)**: Phạm vi xử lý cấu hình production MUST có biên rõ ràng giữa lỗi cấu hình và lỗi xử lý nghiệp vụ, kèm thông điệp có thể hành động.
- **QR-002 (Testing)**: Tính năng MUST định nghĩa kiểm thử cho các trường hợp đủ env, thiếu env và env sai định dạng trong các luồng quan trọng.
- **QR-003 (UX Consistency)**: Trạng thái lỗi cấu hình MUST dùng ngôn ngữ nhất quán trên API phản hồi và tài liệu vận hành.
- **QR-004 (Performance)**: Cơ chế kiểm tra cấu hình MUST không làm tăng đáng kể độ trễ cảm nhận của người dùng ở các luồng redirect và tạo link.

### Key Entities _(include if feature involves data)_

- **Deployment Environment Profile**: Đại diện cho cấu hình môi trường chạy (production/local), gồm tập biến bắt buộc và trạng thái sẵn sàng.
- **Environment Variable Requirement**: Mô tả một biến cấu hình, mục đích, mức bắt buộc, và quy tắc hợp lệ.
- **Deployment Verification Checklist Item**: Một hạng mục kiểm chứng hậu deploy, gồm điều kiện pass/fail và kết quả ghi nhận.
- **Configuration Error Signal**: Thông tin lỗi tiêu chuẩn khi env không hợp lệ, gồm mã lỗi, thông điệp và hướng xử lý.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% bản deploy production mới có đủ biến môi trường bắt buộc trước khi mở truy cập công khai.
- **SC-002**: Người vận hành lần đầu có thể hoàn tất quy trình cấu hình và xác minh production trong dưới 20 phút chỉ dựa trên tài liệu.
- **SC-003**: Ít nhất 95% lỗi cấu hình env production được phát hiện trong bước kiểm tra hậu deploy, không chờ tới phản ánh từ người dùng cuối.
- **SC-004**: Giảm ít nhất 70% số lần rollback do thiếu/sai cấu hình Supabase trong vòng 30 ngày sau khi áp dụng thay đổi.
- **SC-005**: 100% lỗi thiếu env bắt buộc được phát hiện trước khi phục vụ request đầu tiên, kèm thông điệp nêu rõ nguyên nhân và hành động khắc phục trong log vận hành.
- **SC-006**: Các luồng chính (tạo short URL, redirect, xem dashboard) giữ tỷ lệ thành công từ 99% trở lên trong 7 ngày đầu sau release.

## Assumptions

- Dự án tiếp tục dùng Vercel làm nền tảng hosting production và Supabase làm dịch vụ dữ liệu chính.
- Người triển khai có quyền cấu hình Project Settings trên Vercel.
- Không mở rộng phạm vi sang thay đổi nhà cung cấp hạ tầng trong lần cập nhật này.
- Luồng nghiệp vụ hiện tại (shorten, redirect, analytics/dashboard) được giữ nguyên; chỉ bổ sung độ tin cậy triển khai và vận hành.
- Quy trình release cho phép chạy checklist hậu deploy trước khi công bố rộng rãi.
