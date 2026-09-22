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

  /* ---- Cuaderno de recuerdos (hojas ordenadas por fecha) ---- */
  initNotebook();

  function initNotebook() {
    const stack = document.getElementById("notebookStack");
    const prevBtn = document.getElementById("pagePrev");
    const nextBtn = document.getElementById("pageNext");
    const indicator = document.getElementById("pageIndicator");
    if (!stack) return;

    // La lista de fotos vive en photos.js (window.PHOTOS). Acepta rutas o
    // objetos { src, date } donde "date" es un respaldo manual opcional.
    const raw = Array.isArray(window.PHOTOS) ? window.PHOTOS : [];
    const photos = raw.map(function (p) {
      return typeof p === "string" ? { src: p } : p;
    });
    if (!photos.length) {
      indicator.textContent = "Sin fotos";
      prevBtn.disabled = nextBtn.disabled = true;
      return;
    }

    indicator.textContent = "Cargando…";

    // Solo leemos la fecha EXIF de todas (ligero). La conversión de HEIC para
    // mostrar se hace de forma perezosa al navegar (ver ensureLoaded).
    Promise.all(photos.map(resolveDate)).then(function (times) {
      const items = photos.map(function (photo, i) {
        return { src: photo.src, time: times[i] };
      });
      items.sort(function (a, b) { return a.time - b.time; });
      buildNotebook(items);
    });

    function resolveDate(photo) {
      // Respaldo: fecha manual (objeto) o la fecha detectada en el nombre.
      const manual = photo.date ? new Date(photo.date + "T00:00:00").getTime() : NaN;
      const fromName = parseDateFromName(photo.src);
      const fallback = !isNaN(manual) ? manual : !isNaN(fromName) ? fromName : Infinity;
      if (typeof window.exifr === "undefined") {
        return Promise.resolve(fallback);
      }
      return window.exifr
        .parse(photo.src, ["DateTimeOriginal", "CreateDate", "ModifyDate"])
        .then(function (data) {
          const exifDate = data && (data.DateTimeOriginal || data.CreateDate || data.ModifyDate);
          return exifDate instanceof Date ? exifDate.getTime() : fallback;
        })
        .catch(function () { return fallback; });
    }

    // Detecta una fecha en el nombre: "2026-09-15", "2026_09_15" o "20260915".
    function parseDateFromName(src) {
      const name = src.split("/").pop();
      const m = name.match(/(20\d{2})[-_.]?(\d{2})[-_.]?(\d{2})/);
      if (!m) return NaN;
      const y = +m[1], mo = +m[2], d = +m[3];
      if (mo < 1 || mo > 12 || d < 1 || d > 31) return NaN;
      return new Date(y, mo - 1, d).getTime();
    }

    // Devuelve una URL mostrable: convierte HEIC a JPEG solo cuando se pide.
    function toDisplaySrc(src) {
      const isHeic = /\.heic$/i.test(src);
      if (!isHeic || typeof window.heic2any === "undefined") {
        return Promise.resolve(src);
      }
      return fetch(src)
        .then(function (r) { return r.blob(); })
        .then(function (blob) {
          return window.heic2any({ blob: blob, toType: "image/jpeg", quality: 0.82 });
        })
        .then(function (jpeg) { return URL.createObjectURL(jpeg); })
        .catch(function () { return src; });
    }

    function buildNotebook(items) {
      const total = items.length;
      let current = 0;

      items.forEach(function (item, i) {
        const label = isFinite(item.time)
          ? formatDate(new Date(item.time))
          : "Fecha desconocida";
        const sheet = document.createElement("div");
        sheet.className = "sheet";
        sheet.style.zIndex = String(total - i);
        sheet.innerHTML =
          '<div class="sheet__face sheet__front">' +
            '<div class="photo-frame is-loading">' +
              '<img alt="Recuerdo del ' + label +
                '" onerror="this.classList.add(\'is-empty\')" />' +
              '<span class="photo-loader" aria-hidden="true"></span>' +
              '<span class="photo-placeholder">Cargando…</span>' +
            "</div>" +
            '<p class="sheet__date">' + label + "</p>" +
          "</div>" +
          '<div class="sheet__face sheet__back"></div>';
        stack.appendChild(sheet);
      });

      const sheets = Array.prototype.slice.call(stack.children);
      const loaded = new Array(total).fill(false);

      function ensureLoaded(i) {
        if (i < 0 || i >= total || loaded[i]) return;
        loaded[i] = true;
        const sheet = sheets[i];
        const frame = sheet.querySelector(".photo-frame");
        const img = sheet.querySelector("img");
        img.addEventListener("load", function () { frame.classList.remove("is-loading"); });
        img.addEventListener("error", function () { frame.classList.remove("is-loading"); });
        toDisplaySrc(items[i].src).then(function (url) {
          img.src = url;
        });
      }

      function render() {
        sheets.forEach(function (sheet, i) {
          sheet.classList.toggle("is-active", i === current);
          sheet.style.zIndex = String(i === current ? total : 1);
        });
        ensureLoaded(current);
        ensureLoaded(current + 1);
        ensureLoaded(current - 1);
        indicator.textContent = current + 1 + " / " + total;
        prevBtn.disabled = current === 0;
        nextBtn.disabled = current === total - 1;
      }

      prevBtn.addEventListener("click", function () {
        if (current > 0) { current--; render(); }
      });
      nextBtn.addEventListener("click", function () {
        if (current < total - 1) { current++; render(); }
      });

      render();
    }
  }

  function formatDate(date) {
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    return date.getDate() + " de " + meses[date.getMonth()] + " de " + date.getFullYear();
  }

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
