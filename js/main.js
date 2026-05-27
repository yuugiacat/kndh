// ============================================
// DẠY EM — MAIN JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  // --- Hero Particles ---
  const particlesContainer = document.querySelector('.hero-particles');
  if (particlesContainer) {
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDuration = (Math.random() * 8 + 6) + 's';
      p.style.animationDelay = (Math.random() * 10) + 's';
      p.style.width = p.style.height = (Math.random() * 4 + 2) + 'px';
      p.style.opacity = Math.random() * 0.5 + 0.1;
      particlesContainer.appendChild(p);
    }
  }

  // --- Counter Animation ---
  const counters = document.querySelectorAll('.counter');
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      const duration = 1800;
      const start = performance.now();
      const easeOut = t => 1 - Math.pow(1 - t, 3);
      const tick = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        el.textContent = Math.round(easeOut(progress) * target);
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = target;
      };
      requestAnimationFrame(tick);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => countObserver.observe(c));

  // --- Fade-in on Scroll ---
  const fadeEls = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right');
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  fadeEls.forEach(el => fadeObserver.observe(el));

  // --- Donation Amount Buttons ---
  const amountBtns = document.querySelectorAll('.amount-btn');
  amountBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      amountBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // --- Progress Bar Animation ---
  const progressFills = document.querySelectorAll('.progress-bar-fill');
  const progressObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.style.width = el.dataset.width || '0%';
        progressObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  progressFills.forEach(el => {
    const target = el.dataset.width || '0%';
    el.style.width = '0%';
    progressObserver.observe(el);
  });

  // --- Phase accordion ---
  const phaseHeaders = document.querySelectorAll('.phase-header');
  phaseHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const card = header.closest('.phase-card');
      const body = card.querySelector('.phase-body');
      const isOpen = card.classList.contains('expanded');
      // close all
      document.querySelectorAll('.phase-card.expanded').forEach(c => {
        c.classList.remove('expanded');
        c.querySelector('.phase-body').style.display = 'none';
      });
      if (!isOpen) {
        card.classList.add('expanded');
        body.style.display = 'block';
      }
    });
  });

  // Open first expanded by default
  const firstActive = document.querySelector('.phase-card.active, .phase-card.completed:last-of-type');
  if (firstActive) {
    firstActive.classList.add('expanded');
    const body = firstActive.querySelector('.phase-body');
    if (body) body.style.display = 'block';
  }

  // Hide all other phase bodies initially
  document.querySelectorAll('.phase-body').forEach(body => {
    const card = body.closest('.phase-card');
    if (!card || !card.classList.contains('expanded')) {
      body.style.display = 'none';
    }
  });

  // --- Panel Image Sliders ---
  document.querySelectorAll('.ps-slider').forEach(slider => {
    const slides = slider.querySelectorAll('.ps-slide');
    const dots   = slider.querySelectorAll('.ps-dot');
    let current  = 0;

    function goTo(index) {
      slides[current].classList.remove('active');
      dots[current]?.classList.remove('active');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current]?.classList.add('active');
    }

    slider.querySelector('.ps-prev')?.addEventListener('click', () => goTo(current - 1));
    slider.querySelector('.ps-next')?.addEventListener('click', () => goTo(current + 1));
    dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));
  });

});
