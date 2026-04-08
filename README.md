# BE E-Commerce API (Current Status)

README này mô tả đúng hiện trạng code tại thời điểm hiện tại để bạn biết dự án đang có gì và chưa có gì.

## 1. Tổng quan

Backend được xây dựng bằng TypeScript + Express, dùng PostgreSQL (TypeORM) làm database chính, Redis cho cache/queue, và Swagger để xem tài liệu API.

### Hiện đã có

- Auth cơ bản: register, verify email, login, logout, refresh token, forgot/reset/change password.
- RBAC cơ bản: CRUD Role và Permission.
- Middleware xác thực JWT và kiểm tra quyền.
- Queue gửi email bằng BullMQ + Redis (đang xử lý job verify email).
- Swagger docs từ annotation trong route/controller.

### Chưa có hoặc mới ở mức khung

- User API hiện mới có route mẫu `GET /api/users`.
- Chưa có các module nghiệp vụ e-commerce như sản phẩm, đơn hàng, giỏ hàng, thanh toán...
- Chưa có migration/seed chính thức.

## 2. Công nghệ đang dùng

- Node.js + TypeScript
- Express 5
- TypeORM + PostgreSQL
- Redis + BullMQ
- JWT, bcrypt
- Joi validation
- Swagger (swagger-jsdoc + swagger-ui-express)
- ESLint + Prettier

## 3. Cấu trúc module hiện tại

- `server.ts`: khởi tạo app, middleware, router, Swagger, kết nối DB/Redis.
- `src/routes`: route cho auth, users, roles, permissions.
- `src/controllers`: xử lý request/response theo từng module.
- `src/services`: business logic (auth, role, permission, email).
- `src/models/schemas`: entity TypeORM (users, roles, permissions, role_permission, user_role).
- `src/middlewares`: middleware auth, permission, error handler.
- `src/config`: cấu hình DB, Redis, email.
- `src/utils/queue.ts`: cấu hình queue và worker email.

## 4. API đang có

Base URL local: `http://localhost:8000`

### Auth (`/api/auth`)

- `POST /register`
- `GET /verify-email`
- `POST /login`
- `POST /logout`
- `POST /refresh-token`
- `GET /forgot-password`
- `POST /reset-password`
- `POST /change-password`

### Roles (`/api/roles`)

- `POST /create`
- `GET /get-all`
- `GET /:id`
- `PUT /:id`
- `DELETE /:id`

### Permissions (`/api/permissions`)

- `POST /create`
- `GET /get-all`
- `GET /:id`
- `PUT /:id`
- `DELETE /:id`

### Users (`/api/users`)

- `GET /` (route mẫu)

## 5. Yêu cầu môi trường

- Node.js 18+
- PostgreSQL
- Redis

## 6. Biến môi trường cần có

Tạo file `.env` với các biến tối thiểu sau (điền giá trị thật theo máy của bạn):

Lưu ý bảo mật:

- Không commit `.env` chứa secret thật lên Git.
- Nếu bạn từng đẩy `.env` thật lên remote, nên rotate toàn bộ secret ngay.

## 7. Chạy dự án local

1. Cài dependency

```bash
npm install
```

2. Chạy Redis bằng Docker Compose (khuyến nghị)

```bash
docker compose up -d redis
```

3. Đảm bảo PostgreSQL đang chạy và đã tạo database tương ứng trong `.env`.

4. Chạy server

```bash
npm run dev
```

Server chạy ở `http://localhost:8000`.

## 8. Scripts

- `npm run dev`: chạy bằng nodemon với `server.ts`.
- `npm run start`: chạy nodemon (tương tự môi trường local hiện tại).
- `npm run build`: build TypeScript ra `dist`.
- `npm run lint`: kiểm tra lint.
- `npm run lint:fix`: tự sửa lỗi lint.
- `npm run prettier`: check format.
- `npm run prettier:fix`: format code.

## 9. Swagger API Docs

Sau khi chạy server, truy cập:

`http://localhost:8000/api-docs`

## 10. Ghi chú hiện trạng

- Dự án hiện tập trung vào nền tảng auth + role/permission.
- Một số module e-commerce vẫn chưa triển khai.
- Có thể cần seed dữ liệu role mặc định (ví dụ `student`) để luồng register hoạt động ổn định.
