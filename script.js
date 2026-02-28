(() => {
  const body = document.body;
  const intro = document.getElementById("intro");
  const page = document.getElementById("page");
  const introHint = document.getElementById("introHint");
  const openingOverlay = document.getElementById("openingOverlay");
  const openingOverlayImg = openingOverlay ? openingOverlay.querySelector("img") : null;
  const downBtn = document.getElementById("downBtn");
  const timeline = document.getElementById("timeline");
  const mapEl = document.getElementById("leafletMap");

  const prefersReducedMotion =
    "matchMedia" in window ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

  const OPENING_GIF_MS = 800;
  const WHITE_FADE_IN_MS = 450; // matches CSS transition on .white-fade
  const OPENING_GIF_URL = "./assets/opening-envelope.gif";

  const setOpened = () => {
    body.classList.add("opened");
    body.classList.remove("opening");
    body.classList.remove("entering");
    body.classList.remove("playing-envelope");
    body.classList.remove("show-envelope-gif");
    body.classList.remove("is-locked");
    if (page) page.removeAttribute("aria-hidden");
    if (intro) intro.setAttribute("aria-hidden", "true");
  };

  const smoothScrollTo = (el) => {
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const enter = () => {
    if (
      body.classList.contains("entering") ||
      body.classList.contains("opened") ||
      body.classList.contains("playing-envelope") ||
      body.classList.contains("show-envelope-gif")
    )
      return;

    if (prefersReducedMotion) {
      body.classList.add("entering");
      setTimeout(() => {
        setOpened();
        window.scrollTo({ top: 0, left: 0 });
      }, 200);
      return;
    }

    // Ensure we start GIF playback from the beginning.
    if (openingOverlayImg) {
      openingOverlayImg.src = "";
      openingOverlayImg.src = OPENING_GIF_URL;
    }

    if (openingOverlay) openingOverlay.setAttribute("aria-hidden", "false");
    body.classList.add("show-envelope-gif");
    body.classList.add("playing-envelope");

    // Show the full-screen GIF, fade to white, then reveal the page content.
    setTimeout(() => {
      // Start the white fade while the GIF overlay is still visible,
      // so we never flash the background underneath.
      body.classList.add("entering");

      setTimeout(() => {
        if (openingOverlay) openingOverlay.setAttribute("aria-hidden", "true");
        body.classList.remove("show-envelope-gif");
        setOpened();
        window.scrollTo({ top: 0, left: 0 });
      }, WHITE_FADE_IN_MS);
    }, OPENING_GIF_MS);
  };

  if (intro) intro.addEventListener("click", enter);
  // Allow keyboard enter from the intro screen.
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    if (!intro || intro.getAttribute("aria-hidden") === "true") return;
    enter();
  });

  if (downBtn) {
    downBtn.addEventListener("click", () => smoothScrollTo(timeline));
  }

  // Years carousel controls (desktop arrows).
  const yearsTrack = document.getElementById("yearsTrack");
  const yearsPrev = document.querySelector(".years-nav--prev");
  const yearsNext = document.querySelector(".years-nav--next");

  const scrollYearsTo = (dir) => {
    if (!yearsTrack) return;
    const slides = Array.from(yearsTrack.querySelectorAll(".years-slide"));
    if (!slides.length) return;

    const viewportMid = yearsTrack.scrollLeft + yearsTrack.clientWidth / 2;
    let currentIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < slides.length; i++) {
      const el = slides[i];
      const mid = el.offsetLeft + el.offsetWidth / 2;
      const d = Math.abs(mid - viewportMid);
      if (d < bestDist) {
        bestDist = d;
        currentIdx = i;
      }
    }

    const nextIdx = Math.max(0, Math.min(slides.length - 1, currentIdx + dir));
    slides[nextIdx].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  // Map: "<" = back, ">" = next
  if (yearsPrev) yearsPrev.addEventListener("click", () => scrollYearsTo(-1));
  if (yearsNext) yearsNext.addEventListener("click", () => scrollYearsTo(1));

  // Fade-in on scroll
  const revealEls = Array.from(document.querySelectorAll(".reveal"));
  const revealNow = (el) => el.classList.add("is-visible");

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            revealNow(entry.target);
            io.unobserve(entry.target);
          }
        }
      },
      { root: null, threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );

    for (const el of revealEls) io.observe(el);
  } else {
    const onScroll = () => {
      const vh = window.innerHeight || 0;
      for (const el of revealEls) {
        if (el.classList.contains("is-visible")) continue;
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.9) revealNow(el);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
  }

  // Always show the intro on refresh; user must click to enter.

  // Map (Leaflet) with a big custom pin.
  if (mapEl && window.L) {
    const gamosLatLng = [31.797333, 35.331861]; // Mishor Adumim area (approx.)
    const map = window.L.map(mapEl, {
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: true,
      tap: true,
    }).setView(gamosLatLng, 13);

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const icon = window.L.divIcon({
      className: "gamos-pin",
      html: '<div class="gamos-pin__dot"></div><div class="gamos-pin__label">Gamos</div>',
      iconSize: [140, 140],
      iconAnchor: [70, 120],
    });

    const marker = window.L.marker(gamosLatLng, { icon }).addTo(map);
    marker.on("click", () => {
      window.open("https://waze.com/ul?ll=31.797333,35.331861&navigate=yes", "_blank", "noopener");
    });

    // Enable zoom on intentional interaction only.
    mapEl.addEventListener(
      "click",
      () => {
        map.scrollWheelZoom.enable();
      },
      { once: true }
    );
  }
})();
