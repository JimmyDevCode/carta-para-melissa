/* =========================================================
   Nuestro primer capítulo — interacciones
   ========================================================= */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Bloquear scroll durante la intro ---- */
  document.body.classList.add("locked");

  /* ---- Abrir la historia ---- */
  const intro = document.getElementById("intro");
  const story = document.getElementById("story");
  const openBtn = document.getElementById("openBtn");

  openBtn.addEventListener("click", function () {
    intro.classList.add("is-hidden");
    story.hidden = false;
    document.body.classList.remove("locked");
    setTimeout(function () {
      story.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      initReveals();
    }, 420);
  });

  /* ---- Scroll reveal ---- */
  function initReveals() {
    const items = document.querySelectorAll(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    items.forEach((el) => io.observe(el));
  }

  /* ---- Barra de progreso ---- */
  const progressBar = document.getElementById("progressBar");
  function updateProgress() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    progressBar.style.width = pct + "%";
  }
  window.addEventListener("scroll", updateProgress, { passive: true });

  /* ---- Secretos ---- */
  const secrets = [
    "Me haces sonreír más de lo que imaginas.",
    "Sí, a veces me hago el frío. Pero tú sabes que no tanto. 😂",
    "Hay momentos contigo que ya guardé entre mis favoritos.",
    "Pienso en ti en momentos en los que ni te lo imaginas.",
    "Me gusta la calma que siento cuando estamos juntos.",
    "Y probablemente este sea solo el primer mes de muchos.",
  ];
  let secretOrder = shuffle(secrets.slice());
  let secretIndex = 0;

  const secretBtn = document.getElementById("secretBtn");
  const secretText = document.getElementById("secretText");
  const secretCount = document.getElementById("secretCount");

  secretBtn.addEventListener("click", function () {
    if (secretIndex >= secretOrder.length) {
      secretOrder = shuffle(secrets.slice());
      secretIndex = 0;
    }
    const next = secretOrder[secretIndex++];
    secretText.classList.add("swap");
    setTimeout(function () {
      secretText.textContent = next;
      secretText.classList.remove("swap");
    }, reduceMotion ? 0 : 300);
    secretCount.textContent = "secreto " + secretIndex + " de " + secrets.length;
    secretBtn.textContent = secretIndex >= secrets.length ? "Descubrir de nuevo" : "Descubrir otro";
  });

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /* ---- Checklist de planes ---- */
  document.querySelectorAll(".check").forEach(function (item) {
    item.addEventListener("click", function () {
      item.classList.toggle("done");
    });
  });

  /* ---- Partículas / pequeñas luces ---- */
  initParticles();

  function initParticles() {
    const canvas = document.getElementById("particles");
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext("2d");
    let w, h, dpr, particles;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = window.innerWidth * dpr;
      h = canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      const count = Math.min(70, Math.floor(window.innerWidth / 12));
      particles = Array.from({ length: count }, makeParticle);
    }

    function makeParticle() {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: (Math.random() * 1.4 + 0.4) * dpr,
        sx: (Math.random() - 0.5) * 0.12 * dpr,
        sy: (Math.random() - 0.5) * 0.12 * dpr,
        a: Math.random() * 0.5 + 0.15,
        tw: Math.random() * 0.02 + 0.005,
        gold: Math.random() > 0.7,
      };
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.sx;
        p.y += p.sy;
        p.a += p.tw;
        if (p.a > 0.7 || p.a < 0.12) p.tw *= -1;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.gold
          ? "rgba(201,168,106," + p.a + ")"
          : "rgba(246,241,233," + p.a * 0.7 + ")";
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener("resize", resize);
    tick();
  }

  /* ---- Parallax muy sutil en la foto principal ---- */
  if (!reduceMotion) {
    const feature = document.querySelector(".feature-photo img, .feature-photo .photo-placeholder");
    const featureWrap = document.querySelector(".feature-photo");
    if (featureWrap) {
      window.addEventListener(
        "scroll",
        function () {
          const rect = featureWrap.getBoundingClientRect();
          const offset = (rect.top / window.innerHeight - 0.5) * -14;
          featureWrap.style.transform = "translateY(" + offset + "px)";
        },
        { passive: true }
      );
    }
  }
})();
