PHONG VAN — DEPLOY LÊN VERCEL (1 LINK CÔNG KHAI)
=================================================

Tóm tắt kiến trúc
-----------------
- **Vercel** (1 project): phục vụ 3 frontend tại các đường dẫn bí mật trên **một domain**.
- **Render** (1 web service): chạy backend Flask + MongoDB Atlas (API, upload, email).

Backend **không** chạy tốt trên Vercel serverless (Flask lớn, upload file, Google Docs).
Render free tier đủ để test; production nên thêm Persistent Disk cho thư mục `uploads/`.


LINK BẠN SẼ NHẬN ĐƯỢC
---------------------
Giả sử domain Vercel là `https://phong-van.vercel.app` (hoặc domain riêng bạn gắn):

| Ứng dụng      | Link |
|---------------|------|
| Mentee        | `https://phong-van.vercel.app/hskjchaihldkajj/` |
| Mentor        | `https://phong-van.vercel.app/hjgafjkshdgfahjkkjcsdhkk/login` |
| Super Admin   | `https://phong-van.vercel.app/yaghkcjhaiuhahjks/login` |
| Trang gốc `/` | Thông báo — không hiện menu (giống bản local) |

Đường dẫn bí mật nằm trong `deploy/public_paths.json` (giống `build-public.bat`).

Backend API (Render): `https://phong-van-api.onrender.com/api/health` — dùng để kiểm tra.


CÁC FILE ĐÃ TẠO
-----------------
- `vercel.json` — cấu hình build + rewrite SPA + proxy `/api` (tùy chọn)
- `package.json` (root) — script `npm run vercel-build`
- `scripts/build-vercel.mjs` — build 3 frontend vào `deploy/vercel-out/`
- `.vercelignore` — loại trừ venv, uploads, .env
- `render.yaml` — blueprint deploy backend lên Render
- `deploy/.env.vercel.example` — mẫu biến môi trường
- `backend/app.py` — CORS cho `*.vercel.app` + `CORS_ORIGINS`
- `backend/requirements.txt` — thêm `gunicorn`


BƯỚC 1 — DEPLOY BACKEND LÊN RENDER (làm trước)
-----------------------------------------------
1. Đăng ký https://render.com và kết nối GitHub/GitLab (hoặc deploy thủ công).
2. **New → Blueprint** → chọn repo → Render đọc `render.yaml`.
   Hoặc **New → Web Service**:
   - Root Directory: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
3. Thêm biến môi trường (xem `deploy/.env.vercel.example`):
   - `MONGODB_URL`, `SECRET_KEY`, `SMTP_*`, `SUPER_ADMIN_EMAILS`, …
   - `GOOGLE_SERVICE_ACCOUNT_JSON` = nội dung file `service-account.json` (một dòng JSON)
4. (Khuyến nghị) **Disk** → mount `backend/uploads` — nếu không, file upload mất khi redeploy.
5. Deploy xong → copy URL dạng `https://phong-van-api.onrender.com`
6. Kiểm tra: mở `https://phong-van-api.onrender.com/api/health` → phải trả JSON OK.


BƯỚC 2 — DEPLOY FRONTEND LÊN VERCEL
------------------------------------
### Cách A — Vercel Dashboard (dễ nhất)
1. https://vercel.com → **Add New Project** → import repo `Phong_van`.
2. **Root Directory**: để trống (root repo).
3. Vercel tự đọc `vercel.json` (buildCommand, outputDirectory).
4. **Environment Variables** (Production + Preview):

   | Biến | Giá trị |
   |------|---------|
   | `VITE_API_URL` | `https://phong-van-api.onrender.com` (URL Render bước 1) |

5. (Tùy chọn) Sửa `vercel.json` — thay `REPLACE_WITH_RENDER_BACKEND_URL` bằng URL Render
   nếu muốn frontend gọi `/api/...` qua proxy Vercel thay vì gọi thẳng backend.
6. **Deploy** → nhận link `https://<ten-project>.vercel.app`

### Cách B — Vercel CLI
```bash
npm i -g vercel
cd Phong_van
vercel login
vercel link
vercel env add VITE_API_URL production
# Nhập: https://phong-van-api.onrender.com
vercel --prod
```

### Build thử trên máy local
```bash
cd Phong_van
set VITE_API_URL=https://phong-van-api.onrender.com
npm run vercel-build
# Kết quả: deploy/vercel-out/
```


BƯỚC 3 — CẬP NHẬT URL TRÊN RENDER (sau khi có link Vercel)
-----------------------------------------------------------
Trên Render, sửa các biến (thay `phong-van.vercel.app` bằng domain thật):

```
PUBLIC_APP_URL=https://phong-van.vercel.app
BACKEND_PUBLIC_URL=https://phong-van-api.onrender.com
MENTOR_ADMIN_URL=https://phong-van.vercel.app/hjgafjkshdgfahjkkjcsdhkk/access-requests
MENTEE_PROFILE_URL=https://phong-van.vercel.app/hskjchaihldkajj/profile
CORS_ORIGINS=https://phong-van.vercel.app
```

Redeploy Render sau khi đổi env.


BƯỚC 4 — DOMAIN RIÊNG (tùy chọn)
--------------------------------
- **Vercel**: Project → Settings → Domains → thêm `apply.yourdomain.com`
- Cập nhật lại `PUBLIC_APP_URL`, `CORS_ORIGINS`, `MENTOR_*`, `MENTEE_*` trên Render
- Thêm domain mới vào `CORS_ORIGINS` trên Render


BIẾN MÔI TRƯỜNG VERCEL
----------------------
| Biến | Bắt buộc | Mô tả |
|------|----------|-------|
| `VITE_API_URL` | Có | URL backend Render (không `/` cuối). Gắn vào build frontend. |
| `BACKEND_PUBLIC_URL` | Không | Dự phòng nếu không set `VITE_API_URL` |

Không cần `VITE_BASE_PATH` — script build tự đọc `deploy/public_paths.json`.


BIẾN MÔI TRƯỜNG RENDER (backend)
--------------------------------
| Biến | Bắt buộc | Mô tả |
|------|----------|-------|
| `MONGODB_URL` | Có | MongoDB Atlas connection string |
| `SECRET_KEY` | Có | JWT secret (chuỗi dài, ngẫu nhiên) |
| `DATABASE_NAME` | Không | Mặc định `phong_van` |
| `CORS_ORIGINS` | Có (prod) | Domain Vercel, ví dụ `https://xxx.vercel.app` |
| `PUBLIC_APP_URL` | Có | URL Vercel (email, link công khai) |
| `BACKEND_PUBLIC_URL` | Có | URL Render API |
| `MENTOR_ADMIN_URL` | Có | Link mentor trên Vercel |
| `MENTEE_PROFILE_URL` | Có | Link mentee profile trên Vercel |
| `SMTP_*` | Có (email) | Gmail app password |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Có (Docs) | JSON service account (Render không có file local) |
| `GOOGLE_DOCS_TEMPLATE_ID` | Có (Docs) | ID template Google Doc |

Xem đầy đủ trong `backend/.env.example` và `deploy/.env.vercel.example`.


CÁCH API HOẠT ĐỘNG
------------------
**Cách khuyến nghị (đã cấu hình):**
- Build embed `VITE_API_URL=https://...onrender.com`
- Frontend gọi thẳng Render → CORS cho phép `*.vercel.app`

**Cách thay thế (same-origin):**
- Để `VITE_API_URL` trống → frontend gọi `/api/...`
- Sửa rewrite trong `vercel.json` trỏ `/api` → Render
- `BACKEND_PUBLIC_URL` trên Render có thể = URL Vercel (nếu email cần link `/api` cùng domain)


LƯU Ý QUAN TRỌNG
----------------
1. **Render free tier** sleep sau ~15 phút không dùng — lần mở đầu có thể chậm 30–60 giây.
2. **Upload file** cần Persistent Disk trên Render hoặc chuyển sang S3/Cloudinary sau này.
3. **Không commit** `.env`, `service-account.json`, mật khẩu MongoDB.
4. Sau mỗi lần sửa code frontend: push Git → Vercel tự build lại.
5. Sau sửa backend: push Git → Render tự deploy lại.
6. Local dev vẫn dùng `start.bat` / `build-public.bat` như cũ — không ảnh hưởng.


XỬ LÝ LỖI THƯỜNG GẶP
---------------------
| Triệu chứng | Nguyên nhân | Cách sửa |
|-------------|-------------|----------|
| API lỗi CORS | Thiếu domain Vercel trên Render | Thêm `CORS_ORIGINS` |
| Trang trắng / 404 route | Chưa rewrite SPA | Kiểm tra `vercel.json` rewrites |
| `API chưa sẵn sàng` | Backend sleep / sai URL | Kiểm tra `/api/health`, `VITE_API_URL` |
| Upload mất sau redeploy | Render ephemeral disk | Thêm Persistent Disk |
| Google Docs lỗi | Thiếu JSON trên Render | Set `GOOGLE_SERVICE_ACCOUNT_JSON` |


TÓM TẮT NHANH
-------------
1. Deploy backend Render → lấy URL API
2. Deploy repo lên Vercel, set `VITE_API_URL` = URL Render
3. Cập nhật URL Vercel trên env Render (`CORS_ORIGINS`, `PUBLIC_APP_URL`, …)
4. Gửi 3 link con (mentee / mentor / superadmin) cho từng nhóm người dùng

Một domain Vercel = **một link gốc công khai**; 3 app vẫn tách đường dẫn bí mật như thiết kế hiện tại.
