const WHATSAPP_NUMBER = "+5519997890663";

function wsLink(message){
  const text = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${text}`;
}

function init(){
  const heroWs = document.getElementById('heroWs');
  const whatsappTop = document.getElementById('whatsappTop');
  const contactWs = document.getElementById('contactWs');
  const floatWs = document.getElementById('floatWs');
  const quoteBtn = document.getElementById('quoteBtn');
  const quoteForm = document.getElementById('quoteForm');

  const openWs = (msg)=>{ window.open(wsLink(msg),'_blank','noopener'); };

  heroWs && heroWs.addEventListener('click', (e)=>{ e.preventDefault(); openWs('Olá\nGostaria de mais informações sobre serviços'); });
  whatsappTop && whatsappTop.addEventListener('click', (e)=>{ e.preventDefault(); openWs('Olá\nTenho interesse'); });
  contactWs && contactWs.addEventListener('click', (e)=>{ e.preventDefault(); openWs('Olá\nGostaria de falar com a CONSERTA BARATO'); });
  floatWs && floatWs.addEventListener('click', (e)=>{ e.preventDefault(); openWs('Olá\nGostaria de falar com a CONSERTA BARATO e solicitar mais informações'); });
  quoteBtn && quoteBtn.addEventListener('click', (e)=>{ e.preventDefault(); openWs('Olá\nGostaria de solicitar um orçamento'); });

  quoteForm && quoteForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(quoteForm);
    const msg = `Olá\nGostaria de solicitar um orçamento\nNome: ${fd.get('name')}\nWhatsApp: ${fd.get('phone')}\nMarca: ${fd.get('brand')}\nModelo: ${fd.get('model')}\nProblema: ${fd.get('issue')}\nDescrição: ${fd.get('description')}`;
    openWs(msg);
  });

  const reviewForm = document.getElementById('reviewForm');
  reviewForm && reviewForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(reviewForm);
    const ratingStars = '⭐'.repeat(parseInt(fd.get('rating')||'5',10));
    const msg = `Olá\nGostaria de deixar uma avaliação\nNome: ${fd.get('name')}\nAvaliação: ${ratingStars}\nComentário: ${fd.get('comment')}`;
    openWs(msg);
  });

  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  if(menuToggle && mainNav){
    menuToggle.setAttribute('aria-expanded', 'false');
    const isMobile = () => window.matchMedia('(max-width:900px)').matches;
    let overlay = null;
    if(isMobile()){
      overlay = document.createElement('div');
      overlay.className = 'main-nav-overlay';
      document.body.appendChild(overlay);
    }

    const openMenu = ()=>{
      mainNav.classList.add('open');
      if(overlay) overlay.classList.add('open');
      menuToggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };
    const closeMenu = ()=>{
      mainNav.classList.remove('open');
      if(overlay) overlay.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    menuToggle.addEventListener('click', (e)=>{
      e.stopPropagation();
      const isOpen = mainNav.classList.contains('open');
      isOpen ? closeMenu() : openMenu();
    });

    mainNav.querySelectorAll('a').forEach(a=>{
      a.addEventListener('click', ()=>{
        if(mainNav.classList.contains('open')) closeMenu();
      });
    });

    if(overlay){
      overlay.addEventListener('click', closeMenu);
    }

    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape' && mainNav.classList.contains('open')) closeMenu();
    });
  }

  // Filters
  document.querySelectorAll('.filter').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.filter').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

setTimeout(()=>{
  document.querySelectorAll('.reveal').forEach(el=>{
    if(!el.classList.contains('show')) el.classList.add('show');
  });
}, 1500);

function renderProducts(items){
  // Função removida: vendas de celulares desativadas
}

function renderFeatured(items){
  // Função removida: vendas de celulares desativadas
}

function renderServices(items){
  const cont = document.querySelector('#services .cards');
  if(!cont) return;
  cont.innerHTML = items.map(s=> `<article class="card"><h4>${s.name}</h4><p>${s.description||''}</p></article>`).join('');
}

function expressInterest(name){
  const msg = `Olá! Tenho interesse no celular ${name}. Gostaria de mais informações.`;
  window.open(wsLink(msg),'_blank');
}

// Smooth scrolling for internal links
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', (e)=>{
    const href = a.getAttribute('href');
    if(href && href.startsWith('#')){
      const target = document.querySelector(href);
      if(target){
        e.preventDefault();
        target.scrollIntoView({behavior:'smooth', block:'start'});
      }
    }
  });
});

// Scroll reveal using IntersectionObserver
const io = new IntersectionObserver((entries, obs)=>{
  entries.forEach(en=>{
    if(en.isIntersecting){ en.target.classList.add('show'); obs.unobserve(en.target); }
  });
},{threshold:0.12});

// Add reveal class to common elements
['.section', '.card', '.product', '.why-item', '.testimonial', '.hero-content', '.hero-visual', '.sales-banner', '.brand-list', '.testimonial-form'].forEach(sel=>{
  document.querySelectorAll(sel).forEach(el=> io.observe(el));
});

// Fallback: ensure reveal elements become visible if IntersectionObserver fails
setTimeout(()=>{
  document.querySelectorAll('.reveal').forEach(el=>{
    if(!el.classList.contains('show')) el.classList.add('show');
  });
}, 1500);

// Header shrink on scroll
const headerEl = document.querySelector('.site-header');
function handleHeader(){
  if(window.scrollY > 40) headerEl.classList.add('shrink'); else headerEl.classList.remove('shrink');
}
window.addEventListener('scroll', handleHeader);
handleHeader();

// Hero parallax only on non-touch devices
const heroEl = document.querySelector('.hero');
const heroImg = document.querySelector('.hero-visual img');
if(heroEl && heroImg && !('ontouchstart' in window)){
  heroEl.addEventListener('mousemove', (ev)=>{
    const r = heroEl.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width - 0.5;
    const y = (ev.clientY - r.top) / r.height - 0.5;
    heroImg.style.transform = `translate(${x*8}px, ${y*6}px) scale(1.02)`;
  });
  heroEl.addEventListener('mouseleave', ()=> heroImg.style.transform = 'translate(0,0) scale(1)');
}

// Button ripple effect
document.querySelectorAll('.btn').forEach(btn=>{
  btn.addEventListener('click', (e)=>{
    const rect = btn.getBoundingClientRect();
    const circle = document.createElement('span');
    circle.className = 'ripple';
    const size = Math.max(rect.width, rect.height);
    circle.style.width = circle.style.height = size + 'px';
    circle.style.left = (e.clientX - rect.left - size/2) + 'px';
    circle.style.top = (e.clientY - rect.top - size/2) + 'px';
    btn.appendChild(circle);
    setTimeout(()=> circle.remove(), 600);
  });
});

// Testimonials simple carousel
const testimonials = document.querySelectorAll('.testimonials .testimonial');
if(testimonials.length > 0){
  let ti = 0;
  testimonials.forEach((t,i)=> i===0 ? t.classList.add('active') : t.classList.remove('active'));
  setInterval(()=>{
    testimonials[ti].classList.remove('active');
    ti = (ti+1) % testimonials.length;
    testimonials[ti].classList.add('active');
  }, 5000);
}
