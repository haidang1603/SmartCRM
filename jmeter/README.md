# SMARTCRM — PHASE 4: JMETER PERFORMANCE BENCHMARK SUITE

Kế hoạch kiểm thử hiệu năng tái lập (Reproducible JMeter Test Plan) cho SmartCRM.

## 1. Cấu trúc kịch bản kiểm thử

Test Plan `smartcrm_performance_test_plan.jmx` bao gồm các bước tự động:
1. **Setup Thread Group (Authentication):**
   - Đăng nhập qua `POST /api/v1/auth/login` với tài khoản Quản trị viên (`admin` / `Admin@123`).
   - Tự động trích xuất Bearer JWT token từ JSON response qua JSONPostProcessor và lưu vào biến toàn cục `GLOBAL_JWT_TOKEN`.
2. **Main Workload Thread Group (Multi-user concurrency):**
   - Tự động đính kèm Header `Authorization: Bearer ${GLOBAL_JWT_TOKEN}` vào mọi request.
   - **Sampler 1:** `GET /api/v1/dashboard/metrics` (Kiểm tra phản hồi qua Redis Cache).
   - **Sampler 2:** `GET /api/v1/customers?search=Alpha` (Kiểm tra tìm kiếm chỉ mục Composite Index V3 & EntityGraph).
   - **Sampler 3:** `GET /api/v1/deals/kanban` (Kiểm tra tổng hợp đa giai đoạn pipeline trên Database).
   - **Sampler 4:** `GET /api/v1/performance/metrics` (Đo lường thời gian đọc metrics giám sát hệ thống).
3. **Response Assertions:**
   - Xác thực mã phản hồi HTTP `200 OK`.
   - Xác thực cấu trúc JSON `success == true`.

## 2. Hướng dẫn thực thi

### Cách 1: Chạy trực tiếp từ Web UI (Performance Lab)
Không cần cài đặt JMeter, chỉ cần truy cập giao diện SmartCRM:
1. Mở trình duyệt tại `http://localhost:5173/` (hoặc `http://localhost/` trong Docker).
2. Đăng nhập với tài khoản `admin` / `Admin@123`.
3. Nhấp vào tab **"Performance Lab"** trên Sidebar.
4. Chọn kịch bản, chỉnh Virtual Users và bấm **"Bắt đầu đo kiểm"**.

### Cách 2: Chạy qua dòng lệnh JMeter CLI (Non-GUI Mode)
Yêu cầu: Đã cài đặt Apache JMeter 5.6+ và thêm `bin` vào biến môi trường `PATH`.

```bash
# Trên Windows
cd jmeter
run_jmeter_test.bat

# Hoặc tùy biến tham số:
jmeter -n -t smartcrm_performance_test_plan.jmx -l results/run.jtl -e -o results/report -Jthreads=15 -Jloops=30 -Jhost=localhost -Jport=8080

# Trên Linux / macOS
cd jmeter
chmod +x run_jmeter_test.sh
./run_jmeter_test.sh localhost 8080 15 30
```

## 3. Cách diễn giải các chỉ số (Metric Interpretation)

- **p50 (Median Latency):** Thời gian phản hồi mà 50% số lượng request đạt được. Đây là trải nghiệm điển hình của người dùng thông thường.
- **p95 (95th Percentile):** Thời gian phản hồi của 95% request nhanh nhất. Chỉ số này loại bỏ các dao động ngoại lai cực đoan (spikes) và là chỉ số cam kết chất lượng dịch vụ (SLO Target: `< 500ms`).
- **p99 (99th Percentile):** Thời gian phản hồi trong trường hợp xấu nhất (Tail Latency), thường phản ánh tác động của Java Garbage Collection (GC Pause) hoặc độ trễ I/O đĩa.
- **Throughput (Transactions / Requests per Second):** Năng lực xử lý tối đa của hệ thống trong 1 giây mà không làm tăng error rate.
- **Error Rate (%):** Tỷ lệ request gặp lỗi (Yêu cầu: `0.00%`).
