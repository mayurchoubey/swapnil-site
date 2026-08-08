/* ============================================================================
   Coach Swapnil — site behavior
   Single-page site: every nav target is an in-page anchor.
   Progressive enhancement only. Without JS the anchors still jump, the FAQ
   still opens (native <details>), the enquiry form still has a plain WhatsApp
   link beneath it, and reveal animations start from a visible state.
   ========================================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -- Navigation --------------------------------------------------------- */
  function initNav() {
    var nav = document.querySelector('.site-nav');
    if (!nav) return;

    var onScroll = function () {
      nav.setAttribute('data-scrolled', window.scrollY > 24 ? 'true' : 'false');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var toggle = nav.querySelector('.nav__toggle');
    var group = nav.querySelector('.nav__group');
    if (!toggle || !group) return;

    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      group.setAttribute('data-open', String(open));
    };

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Tapping an in-page link must close the drawer, or it stays open over the
    // section the visitor just jumped to.
    group.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (link) setOpen(false);
    });

    // Close on outside click, on Escape, and when the layout leaves mobile.
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', function (e) {
      if (e.matches) setOpen(false);
    });
  }

  /* -- Scroll spy -----------------------------------------------------------
     Marks the nav link for whichever section currently sits under the nav bar.
     Reuses aria-current="page", which the nav already styles with the ember
     underline. Read in a rAF so the scroll listener never forces layout. */
  function initScrollSpy() {
    var links = Array.prototype.slice.call(
      document.querySelectorAll('.nav__links a[href^="#"]')
    );
    var targets = links
      .map(function (a) {
        var id = a.getAttribute('href').slice(1);
        return { link: a, section: id && document.getElementById(id) };
      })
      .filter(function (t) { return t.section; });
    if (!targets.length) return;

    var current = null;
    var ticking = false;

    var update = function () {
      ticking = false;
      // The section whose top has most recently passed under the nav.
      var line = 140;
      var found = null;
      targets.forEach(function (t) {
        if (t.section.getBoundingClientRect().top <= line) found = t;
      });
      // Past the last section (footer), keep the final link lit.
      if (found === current) return;
      targets.forEach(function (t) {
        if (t === found) t.link.setAttribute('aria-current', 'page');
        else t.link.removeAttribute('aria-current');
      });
      current = found;
    };

    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  }

  /* -- Toasts (feedback/Toast.jsx) ---------------------------------------- */
  var toastRegion;
  function toast(title, message) {
    if (!toastRegion) {
      toastRegion = document.createElement('div');
      toastRegion.className = 'toast-region';
      toastRegion.setAttribute('role', 'status');
      toastRegion.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastRegion);
    }
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML =
      '<span class="toast__dot"></span>' +
      '<div><div class="toast__title"></div><div class="toast__msg"></div></div>' +
      '<button class="toast__close" type="button" aria-label="Dismiss">&#10005;</button>';
    el.querySelector('.toast__title').textContent = title;
    el.querySelector('.toast__msg').textContent = message;
    toastRegion.appendChild(el);

    var dismiss = function () {
      el.setAttribute('data-leaving', 'true');
      setTimeout(function () { el.remove(); }, 320);
    };
    el.querySelector('.toast__close').addEventListener('click', dismiss);
    setTimeout(dismiss, 5000);
  }

  /* -- WhatsApp enquiry ----------------------------------------------------
     WhatsApp is the real channel — there is no backend and no email address.
     Forms compose a prefilled message and hand off to wa.me rather than
     pretending to submit somewhere.
     ---------------------------------------------------------------------- */
  var WA_NUMBER = '919977221799';

  function waUrl(form) {
    var get = function (n) {
      var el = form.elements[n];
      return el && el.value ? el.value.trim() : '';
    };
    var name = get('name');
    var lines = ['Hi Swapnil, I’m ' + name + '.'];
    if (get('program')) lines.push('Interested in: ' + get('program'));
    if (get('days')) lines.push('Days per week: ' + get('days'));
    if (get('experience')) lines.push('Experience: ' + get('experience'));
    if (get('notes')) lines.push('', get('notes'));
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));
  }

  function openWhatsApp(form) {
    // Opened from a click handler, so this is not treated as a popup.
    var win = window.open(waUrl(form), '_blank', 'noopener');
    if (!win) window.location.href = waUrl(form);
  }

  /* -- Form validation ----------------------------------------------------- */
  function fieldError(input, message) {
    var slot = input.parentElement.querySelector('.field__error');
    if (slot) slot.textContent = message || '';
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function validate(form) {
    var ok = true;
    var required = form.querySelectorAll('[required]');
    required.forEach(function (input) {
      var value = input.value.trim();
      if (!value) {
        fieldError(input, 'Required');
        ok = false;
      } else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        fieldError(input, 'Enter a valid email');
        ok = false;
      } else {
        fieldError(input, '');
      }
    });
    if (!ok) {
      var firstBad = form.querySelector('[aria-invalid="true"]');
      if (firstBad) firstBad.focus();
    }
    return ok;
  }

  function initForms() {
    document.querySelectorAll('form[data-whatsapp]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validate(form)) return;
        openWhatsApp(form);
        toast('Opening WhatsApp', 'Your message is ready — press send in WhatsApp.');
      });
      // Clear the error as soon as the field is corrected.
      form.querySelectorAll('[required]').forEach(function (input) {
        input.addEventListener('input', function () {
          if (input.getAttribute('aria-invalid') === 'true') fieldError(input, '');
        });
      });
    });
  }

  /* -- Scroll reveal ------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    items.forEach(function (el) {
      // Stagger siblings that share a reveal group.
      var group = el.parentElement;
      if (group && group.hasAttribute('data-reveal-stagger')) {
        var index = Array.prototype.indexOf.call(group.children, el);
        el.style.setProperty('--reveal-delay', Math.min(index, 6) * 80 + 'ms');
      }
      io.observe(el);
    });
  }

  /* -- Stat count-up ------------------------------------------------------- */
  function initCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    var render = function (el, value) {
      el.textContent = (el.dataset.prefix || '') + value + (el.dataset.suffix || '');
    };

    if (reduced || !('IntersectionObserver' in window)) {
      counters.forEach(function (el) { render(el, Number(el.dataset.count)); });
      return;
    }

    counters.forEach(function (el) { render(el, 0); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        var target = Number(el.dataset.count);
        var duration = 1100;
        var start = null;
        var step = function (ts) {
          if (start === null) start = ts;
          var p = Math.min((ts - start) / duration, 1);
          // Matches --ease-liquid closely enough for a number ramp.
          var eased = 1 - Math.pow(1 - p, 3);
          render(el, Math.round(target * eased));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });

    counters.forEach(function (el) { io.observe(el); });
  }

  /* -- Footer year --------------------------------------------------------- */
  function initYear() {
    var year = String(new Date().getFullYear());
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = year;
    });
  }

  /* -- Boot ---------------------------------------------------------------- */
  function boot() {
    initNav();
    initScrollSpy();
    initForms();
    initReveal();
    initCounters();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
