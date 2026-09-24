/* =====================================================================
   TÔN ĐỨC THẮNG — TONDUCTHANG.JS
   Mục lục:
   1. DỮ LIỆU (timeline, hành trình, sự kiện, thư viện, trích dẫn)
   2. LOADING SCREEN + ẢNH NỀN
   3. HEADER SCROLL + MOBILE MENU + ACTIVE NAV LINK
   4. SMOOTH SCROLL CHO CÁC LIÊN KẾT NEO (#...)
   5. HIỆU ỨNG PARTICLES TRONG HERO (canvas)
   6. RENDER TIMELINE + TƯƠNG TÁC CLICK
   7. RENDER HÀNH TRÌNH TÌM ĐƯỜNG CỨU NƯỚC
   8. RENDER SỰ KIỆN LỊCH SỬ
   9. RENDER THƯ VIỆN ẢNH + LIGHTBOX
   10. TRÍCH DẪN LỊCH SỬ (luân phiên + hiệu ứng chữ + parallax)
   11. SCROLL REVEAL DÙNG CHUNG (IntersectionObserver)
   12. COUNTER ANIMATION (số liệu trong phần giới thiệu)
   13. NÚT BACK TO TOP + NĂM Ở FOOTER
===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  /* =====================================================================
     1. DỮ LIỆU
     Toàn bộ nội dung nhân vật / sự kiện / ảnh / trích dẫn được khai báo
     tại đây. Muốn sửa nội dung hoặc thêm mục mới, chỉ cần chỉnh trong các
     mảng dữ liệu bên dưới — không cần đụng tới phần code render.
     (Trong chuỗi dùng dấu “ ” để trích dẫn, tránh phải escape dấu " .)
  ===================================================================== */

  /* ---------------------------------------------------------------------
     Hàm tạo ảnh SVG "tự chứa" (không phụ thuộc mạng).
     Trả về data-URI nên ảnh luôn hiển thị ngay cả khi không có Internet.
     Muốn dùng ảnh thật: điền đường dẫn file vào trường image / src.
     Tham số title dùng "|" để xuống dòng, ví dụ "Xưởng|Ba Son".
  --------------------------------------------------------------------- */
  function makeArt(title, subtitle, w, h, hue) {
    const palette = {
      gold: ["#2a1a12", "#c9a227", "#f2ead9"],
      red: ["#2a1012", "#c24a4a", "#f2ead9"],
      jade: ["#0f1c18", "#5f8a76", "#e7d9bc"],
    };
    const [bg, accent, text] = palette[hue] || palette.red;
    const esc = (s) =>
      String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    const lines = String(title || "")
      .split("|")
      .filter((line, i, arr) => line !== "" || arr.length === 1);
    // Bộ chữ hỗ trợ đầy đủ dấu tiếng Việt: ưu tiên font hệ thống có Latin Extended
    const fontSerif =
      "'Times New Roman','Palatino Linotype','Segoe UI','Noto Serif',Tahoma,Arial,sans-serif";
    const fontSans = "'Segoe UI','Noto Sans',Tahoma,Arial,Helvetica,sans-serif";
    const lineGap = 62;
    const titleSvg =
      lines.length && lines[0] !== ""
        ? lines
            .map(
              (line, i) =>
                `<text x="${w / 2}" y="${h / 2 - ((lines.length - 1) * lineGap) / 2 + i * lineGap + 14}" text-anchor="middle" font-family="${fontSerif}" font-size="${Math.round(w / 13)}" font-weight="700" fill="${accent}">${esc(line)}</text>`,
            )
            .join("")
        : "";
    const subtitleSvg = subtitle
      ? `<text x="${w / 2}" y="${h / 2 + ((lines.length - 1) * lineGap) / 2 + 78}" text-anchor="middle" font-family="${fontSans}" font-size="${Math.round(w / 30)}" fill="${text}" opacity="0.75">${esc(subtitle)}</text>`
      : "";
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
      `<rect width="${w}" height="${h}" fill="${bg}"/>` +
      `<rect x="12" y="12" width="${w - 24}" height="${h - 24}" fill="none" stroke="${accent}" stroke-width="2" opacity="0.5"/>` +
      `<circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) * 0.3}" fill="${accent}" opacity="0.08"/>` +
      titleSvg +
      subtitleSvg +
      `</svg>`;
    // encodeURIComponent để nguyên dấu ' và ( ) — mã hóa thêm để an toàn khi
    // dùng trong CSS url(...) và trong thuộc tính HTML.
    const encoded = encodeURIComponent(svg)
      .replace(/'/g, "%27")
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29");
    return "data:image/svg+xml;charset=UTF-8," + encoded;
  }

  /* ---------------------------------------------------------------------
     Gắn ảnh dự phòng cho mọi <img data-fallback>. Nếu ảnh lỗi (thiếu file /
     sai đường dẫn), thay bằng ảnh SVG dự phòng để khung ảnh không bao giờ trống.
     Gọi sau khi các card đã được render ra DOM.
  --------------------------------------------------------------------- */
  function applyImageFallbacks(scope) {
    (scope || document)
      .querySelectorAll("img[data-fallback]")
      .forEach((img) => {
        const swap = () => {
          if (img.dataset.swapped === "1" || !img.dataset.fallback) return;
          img.dataset.swapped = "1";
          img.src = img.dataset.fallback;
        };
        if (img.complete && img.naturalWidth === 0) swap();
        img.addEventListener("error", swap);
      });
  }

  // Dữ liệu cho Timeline (section "Cuộc đời")
  const timelineData = [
    {
      year: "1888",
      name: "Sinh ở Cù lao Ông Hổ",
      detail:
        "Tôn Đức Thắng sinh ngày 20/8/1888 tại làng An Hòa, Cù lao Ông Hổ, tổng Định Thành, tỉnh Long Xuyên (nay thuộc TP. Long Xuyên, tỉnh An Giang), trong một gia đình nông dân.",
    },
    {
      year: "Đầu 1900s",
      name: "Học nghề thợ máy ở Ba Son",
      detail:
        "Ông rời quê lên Sài Gòn, học nghề và làm thợ máy tại xưởng đóng tàu Ba Son — một trong những trung tâm công nghiệp lớn của Sài Gòn thời Pháp thuộc.",
    },
    {
      year: "1916 – 1919",
      name: "Làm việc ở Pháp trong Thế chiến I",
      detail:
        "Ông bị động viên sang Pháp, làm thợ máy trong binh xưởng hải quân ở Toulon. Theo tiểu sử chính thức, ông tham gia phản đối can thiệp quân sự của Pháp vào nước Nga Xô viết năm 1919 — một chi tiết được nhiều tài liệu trong nước ghi nhận, dù giới nghiên cứu sử học còn có những ý kiến khác nhau về mức độ chính xác của sự kiện.",
    },
    {
      year: "1920",
      name: "Trở về nước, lập Công hội Đỏ",
      detail:
        "Về nước, ông cùng anh em công nhân Sài Gòn – Chợ Lớn thành lập Công hội Đỏ, một trong những tổ chức công đoàn đầu tiên do người Việt lập ra, vận động công nhân đấu tranh đòi quyền lợi.",
    },
    {
      year: "1929",
      name: "Bị bắt giam",
      detail:
        "Do hoạt động trong phong trào công nhân và tổ chức cách mạng, ông bị thực dân Pháp bắt giam, sau đó bị kết án và đày đi Côn Đảo.",
    },
    {
      year: "1930 – 1945",
      name: "15 năm tù Côn Đảo",
      detail:
        "Ông chịu án tù khổ sai suốt 15 năm tại Côn Đảo — nơi được mệnh danh là “địa ngục trần gian” — cho đến khi Cách mạng Tháng Tám năm 1945 thành công, ông cùng nhiều tù chính trị được giải thoát.",
    },
    {
      year: "1946 – 1960",
      name: "Lãnh đạo Mặt trận và công đoàn",
      detail:
        "Sau khi ra tù, ông giữ nhiều trọng trách: Chủ tịch Tổng Liên đoàn Lao động Việt Nam, sau đó là Chủ tịch Ủy ban Trung ương Mặt trận Tổ quốc Việt Nam.",
    },
    {
      year: "1960 – 1969",
      name: "Phó Chủ tịch nước",
      detail:
        "Ông giữ chức Phó Chủ tịch nước Việt Nam Dân chủ Cộng hòa dưới thời Chủ tịch Hồ Chí Minh.",
    },
    {
      year: "1969",
      name: "Trở thành Chủ tịch nước",
      detail:
        "Sau khi Chủ tịch Hồ Chí Minh qua đời ngày 2/9/1969, Quốc hội bầu Tôn Đức Thắng làm Chủ tịch nước Việt Nam Dân chủ Cộng hòa.",
    },
    {
      year: "1976",
      name: "Chủ tịch nước thống nhất",
      detail:
        "Sau Đại thắng mùa Xuân năm 1975 và việc thống nhất đất nước, ông trở thành Chủ tịch nước đầu tiên của nước Cộng hòa Xã hội chủ nghĩa Việt Nam.",
    },
    {
      year: "1980",
      name: "Qua đời",
      detail:
        "Tôn Đức Thắng qua đời ngày 30/3/1980 tại Hà Nội, khi đang đảm nhiệm cương vị Chủ tịch nước, thọ 91 tuổi.",
    },
  ];

  // Các chặng của hành trình từ thợ máy đến Chủ tịch nước (section "Hành trình")
  const marchData = [
    {
      when: "1888",
      place: "Cù lao Ông Hổ, Long Xuyên",
      note: "Sinh ra trong một gia đình nông dân ở làng An Hòa, vùng đất bồi giữa sông Hậu — nơi ông gắn bó suốt thời thơ ấu trước khi lên Sài Gòn lập nghiệp.",
    },
    {
      when: "Đầu 1900s",
      place: "Xưởng Ba Son, Sài Gòn",
      note: "Học nghề và làm thợ máy tại xưởng đóng tàu Ba Son, nơi ông tiếp xúc với đời sống công nhân và bắt đầu hình thành ý thức đấu tranh giai cấp.",
    },
    {
      when: "1916 – 1919",
      place: "Toulon, Pháp",
      note: "Làm việc trong binh xưởng hải quân Pháp thời Thế chiến I, tiếp xúc với phong trào công nhân và tư tưởng cách mạng ở châu Âu.",
    },
    {
      when: "1920 – 1929",
      place: "Sài Gòn – Chợ Lớn",
      note: "Trở về nước, cùng anh em công nhân thành lập Công hội Đỏ, tổ chức các cuộc đấu tranh của công nhân đòi quyền lợi và ủng hộ phong trào cách mạng.",
    },
    {
      when: "1930 – 1945",
      place: "Côn Đảo",
      note: "Bị đày và chịu án tù khổ sai 15 năm tại “địa ngục trần gian” Côn Đảo, nơi ông vẫn giữ vững tinh thần và tham gia tổ chức anh em tù chính trị.",
    },
    {
      when: "1969 – 1980",
      place: "Hà Nội",
      note: "Sau khi ra tù và trải qua nhiều trọng trách, ông trở thành Chủ tịch nước, chứng kiến ngày thống nhất đất nước năm 1975 – 1976 cho đến khi qua đời năm 1980.",
    },
  ];

  // Dữ liệu sự kiện / tư liệu lịch sử (section "Sự kiện")
  const eventsData = [
    {
      title: "Học nghề thợ máy ở xưởng Ba Son",
      year: "Đầu thế kỷ XX",
      figures: "Tôn Đức Thắng",
      desc: "Rời quê An Giang lên Sài Gòn, Tôn Đức Thắng học nghề và làm thợ máy tại xưởng đóng tàu Ba Son — một trong những cơ sở công nghiệp lớn nhất Nam Kỳ, nơi hình thành một trong những đội ngũ công nhân có tổ chức sớm nhất Việt Nam.",
      image:
        "https://svhtt.angiang.gov.vn/sites/default/files/inline-images/14.jpg",
      imageFallback: makeArt("Xưởng|Ba Son", "Sài Gòn", 800, 600, "gold"),
    },
    {
      title: "Làm việc tại binh xưởng Toulon",
      year: "1916 – 1919",
      figures: "Tôn Đức Thắng",
      desc: "Trong Chiến tranh thế giới thứ nhất, ông bị động viên sang Pháp, làm thợ máy tại binh xưởng hải quân ở Toulon. Đây là giai đoạn ông lần đầu tiếp xúc trực tiếp với phong trào công nhân và không khí chính trị châu Âu.",
      image:
        "https://file3.qdnd.vn/data/images/13/2019/07/11/tvthuonghuyen/18.jpg",
      imageFallback: makeArt(
        "Binh xưởng|Toulon",
        "1916 – 1919",
        800,
        600,
        "jade",
      ),
    },
    {
      title: "Thành lập Công hội Đỏ",
      year: "Khoảng 1920",
      figures: "Tôn Đức Thắng",
      desc: "Sau khi trở về Sài Gòn, ông cùng anh em công nhân thành lập Công hội Đỏ — một trong những tổ chức công đoàn đầu tiên do người Việt lập ra, vận động và tổ chức công nhân đấu tranh đòi quyền lợi kinh tế và chính trị.",
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxbtuz2p4reLRFKkMjyDDLE6zffnxfJCI--qFWGWxMh5USvTogEMVlS6gQ&s=10",
      imageFallback: makeArt("Công hội|Đỏ", "Khoảng 1920", 800, 600, "red"),
    },
    {
      title: "15 năm tù Côn Đảo",
      year: "1930 – 1945",
      figures: "Tôn Đức Thắng",
      desc: "Bị thực dân Pháp bắt và đày ra Côn Đảo, ông chịu án tù khổ sai suốt 15 năm — quãng thời gian dài nhất trong cuộc đời hoạt động cách mạng của ông. Ông được giải thoát sau khi Cách mạng Tháng Tám năm 1945 thành công.",
      image:
        "https://baodaklak.vn/file/fb9e3a03798789de0179a1704dea238e/fb9e3a03798789de017a32af1c5137dd/082022/u_2_20220825083621.jpg",
      imageFallback: makeArt("Côn Đảo", "1930 – 1945", 800, 600, "red"),
    },
    {
      title: "Chủ tịch Tổng Liên đoàn Lao động và Mặt trận Tổ quốc",
      year: "1946 – 1960",
      figures: "Tôn Đức Thắng",
      desc: "Ra tù sau năm 1945, ông tiếp tục cống hiến cho phong trào công nhân với cương vị Chủ tịch Tổng Liên đoàn Lao động Việt Nam, sau đó đứng đầu Ủy ban Trung ương Mặt trận Tổ quốc Việt Nam, góp phần xây dựng khối đại đoàn kết dân tộc.",
      image:
        "https://thinhvuongvietnam.com/Content/UploadFiles/EditorFiles/images/2026/Quy3/mattrantoquocvietnam112092026033900.jpg",
      imageFallback: makeArt(
        "Mặt trận|Tổ quốc",
        "1946 – 1960",
        800,
        600,
        "gold",
      ),
    },
    {
      title: "Trở thành Chủ tịch nước",
      year: "1969",
      figures: "Tôn Đức Thắng",
      desc: "Sau khi Chủ tịch Hồ Chí Minh qua đời ngày 2/9/1969, Quốc hội bầu Tôn Đức Thắng làm Chủ tịch nước Việt Nam Dân chủ Cộng hòa, tiếp nối cương vị đứng đầu Nhà nước trong giai đoạn quyết định của cuộc kháng chiến chống Mỹ.",
      image:
        "https://file3.qdnd.vn/data/images/0/2022/06/26/hoangtruong_la/chu-tich-ho-chi-minh-chu-tri-phien-hop-hoi-dong-chinh-phu.jpg?dpi=150&quality=100&w=870",
      imageFallback: makeArt("Chủ tịch|nước", "1969", 800, 600, "red"),
    },
    {
      title: "Chủ tịch nước thống nhất",
      year: "1976",
      figures: "Tôn Đức Thắng",
      desc: "Sau Đại thắng mùa Xuân năm 1975, đất nước thống nhất, nước Cộng hòa Xã hội chủ nghĩa Việt Nam ra đời năm 1976. Tôn Đức Thắng trở thành vị Chủ tịch nước đầu tiên của nước Việt Nam thống nhất, giữ cương vị này cho đến khi qua đời năm 1980.",
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFYN4hIKJap_840OU0dXRwiZujN8XNSlQ8A190TUlzTsCiz_6ot7DAqqY&s=10",
      imageFallback: makeArt("Thống nhất|đất nước", "1976", 800, 600, "jade"),
    },
  ];

  // Dữ liệu thư viện ảnh — thêm/bớt phần tử để thay đổi số lượng ảnh hiển thị.
  // Chép ảnh thật vào thư mục images/ đúng tên bên dưới; thiếu file thì hiện ảnh SVG dự phòng.
  const galleryData = [
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/1/15/Mr._Ton_Duc_Thang.jpg",
      fallback: makeArt("Tôn Đức|Thắng", "Chân dung", 500, 650, "red"),
      caption: "Chủ tịch Tôn Đức Thắng",
    },
    {
      src: "https://luhanhvietnam.com.vn/du-lich/vnt_upload/news/04_2023/cu-lao-ong-ho1.jpg",
      fallback: makeArt("Cù lao|Ông Hổ", "An Giang", 500, 550, "jade"),
      caption:
        "Cù lao Ông Hổ (TP. Long Xuyên, An Giang) — quê hương Tôn Đức Thắng",
    },
    {
      src: "https://congnghieptauthuyvietnam.vn/upload/images/a%C3%8C%E2%80%B0nh%203_Albert%20Sarraut.jpg",
      fallback: makeArt("Xưởng|Ba Son", "Sài Gòn", 500, 620, "gold"),
      caption: "Xưởng đóng tàu Ba Son (Sài Gòn) — nơi ông học nghề thợ máy",
    },
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Le_m%C3%A9morial_du_Pr%C3%A9sident_Ton_Duc_Thang_%28%C3%AEle_du_Tigre%2C_Vietnam%29_%286635518367%29.jpg?utm_source=vi.wikipedia.org&utm_campaign=index&utm_content=original",
      fallback: makeArt("Nhà lưu niệm|Tôn Đức Thắng", "An Giang", 500, 600, "jade"),
      caption: "Khu lưu niệm Chủ tịch Tôn Đức Thắng tại quê nhà An Giang",
    },
    {
      src: "https://owa.bestprice.vn/images/articles/uploads/nha-tu-con-dao-o-dau-kham-pha-nha-tu-con-dao-5f3b88abbe95f.jpg",
      fallback: makeArt("Nhà tù|Côn Đảo", "1930 – 1945", 500, 500, "red"),
      caption: "Di tích nhà tù Côn Đảo — nơi ông chịu án tù khổ sai 15 năm",
    },
    {
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYA-tVsBVDtAcbXntQKRxf9vYpSW_6swAuA8l5lHVMJA&s=10",
      fallback: makeArt("Đại học|Tôn Đức Thắng", "TP.HCM", 500, 560, "gold"),
      caption: "Trường Đại học Tôn Đức Thắng — mang tên vị Chủ tịch nước",
    },
    // THÊM ẢNH TẠI ĐÂY: sao chép khối dưới rồi sửa src + caption để thêm ảnh mới
    // {
    //   src: "images/ten-file-anh-cua-ban.jpg",
    //   fallback: makeArt("Tiêu đề|ảnh", "Phụ đề", 500, 500, "gold"),
    //   caption: "Chú thích cho ảnh mới",
    // },
  ];

  // Trích dẫn lịch sử — chỉ dùng câu có nguồn ghi nhận, không tự bịa
  const quotesData = [
    {
      text: "Đoàn kết, đoàn kết, đại đoàn kết. Thành công, thành công, đại thành công.",
      author: "Chủ tịch Hồ Chí Minh (khẩu hiệu Mặt trận Tổ quốc)",
      source:
        "Tinh thần mà Tôn Đức Thắng theo đuổi trong nhiều năm lãnh đạo Mặt trận Tổ quốc Việt Nam",
    },
    {
      text: "Không có gì quý hơn độc lập, tự do.",
      author: "Chủ tịch Hồ Chí Minh",
      source: "Lời kêu gọi toàn quốc, ngày 17/7/1966",
    },
  ];

  /* =====================================================================
     2. LOADING SCREEN + ẢNH NỀN
  ===================================================================== */
  const loadingScreen = document.getElementById("loading-screen");
  function hideLoadingScreen() {
    loadingScreen.classList.add("hidden");
  }
  window.addEventListener("load", () => {
    setTimeout(hideLoadingScreen, 900); // giữ đủ lâu để thấy thanh chạy
  });
  // Lưới an toàn: nếu sự kiện load không bao giờ bắn (ảnh lỗi, tài nguyên treo)
  setTimeout(hideLoadingScreen, 4000);

  // Ảnh nền hero, video, trích dẫn: SVG tự tạo (dùng url("...") có nháy kép để an toàn).
  // Muốn dùng ảnh thật: thay bằng style.backgroundImage = 'url("images/ten-anh.jpg")'.
  const heroBg = document.querySelector(".hero-bg");
  if (heroBg) {
    heroBg.style.backgroundImage = `url("${makeArt(
      "",
      "",
      1600,
      900,
      "red",
    )}")`;
  }

  // Ảnh chân dung phần giới thiệu: dùng ảnh thật nếu có, thiếu file thì thay bằng SVG
  const introPortrait = document.getElementById("intro-portrait");
  if (introPortrait) {
    const swapIntro = () => {
      if (introPortrait.dataset.swapped === "1") return;
      introPortrait.dataset.swapped = "1";
      introPortrait.src = makeArt(
        "Tôn Đức|Thắng",
        "1888 – 1980",
        700,
        900,
        "red",
      );
    };
    if (introPortrait.complete && introPortrait.naturalWidth === 0) swapIntro();
    introPortrait.addEventListener("error", swapIntro);
  }

  // Ảnh bìa cho các thẻ video (dạng liên kết)
  document.querySelectorAll(".video-link").forEach((el) => {
    el.style.backgroundImage = `url("${makeArt(
      el.dataset.artTitle || "Tôn Đức Thắng",
      el.dataset.artSub || "",
      800,
      450,
      el.dataset.artHue || "red",
    )}")`;
  });

  const quoteBgEl = document.querySelector(".quote-bg");
  if (quoteBgEl) {
    quoteBgEl.style.backgroundImage = `url("${makeArt(
      "Côn Đảo",
      "1930 – 1945",
      1600,
      900,
      "red",
    )}")`;
  }

  /* =====================================================================
     3. HEADER SCROLL + MOBILE MENU + ACTIVE NAV LINK
  ===================================================================== */
  const header = document.getElementById("header");
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");
  const navLinkItems = document.querySelectorAll(".nav-link");
  const backToTopBtn = document.getElementById("back-to-top");

  window.addEventListener(
    "scroll",
    () => {
      header.classList.toggle("scrolled", window.scrollY > 60);
      backToTopBtn.classList.toggle("show", window.scrollY > 600);
    },
    { passive: true },
  );

  function setMenu(open) {
    hamburger.classList.toggle("active", open);
    navLinks.classList.toggle("open", open);
    hamburger.setAttribute("aria-expanded", String(open));
  }
  hamburger.addEventListener("click", () =>
    setMenu(!navLinks.classList.contains("open")),
  );
  navLinkItems.forEach((link) =>
    link.addEventListener("click", () => setMenu(false)),
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenu(false);
  });

  // Highlight mục menu tương ứng với section đang hiển thị trên màn hình
  const sectionsForNav = document.querySelectorAll("main section[id]");
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          navLinkItems.forEach((link) => {
            link.classList.toggle(
              "active",
              link.getAttribute("href") === `#${id}`,
            );
          });
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  sectionsForNav.forEach((sec) => navObserver.observe(sec));

  /* =====================================================================
     4. SMOOTH SCROLL CHO CÁC LIÊN KẾT NEO
     (bù trừ chiều cao header cố định)
  ===================================================================== */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId.length < 2) return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const top =
        target.getBoundingClientRect().top +
        window.pageYOffset -
        header.offsetHeight +
        1;
      window.scrollTo({
        top,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });
  });

  /* =====================================================================
     5. HIỆU ỨNG PARTICLES TRONG HERO (canvas)
     Tàn lửa / khói súng: các hạt sáng vàng và đỏ bay lên chậm.
     Tạm dừng khi hero ra khỏi màn hình và tắt hẳn nếu người dùng bật
     "giảm chuyển động".
  ===================================================================== */
  const canvas = document.getElementById("particles-canvas");
  const ctx = canvas ? canvas.getContext("2d") : null;
  let particles = [];
  let heroVisible = true;

  function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  function createParticles() {
    const count = window.innerWidth < 768 ? 35 : 70;
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.8 + 0.4,
      speedY: Math.random() * 0.4 + 0.15,
      drift: Math.random() * 0.3 - 0.15,
      alpha: Math.random() * 0.5 + 0.2,
      ember: Math.random() < 0.35, // một phần hạt màu đỏ cam như tàn lửa
    }));
  }

  function animateParticles() {
    if (heroVisible) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y -= p.speedY;
        p.x += p.drift;
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.ember
          ? `rgba(224, 96, 64, ${p.alpha})`
          : `rgba(231, 199, 102, ${p.alpha})`;
        ctx.fill();
      });
    }
    requestAnimationFrame(animateParticles);
  }

  if (canvas && ctx && !prefersReducedMotion) {
    resizeCanvas();
    createParticles();
    animateParticles();
    window.addEventListener("resize", () => {
      resizeCanvas();
      createParticles();
    });
    new IntersectionObserver((entries) => {
      heroVisible = entries[0].isIntersecting;
    }).observe(document.getElementById("hero"));
  }

  /* =====================================================================
     6. RENDER TIMELINE + TƯƠNG TÁC CLICK
  ===================================================================== */
  const timelineWrap = document.getElementById("timeline-wrap");

  timelineData.forEach((item) => {
    const el = document.createElement("div");
    el.className = "timeline-item";
    el.innerHTML = `
      <span class="timeline-dot"></span>
      <p class="timeline-year">${item.year}</p>
      <h3 class="timeline-name">
        <button type="button" class="timeline-toggle" aria-expanded="false">${item.name}</button>
      </h3>
      <p class="timeline-detail">${item.detail}</p>
    `;
    timelineWrap.appendChild(el);
  });

  // Nhấn vào mốc (tên, chấm tròn hoặc vùng chữ) để mở/đóng phần chi tiết
  timelineWrap.addEventListener("click", (e) => {
    const item = e.target.closest(".timeline-item");
    if (!item) return;
    const detail = item.querySelector(".timeline-detail");
    const dot = item.querySelector(".timeline-dot");
    const toggle = item.querySelector(".timeline-toggle");
    const isOpen = detail.classList.toggle("open");
    dot.classList.toggle("active", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  /* =====================================================================
     7. RENDER HÀNH TRÌNH TÌM ĐƯỜNG CỨU NƯỚC
     Đường đỏ chạy qua các chặng dừng chân khi người xem cuộn tới (CSS lo
     phần chuyển động, JS chỉ thêm class .in-view và đặt độ trễ cho từng chấm).
  ===================================================================== */
  const marchTrack = document.getElementById("march-track");

  marchData.forEach((stop, i) => {
    const el = document.createElement("div");
    el.className = "march-stop";
    // Chấm sáng lên đúng lúc đường đỏ chạy tới (đường chạy 3.2s)
    const delay = (i / (marchData.length - 1)) * 2.6;
    el.style.setProperty("--lit-delay", `${delay.toFixed(2)}s`);
    el.innerHTML = `
      <span class="march-marker"></span>
      <p class="march-when">${stop.when}</p>
      <h3 class="march-place">${stop.place}</h3>
      <p class="march-note">${stop.note}</p>
    `;
    marchTrack.appendChild(el);
  });

  /* =====================================================================
     8. RENDER SỰ KIỆN LỊCH SỬ
  ===================================================================== */
  const eventsList = document.getElementById("events-list");

  eventsData.forEach((ev, index) => {
    const el = document.createElement("article");
    el.className = `event-item reveal-on-scroll ${index % 2 === 1 ? "reverse" : ""}`;
    const evImgSrc = ev.image || ev.imageFallback || "";

    el.innerHTML = `
      <div class="event-image">
        <img src="${evImgSrc}" data-fallback="${ev.imageFallback || ""}" alt="${ev.title}" loading="lazy">
      </div>
      <div class="event-text">
        <span class="event-year">${ev.year}</span>
        <h3 class="event-title">${ev.title}</h3>
        <p class="event-figures">Nhân vật liên quan: ${ev.figures}</p>
        <p class="event-desc">${ev.desc}</p>
      </div>
    `;
    eventsList.appendChild(el);
  });

  /* =====================================================================
     9. RENDER THƯ VIỆN ẢNH + LIGHTBOX
  ===================================================================== */
  const galleryGrid = document.getElementById("gallery-grid");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const lightboxClose = document.getElementById("lightbox-close");
  const lightboxPrev = document.getElementById("lightbox-prev");
  const lightboxNext = document.getElementById("lightbox-next");
  let currentImageIndex = 0;

  galleryData.forEach((item, index) => {
    const el = document.createElement("div");
    el.className = "gallery-item";
    el.dataset.index = index;
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `Xem ảnh: ${item.caption}`);
    el.innerHTML = `
      <img src="${item.src}" data-fallback="${item.fallback || ""}" alt="${item.caption}" loading="lazy">
      <div class="gallery-overlay"><p>${item.caption}</p></div>
    `;
    galleryGrid.appendChild(el);
  });

  // Sau khi các khối (nhân vật, sự kiện, thư viện) đã render xong, gắn ảnh dự
  // phòng: nếu file trong images/ bị thiếu thì tự thay bằng ảnh SVG.
  applyImageFallbacks();

  // Chỉ gắn một lần: nếu ảnh trong lightbox lỗi, đổi sang ảnh dự phòng của mục hiện tại
  lightboxImg.addEventListener("error", () => {
    const item = galleryData[currentImageIndex];
    if (lightboxImg.dataset.swapped === "1" || !item || !item.fallback) return;
    lightboxImg.dataset.swapped = "1";
    lightboxImg.src = item.fallback;
  });

  function openLightbox(index) {
    currentImageIndex = index;
    const item = galleryData[index];
    lightboxImg.dataset.swapped = "0";
    lightboxImg.src = item.src;
    lightboxImg.alt = item.caption;
    lightboxCaption.textContent = item.caption;
    lightbox.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("active");
    document.body.style.overflow = "";
  }

  function showNextImage(step) {
    currentImageIndex =
      (currentImageIndex + step + galleryData.length) % galleryData.length;
    openLightbox(currentImageIndex);
  }

  galleryGrid.addEventListener("click", (e) => {
    const item = e.target.closest(".gallery-item");
    if (!item) return;
    openLightbox(Number(item.dataset.index));
  });
  galleryGrid.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const item = e.target.closest(".gallery-item");
    if (!item) return;
    e.preventDefault();
    openLightbox(Number(item.dataset.index));
  });

  lightboxClose.addEventListener("click", closeLightbox);
  lightboxPrev.addEventListener("click", () => showNextImage(-1));
  lightboxNext.addEventListener("click", () => showNextImage(1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("active")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showNextImage(-1);
    if (e.key === "ArrowRight") showNextImage(1);
  });

  /* =====================================================================
     10. TRÍCH DẪN LỊCH SỬ (luân phiên + hiệu ứng chữ + parallax)
  ===================================================================== */
  const quoteContent = document.getElementById("quote-content");
  const quoteSection = document.getElementById("quote-section");
  const quoteBg = document.querySelector(".quote-bg");
  let currentQuoteIndex = 0;
  let quoteTimer = null;

  function renderQuote(index) {
    const q = quotesData[index];
    const wordsHTML = q.text
      .split(" ")
      .map(
        (word, i) =>
          `<span class="word" style="animation-delay:${Math.min(i * 0.05, 1.2)}s">${word}</span>`,
      )
      .join(" ");

    quoteContent.innerHTML = `
      <p class="quote-text">${wordsHTML}</p>
      <p class="quote-author">— ${q.author}</p>
      <p class="quote-source">${q.source}</p>
      <div class="quote-dots">
        ${quotesData
          .map(
            (_, i) =>
              `<button type="button" class="quote-dot ${i === index ? "active" : ""}" data-index="${i}" aria-label="Trích dẫn ${i + 1}"></button>`,
          )
          .join("")}
      </div>
    `;
  }

  function nextQuote() {
    currentQuoteIndex = (currentQuoteIndex + 1) % quotesData.length;
    renderQuote(currentQuoteIndex);
  }

  function startQuoteRotation() {
    clearInterval(quoteTimer);
    quoteTimer = setInterval(nextQuote, 9000); // trích dẫn dài nên để 9 giây
  }

  renderQuote(currentQuoteIndex);
  startQuoteRotation();

  // Bấm vào chấm tròn để chọn trích dẫn thủ công
  quoteContent.addEventListener("click", (e) => {
    const dot = e.target.closest(".quote-dot");
    if (!dot) return;
    currentQuoteIndex = Number(dot.dataset.index);
    renderQuote(currentQuoteIndex);
    startQuoteRotation(); // reset đồng hồ đếm sau khi người dùng tự chọn
  });

  // Parallax nhẹ cho ảnh nền phần trích dẫn khi cuộn qua
  if (!prefersReducedMotion) {
    window.addEventListener(
      "scroll",
      () => {
        const rect = quoteSection.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          quoteBg.style.transform = `translateY(${rect.top * 0.15}px)`;
        }
      },
      { passive: true },
    );
  }

  /* =====================================================================
     11. SCROLL REVEAL DÙNG CHUNG (IntersectionObserver)
     Áp dụng cho .reveal-on-scroll, .timeline-item và đường hành trình,
     kể cả những phần tử vừa được tạo động ở các bước trên.
  ===================================================================== */
  const revealTargets = document.querySelectorAll(
    ".reveal-on-scroll, .timeline-item",
  );

  function revealAll() {
    revealTargets.forEach((el) => el.classList.add("in-view"));
    marchTrack.classList.add("in-view");
  }

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      // threshold thấp để phần tử cao (vượt màn hình) vẫn được hiện đúng lúc
      { threshold: 0.05, rootMargin: "0px 0px -5% 0px" },
    );
    revealTargets.forEach((el) => revealObserver.observe(el));

    // Đường hành trình chỉ bắt đầu chạy khi cả đường đã vào tầm nhìn
    const marchObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            marchObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 },
    );
    marchObserver.observe(marchTrack);

    // Lưới an toàn: nếu observer không chạy (trang in, khung ẩn, trình duyệt cũ),
    // vẫn hiện nội dung đang nằm trong màn hình.
    window.setTimeout(() => {
      revealTargets.forEach((el) => {
        if (
          getComputedStyle(el).opacity === "0" &&
          !el.classList.contains("in-view")
        ) {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            el.classList.add("in-view");
          }
        }
      });
    }, 1200);
  } else {
    revealAll();
  }

  /* =====================================================================
     12. COUNTER ANIMATION (số liệu trong phần giới thiệu)
  ===================================================================== */
  const statNumbers = document.querySelectorAll(".stat-number");

  function animateCounter(el) {
    const target = Number(el.dataset.target);
    if (prefersReducedMotion) {
      el.textContent = target;
      return;
    }
    const duration = 1600;
    const startTime = performance.now();

    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      // easeOutQuad để số chạy chậm dần về cuối
      const eased = 1 - (1 - progress) * (1 - progress);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 },
  );
  statNumbers.forEach((el) => counterObserver.observe(el));

  /* =====================================================================
     13. NÚT BACK TO TOP + NĂM Ở FOOTER
  ===================================================================== */
  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  });

  const yearEl = document.getElementById("current-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
