/* ==========================================================================
   Pixel Parlour — Site behaviour
   Progressive enhancement only: every page works without this file.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  // Tells the inline <head> safety net that main.js loaded (see .no-reveal in base.css)
  window.PIXEL_PARLOUR_READY = true;

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ------------------------------------------------------------------------
     1. Fill business details from js/config.js
     ------------------------------------------------------------------------ */
  function applyConfig() {
    var config = window.PIXEL_PARLOUR;
    if (!config) return;

    var isSet = function (value) {
      return typeof value === "string" && value.trim() !== "" && value.trim() !== "#";
    };

    document.querySelectorAll("[data-config]").forEach(function (el) {
      var key = el.getAttribute("data-config");
      var value = config[key];
      if (!isSet(value)) return;

      // data-config-attr="href" means: only update the link, keep the visible text/icon
      var hrefOnly = el.getAttribute("data-config-attr") === "href";

      switch (key) {
        case "email":
          if (el.tagName === "A") el.href = "mailto:" + value;
          if (!hrefOnly) el.textContent = value;
          break;
        case "phone":
          if (el.tagName === "A") el.href = "tel:" + value.replace(/[^\d+]/g, "");
          if (!hrefOnly) el.textContent = value;
          break;
        case "whatsapp":
          if (el.tagName === "A") el.href = "https://wa.me/" + value.replace(/\D/g, "");
          break;
        case "instagram":
        case "linkedin":
        case "facebook":
        case "x":
          if (el.tagName === "A") el.href = value;
          break;
        case "formspreeEndpoint":
          if (el.tagName === "FORM") el.action = value;
          break;
        default:
          if (!hrefOnly) el.textContent = value;
      }
    });

    // Reveal optional items (e.g. WhatsApp) only once their value is configured
    document.querySelectorAll("[data-config-show]").forEach(function (el) {
      if (isSet(config[el.getAttribute("data-config-show")])) el.hidden = false;
    });
  }

  /* ------------------------------------------------------------------------
     2. Footer year
     ------------------------------------------------------------------------ */
  function setYear() {
    var year = String(new Date().getFullYear());
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = year;
    });
  }

  /* ------------------------------------------------------------------------
     3. Scroll-driven UI: sticky header shadow + "Back to top" button
     One passive listener, throttled to one update per animation frame.
     ------------------------------------------------------------------------ */
  function initScrollUI() {
    var header = document.querySelector(".site-header");
    var backToTop = document.querySelector(".back-to-top");
    if (!header && !backToTop) return;

    var ticking = false;
    var update = function () {
      var y = window.scrollY;
      if (header) header.classList.toggle("is-scrolled", y > 8);
      if (backToTop) backToTop.classList.toggle("is-visible", y > window.innerHeight * 0.9);
      ticking = false;
    };

    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  }

  /* ------------------------------------------------------------------------
     4. Mobile navigation
     ------------------------------------------------------------------------ */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById(toggle ? toggle.getAttribute("aria-controls") : "");
    if (!toggle || !nav) return;

    var mobileQuery = window.matchMedia("(max-width: 859.98px)");

    // A closed mobile menu is "inert": instantly out of the Tab order and hidden from
    // screen readers (CSS visibility only kicks in after the fade-out finishes)
    var syncInert = function () {
      nav.inert = mobileQuery.matches && toggle.getAttribute("aria-expanded") !== "true";
    };

    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("is-open", open);
      syncInert();
    };

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    // ESC closes the menu and returns focus to the toggle
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    // Close after choosing a link (handles same-page anchors)
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a") && mobileQuery.matches) setOpen(false);
    });

    // Close when keyboard focus leaves the header (e.g. Tab past the last link),
    // so focus never lands on page content hidden behind the open panel
    var header = toggle.closest(".site-header");
    if (header) {
      header.addEventListener("focusout", function (event) {
        var next = event.relatedTarget;
        if (toggle.getAttribute("aria-expanded") === "true" && next && !header.contains(next)) {
          setOpen(false);
        }
      });
    }

    // Close when clicking outside the header
    document.addEventListener("click", function (event) {
      if (toggle.getAttribute("aria-expanded") === "true" && !event.target.closest(".site-header")) {
        setOpen(false);
      }
    });

    // Reset when resizing up to desktop
    var onChange = function (event) {
      if (!event.matches) setOpen(false);
      syncInert();
    };
    if (mobileQuery.addEventListener) mobileQuery.addEventListener("change", onChange);
    else if (mobileQuery.addListener) mobileQuery.addListener(onChange);
    syncInert();
  }

  /* ------------------------------------------------------------------------
     5. Scroll reveal
     ------------------------------------------------------------------------ */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ------------------------------------------------------------------------
     6. Count-up numbers
     Markup: <span data-count="150" data-suffix="+" data-decimals="0">150+</span>
     The static text is the no-JS / reduced-motion fallback.
     ------------------------------------------------------------------------ */
  function initCountUp() {
    var counters = document.querySelectorAll("[data-count]");
    if (!counters.length || prefersReducedMotion.matches || !("IntersectionObserver" in window)) return;

    var format = function (el, value) {
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var prefix = el.getAttribute("data-prefix") || "";
      var suffix = el.getAttribute("data-suffix") || "";
      return prefix + value.toFixed(decimals) + suffix;
    };

    var animate = function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      if (isNaN(target)) return;
      var duration = 1600;
      var start = null;

      var step = function (timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        el.textContent = format(el, target * eased);
        if (progress < 1) window.requestAnimationFrame(step);
      };

      window.requestAnimationFrame(step);
    };

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });

    counters.forEach(function (el) {
      el.textContent = format(el, 0);
      observer.observe(el);
    });
  }

  /* ------------------------------------------------------------------------
     7. Carousel controls (scroll-snap track + prev/next buttons)
     ------------------------------------------------------------------------ */
  function initCarousels() {
    document.querySelectorAll("[data-carousel]").forEach(function (carousel) {
      var track = carousel.querySelector(".carousel__track");
      var prev = carousel.querySelector("[data-carousel-prev]");
      var next = carousel.querySelector("[data-carousel-next]");
      if (!track || !prev || !next) return;

      var slides = Array.prototype.slice.call(track.querySelectorAll(".carousel__slide"));
      var settleTimer = null;

      var behavior = function () {
        return prefersReducedMotion.matches ? "auto" : "smooth";
      };

      var maxScroll = function () {
        return track.scrollWidth - track.clientWidth;
      };

      // Where each slide snaps to (clamped to what the track can actually scroll)
      var snapPositions = function () {
        var pad = parseFloat(window.getComputedStyle(track).scrollPaddingLeft) || 0;
        var trackLeft = track.getBoundingClientRect().left;
        var max = maxScroll();
        var positions = slides.map(function (slide) {
          var x = slide.getBoundingClientRect().left - trackLeft + track.scrollLeft - pad;
          return Math.round(Math.min(max, Math.max(0, x)));
        });
        return positions.filter(function (x, i) { return positions.indexOf(x) === i; });
      };

      // Disable a button when there's no further slide in that direction
      var updateButtons = function () {
        var current = track.scrollLeft;
        var positions = snapPositions();
        prev.disabled = !positions.some(function (x) { return x < current - 2; });
        next.disabled = !positions.some(function (x) { return x > current + 2; });
      };

      /* Scroll to the next/previous slide.
         WHY snapping is paused: Chrome cancels a smooth programmatic scroll on a
         "mandatory" snap track when the next snap point lies beyond the end of the
         track (common on wide screens), snapping straight back to the first slide.
         We turn snapping off while the button-driven scroll runs, then restore it.
         Swiping and trackpad scrolling keep native snapping throughout. */
      var go = function (direction) {
        var current = track.scrollLeft;
        var positions = snapPositions();
        var target = direction > 0
          ? positions.filter(function (x) { return x > current + 2; })[0]
          : positions.filter(function (x) { return x < current - 2; }).pop();
        if (target === undefined) return;

        track.classList.add("is-scrolling");
        track.scrollTo({ left: target, behavior: behavior() });

        var settle = function () {
          window.clearTimeout(settleTimer);
          track.removeEventListener("scrollend", settle);
          track.classList.remove("is-scrolling");
          updateButtons();
        };
        window.clearTimeout(settleTimer);
        // Restore snapping when the scroll really ends; browsers without "scrollend"
        // (older Safari) use a timer. The long timer is a safety net either way.
        var hasScrollEnd = "onscrollend" in window;
        if (hasScrollEnd) track.addEventListener("scrollend", settle);
        settleTimer = window.setTimeout(settle, hasScrollEnd ? 2000 : 900);
      };

      prev.addEventListener("click", function () { go(-1); });
      next.addEventListener("click", function () { go(1); });

      // Arrow keys when the track itself has focus
      track.addEventListener("keydown", function (event) {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          go(1);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          go(-1);
        }
      });

      var raf = null;
      track.addEventListener("scroll", function () {
        if (raf) return;
        raf = window.requestAnimationFrame(function () {
          updateButtons();
          raf = null;
        });
      }, { passive: true });

      window.addEventListener("resize", updateButtons);
      updateButtons();
    });
  }

  /* ------------------------------------------------------------------------
     8. Smooth anchor scrolling, enabled only once the page has loaded
     (see the note in base.css: enabling it earlier breaks cross-page #links)
     ------------------------------------------------------------------------ */
  function enableSmoothScroll() {
    var enable = function () {
      window.requestAnimationFrame(function () { root.classList.add("smooth-scroll"); });
    };
    if (document.readyState === "complete") enable();
    else window.addEventListener("load", enable, { once: true });
  }

  /* ------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */
  var init = function () {
    applyConfig();
    setYear();
    initScrollUI();
    initNav();
    initReveal();
    initCountUp();
    initCarousels();
    enableSmoothScroll();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
