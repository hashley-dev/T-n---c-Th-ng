# Tôn Đức Thắng — Không gian tư liệu số

Trang web tĩnh (HTML/CSS/JS thuần, không cần build) giới thiệu về Chủ tịch **Tôn Đức Thắng** (1888 – 1980): thân thế, cuộc đời, hành trình hoạt động cách mạng, các sự kiện lịch sử, thư viện hình ảnh, tư liệu phim và di sản.

## Cấu trúc

```
test6/
├── test6.html   # Trang chính (bố cục, các section)
├── test6.css    # Toàn bộ giao diện, responsive
└── test6.js     # Dữ liệu (timeline, hành trình, sự kiện, thư viện, trích dẫn) + hiệu ứng
```

## Chạy thử ở máy

Chỉ cần mở trực tiếp `test6/test6.html` bằng trình duyệt.

Hoặc chạy một web server tĩnh tại thư mục gốc:

```powershell
# Python 3
python -m http.server 5500
# rồi mở http://localhost:5500/test6/test6.html
```

## Nội dung & chỉnh sửa

- Toàn bộ nội dung (mốc thời gian, chặng hành trình, sự kiện, ảnh, trích dẫn) nằm trong phần **DỮ LIỆU** ở đầu `test6/test6.js` — sửa ở đó, không cần đụng tới code render.
- Muốn dùng **ảnh thật**: chép ảnh vào thư mục `test6/images/` rồi trỏ đường dẫn trong `test6.js` (ví dụ `"images/ba-son.jpg"`). Nếu thiếu file, trang tự thay bằng ảnh SVG dự phòng.
- Muốn nhúng **video**: xem hướng dẫn ngay trong phần `#video` của `test6.html` (thay thẻ `a.video-frame` bằng `iframe` YouTube).

## Đưa lên GitHub Pages

Xem hướng dẫn trong file này hoặc làm theo các bước:

1. Đưa toàn bộ mã nguồn lên repository trên GitHub (nhánh `main`).
2. Vào **Settings → Pages**.
3. **Source** chọn `Deploy from a branch`, **Branch** chọn `main` và thư mục `/ (root)`.
4. Bấm **Save**, chờ ~1 phút.
5. Trang sẽ chạy tại `https://<tên-tài-khoản>.github.io/<tên-repo>/test6/test6.html`.

## Giấy phép & nguồn tư liệu

Trang web được xây dựng với mục đích **giáo dục và học tập**. Hình ảnh, video và tư liệu thuộc bản quyền của các nguồn gốc tương ứng (Đại học Tôn Đức Thắng, các bảo tàng, kênh truyền thông…). Vui lòng ghi rõ nguồn khi sử dụng lại.
