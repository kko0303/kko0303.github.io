/* ============================================================
   作品リスト。
   works/ フォルダに画像を入れて build_page.py を実行すると
   ここが自動で書き換わります。手で足しても構いません。
   ============================================================ */
const PHOTOS = [
  { src: "works/01_アクセサリーツリー.jpg", caption: "アクセサリーツリー" },
];

/* ---- WORKS を組み立てる ---- */
(function () {
  const grid = document.getElementById("works-grid");
  PHOTOS.forEach((p, i) => {
    const a = document.createElement("a");
    a.className = "card rise";
    a.href = "#works";
    a.innerHTML =
      '<div class="frame"><span class="no">' +
      String(i + 1).padStart(2, "0") +
      '</span><img loading="lazy" alt=""></div>' +
      '<div class="meta"><span class="ttl"></span><span class="cat">3D PRINT</span></div>';
    a.querySelector("img").src = p.src;
    a.querySelector("img").alt = p.caption;
    a.querySelector(".ttl").textContent = p.caption;
    a.addEventListener("click", e => { e.preventDefault(); openLb(i); });
    grid.appendChild(a);
  });
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
  idx = (i + PHOTOS.length) % PHOTOS.length;
  lbImg.src = PHOTOS[idx].src;
  lbImg.alt = PHOTOS[idx].caption;
  lbCap.textContent = `${String(idx + 1).padStart(2, "0")} — ${PHOTOS[idx].caption}`;
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
