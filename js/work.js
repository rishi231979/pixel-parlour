/* ==========================================================================
   Pixel Parlour — Work page
   1. Category filter (toggle buttons with aria-pressed)
   2. Case-study modals (native <dialog>)
   Loaded only on work.html.
   ========================================================================== */

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var FADE_MS = 260; // keep in sync with --duration-base

  /* ------------------------------------------------------------------------
     1. Filter
     Markup: buttons [data-filter="all|social|seo|ads|branding"] inside
     [data-filter-bar]; cards are <li data-category="social seo">.
     ------------------------------------------------------------------------ */
  function initFilter() {
    var bar = document.querySelector("[data-filter-bar]");
    if (!bar) return;

    var buttons = Array.prototype.slice.call(bar.querySelectorAll("[data-filter]"));
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-category]"));
    var empty = document.querySelector("[data-filter-empty]");
    var status = document.querySelector("[data-filter-status]");
    var timer = null;

    var matches = function (item, filter) {
      return filter === "all" || item.getAttribute("data-category").split(/\s+/).indexOf(filter) !== -1;
    };

    var labelFor = function (filter) {
      var btn = bar.querySelector('[data-filter="' + filter + '"]');
      return btn ? btn.textContent.trim() : filter;
    };

    var render = function (filter) {
      var count = 0;

      items.forEach(function (item) {
        var show = matches(item, filter);
        item.hidden = !show;
        if (show) count++;

        // fade the newly shown cards back in
        if (show && !prefersReducedMotion.matches) {
          item.classList.add("is-fading");
          window.requestAnimationFrame(function () {
            window.requestAnimationFrame(function () {
              item.classList.remove("is-fading");
            });
          });
        } else {
          item.classList.remove("is-fading");
        }
      });

      if (empty) empty.hidden = count > 0;
      if (status) {
        status.textContent = count === 0
          ? "No projects in " + labelFor(filter) + " yet."
          : "Showing " + count + (count === 1 ? " project" : " projects") +
            (filter === "all" ? "." : " in " + labelFor(filter) + ".");
      }
    };

    var apply = function (filter) {
      buttons.forEach(function (btn) {
        btn.setAttribute("aria-pressed", String(btn.getAttribute("data-filter") === filter));
      });

      window.clearTimeout(timer);

      if (prefersReducedMotion.matches) {
        render(filter);
        return;
      }

      // fade out what's visible, then swap
      items.forEach(function (item) {
        if (!item.hidden) item.classList.add("is-fading");
      });
      timer = window.setTimeout(function () { render(filter); }, FADE_MS);
    };

    bar.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-filter]");
      if (btn && btn.getAttribute("aria-pressed") !== "true") {
        apply(btn.getAttribute("data-filter"));
      }
    });
  }

  /* ------------------------------------------------------------------------
     2. Dialogs
     Trigger: <a href="#case-a" data-dialog-open="case-a">; target: <dialog id="case-a">.
     The trigger is a real in-page link so that without JS (or without <dialog>
     support) it simply jumps to the case study, which CSS then shows inline.
     Closes on ESC (native), backdrop click and [data-dialog-close].
     Focus returns to the trigger on close.
     ------------------------------------------------------------------------ */
  function initDialogs() {
    var lastTrigger = null;

    document.querySelectorAll("[data-dialog-open]").forEach(function (trigger) {
      var dialog = document.getElementById(trigger.getAttribute("data-dialog-open"));
      if (!dialog || typeof dialog.showModal !== "function") return; // fall back to the link

      trigger.addEventListener("click", function (event) {
        event.preventDefault(); // open the modal instead of jumping to #case-x
        lastTrigger = trigger;
        dialog.showModal();
        dialog.scrollTop = 0;
      });
    });

    document.querySelectorAll("dialog.dialog").forEach(function (dialog) {
      // .dialog has no padding and .dialog__inner fills it, so a click whose
      // target is the <dialog> element itself landed on the backdrop.
      dialog.addEventListener("click", function (event) {
        if (event.target === dialog) dialog.close();
      });

      dialog.querySelectorAll("[data-dialog-close]").forEach(function (btn) {
        btn.addEventListener("click", function () { dialog.close(); });
      });

      dialog.addEventListener("close", function () {
        if (lastTrigger) {
          lastTrigger.focus();
          lastTrigger = null;
        }
      });
    });
  }

  var init = function () {
    initFilter();
    initDialogs();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
