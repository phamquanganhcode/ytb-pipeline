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
- **Kiểm thử thành công:** Xuất ảnh tĩnh tại [out/test_caption.png](file:///d:/youtube-video-pipeline/out/test_caption.png) (1920x1080).

### [Đợt 4] - Tối Ưu Hóa GPU CUDA & Môi Trường Render Đám Mây Kaggle (19/11/2026)

#### 1. Tối ưu mã nguồn tự động phát hiện GPU CUDA (`make_video.py`)
- Cập nhật hàm gọi `faster-whisper`: Tự động nhận diện `torch.cuda.is_available()`.
  - Nếu có GPU (Kaggle T4 / GPU Local): Chuyển sang `device="cuda"` và `compute_type="float16"`, rút ngắn thời gian Whisper 15 phút từ ~4 phút xuống chỉ còn **~30 giây**.
  - Nếu không có GPU: Tự động dùng fallback `device="cpu"` và `compute_type="int8"`.

#### 2. Xây dựng bộ công cụ chạy đám mây trên Kaggle (`kaggle/`)
- **`kaggle/setup_kaggle.sh`:** Script tự động cấu hình Node.js 20, FFmpeg, các thư viện Linux headless Chromium cho Remotion và các package Python.
- **`kaggle/pipeline_kaggle.ipynb`:** Jupyter Notebook hoàn chỉnh, tối ưu 1-click để chạy toàn bộ quy trình trên Kaggle.
- **`kaggle/kernel-metadata.json`:** Cấu hình cho người dùng điều khiển tự động qua Kaggle CLI (`kaggle kernels push`).

---

## ☁️ Hướng Dẫn Chạy Pipeline Miễn Phí Trên Kaggle

Chạy trên Kaggle giúp giải phóng hoàn toàn máy tính của bạn và tận dụng **30 giờ GPU T4 miễn phí / tuần / mỗi tài khoản**.

### 1. Cách thiết lập Notebook trên Kaggle:
1. Đăng nhập vào [Kaggle](https://www.kaggle.com/) ➔ Chọn **Create** ➔ **New Notebook**.
2. Trên thanh menu Notebook, chọn **File** ➔ **Upload Notebook** ➔ Chọn file [kaggle/pipeline_kaggle.ipynb](file:///d:/youtube-video-pipeline/kaggle/pipeline_kaggle.ipynb).
3. **Cài đặt bắt buộc ở cột bên phải (Notebook Settings):**
   - **Accelerator:** Chọn **GPU T4** (hoặc GPU T4 x 2).
   - **Internet:** Bật **Internet on** (Bắt buộc).
4. **Treo máy không cần bật máy tính (Background Execution):**
   - Nhấp vào nút **Save Version** ở góc phải trên ➔ Chọn **Save & Run All (Commit)**.
   - Bạn có thể tắt máy tính đi ngủ, server Kaggle sẽ tự động chạy ngầm toàn bộ quy trình.
   - Sau khi chạy xong, vào tab **Output** của Notebook để tải file `.mp4` và thumbnail về máy.

### 2. Chiến lược luân chuyển nhiều tài khoản Kaggle (Không giới hạn GPU):
- Mỗi tài khoản Kaggle được cấp **30 giờ GPU / tuần**.
- Khi tài khoản 1 dùng hết hạn mức trong tuần, bạn chỉ cần đăng xuất và đăng nhập tài khoản Kaggle thứ 2 để chạy tiếp tục (2 tài khoản = 60 giờ GPU = sản xuất được **~120 video 15 phút / tuần** hoàn toàn miễn phí).

### 3. Tự động hóa hoàn toàn từ Terminal (Kaggle CLI - Khuyên dùng):
Tài khoản của bạn đã được kết nối trực tiếp với Kaggle CLI. Bạn có thể điều khiển toàn bộ từ terminal mà không cần mở trình duyệt:

```bash
# 1. Đẩy code lên Kaggle và tự động kích hoạt GPU chạy ngầm
kaggle kernels push -p kaggle

# 2. Kiểm tra tiến độ render trên đám mây
kaggle kernels status phamquanganh867/youtube-video-pipeline-render

# 3. Tải toàn bộ video MP4 và Thumbnail về thư mục out/
kaggle kernels output phamquanganh867/youtube-video-pipeline-render -p out
```

---

### Đợt 5: Nâng Cấp Định Dạng Video "Giải Phẫu Thảm Họa Kỹ Thuật & Hạ Tầng" (`--format disaster`)

Hệ thống đã được mở rộng toàn diện để sản xuất video tài liệu/phân tích chuyên sâu về các thảm họa kỹ thuật theo mô hình Swiss Cheese Model:

1. **Giao diện & Đồ họa mới (React / Remotion):**
   - **9 Icon chuyên dụng mới:** `hazard` (nguy hiểm sinh học/hóa học), `radiation` (phóng xạ), `fire` (lửa), `gear` (bánh răng kỹ thuật), `wrench` (cờ lê sửa chữa), `skull` (tử vong/nguy kịch), `electricity` (điện cao thế), `siren` (còi hú), `timer` (đồng hồ đếm ngược sự cố).
   - **4 Backgrounds vector SVG mới:** `control_room` (phòng điều khiển hạt nhân/công nghiệp), `factory` (nhà máy lò hơi, đường ống), `server_room` (trung tâm dữ liệu/datacenter), `bridge` (cầu dây văng/công trình hạ tầng).
   - **3 Hiệu ứng thời tiết/môi trường (WeatherFx):** `alarm` (chớp đỏ cảnh báo khẩn cấp toàn màn hình), `smoke` (khói xám bốc mù mịt), `fire` (tàn lửa bốc cháy).
   - **Thumbnail thảm họa tự động:** Tự động phát hiện chủ đề thảm họa để đổi badge đỏ `⚠️ THẢM HỌA KỸ THUẬT`, đổi icon cảnh báo ⚠️, emoji 💥⚠️, và hỗ trợ render trực tiếp cả nền SVG lẫn ảnh PNG.

2. **Âm thanh & Hiệu ứng SFX:**
   - Bổ sung 5 SFX tổng hợp mới: `alarm` (còi hú khẩn cấp), `explosion` (tiếng nổ lớn chấn động), `glitch` (tiếng chập điện nhiễu sóng), `creak` (tiếng kim loại/kết cấu vặn gãy), `geiger` (máy đo phóng xạ Geiger kêu tích tắc dồn dập).
   - Tự động kích hoạt SFX theo ngữ cảnh đạo cụ (`hazard`/`siren` ➔ `alarm`, `wrench`/`gear` ➔ `creak`).

3. **Cải tiến cốt lõi Engine TTS & Khả năng chịu lỗi:**
   - **Audio Caching (`scene_i.wav`):** Hệ thống tự động cache âm thanh từng phân cảnh đã tạo. Khi chạy lại, các phân cảnh cũ sẽ nạp tức thì trong 0 giây, không bao giờ phải gọi lại TTS cho những câu đã hoàn thành.
   - **Khắc phục lỗi treo Edge-TTS trên Windows:** Gọi qua tiến trình CLI với `stdin=subprocess.DEVNULL`, cơ chế timeout 10s + tự động retry 5 lần kèm exponential backoff và giãn cách 1s chống rate-limit từ Microsoft.

4. **Kịch bản mẫu & Ngân hàng chủ đề:**
   - **Prompt chuyên dụng:** [prompts/disaster_prompt.md](file:///d:/youtube-video-pipeline/prompts/disaster_prompt.md) với quy chuẩn phân tích kỹ thuật khách quan, không phóng đại giật gân, tuân thủ mô hình Swiss Cheese.
   - **25 Chủ đề tuyển chọn:** [topics/disaster.txt](file:///d:/youtube-video-pipeline/topics/disaster.txt) (Chernobyl, Cầu Tacoma Narrows, Tàu con thoi Challenger, Sự cố sập CrowdStrike, Boeing 737 MAX, Tàu ngầm Titan,...).
   - **Kịch bản mẫu hoàn chỉnh:** [scripts/disaster/chernobyl.json](file:///d:/youtube-video-pipeline/scripts/disaster/chernobyl.json) (23 phân cảnh tiếng Việt) & [scripts/disaster/chernobyl_en.json](file:///d:/youtube-video-pipeline/scripts/disaster/chernobyl_en.json) (23 phân cảnh tiếng Anh).

5. **Motion Graphics Kỹ Thuật Độc Quyền (Đè bẹp video AI tĩnh thông thường):**
   - **`src/TimelineBar.tsx` (Trục thời gian sự cố từng giây):** Thanh tiến trình chuyên nghiệp trên cùng màn hình, hiển thị các mốc thời gian và kim scrubber phát sáng trượt mượt mà theo từng giây phân cảnh.
   - **`src/TechnicalDiagram.tsx` (Sơ đồ kỹ thuật Blueprint SVG thời gian thực):**
     - `data_flow` & `code_crash`: Mô phỏng luồng cập nhật đám mây ➔ nạp Channel File 291 vào Kernel Driver (Ring 0) ➔ lệch 21 vs 20 input fields gây lỗi đọc bộ nhớ ngoài giới hạn (`Out-of-Bounds Memory Read`) ➔ BSOD vòng lặp sập 8.5 triệu máy tính.
     - `reactor_core`: Mặt cắt lõi hạt nhân Chernobyl, mô phỏng hơi nước sôi tạo bọt (positive void coefficient), thanh điều khiển chèn đầu graphite gây đột biến công suất 33,000 MW.
     - `dam_cross_section`: Mặt cắt đập thủy điện trọng lực, vector áp suất thủy tĩnh $P = \rho g h$ ép lên tường đập, vết nứt gãy trượt cấu trúc (shear failure).
     - `swiss_cheese`: 4 lát cắt phòng thủ chiều sâu (Thiết kế ➔ Đào tạo ➔ Quy trình ➔ Ngắt khẩn cấp), mô phỏng các lỗ hổng thẳng hàng dẫn tới thảm họa.
   - **Kịch bản mẫu IT Disaster:** [scripts/disaster/crowdstrike_en.json](file:///d:/youtube-video-pipeline/scripts/disaster/crowdstrike_en.json) đã được render hoàn chỉnh ra [out/crowdstrike_en.mp4](file:///d:/youtube-video-pipeline/out/crowdstrike_en.mp4).

