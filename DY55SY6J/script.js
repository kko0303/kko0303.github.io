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
  { title: "モニターデスク棚", photos: ["works/04_モニターデスク棚.jpg"] },
  { title: "事務所用収納", photos: ["works/05_事務所用収納.jpg"] },
];

/* ============================================================
   作品の説明文。
   左の「作品名」は上の WORKS の title と同じ字にしてください。
   build_page.py はここを書き換えないので、写真を足しても消えません。
   説明が要らない作品は、行ごと消せば何も出ません。
   ============================================================ */
/* 作品カードから飛ばしたい先。ここに書いた作品は、タップすると
   写真の拡大ではなくそのセクションへ移動します。 */
const LINKS = {
  "分割キーボードアーム": "#dock",
};

const NOTES = {
  "分割キーボードアーム":
    "自作の分割キーボードを、椅子のアームレストに載せるドック。" +
    "姿勢を変えても手の位置が変わりません。" +
    "詳しくは上の「アームレストドック」をご覧ください。",

  "IKEA SKADIS ボードアクセサリー":
    "IKEAの有孔ボード SKÅDIS 用の棚・フック・小物入れ。" +
    "純正では欲しいサイズが無かったので、必要な形だけ自分で足していきました。" +
    "同じフィラメントで揃えると、後から作り足しても見た目が揃います。",

  "アクセサリーツリー":
    "指輪・ブレスレット・ネックレスをまとめて掛けておくスタンド。" +
    "枝の高さと角度を変えて、絡まずに掛かる位置を探りました。",

  "モニターデスク棚":
    "モニター下の空間を埋める、引き出し付きの台。" +
    "机の幅と手持ちの小物に合わせて寸法を決めているので、無駄な余白がありません。",

  "事務所用収納":
    "職場のカウンターで使う、自立式のツールスタンド。" +
    "ホチキス・スタンプ・ハサミ・カッターの定位置をつくり、ラベルも一体で印刷しています。" +
    "置くだけなので壁に穴を開けずに済みます。",
};

/* 作品をまたいで全部の写真を1列に並べたもの。ライトボックスはこれを送る */
const FLAT = WORKS.flatMap((w, wi) =>
  w.photos.map((src, pi) => ({
    src, title: w.title, wi, pi, of: w.photos.length
  }))
);

/* ---- WORKS を組み立てる ----
   複数枚ある作品は、タップしなくてもゆっくり入れ替わります。
   画面に入っているカードだけを動かし、見えなくなったら止めます。   */
/* 速さの調整はこの3つだけ。数字はミリ秒（1000 = 1秒）
   遅くしたいときは SLIDE_MS を大きく、速くしたいときは小さくします。 */
const FIRST_MS = 900;           // カードが見えてから最初に切り替わるまで
const SLIDE_MS = 2000;          // 2枚目以降、1枚あたりの表示時間
const FADE_STAGGER = 250;       // カードごとに開始をずらす量

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
      '<div class="meta"><span class="ttl"></span><span class="cat">3D PRINT</span></div>' +
      '<p class="desc"></p>';

    const frame = a.querySelector(".frame");
    a.querySelector(".ttl").textContent = w.title;

    const note = NOTES[w.title];
    if (note) a.querySelector(".desc").textContent = note;
    else a.querySelector(".desc").remove();

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

    // 詳細セクションがある作品は、そちらへ飛ばす。
    // 無い作品はこれまでどおり写真の拡大表示。
    const link = LINKS[w.title];
    if (link) {
      a.href = link;
      a.classList.add("has-detail");
    } else {
      a.addEventListener("click", e => { e.preventDefault(); openLb(first + show.at); });
    }

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
        // 最初の1回だけ早く動かす。スクロールで通り過ぎる人にも
        // 「これは複数枚ある」と気づいてもらうため。
        const delay = FIRST_MS + FADE_STAGGER * shows.indexOf(show);
        show.timer = setTimeout(function tick() {
          show.step();
          show.timer = setTimeout(tick, SLIDE_MS);
        }, delay);
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
