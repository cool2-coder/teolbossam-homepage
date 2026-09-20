(() => {
  'use strict';

  /* Header scroll state */
  const header = document.getElementById('siteHeader');
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile nav toggle */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');

  const closeNav = () => {
    document.body.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
  };

  navToggle.addEventListener('click', () => {
    const isOpen = document.body.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });

  /* Scroll-reveal animations */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* Contact form (client-side validation, no backend wired yet) */
  const form = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let firstInvalid = null;
      form.querySelectorAll('[required]').forEach((field) => {
        const row = field.closest('.form-row');
        const isEmpty = !field.value || !field.value.trim();
        row.classList.toggle('field-invalid', isEmpty);
        if (isEmpty && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        formNote.textContent = '필수 항목을 모두 입력해주세요.';
        formNote.className = 'form-note error';
        firstInvalid.focus();
        return;
      }

      const data = new FormData(form);
      const typeLabel = {
        individual: '개인 수업 신청',
        institution: '기관 출강 문의',
        partnership: '협업 · 제휴 제안',
        etc: '기타',
      }[data.get('type')] || data.get('type');

      const subject = encodeURIComponent(`[털보쌤 문의] ${typeLabel} - ${data.get('name')}`);
      const body = encodeURIComponent(
        `이름: ${data.get('name')}\n` +
        `연락처: ${data.get('phone')}\n` +
        `이메일: ${data.get('email') || '-'}\n` +
        `문의 유형: ${typeLabel}\n\n` +
        `문의 내용:\n${data.get('message')}`
      );

      window.location.href = `mailto:hello@teolbossam.com?subject=${subject}&body=${body}`;

      formNote.textContent = '메일 앱이 열립니다. 전송 후 확인 연락을 드릴게요!';
      formNote.className = 'form-note success';
    });

    form.querySelectorAll('[required]').forEach((field) => {
      field.addEventListener('input', () => {
        if (field.value.trim()) {
          field.closest('.form-row').classList.remove('field-invalid');
        }
      });
    });
  }
})();
