# Module Quản Lý Bằng Cấp (WebApp/DesktopApp)

## 📖 Giới thiệu
Đây là dự án **Xây dựng Module Quản lý Bằng Cấp**, cung cấp giải pháp quản lý, lưu trữ, tra cứu và xác minh văn bằng, chứng chỉ tập trung. Hệ thống thay thế phương thức quản lý thủ công truyền thống, hướng tới việc đảm bảo tính minh bạch, an toàn dữ liệu và hỗ trợ xác thực nhanh chóng thông qua mã QR và các công cụ tra cứu trực tuyến.

## 🚀 Công nghệ sử dụng
Dự án được xây dựng dựa trên các công nghệ hiện đại:
* **Frontend:** ReactJS
* **Backend:** NodeJS
* **Database:** MongoDB
* **Containerization:** Docker & Docker Compose

## ✨ Tính năng chính
* **Quản lý người dùng:** Phân quyền quản trị viên, cán bộ quản lý, đơn vị cấp, người dùng.
* **Quản lý văn bằng:** Thêm mới (thủ công/Excel/Hình ảnh), cập nhật, xóa, và duyệt văn bằng.
* **Quản lý đơn vị & loại văn bằng:** Quản lý danh mục các đơn vị cấp bằng và các loại chứng chỉ/văn bằng.
* **Tra cứu & Xác minh:** Tra cứu văn bằng qua mã số, thông tin cá nhân hoặc quét mã QR.
* **Bảo mật:** Tích hợp chữ ký số và xác thực người dùng.

## 🔧 Cấu hình Môi trường (.env)
Trước khi khởi chạy hệ thống, bạn cần tạo các file cấu hình môi trường `.env` trong các thư mục mã nguồn tương ứng.

### 1. Cấu hình Backend (NodeJS)
Tạo file `.env` trong thư mục gốc của Backend (Server) với nội dung sau:

```env
PORT=3000
JWT_SECRET=ucantseeme
MONGODB_URI=mongodb://mongo:27017/modulequanlybangcap
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
REACT_URL=http://localhost:3001
GEMINI_API_KEY=your_gemini_api_key
MEGA_EMAIL=your_mega_email
MEGA_PASSWORD=your_mega_password
```

> Lưu ý: Các trường để trống hoặc giá trị mẫu (`your_...`) cần được điền thông tin thực tế của bạn để các chức năng gửi mail, lưu trữ đám mây hoặc AI hoạt động chính xác.

### 2. Cấu hình Frontend (ReactJS)
Tạo file `.env` trong thư mục gốc của Frontend (Client) với nội dung sau:

```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_WEBSITE_URL=http://localhost:3001
REACT_APP_STORAGE_SECRET=ucantseeme
```

## ⚙️ Hướng dẫn Cài đặt & Vận hành (Quick Start)
Máy tính cần cài đặt sẵn Docker Desktop (hoặc Docker Engine & Docker Compose).

### Bước 1: Build Docker Image
Xây dựng các image cần thiết cho dự án từ mã nguồn.

```bash
docker compose build
```

### Bước 2: Khởi động Cơ sở dữ liệu
Khởi động container MongoDB trước để chuẩn bị nạp dữ liệu.

```bash
docker compose up -d mongo
```

### Bước 3: Nạp dữ liệu mẫu (Seed Data)
Thực hiện sao chép các file dữ liệu JSON từ thư mục DB/ vào trong container và import vào MongoDB.

**Sao chép dữ liệu vào container:**

```bash
docker cp DB/modulequanlybangcap.users.json mongo:/users.json
docker cp DB/modulequanlybangcap.degreetypes.json mongo:/degreetypes.json
docker cp DB/modulequanlybangcap.degrees.json mongo:/degrees.json
docker cp DB/modulequanlybangcap.issuers.json mongo:/issuers.json
```

**Import dữ liệu vào database `modulequanlybangcap`:**

```bash
docker exec -i mongo mongoimport --db modulequanlybangcap --collection users --file /users.json --jsonArray
docker exec -i mongo mongoimport --db modulequanlybangcap --collection degreetypes --file /degreetypes.json --jsonArray
docker exec -i mongo mongoimport --db modulequanlybangcap --collection degrees --file /degrees.json --jsonArray
docker exec -i mongo mongoimport --db modulequanlybangcap --collection issuers --file /issuers.json --jsonArray
```

### Bước 4: Khởi chạy ứng dụng
Sau khi cơ sở dữ liệu đã sẵn sàng, khởi động toàn bộ các dịch vụ còn lại.

```bash
docker compose up -d
```

### 🌐 Truy cập ứng dụng
Sau khi hoàn tất, truy cập vào Web App tại địa chỉ:

```
URL: http://localhost:3001/
```

### 🛑 Quản lý Docker Containers
**Ngưng hoạt động (Stop):** Dùng để tạm dừng các container đang chạy.

```bash
docker compose stop
```

**Ngưng và Xóa (Down & Clean):** Dùng để dừng, xóa các container và volume
(dữ liệu database sẽ mất nếu không được cấu hình mount ra ngoài).

```bash
docker compose down -v
```

**Xem logs của các container:** Hữu ích để debug khi ứng dụng gặp lỗi

```bash
docker compose logs -f
```

> Chú ý: Thay `-f` bằng `--tail 100` để chỉ xem 100 dòng log gần nhất.

