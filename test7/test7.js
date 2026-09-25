/* =====================================================================
   VÕ NGUYÊN GIÁP — VONGUYENGIAP.JS
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
     Tham số title dùng "|" để xuống dòng, ví dụ "Đại tướng|Võ Nguyên Giáp".
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
      year: "1911",
      name: "Sinh ở Quảng Bình",
      detail:
        "Võ Nguyên Giáp sinh ngày 25/8/1911 tại làng An Xá, xã Lộc Thủy, huyện Lệ Thủy, tỉnh Quảng Bình, trong một gia đình nhà nho.",
    },
    {
      year: "1925 – 1930",
      name: "Học ở Huế, hoạt động yêu nước",
      detail:
        "Ông học tại Trường Quốc học Huế, tham gia phong trào yêu nước của học sinh, sinh viên; bị đuổi học và từng bị bắt giam một thời gian ngắn vì hoạt động chính trị.",
    },
    {
      year: "1936 – 1939",
      name: "Dạy học và viết báo ở Hà Nội",
      detail:
        "Ông dạy môn Lịch sử tại Trường tư thục Thăng Long (Hà Nội), đồng thời viết báo và tham gia phong trào Mặt trận Dân chủ Đông Dương.",
    },
    {
      year: "1940",
      name: "Sang Trung Quốc, gặp Hồ Chí Minh",
      detail:
        "Ông sang Trung Quốc hoạt động cách mạng và gặp Nguyễn Ái Quốc (Hồ Chí Minh), mở đầu con đường hoạt động cách mạng chuyên nghiệp.",
    },
    {
      year: "22/12/1944",
      name: "Thành lập Đội Việt Nam Tuyên truyền Giải phóng quân",
      detail:
        "Theo chỉ thị của Hồ Chí Minh, ông thành lập Đội Việt Nam Tuyên truyền Giải phóng quân tại khu rừng Trần Hưng Đạo (Cao Bằng) với 34 chiến sĩ đầu tiên — tiền thân của Quân đội Nhân dân Việt Nam.",
    },
    {
      year: "1945",
      name: "Tổng khởi nghĩa và Chính phủ lâm thời",
      detail:
        "Ông tham gia lãnh đạo Cách mạng Tháng Tám, sau đó giữ chức Bộ trưởng Bộ Nội vụ trong Chính phủ lâm thời nước Việt Nam Dân chủ Cộng hòa.",
    },
    {
      year: "1948",
      name: "Phong quân hàm Đại tướng",
      detail:
        "Ở tuổi 37, ông được phong quân hàm Đại tướng — Đại tướng đầu tiên và trẻ tuổi nhất của Quân đội Nhân dân Việt Nam, giữ chức Tổng Tư lệnh Quân đội.",
    },
    {
      year: "1954",
      name: "Chiến thắng Điện Biên Phủ",
      detail:
        'Với cương vị Tổng Tư lệnh, ông quyết định chuyển phương châm tác chiến từ "đánh nhanh, thắng nhanh" sang "đánh chắc, tiến chắc", dẫn đến chiến thắng Điện Biên Phủ, buộc Pháp ký Hiệp định Genève.',
    },
    {
      year: "1968",
      name: "Tổng tiến công và nổi dậy Tết Mậu Thân",
      detail:
        "Ông là một trong những người chỉ đạo chiến lược cuộc Tổng tiến công và nổi dậy Tết Mậu Thân, một bước ngoặt quan trọng của cuộc kháng chiến chống Mỹ.",
    },
    {
      year: "1975",
      name: "Chiến dịch Hồ Chí Minh",
      detail:
        'Ông ra mệnh lệnh "thần tốc, thần tốc hơn nữa, táo bạo, táo bạo hơn nữa" trong Chiến dịch Hồ Chí Minh, kết thúc cuộc kháng chiến chống Mỹ và thống nhất đất nước.',
    },
    {
      year: "2013",
      name: "Qua đời",
      detail:
        "Đại tướng Võ Nguyên Giáp qua đời ngày 4/10/2013 tại Hà Nội, thọ 102 tuổi, được an táng tại Vũng Chùa – Đảo Yến, quê nhà Quảng Bình.",
    },
  ];

  // Các chặng của hành trình từ thầy giáo đến Đại tướng (section "Hành trình")
  const marchData = [
    {
      when: "1911",
      place: "An Xá, Quảng Bình",
      note: "Sinh ra trong một gia đình nhà nho ở làng An Xá, huyện Lệ Thủy — vùng đất hiếu học bên dòng sông Kiến Giang.",
    },
    {
      when: "1925 – 1930",
      place: "Huế",
      note: "Học tại Trường Quốc học Huế, tham gia phong trào yêu nước của học sinh và sớm bộc lộ tinh thần đấu tranh chính trị.",
    },
    {
      when: "1936 – 1939",
      place: "Hà Nội",
      note: "Dạy học môn Lịch sử tại Trường Thăng Long, viết báo và hoạt động trong phong trào Mặt trận Dân chủ Đông Dương.",
    },
    {
      when: "1940",
      place: "Trung Quốc",
      note: "Sang Trung Quốc hoạt động cách mạng, gặp Nguyễn Ái Quốc (Hồ Chí Minh), bước ngoặt đưa ông vào con đường quân sự.",
    },
    {
      when: "1944",
      place: "Cao Bằng",
      note: "Thành lập Đội Việt Nam Tuyên truyền Giải phóng quân với 34 chiến sĩ đầu tiên tại khu rừng Trần Hưng Đạo.",
    },
    {
      when: "1954",
      place: "Điện Biên Phủ",
      note: "Với cương vị Tổng Tư lệnh, chỉ huy chiến dịch Điện Biên Phủ, đánh dấu đỉnh cao sự nghiệp quân sự của ông.",
    },
  ];

  // Dữ liệu sự kiện / tư liệu lịch sử (section "Chiến dịch")
  const eventsData = [
    {
      title: "Thành lập Đội Việt Nam Tuyên truyền Giải phóng quân",
      year: "22/12/1944",
      figures: "Võ Nguyên Giáp",
      desc: "Theo chỉ thị của Hồ Chí Minh, Võ Nguyên Giáp thành lập Đội Việt Nam Tuyên truyền Giải phóng quân tại khu rừng Trần Hưng Đạo (Cao Bằng) với 34 chiến sĩ đầu tiên, trang bị thô sơ. Chỉ ba ngày sau, đội quân non trẻ này đã lập chiến công đầu tiên tại Phai Khắt và Nà Ngần.",
      image:
        "https://commons.wikimedia.org/wiki/Special:FilePath/Vo_Nguyen_Giap,_Vietminh_forces,_1944.jpg",
      imageFallback: makeArt(
        "Đội Việt Nam|Tuyên truyền GPQ",
        "22/12/1944",
        800,
        600,
        "gold",
      ),
    },
    {
      title: "Phong quân hàm Đại tướng",
      year: "1948",
      figures: "Võ Nguyên Giáp",
      desc: "Ở tuổi 37, Võ Nguyên Giáp được phong quân hàm Đại tướng — Đại tướng đầu tiên và trẻ tuổi nhất của Quân đội Nhân dân Việt Nam, giữ chức Tổng Tư lệnh Quân đội trong nhiều thập kỷ sau đó.",
      image:
        "https://baokhanhhoa.vn/file/e7837c02857c8ca30185a8c39b582c03/ThumbImages/Systems/2013/10/08/bac-ho_500.jpg",
      imageFallback: makeArt("Đại tướng", "1948", 800, 600, "red"),
    },
    {
      title: "Chiến thắng Điện Biên Phủ",
      year: "13/3 – 7/5/1954",
      figures: "Võ Nguyên Giáp",
      desc: 'Là Tổng Tư lệnh chiến dịch, ông quyết định chuyển phương châm tác chiến từ "đánh nhanh, thắng nhanh" sang "đánh chắc, tiến chắc" — một quyết định khó khăn nhưng mang tính bước ngoặt. Sau 56 ngày đêm, quân đội Việt Nam giành thắng lợi hoàn toàn, buộc Pháp phải ký Hiệp định Genève.',
      image:
        "https://dienbienphu-image.nhandan.vn/t1200/Uploaded/uncqrwpjw/chienthangdienbienphuttxvn.jpg",
      imageFallback: makeArt("Điện Biên Phủ", "1954", 800, 600, "red"),
    },
    {
      title: "Tổng tiến công và nổi dậy Tết Mậu Thân",
      year: "1968",
      figures: "Võ Nguyên Giáp",
      desc: "Với cương vị Bộ trưởng Bộ Quốc phòng, ông là một trong những người chỉ đạo chiến lược cuộc Tổng tiến công và nổi dậy đồng loạt vào các đô thị miền Nam dịp Tết Mậu Thân — sự kiện làm lung lay quyết tâm chiến tranh của Mỹ.",
      image:
        "https://baoquankhu4.com.vn/upload/18269/20241115/mau_than_1968_7317c.jpg",
      imageFallback: makeArt("Tết Mậu Thân", "1968", 800, 600, "jade"),
    },
    {
      title: "Chiến dịch Hồ Chí Minh",
      year: "Tháng 4/1975",
      figures: "Võ Nguyên Giáp, Văn Tiến Dũng",
      desc: 'Ông ký mệnh lệnh nổi tiếng ngày 7/4/1975: "Thần tốc, thần tốc hơn nữa, táo bạo, táo bạo hơn nữa, tranh thủ từng giờ từng phút, xốc tới mặt trận, giải phóng miền Nam, quyết chiến và toàn thắng." Chiến dịch kết thúc ngày 30/4/1975, thống nhất đất nước.',
      image: "https://hatinh.gov.vn/Files/topics/17144379188271.jpeg",
      imageFallback: makeArt(
        "Chiến dịch|Hồ Chí Minh",
        "1975",
        800,
        600,
        "gold",
      ),
    },
  ];

  // Dữ liệu thư viện ảnh — thêm/bớt phần tử để thay đổi số lượng ảnh hiển thị.
  // Ảnh dùng nguồn Wikimedia Commons (Special:FilePath); nếu link lỗi, trang tự
  // thay bằng ảnh SVG dự phòng trong trường "fallback".
  const galleryData = [
    {
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Mr._Vo_Nguyen_Giap.jpg",
      fallback: makeArt("Võ Nguyên|Giáp", "Chân dung", 500, 650, "red"),
      caption: "Đại tướng Võ Nguyên Giáp — Ảnh: Wikimedia Commons",
    },
    {
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Ho_Chi_Minh_and_Vo_Nguyen_Giap_(1945).jpg",
      fallback: makeArt(
        "Hồ Chí Minh|và Võ Nguyên Giáp",
        "1945",
        500,
        620,
        "gold",
      ),
      caption:
        "Hồ Chí Minh và Võ Nguyên Giáp, năm 1945 — Ảnh: Wikimedia Commons",
    },
    {
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Vo_Nguyen_Giap,_Vietminh_forces,_1944.jpg",
      fallback: makeArt(
        "Đội Việt Nam|Tuyên truyền GPQ",
        "22/12/1944",
        500,
        550,
        "jade",
      ),
      caption:
        "Võ Nguyên Giáp cùng lực lượng Việt Minh, năm 1944 — Ảnh: Wikimedia Commons",
    },
    {
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Sculpture_of_Gen._Vo_Nguyen_Giap_-_Dien_Bien_Phu_Victory_Museum_-_Dien_Bien_Phu_-_Vietnam_(48159211597).jpg",
      fallback: makeArt("Bảo tàng|Điện Biên Phủ", "Điện Biên", 500, 500, "red"),
      caption:
        "Tượng Đại tướng tại Bảo tàng Chiến thắng Điện Biên Phủ — Ảnh: Wikimedia Commons",
    },
    {
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Vo_Nguyen_Giap,_Philippe_Leclerc,_Hanoi_street,_March_1946.jpg",
      fallback: makeArt("Hà Nội", "Tháng 3/1946", 500, 560, "gold"),
      caption:
        "Võ Nguyên Giáp trên phố Hà Nội, tháng 3/1946 — Ảnh: Wikimedia Commons",
    },
    {
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Vo_Nguyen_Giap's_tomb.jpg",
      fallback: makeArt("Vũng Chùa|Đảo Yến", "Quảng Bình", 500, 600, "jade"),
      caption:
        "Mộ phần Đại tướng tại Vũng Chùa – Đảo Yến, Quảng Bình — Ảnh: Wikimedia Commons",
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
      text: "Thần tốc, thần tốc hơn nữa, táo bạo, táo bạo hơn nữa, tranh thủ từng giờ từng phút, xốc tới mặt trận, giải phóng miền Nam, quyết chiến và toàn thắng.",
      author: "Đại tướng Võ Nguyên Giáp",
      source: "Mệnh lệnh chiến dịch Hồ Chí Minh, ngày 7/4/1975",
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
        "Võ Nguyên|Giáp",
        "1911 – 2013",
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
      el.dataset.artTitle || "Võ Nguyên Giáp",
      el.dataset.artSub || "",
      800,
      450,
      el.dataset.artHue || "red",
    )}")`;
  });

  const quoteBgEl = document.querySelector(".quote-bg");
  if (quoteBgEl) {
    quoteBgEl.style.backgroundImage = `url("${makeArt(
      "Điện Biên Phủ",
      "1954",
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
