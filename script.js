// 모바일 메뉴
const toggle = document.querySelector('.nav-toggle');
const menu = document.getElementById('nav-menu');
toggle.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});
menu.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', () => {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  })
);

// 스크롤 등장 애니메이션
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// 숫자 카운트업
const counters = document.querySelectorAll('[data-count]');
const countIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target = Number(el.dataset.count);
    const start = performance.now();
    const dur = 1400;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('ko-KR');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    countIO.unobserve(el);
  });
});
counters.forEach((el) => countIO.observe(el));

// 문의 폼: 기본은 메일 앱으로 연결 (백엔드/폼 서비스 연결 시 교체)
const CONTACT_EMAIL = 'hello@teolbossam.com';
const form = document.getElementById('contact-form');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const d = new FormData(form);
  const subject = `[${d.get('type')}] ${d.get('name')}님 문의`;
  const body = `이름: ${d.get('name')}\n연락처: ${d.get('reply')}\n유형: ${d.get('type')}\n\n${d.get('message')}`;
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  form.querySelector('.form-note').textContent = '메일 앱이 열렸어요. 전송 버튼을 눌러 마무리해주세요!';
});

document.getElementById('year').textContent = new Date().getFullYear();
