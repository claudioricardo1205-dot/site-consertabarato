const WHATSAPP_NUMBER = "+5519997890663"; // número atualizado para CONSERTA BARATO (formato +55...) 

function wsLink(message){
  const text = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${text}`;
}

// Open WhatsApp from hero/headers
function init(){
  const heroWs = document.getElementById('heroWs');
  const whatsappTop = document.getElementById('whatsappTop');
  const contactWs = document.getElementById('contactWs');
  const floatWs = document.getElementById('floatWs');
  const quoteBtn = document.getElementById('quoteBtn');
  const quoteForm = document.getElementById('quoteForm');

  const openWs = (msg)=>{ window.open(wsLink(msg),'_blank','noopener'); };

  // attach click handlers with preventDefault to avoid accidental navigation
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

  // Menu toggle for mobile (accessible)
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  if(menuToggle && mainNav){
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.addEventListener('click', (e)=>{
      const open = mainNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      e.stopPropagation();
    });

    // Close menu when a nav link is clicked (mobile)
    mainNav.querySelectorAll('a').forEach(a=>{
      a.addEventListener('click', ()=>{
        if(mainNav.classList.contains('open')){
          mainNav.classList.remove('open');
          menuToggle.setAttribute('aria-expanded','false');
        }
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (ev)=>{
      if(mainNav.classList.contains('open')){
        const inside = mainNav.contains(ev.target) || menuToggle.contains(ev.target);
        if(!inside){
          mainNav.classList.remove('open');
          menuToggle.setAttribute('aria-expanded','false');
        }
      }
    });
  }

  // Vendas de celulares removidas: não carregar produtos

  // Filters
  document.querySelectorAll('.filter').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.filter').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      const applyFilter = (items)=>{
        const filtered = items.filter(p=>{
          if(f==='all') return true;
          if(f==='novo') return p.condition==='novo';
          if(f==='seminovo') return p.condition==='seminovo';
          return p.brand===f;
        });
        renderProducts(filtered);
      };
      if(productsCache && productsCache.length){
        applyFilter(productsCache);
      } else {
        fetch('data/products.json').then(r=>r.json()).then(data=> applyFilter(data.products)).catch(err=> console.warn('Erro no filtro:',err));
      }
    });
  });
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

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

/* --- Modern effects: smooth scroll, reveal on scroll, header shrink, parallax, ripple, testimonials carousel --- */

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
['.section', '.card', '.product', '.why-item', '.testimonial', '.hero-content', '.hero-visual'].forEach(sel=>{
  document.querySelectorAll(sel).forEach(el=> io.observe(el));
});

// Header shrink on scroll
const headerEl = document.querySelector('.site-header');
function handleHeader(){
  if(window.scrollY > 40) headerEl.classList.add('shrink'); else headerEl.classList.remove('shrink');
}
window.addEventListener('scroll', handleHeader);
handleHeader();

// Hero parallax on mouse move
const heroEl = document.querySelector('.hero');
const heroImg = document.querySelector('.hero-visual img');
if(heroEl && heroImg){
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

