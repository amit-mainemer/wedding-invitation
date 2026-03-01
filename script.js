(() => {
  const body = document.body;
  const intro = document.getElementById("intro");
  const page = document.getElementById("page");
  const introHint = document.getElementById("introHint");
  const openingOverlay = document.getElementById("openingOverlay");
  const openingOverlayImg = openingOverlay ? openingOverlay.querySelector("img") : null;
  const downBtn = document.getElementById("downBtn");
  const timeline = document.getElementById("timeline");

  const prefersReducedMotion =
    "matchMedia" in window ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

  const OPENING_GIF_MS = 800;
  const WHITE_FADE_IN_MS = 650; // matches CSS transition on .white-fade
  const HIDE_OVERLAY_EARLY_MS = 260; // prevents the GIF from reaching a second loop
  const OPENING_GIF_URL = "./assets/opening-envelope.gif";

  const setOpened = () => {
    body.classList.add("opened");
    body.classList.remove("opening");
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
        body.classList.remove("entering");
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

      // Hide the GIF overlay early during the white fade so the GIF can't restart.
      setTimeout(() => {
        if (openingOverlay) openingOverlay.setAttribute("aria-hidden", "true");
        body.classList.remove("show-envelope-gif");
      }, HIDE_OVERLAY_EARLY_MS);

      setTimeout(() => {
        setOpened();
        // Let the page start fading in, then fade out the white overlay smoothly.
        setTimeout(() => body.classList.remove("entering"), 60);
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

  // Years carousel is swipe/scroll-only (no arrows).
  const yearsTrack = document.getElementById("yearsTrack");
  if (yearsTrack) {
    yearsTrack.style.cursor = "grab";
    yearsTrack.addEventListener("mousedown", () => (yearsTrack.style.cursor = "grabbing"));
    window.addEventListener("mouseup", () => (yearsTrack.style.cursor = "grab"));
  }

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

  // FAQ accordion
  const faqButtons = Array.from(document.querySelectorAll(".faq-q"));
  const setFaqOpen = (btn, open) => {
    const item = btn.closest(".faq-item");
    if (!item) return;
    const panel = item.querySelector(".faq-a");
    if (!panel) return;

    item.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    panel.setAttribute("aria-hidden", open ? "false" : "true");

    if (open) {
      panel.style.maxHeight = panel.scrollHeight + "px";
    } else {
      panel.style.maxHeight = "0px";
    }
  };

  for (const btn of faqButtons) {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      const isOpen = item ? item.classList.contains("is-open") : false;
      setFaqOpen(btn, !isOpen);
    });
  }

  window.addEventListener("resize", () => {
    for (const btn of faqButtons) {
      const item = btn.closest(".faq-item");
      if (!item || !item.classList.contains("is-open")) continue;
      const panel = item.querySelector(".faq-a");
      if (!panel) continue;
      panel.style.maxHeight = panel.scrollHeight + "px";
    }
  });

  // Always show the intro on refresh; user must click to enter.

})();
