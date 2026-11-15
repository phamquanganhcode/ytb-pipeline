# Ảnh cần tạo cho tập Hampton Roads

Kịch bản `scripts/naval/hampton-roads.json` cần 19 ảnh (9 ảnh mặt, 10 phông nền) và 1 ảnh thumbnail.
Cho đến khi đủ mặt của "you" và đủ phông nền, `make_video.py` sẽ dừng lại chứ không render.

## Cách làm

1. Chạy `PY batch.py scripts/naval`. Lệnh này ghi prompt đầy đủ vào `out/faces_todo.md`, `out/bg_todo.md`
   và `out/thumb_todo.md`.
2. Tạo ảnh trên gemini.google.com theo đúng quy trình trong `prompts/daily_run.md` (mục 4), lưu vào
   `assets/faces-src/`, `assets/bg-src/` và `assets/thumbs-src/` với đúng tên file ghi trong các file todo.
3. Hai phông vẽ lại ở cuối file này không có trong `out/bg_todo.md` (tên đã có trong danh mục). Lưu ảnh vào
   `assets/bg-src/` rồi chạy:
   `PY prep_bg.py assets/bg-src/hamptonroads1862.png assets/bg-src/turret1862.png`
   Sau đó xoá thư mục `assets/bg-svg/` (bản vẽ tạm).
4. Chạy lại `PY batch.py scripts/naval` để cài ảnh và render `out/hampton-roads.mp4`.

## Thứ tự ưu tiên (nếu hết hạn mức tạo ảnh trong ngày)

| # | File | Loại | Dùng trong |
|---|---|---|---|
| 1 | `samuel-dana-greene_neutral.png` | mặt "you" | bắt buộc, thiếu là không render |
| 2 | `samuel-dana-greene_shock.png`, `samuel-dana-greene_happy.png` | mặt "you" | cùng cuộc trò chuyện với ảnh 1 |
| 3 | `turret1862.png` (vẽ lại) | phông | 24 cảnh |
| 4 | `virginiacasemate1862.png` | phông | 21 cảnh |
| 5 | `congressfire1862.png` | phông | 14 cảnh, gồm cảnh mở đầu |
| 6 | `gosport1861.png` | phông | 14 cảnh |
| 7 | `hamptonroads1862.png` (vẽ lại) | phông | 9 cảnh và 5 bong bóng suy nghĩ |
| 8 | `monitordeck1862.png` | phông | 9 cảnh |
| 9 | `franklin-buchanan_neutral.png` | mặt | 12 cảnh |
| 10 | `john-worden_neutral.png` | mặt | 10 cảnh |
| 11 | `john-ericsson_neutral.png` | mặt | 11 cảnh |
| 12 | `sailor-1862_neutral.png`, `gunner-1862_neutral.png` | mặt đám đông | các cảnh có thuỷ thủ |
| 13 | `cumberland1862.png` | phông | 6 cảnh |
| 14 | `cabinetroom1862.png`, `edwin-stanton_neutral.png` | phông, mặt | 5 cảnh Washington |
| 15 | `monitorcabin1862.png` | phông | 5 cảnh |
| 16 | `timesoffice1862.png` | phông | 3 cảnh |

Mặt nhân vật phụ nào chưa có thì pipeline vẫn render, nhân vật đó hiện là người que đầu đen.

Khi xem ảnh trước khi lưu, lưu ý: hai tàu phải đúng hình dáng (Virginia có khoang sắt nghiêng như mái nhà
và một ống khói; Monitor là sàn phẳng với một tháp pháo tròn), không có chữ, không có người.

## Prompt cho hai phông vẽ lại

Đính kèm `public/bg/parlor.png` làm ảnh mẫu phong cách, thêm "Create an image. " ở đầu.

### hamptonroads1862

Lưu thành `assets/bg-src/hamptonroads1862.png`:

```
Wide 16:9 landscape painted background for a 2D animated history explainer: the Confederate ironclad CSS Virginia (long low hull, sloping iron casemate like a barn roof, one smokestack) and the Union ironclad USS Monitor (flat raft deck with one round turret) firing at each other at close range in Hampton Roads, Virginia, March 1862, seen from a wooden wharf: powder smoke, a stranded wooden frigate and a low stone fort on the far shore.
Full rich color, not sepia and not a pencil sketch: bold dark-brown ink outlines, flat color fills
with soft cel shading, warm saturated palette with deep shadows, like a polished animated cartoon
background (match the attached image's style if one is attached). Detailed period-accurate props.
Eye-level camera. Leave the floor or ground across the lower fifth clear and flat, because cartoon
characters will stand there. No people, no animals, no text or lettering anywhere (blank barrels,
blank signs), no frame or border.
```

### turret1862

Lưu thành `assets/bg-src/turret1862.png`:

```
Wide 16:9 landscape painted background for a 2D animated history explainer: inside the revolving gun turret of the ironclad USS Monitor, 1862: riveted iron wall, two big Dahlgren guns at their ports, roof grating with daylight, shot rack, lantern.
Full rich color, not sepia and not a pencil sketch: bold dark-brown ink outlines, flat color fills
with soft cel shading, warm saturated palette with deep shadows, like a polished animated cartoon
background (match the attached image's style if one is attached). Detailed period-accurate props.
Eye-level camera. Leave the floor or ground across the lower fifth clear and flat, because cartoon
characters will stand there. No people, no animals, no text or lettering anywhere (blank barrels,
blank signs), no frame or border.
```
