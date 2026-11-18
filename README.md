# YouTube Video Pipeline

Hệ thống tự động hóa sản xuất video YouTube phong cách hoạt hình giải thích lịch sử & tài chính (Storytelling Animation) kết hợp giữa **Python** (TTS, xử lý âm thanh, đồng bộ khẩu hình qua Whisper) và **Remotion / React** (dựng hình chuyển động, đồ hoạ, phụ đề và render video MP4 / Thumbnail PNG).

---

## 🚀 Tính Năng Nổi Bật

- **Tự Động Hóa Toàn Diện (End-to-End Pipeline):** Từ kịch bản JSON ➔ Lồng tiếng (TTS) ➔ Căn khớp khẩu hình (Lip-sync) ➔ Dựng hình React Remotion ➔ Render MP4 & Thumbnail PNG.
- **Mô Hình Hybrid Tiết Kiệm Chi Phí:**
  - TTS Tiếng Anh chất lượng cao bằng model **Kokoro** (chạy local trên CPU).
  - Căn thời gian từng từ và khẩu hình bằng **faster-whisper** (chạy local).
  - Chuẩn hoá âm thanh chuẩn YouTube (-14 LUFS) bằng FFmpeg 2-pass Loudnorm.
- **Hệ Thống Nhạc Nền Đa Tầng Cảm Xúc (Mood-based BGM):**
  - Tự động thay đổi và hòa âm chéo (crossfade 2s) giữa 5 sắc thái: `calm`, `mystery`, `tense`, `triumph`, `sad` theo từng chương của câu chuyện.
- **Tự Động Sinh Thumbnail Chuẩn YouTube (CTR-Optimized):**
  - Tự động render ảnh thumbnail 1280x720 sắc nét theo phong cách giật gân, tương phản cao, nổi bật nhân vật và số liệu.

---

## 🛠 Hướng Dẫn Sử Dụng

### 1. Môi trường yêu cầu
- **Node.js** (v18+)
- **Python 3.12** với venv tại `C:/Users/phama/.venvs/video-pipeline` (hoặc venv tương đương cài đặt các package trong `requirements.txt`).

### 2. Cài đặt phụ thuộc
```bash
# Cài đặt thư viện Node.js
npm install

# Môi trường Python
pip install -r requirements.txt
```

### 3. Các lệnh chính

| Lệnh | Chức năng |
| :--- | :--- |
| `npm run studio` | Mở Remotion Studio trên trình duyệt để xem và chỉnh sửa giao diện video trực tiếp. |
| `npm run render` | Render video tập phim ra file `out/episode.mp4`. |
| `npm run thumbnail` | Render ảnh Thumbnail chuẩn YouTube ra file `out/thumbnail.png`. |

### 4. Quy trình chạy pipeline Python
```bash
# Render video từ file kịch bản JSON có sẵn (kèm tự động xuất thumbnail và chuẩn hóa âm thanh)
python make_video.py scripts/life/charles-ponzi.json

# Chỉ tạo kịch bản và chuẩn bị dữ liệu, không render video
python make_video.py scripts/life/charles-ponzi.json --no-render

# Kiểm tra tính hợp lệ của kịch bản trước khi đưa vào hàng đợi
python daily.py check scripts/life/charles-ponzi.json
```

---

## 📝 Lịch Sử Nâng Cấp & Công Việc Đã Thực Hiện (Changelog)

### [Đợt 1] - Nâng cấp Hệ thống Nhạc Nền (BGM) & Tự Động Sinh Thumbnail (18/11/2026 - 19/11/2026)

#### 1. Hệ Thống Âm Thanh & Nhạc Nền (BGM)
- **Khắc phục lỗi rơi về nhạc tổng hợp đơn điệu:**
  - Phát hiện các file kịch bản lớn (`charles-ponzi.json`, `jesse-livermore.json`, `john-law.json`) bị thiếu trường `"mood"` trong `meta.chapters`, dẫn tới việc pipeline tự động phát file nhạc `bed.wav` (sóng sin toán học khô cứng).
  - Bổ sung đầy đủ 14-15 mốc mood cảm xúc (`mystery`, `calm`, `tense`, `triumph`, `sad`) cho từng chương trong cả 3 kịch bản, kích hoạt tính năng hòa âm chuyển cảnh 2 giây trong `Episode.tsx`.
- **Nâng cấp logic mã nguồn:**
  - `make_video.py`: Đổi nhạc nền mặc định thành `public/music/calm.mp3` thay vì `bed.wav` khi không có chương cụ thể.
  - Thêm cơ chế kiểm tra `mood` hợp lệ trong hàm `validate()` của `make_video.py` và hàm `check()` của `daily.py`.

#### 2. Tự Động Hóa Tạo Thumbnail Thu Hút Click (Thumbnail Generation)
- **Xây dựng Component `src/Thumbnail.tsx`:**
  - Render ảnh 1280 × 720 px chuẩn tỷ lệ YouTube 16:9.
  - Bố cục 2 cột CTR cao: Cột trái chứa badge sự kiện `⚡ TRUE STORY`, tiêu đề in hoa khổ lớn (font Arial Black/Impact với viền đen nổi khối và bóng đổ sâu), phụ đề màu vàng/xanh neon và khung thống kê tăng trưởng tiền tệ.
  - Cột phải hiển thị nhân vật chính với biểu cảm cường điệu (shock/happy) cắt nét từ `public/faces/`, hiệu ứng hào quang sáng (Aura Glow viền vàng) kèm sticker tiền bay.
- **Tích hợp Remotion Composition:**
  - Đăng ký composition `Thumbnail` vào `src/Root.tsx`, tự động phân tích tiêu đề, bối cảnh mở đầu và mặt nhân vật từ `public/manifest.json`.
- **Tự động hóa CLI & Khắc phục lỗi môi trường Windows:**
  - Thêm script `npm run thumbnail` vào `package.json`.
  - Cập nhật `make_video.py` tự động render luôn file `out/<episode>_thumb.png` ngay sau khi render xong file `.mp4`.
  - Tối ưu hóa đường dẫn thực thi `node_modules/.bin/remotion.cmd` trên Windows để vượt qua hạn chế `ExecutionPolicy (npx.ps1)` của PowerShell.
- **Kiểm thử thực tế:** Render thành công file mẫu chất lượng cao tại `out/test_thumbnail.png`.

### [Đợt 2] - Mở Rộng Kho Sound Effects (SFX) & Tự Động Trigger (19/11/2026)

#### 1. Mở rộng 6 Sound Effects (SFX) mới trong `public/sfx/`
Bổ sung 6 hiệu ứng âm thanh kịch tính và hài hước (chuẩn phong cách meme/comic YouTube):
- `boom.wav`: Bass drop siêu trầm + xung va đập (dùng cho các cú sốc, thị trường sụp đổ, biến cố lớn).
- `cash.wav`: Tiếng máy đếm tiền / két sắt "cha-ching" với 3 nốt chuông kim loại ngân vang (thay thế cho tiếng coin cũ khi xuất hiện tiền tài, làm giàu).
- `gavel.wav`: Tiếng búa toà án gỗ vang rền (dành cho các cảnh kết án, bắt giam, luật lệ mới).
- `scratch.wav`: Tiếng dừng đĩa than (record scratch) cho các tình huống ngớ ngẩn, quay xe, trớ trêu.
- `buzzer.wav`: Tiếng còi báo lỗi chát chúa (dành cho các pha lừa đảo bại lộ, phá sản, thất bại).
- `thud.wav`: Tiếng thụi/đấm comic trầm đặc (dùng cho thẻ thời gian Stamp mở cảnh hoặc va chạm thể chất).

#### 2. Cải tiến logic tổng hợp âm thanh trong `make_video.py`
- Cập nhật hàm `write_sfx()`: Tự động tổng hợp đầy đủ 13 âm thanh SFX toán học chất lượng cao.
- **Bảo toàn file âm thanh tự chọn:** Thêm điều kiện kiểm tra tồn tại `if not target_file.exists():`, cho phép người dùng tự thả file thu âm thật vào `public/sfx/` mà không lo bị pipeline ghi đè khi render.
- Thêm tập hợp `SFX_NAMES` và bổ sung kiểm tra tính hợp lệ của trường `sfx` trong hàm `validate()`.

#### 3. Tự động hóa Trigger SFX trong `make_video.py` & `src/Episode.tsx`
- **Tự động kích hoạt (Auto-trigger):**
  - Khi nhân vật có biểu cảm giật mình `expression: "shock"`: Pipeline tự động kích hoạt `boom.wav` ngay tại timestamp phát âm từ khóa đó.
  - Khi nhân vật cầm tiền/vàng/vali `hold: "money"`: Tự động kích hoạt tiếng két tiền `cash.wav`.
  - Khi nhãn địa điểm/năm `stamp` xuất hiện ở đầu cảnh: Tự động phát âm thanh gõ nhẹ `thud.wav`.
  - Icon tiền tệ trong `Icons.tsx`: Nâng cấp từ tiếng coin nhỏ sang tiếng chuông ngân `cash.wav`.
- **Hỗ trợ Trigger thủ công trong Kịch bản:** Cho phép biên kịch chèn trực tiếp hiệu ứng vào file JSON qua cú pháp `"sfx": [{"sound": "gavel", "word": "prison"}]`, hệ thống sẽ tự động đo thời gian bằng Whisper và phát âm thanh đúng thời điểm.

### [Đợt 3] - Tích Hợp Phụ Đề Động Kinetic Highlight (19/11/2026)

#### 1. Tạo mới Component `src/KineticCaptions.tsx`
- Xây dựng component phụ đề động phong cách YouTube/Shorts hiện đại (Word-by-word Highlight):
  - Phân nhóm từ ngữ thành từng cụm ngắn 3-4 từ (`chunkSize`) dễ đọc, không gây rối mắt.
  - Hiệu ứng nhịp nói sống động: Từ đang được phát âm sẽ tự động đổi sang màu vàng neon rực rỡ (`#FFD23F` cho narrator) hoặc xanh cyan (`#00F0FF` cho friend), phóng to nhẹ (`scale(1.16)`) kèm bóng đổ 3D và viền đen dày (`WebkitTextStroke: 4px #000`).
  - Các từ đã nói giữ màu trắng sáng, các từ chuẩn bị nói hiển thị mờ nhẹ để hướng ánh nhìn người xem theo đúng mạch kể.
  - Hiệu ứng chuyển cụm (chunk transition) nảy nhẹ bằng thuật toán `spring()` của Remotion.

#### 2. Kết nối Timestamp từng từ từ Whisper trong `make_video.py`
- Tận dụng dữ liệu timestamp chính xác của `faster-whisper`: Gán mốc frame `at` cho từng từ ngữ hiển thị (`scene["words"] = [{"word": w, "at": f}, ...]`).
- Lưu trữ cấu trúc `words` trực tiếp vào `manifest.json` và hỗ trợ fallback tự động chia đều frame nếu chạy với kịch bản cũ.
- Bổ sung cấu hình `captionStyle: 'kinetic'` (mặc định) và `captionWords: 4` vào `manifest.json`.

#### 3. Tích hợp vào `src/Episode.tsx` & `src/Root.tsx`
- Bổ sung `KineticCaptions` vào giao diện chính của từng phân cảnh (`Scene`), tự động ẩn khi chuyển cảnh để không bị đè chữ.
- Cho phép linh hoạt chuyển đổi giữa các phong cách phụ đề qua `captionStyle: 'kinetic' | 'classic' | 'none'`.
- Kiểm thử thành công xuất ảnh tĩnh tại [out/test_caption.png](file:///d:/youtube-video-pipeline/out/test_caption.png) (1920x1080).
