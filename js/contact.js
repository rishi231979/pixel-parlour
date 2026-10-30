/* ==========================================================================
   Pixel Parlour — Contact form
   Progressive enhancement: without JS the form POSTs straight to Formspree.
   With JS we validate inline, submit with fetch() and show friendly states.
   Loaded only on contact.html (after config.js and main.js).
   ========================================================================== */

(function () {
  "use strict";

  var form = document.querySelector("[data-contact-form]");
  if (!form) return;

  var config = window.PIXEL_PARLOUR || {};
  var endpoint = (config.formspreeEndpoint || form.getAttribute("action") || "").trim();
  var isPlaceholder = !endpoint || endpoint.indexOf("YOUR_FORM_ID") !== -1;
  var fallbackEmail = config.email && config.email.indexOf("YOUR-DOMAIN") === -1 ? config.email : "";

  var submitBtn = form.querySelector("[type='submit']");
  var submitLabel = submitBtn ? submitBtn.querySelector("[data-submit-label]") : null;
  var summary = form.querySelector("[data-form-summary]");
  var status = form.querySelector("[data-form-status]");
  var successPanel = document.querySelector("[data-form-success]");

  if (isPlaceholder) {
    console.warn(
      "[Pixel Parlour] The contact form is not connected yet. " +
      "Set formspreeEndpoint in js/config.js to your Formspree URL " +
      "(e.g. https://formspree.io/f/abcdwxyz). Submissions are not being sent."
    );
  } else {
    form.setAttribute("action", endpoint);
  }

  // We handle validation ourselves (keeps messages friendly + accessible)
  form.setAttribute("novalidate", "");

  /* ------------------------------------------------------------------------
     Validation rules: return "" when valid, or an error message
     ------------------------------------------------------------------------ */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PHONE_RE = /^[+()\d\s.-]{6,}$/;

  var rules = {
    name: function (el) {
      return el.value.trim() ? "" : "Please tell us your name.";
    },
    email: function (el) {
      var v = el.value.trim();
      if (!v) return "Please enter your email address.";
      return EMAIL_RE.test(v) ? "" : "That email doesn't look quite right. Try something like name@example.com.";
    },
    phone: function (el) {
      var v = el.value.trim();
      return !v || PHONE_RE.test(v) ? "" : "Please enter a valid phone number, or leave it blank.";
    },
    message: function (el) {
      var v = el.value.trim();
      if (!v) return "Please tell us a little about your goals.";
      return v.length >= 10 ? "" : "Could you tell us a bit more? A sentence or two is perfect.";
    },
    consent: function (el) {
      return el.checked ? "" : "Please tick this box so we're allowed to reply to you.";
    }
  };

  var fields = Object.keys(rules)
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  function validateField(el) {
    var message = rules[el.id](el);
    var errorEl = document.getElementById(el.id + "-error");
    if (errorEl) errorEl.textContent = message;
    if (message) el.setAttribute("aria-invalid", "true");
    else el.removeAttribute("aria-invalid");
    return !message;
  }

  // Re-check a field live once it has been flagged, and on blur once filled in
  form.addEventListener("input", function (event) {
    var el = event.target;
    if (rules[el.id] && el.getAttribute("aria-invalid") === "true") validateField(el);
  });

  form.addEventListener("change", function (event) {
    var el = event.target;
    if (rules[el.id] && el.getAttribute("aria-invalid") === "true") validateField(el);
  });

  form.addEventListener("focusout", function (event) {
    var el = event.target;
    if (rules[el.id] && el.type !== "checkbox" && el.value.trim()) validateField(el);
  });

  /* ------------------------------------------------------------------------
     UI helpers
     ------------------------------------------------------------------------ */
  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    submitBtn.setAttribute("aria-busy", String(loading));
    if (submitLabel) submitLabel.textContent = loading ? "Sending…" : "Send my enquiry";
  }

  function emailLink() {
    var address = fallbackEmail || "hello@YOUR-DOMAIN.com";
    return '<a href="mailto:' + address + '">' + address + "</a>";
  }

  function showStatus(type, html) {
    status.className = "alert alert--" + type;
    status.innerHTML = html;
  }

  function clearMessages() {
    summary.textContent = "";
    status.className = "alert";
    status.innerHTML = "";
  }

  function showSuccess() {
    form.hidden = true;
    if (successPanel) {
      successPanel.hidden = false;
      var heading = successPanel.querySelector("h2");
      if (heading) heading.focus();
    }
  }

  /* ------------------------------------------------------------------------
     Submit
     ------------------------------------------------------------------------ */
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearMessages();

    // 1. Validate everything, focus the first problem
    var invalid = fields.filter(function (el) { return !validateField(el); });
    if (invalid.length) {
      summary.textContent = invalid.length === 1
        ? "Almost there! One field needs a quick look."
        : "Almost there! " + invalid.length + " fields need a quick look.";
      invalid[0].focus();
      return;
    }

    // 2. Honeypot filled in → almost certainly a bot. Pretend all is well.
    var honeypot = form.querySelector("[name='_gotcha']");
    if (honeypot && honeypot.value) {
      showSuccess();
      return;
    }

    // 3. Endpoint not configured yet → tell the visitor politely
    if (isPlaceholder) {
      showStatus(
        "info",
        "<p><strong>Thanks for reaching out!</strong> Our online form isn't switched on just yet, " +
        "so your message hasn't been sent.</p><p>Please email us at " + emailLink() +
        " and we'll get back to you within 1 business day.</p>"
      );
      return;
    }

    // 4. Send to Formspree
    setLoading(true);

    fetch(endpoint, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" }
    })
      .then(function (response) {
        if (response.ok) {
          form.reset();
          showSuccess();
          return null;
        }
        return response.json().then(function (data) {
          var detail = data && data.errors
            ? data.errors.map(function (e) { return e.message; }).join(" ")
            : "";
          throw new Error(detail || "Request failed with status " + response.status);
        });
      })
      .catch(function (error) {
        console.error("[Pixel Parlour] Form submission failed:", error);
        showStatus(
          "error",
          "<p><strong>Oops, something went wrong on our side.</strong> Your message wasn't sent.</p>" +
          "<p>Please try again in a moment, or email us directly at " + emailLink() + ".</p>"
        );
      })
      .then(function () {
        setLoading(false);
      });
  });
})();
