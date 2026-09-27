# Halo — Supabase Auth trên Render

Web đăng ký, đăng nhập, đăng xuất và quên mật khẩu bằng Supabase Auth. Giao diện được phục vụ bởi Express, không cần build frontend.

## Chạy local

```bash
npm install
cp .env.example .env
npm run dev
```

Điền `SUPABASE_URL` và `SUPABASE_ANON_KEY` trong `.env`, sau đó mở `http://localhost:3000`.

## Cấu hình Supabase

1. Vào Supabase Dashboard → **Project Settings → API** và lấy Project URL cùng Publishable/anon key.
2. Có thể chạy `supabase/schema.sql` trong **SQL Editor** để tạo bảng `profiles`, trigger và RLS.
3. Trong **Authentication → URL Configuration**, thêm URL local và URL Render sau khi deploy vào **Redirect URLs**. Ví dụ: `https://ten-app.onrender.com/**`.
4. Nếu muốn đăng nhập ngay sau đăng ký, tắt **Confirm email** trong Authentication → Providers → Email. Nếu bật, người dùng sẽ nhận email xác nhận trước khi đăng nhập.

## Deploy lên Render

### Cách nhanh bằng Dashboard

1. Đẩy thư mục này lên GitHub.
2. Render → **New → Web Service** → chọn repository.
3. Build Command: `npm install`.
4. Start Command: `npm start`.
5. Thêm biến môi trường `SUPABASE_URL` và `SUPABASE_ANON_KEY`.

Hoặc dùng `render.yaml` để Render nhận cấu hình service tự động. Chỉ dùng publishable/anon key ở frontend; tuyệt đối không đưa `service_role` key vào biến môi trường của app này.
