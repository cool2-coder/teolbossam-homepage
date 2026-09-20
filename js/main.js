(() => {
  'use strict';

  /* Brand asset slots — see assets/brand/README.md.
     Each slot holds an <img data-brand-asset> attempt plus a text
     fallback that's already in the DOM. If the real BI file loads,
     we reveal the image and hide the fallback; if it 404s, we just
     remove the broken <img> and the fallback (never a fake logo)
     is what was already there. */
  document.querySelectorAll('[data-brand-asset]').forEach((img) => {
    const markLoaded = () => img.closest('[data-brand-slot]')?.classList.add('is-loaded');
    const markMissing = () => img.remove();

    img.addEventListener('load', markLoaded);
    img.addEventListener('error', markMissing);

    // The <img> may have already finished loading (or failing) before this
    // script ran, since the browser starts fetching it as soon as the HTML
    // parser sees the tag — well before this deferred script executes.
    if (img.complete) {
      if (img.naturalWidth > 0) markLoaded();
      else markMissing();
    }
  });

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

  /* Contact form (client-side validation, no backend wired yet).
   *
   * SWAP POINT for a future Formspree / server API integration:
   * everything the email body needs is declared once below (FIELD_LABELS
   * and the *_LABELS option maps), so replacing the mailto redirect with
   * a fetch(...) call only touches the block marked below — the rest of
   * the handler (validation, field reading) can stay as-is.
   */
  const form = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');

  const FIELD_LABELS = [
    ['name', '담당자명'],
    ['organization', '기관명'],
    ['phone', '연락처'],
    ['email', '이메일'],
    ['type', '문의 유형'],
    ['audience', '참여 대상'],
    ['headcount', '예상 인원'],
    ['region', '희망 지역'],
    ['date', '희망 날짜'],
    ['program', '관심 프로그램'],
    ['message', '문의 내용'],
  ];
  const TYPE_LABELS = {
    individual: '개인 수업 신청',
    institution: '기관 출강 문의',
    partnership: '협업 · 제휴 제안',
    etc: '기타',
  };
  const AUDIENCE_LABELS = {
    toddler: '유아 (4~7세)',
    lower: '초등 저학년 (1~3학년)',
    upper: '초등 고학년 (4~6학년)',
    group: '기관 단체',
    family: '가족 프로그램',
    etc: '기타',
  };
  const PROGRAM_LABELS = {
    forest: '숲 탐험대',
    insect: '곤충 탐험대',
    eco: '환경특공대',
    lab: '자연 탐구교실',
    undecided: '아직 미정이에요',
    etc: '기타',
  };
  const OPTION_LABELS = { type: TYPE_LABELS, audience: AUDIENCE_LABELS, program: PROGRAM_LABELS };

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
      const readableValue = (fieldName) => {
        const raw = data.get(fieldName);
        if (!raw) return null;
        const map = OPTION_LABELS[fieldName];
        return map ? (map[raw] || raw) : raw;
      };

      const typeLabel = readableValue('type');
      const subject = encodeURIComponent(`[털보쌤 문의] ${typeLabel} - ${data.get('name')}`);
      const bodyLines = FIELD_LABELS
        .map(([fieldName, label]) => [label, readableValue(fieldName)])
        .filter(([, value]) => value)
        .map(([label, value]) => `${label}: ${value}`);

      const body = encodeURIComponent(bodyLines.join('\n'));

      /* --- mailto swap point: replace this line with a fetch() call when a backend is ready --- */
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
