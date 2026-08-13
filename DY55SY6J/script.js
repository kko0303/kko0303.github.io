/* ============================================================
   作品リスト。
   works/ フォルダに画像を入れて build_page.py を実行すると
   ここが自動で書き換わります。手で足しても構いません。

   1つの作品に写真を複数入れられます。カードには1枚目が出て、
   タップすると2枚目以降も送れます。
   ============================================================ */
const WORKS = [
  { title: "アクセサリーツリー", photos: ["works/01_アクセサリーツリー.jpg"] },
  { title: "IKEA SKADIS ボードアクセサリー", photos: ["works/02_IKEA SKADIS ボードアクセサリー-1.jpg", "works/02_IKEA SKADIS ボードアクセサリー-2.jpg"] },
  { title: "分割キーボードアーム", photos: ["works/03_分割キーボードアーム-1.jpg", "works/03_分割キーボードアーム-2.jpg", "works/03_分割キーボードアーム-3.jpg"] },
];

/* 作品をまたいで全部の写真を1列に並べたもの。ライトボックスはこれを送る */
const FLAT = WORKS.flatMap((w, wi) =>
  w.photos.map((src, pi) => ({
    src, title: w.title, wi, pi, of: w.photos.length
  }))
);

/* ---- WORKS を組み立てる ----
   複数枚ある作品は、タップしなくてもゆっくり入れ替わります。
   画面に入っているカードだけを動かし、見えなくなったら止めます。   */
const SLIDE_MS = 3600;          // 1枚あたりの表示時間
const FADE_STAGGER = 700;       // カードごとに開始をずらす量

(function () {
  const grid = document.getElementById("works-grid");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let flatIndex = 0;

  const shows = [];             // 自動送りするカードの管理表

  WORKS.forEach((w, i) => {
    const first = flatIndex;
    flatIndex += w.photos.length;

    const a = document.createElement("a");
    a.className = "card rise";
    a.href = "#works";
    a.innerHTML =
      '<div class="frame"><span class="no">' +
      String(i + 1).padStart(2, "0") + "</span></div>" +
      '<div class="meta"><span class="ttl"></span><span class="cat">3D PRINT</span></div>';

    const frame = a.querySelector(".frame");
    a.querySelector(".ttl").textContent = w.title;

    // 写真を重ねて置く。1枚目だけ表示状態にしておく
    const imgs = w.photos.map((src, k) => {
      const img = new Image();
      img.src = src;
      img.alt = w.title;
      if (k === 0) img.classList.add("on");
      else img.loading = "lazy";
      frame.appendChild(img);
      return img;
    });

    let dots = [];
    if (w.photos.length > 1) {
      const box = document.createElement("div");
      box.className = "dots";
      dots = w.photos.map((_, k) => {
        const d = document.createElement("i");
        if (k === 0) d.classList.add("on");
        box.appendChild(d);
        return d;
      });
      frame.appendChild(box);
    }

    const show = { imgs, dots, at: 0, timer: null, visible: false };

    show.step = () => {
      show.imgs[show.at].classList.remove("on");
      show.dots[show.at]?.classList.remove("on");
      show.at = (show.at + 1) % show.imgs.length;
      show.imgs[show.at].classList.add("on");
      show.dots[show.at]?.classList.add("on");
    };

    // タップしたら、いま見えている写真から拡大表示を開く
    a.addEventListener("click", e => { e.preventDefault(); openLb(first + show.at); });

    grid.appendChild(a);

    if (w.photos.length > 1 && !still) {
      show.el = a;
      shows.push(show);
    }
  });

  if (!shows.length) return;

  // 画面外のカードは止めておく
  const vis = new IntersectionObserver(entries => {
    entries.forEach(en => {
      const show = shows.find(s => s.el === en.target);
      if (!show) return;
      if (en.isIntersecting && !show.timer) {
        const delay = FADE_STAGGER * shows.indexOf(show);
        show.timer = setTimeout(function tick() {
          show.step();
          show.timer = setTimeout(tick, SLIDE_MS);
        }, SLIDE_MS + delay);
      } else if (!en.isIntersecting && show.timer) {
        clearTimeout(show.timer);
        show.timer = null;
      }
    });
  }, { threshold: .35 });

  shows.forEach(s => vis.observe(s.el));
})();

/* ---- ヘッダーの追従 ---- */
const hdr = document.getElementById("hdr");
const onScroll = () => hdr.classList.toggle("stuck", scrollY > 40);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---- モバイルメニュー ---- */
const burger = document.getElementById("burger");
const nav = document.getElementById("nav");
burger.addEventListener("click", () => {
  burger.classList.toggle("on");
  nav.classList.toggle("open");
});
nav.addEventListener("click", e => {
  if (e.target.tagName === "A") { burger.classList.remove("on"); nav.classList.remove("open"); }
});

/* ---- スクロールで浮かび上がる ---- */
const io = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  });
}, { threshold: .12, rootMargin: "0px 0px -8% 0px" });

document.querySelectorAll(".rise").forEach((el, i) => {
  el.style.transitionDelay = (i % 3) * 90 + "ms";
  io.observe(el);
});

/* ---- ライトボックス ---- */
const lb = document.getElementById("lb");
const lbImg = document.getElementById("lb-img");
const lbCap = document.getElementById("lb-cap");
let idx = 0;

function openLb(i) {
  idx = (i + FLAT.length) % FLAT.length;
  const p = FLAT[idx];
  lbImg.src = p.src;
  lbImg.alt = p.title;
  // 同じ作品に複数枚あるときだけ「1 / 2」を出す
  lbCap.textContent = p.title + (p.of > 1 ? `　${p.pi + 1} / ${p.of}` : "");
  lb.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeLb() {
  lb.classList.remove("open");
  document.body.style.overflow = "";
}

lb.addEventListener("click", e => { if (e.target === lb || e.target === lbImg) closeLb(); });
lb.querySelector(".x").addEventListener("click", closeLb);
lb.querySelector(".prev").addEventListener("click", e => { e.stopPropagation(); openLb(idx - 1); });
lb.querySelector(".next").addEventListener("click", e => { e.stopPropagation(); openLb(idx + 1); });
addEventListener("keydown", e => {
  if (!lb.classList.contains("open")) return;
  if (e.key === "Escape") closeLb();
  if (e.key === "ArrowLeft") openLb(idx - 1);
  if (e.key === "ArrowRight") openLb(idx + 1);
});

/* スワイプで送る */
let x0 = null;
lb.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
lb.addEventListener("touchend", e => {
  if (x0 === null) return;
  const dx = e.changedTouches[0].clientX - x0;
  if (Math.abs(dx) > 50) openLb(idx + (dx < 0 ? 1 : -1));
  x0 = null;
}, { passive: true });

/* ---- 画像が無い場合はその枠を静かに畳む ---- */
document.querySelectorAll(".portrait img").forEach(img => {
  img.addEventListener("error", () => img.closest("figure").remove());
});
