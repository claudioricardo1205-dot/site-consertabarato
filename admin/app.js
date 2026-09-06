import firebaseConfig from '../firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut, getIdTokenResult, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// UI helpers
function $(sel){ return document.querySelector(sel); }
function $all(sel){ return Array.from(document.querySelectorAll(sel)); }

async function requireAdmin(){
  return new Promise((res,rej)=>{
    onAuthStateChanged(auth, async user=>{
      if(!user) return window.location.href = '../login.html';
      try{
        const token = await getIdTokenResult(user);
        if(token.claims && token.claims.admin){ res(user); }
        else { alert('Acesso negado: usuário não é administrador'); await signOut(auth); window.location.href='../login.html'; }
      }catch(err){ console.error(err); window.location.href='../login.html'; }
    });
  });
}

// Logout buttons
$all('#logoutBtn, #logoutBtn2, #logoutBtn3').forEach(btn => btn && btn.addEventListener('click', async ()=>{ await signOut(auth); window.location.href='../login.html'; }));

// Modal helpers
function openModal(id){ const m = $(id); if(m){ m.classList.add('open'); m.setAttribute('aria-hidden','false'); }}
function closeModal(id){ const m = $(id); if(m){ m.classList.remove('open'); m.setAttribute('aria-hidden','true'); }}

// Dashboard page logic
if(location.pathname.endsWith('/admin/index.html') || location.pathname.endsWith('/admin/') ){
  (async ()=>{
    await requireAdmin();
    // load stats
    const productsSnap = await getDocs(collection(db,'products'));
    const servicesSnap = await getDocs(collection(db,'services'));
    const totalProducts = productsSnap.size;
    const sold = productsSnap.docs.filter(d=> d.data().status === 'vendido').length;
    const available = productsSnap.docs.filter(d=> d.data().status === 'available').length;
    const stats = $('#stats');
    stats.innerHTML = `
      <div class="card"><h4>${totalProducts}</h4><div class="small">produtos cadastrados</div></div>
      <div class="card"><h4>${available}</h4><div class="small">disponíveis</div></div>
      <div class="card"><h4>${sold}</h4><div class="small">vendidos</div></div>
      <div class="card"><h4>${servicesSnap.size}</h4><div class="small">serviços cadastrados</div></div>
    `;

    // latest products
    const q = query(collection(db,'products'), orderBy('createdAt','desc'), limit(6));
    const latestSnap = await getDocs(q);
    const latest = $('#latest');
    latest.innerHTML = latestSnap.docs.map(d=>{
      const p = d.data();
      return `<div class="product-row"><img src="${p.photoMain||'../images/products/1-iPhone-12.svg'}"><div><strong>${p.name}</strong><div class="small">${p.brand} • ${p.model}</div></div><div style="margin-left:auto; text-align:right">R$ ${p.price||''}<div class="small">${p.status||''}</div></div></div>`;
    }).join('');
  })();
}

// Produtos page logic
if(location.pathname.endsWith('/admin/produtos.html')){
  (async ()=>{
    await requireAdmin();
    const listEl = $('#productsList');
    const modal = $('#productModal');
    const addBtn = $('#addProductBtn');
    const closeModalBtn = $('#closeModal');
    const cancelBtn = $('#cancelProductBtn');
    const saveBtn = $('#saveProductBtn');
    const form = $('#productForm');

    async function loadProducts(){
      const snap = await getDocs(collection(db,'products'));
      const html = snap.docs.map(d=>{
        const p = d.data();
        return `<div class="product-row"><img src="${p.photoMain||'../images/products/1-iPhone-12.svg'}"><div><strong>${p.name}</strong><div class="small">${p.brand} • ${p.model}</div></div><div style="margin-left:auto;text-align:right"><div>${p.price||''}</div><div class="small">${p.status||''}</div><div style="margin-top:0.6rem"><button class="btn btn-outline edit-btn" data-id="${d.id}">Editar</button> <button class="btn btn-outline delete-btn" data-id="${d.id}">Excluir</button></div></div></div>`;
      }).join('');
      listEl.innerHTML = html;
      $all('.edit-btn').forEach(b=> b.addEventListener('click', ()=> openEdit(b.dataset.id)));
      $all('.delete-btn').forEach(b=> b.addEventListener('click', ()=> delProduct(b.dataset.id)));
    }

    addBtn.addEventListener('click', ()=>{ form.reset(); $('#modalTitle').textContent='Novo produto'; openModal('#productModal'); });
    closeModalBtn.addEventListener('click', ()=> closeModal('#productModal'));
    cancelBtn.addEventListener('click', ()=> closeModal('#productModal'));

    async function openEdit(id){
      const d = await getDoc(doc(db,'products',id));
      if(!d.exists()) return alert('Produto não encontrado');
      const p = d.data();
      $('#p_name').value = p.name||''; $('#p_brand').value = p.brand||''; $('#p_model').value = p.model||''; $('#p_storage').value = p.storage||''; $('#p_ram').value = p.ram||''; $('#p_color').value = p.color||''; $('#p_category').value = p.category||'novo'; $('#p_price').value = p.price||''; $('#p_price_promo').value = p.pricePromo||''; $('#p_status').value = p.status||'available'; $('#p_description').value = p.description||'';
      $('#saveProductBtn').dataset.editId = id;
      $('#modalTitle').textContent='Editar produto';
      openModal('#productModal');
    }

    async function delProduct(id){
      if(!confirm('Tem certeza que deseja excluir este produto?')) return;
      try{ await deleteDoc(doc(db,'products',id)); alert('Produto excluído'); loadProducts(); }catch(err){ alert('Erro: '+err.message) }
    }

    saveBtn.addEventListener('click', async (e)=>{
      e.preventDefault();
      saveBtn.disabled = true;
      const editId = saveBtn.dataset.editId;
      data = {
        name: $('#p_name').value,
        brand: $('#p_brand').value,
        model: $('#p_model').value,
        storage: $('#p_storage').value,
        ram: $('#p_ram').value,
        color: $('#p_color').value,
        category: $('#p_category').value,
        price: Number($('#p_price').value),
        pricePromo: Number($('#p_price_promo').value) || null,
        status: $('#p_status').value,
        description: $('#p_description').value,
        photoMain: $('#p_photo_url').value || ''
      };
      try{
        if(!data.name || data.name.trim().length < 2){ throw new Error('O campo Nome é obrigatório (mínimo 2 caracteres).'); }
        if(!data.price || isNaN(Number(data.price))){ throw new Error('Preço inválido.'); }

        if(editId){
          data.updatedAt = serverTimestamp();
          await updateDoc(doc(db,'products',editId), data);
        } else {
          data.createdAt = serverTimestamp();
          await addDoc(collection(db,'products'), data);
        }
        closeModal('#productModal');
        saveBtn.dataset.editId = '';
        loadProducts();
      }catch(err){
        console.error('Save product error', err);
        alert('Erro ao salvar produto: ' + (err.message || err));
      }finally{
        saveBtn.disabled = false;
      }
    });

    await loadProducts();
  })();
}

// Services page logic
if(location.pathname.endsWith('/admin/servicos.html')){
  (async ()=>{
    await requireAdmin();
    const listEl = $('#servicesList');
    const addBtn = $('#addServiceBtn');
    const saveBtn = $('#saveServiceBtn');
    const closeBtn = $('#closeServiceModal');
    const cancelBtn = $('#cancelServiceBtn');

    async function loadServices(){
      const snap = await getDocs(collection(db,'services'));
      listEl.innerHTML = snap.docs.map(d=>{
        const s = d.data();
        return `<div class="service-row"><img src="${s.image||'../images/logo_clean_opt.png'}"><div><strong>${s.name}</strong><div class="small">${s.description||''}</div></div><div style="margin-left:auto"><button class="btn btn-outline edit-service" data-id="${d.id}">Editar</button> <button class="btn btn-outline del-service" data-id="${d.id}">Excluir</button></div></div>`;
      }).join('');
      $all('.edit-service').forEach(b=>b.addEventListener('click', ()=> openEditService(b.dataset.id)));
      $all('.del-service').forEach(b=>b.addEventListener('click', ()=> delService(b.dataset.id)));
    }

    addBtn.addEventListener('click', ()=>{ $('#serviceForm').reset(); $('#serviceModalTitle').textContent='Novo serviço'; openModal('#serviceModal'); });
    closeBtn.addEventListener('click', ()=> closeModal('#serviceModal'));
    cancelBtn.addEventListener('click', ()=> closeModal('#serviceModal'));

    async function openEditService(id){
      const d = await getDoc(doc(db,'services',id));
      if(!d.exists()) return alert('Serviço não encontrado');
      const s = d.data();
      $('#s_name').value = s.name||''; $('#s_description').value = s.description||''; $('#s_status').value = s.status||'ativo';
      $('#saveServiceBtn').dataset.editId = id;
      $('#serviceModalTitle').textContent='Editar serviço';
      openModal('#serviceModal');
    }

    async function delService(id){ if(!confirm('Tem certeza que deseja excluir este serviço?')) return; await deleteDoc(doc(db,'services',id)); loadServices(); }

    saveBtn.addEventListener('click', async (e)=>{
      e.preventDefault(); saveBtn.disabled=true;
      const editId = saveBtn.dataset.editId;
      const data = { name: $('#s_name').value, description: $('#s_description').value, status: $('#s_status').value, image: $('#s_image_url').value || '' };
      try{
        if(!data.name || data.name.trim().length < 2) throw new Error('Nome do serviço é obrigatório');
        if(!data.description || data.description.trim().length < 2) throw new Error('Descrição do serviço é obrigatória');
        if(editId){ data.updatedAt = serverTimestamp(); await updateDoc(doc(db,'services',editId), data); }
        else { await addDoc(collection(db,'services'), {...data, createdAt: serverTimestamp()}); }
        closeModal('#serviceModal'); loadServices();
      }catch(err){
        console.error('Save service error', err);
        alert('Erro ao salvar serviço: ' + (err.message || err));
      }finally{ saveBtn.disabled=false; }
    });

    await loadServices();
  })();
}
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const userArea = document.getElementById('userArea');
const adminNav = document.getElementById('adminNav');

loginForm && loginForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email = document.getElementById('email').value;
  const pw = document.getElementById('password').value;
  try{
    await signInWithEmailAndPassword(auth, email, pw);
  }catch(err){
    alert('Erro login: '+err.message);
  }
});

logoutBtn && logoutBtn.addEventListener('click', ()=> signOut(auth));

onAuthStateChanged(auth, user=>{
  const loginSectionEl = document.getElementById('loginSection');
  const adminNavEl = document.getElementById('adminNav') || adminNav;
  const logoutBtnEl = document.getElementById('logoutBtn') || logoutBtn;
  try{
    if(user){
      // show dashboard if elements exist
      if(loginSectionEl) loginSectionEl.style.display = 'none';
      if(adminNavEl) adminNavEl.style.display = 'block';
      if(logoutBtnEl) logoutBtnEl.style.display = 'inline-block';
      if(userArea) userArea.innerHTML = `<div>Logado como ${user.email}</div>`;
      // Only call showView if the corresponding element exists on this page
      if(document.getElementById('viewProducts')){
        showView('products');
      }
      bindNav();
      startListeners();
    } else {
      if(loginSectionEl) loginSectionEl.style.display = 'block';
      if(adminNavEl) adminNavEl.style.display = 'none';
      if(logoutBtnEl) logoutBtnEl.style.display = 'none';
      if(userArea) userArea.innerHTML = '';
      document.querySelectorAll('.admin-view').forEach(v=>v.style.display='none');
    }
  }catch(e){
    console.error('onAuthStateChanged handling error', e);
  }
});

function bindNav(){
  document.querySelectorAll('#adminNav .navbtn').forEach(b=>{
    b.addEventListener('click', ()=>{
      document.querySelectorAll('#adminNav .navbtn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      showView(b.dataset.view);
    });
  });
}

function showView(name){
  document.querySelectorAll('.admin-view').forEach(v=>v.style.display='none');
  const id = 'view' + capitalize(name || '');
  const el = document.getElementById(id);
  if(!el){
    console.warn('showView: elemento não encontrado para', id);
    return false;
  }
  el.style.display = 'block';
}

function capitalize(s){return s.charAt(0).toUpperCase()+s.slice(1)}

// ---------- Firestore listeners & functions ----------
function startListeners(){
  // products
  const productsCol = collection(db,'products');
  onSnapshot(productsCol, snap=>{
    const list = document.getElementById('productsList');
    if(!list){ console.warn('startListeners: #productsList não encontrado'); return; }
    try{ list.innerHTML = ''; }catch(e){ console.warn('Não foi possível limpar productsList',e); return; }
    snap.forEach(docSnap=>{
      const data = docSnap.data();
      const el = document.createElement('div'); el.className='item';
      el.innerHTML = `<div><strong>${data.name}</strong><div class="muted">${data.brand||''} — R$ ${data.price||''}</div></div>
        <div>
          <button class="btn" data-id="${docSnap.id}" data-action="edit">Editar</button>
          <button class="btn danger" data-id="${docSnap.id}" data-action="delete">Apagar</button>
        </div>`;
      list.appendChild(el);
    });
    // bind actions
    list.querySelectorAll('button').forEach(b=>b.addEventListener('click', handleProductAction));
  }, err=>{ console.error('Produtos onSnapshot error', err); alert('Erro de conexão com Firestore ao carregar produtos: '+(err.message||err)); });

  // quotes
  const quotesCol = collection(db,'quotes');
  onSnapshot(quotesCol, snap=>{
    const list = document.getElementById('quotesList');
    if(!list){ console.warn('startListeners: #quotesList não encontrado'); return; }
    try{ list.innerHTML=''; }catch(e){ console.warn('Não foi possível limpar quotesList', e); return; }
    snap.forEach(s=>{
      const d=s.data();
      const el=document.createElement('div'); el.className='item';
      el.innerHTML = `<div><strong>${d.name||d.contact||'—'}</strong><div class="muted">${d.phone||''} — ${d.brand||''} ${d.model||''}</div><div>${d.description||''}</div></div>
        <div><button class="btn" data-id="${s.id}" data-qa="mark">Marcar tratado</button></div>`;
      list.appendChild(el);
    });
    list.querySelectorAll('button').forEach(b=> b.addEventListener('click', async (ev)=>{
      const id = ev.currentTarget.dataset.id; const ref = doc(db,'quotes',id);
      await updateDoc(ref,{handled:true});
    }));
  }, err=>{ console.error('Quotes onSnapshot error', err); });

  // orders
  const ordersCol = collection(db,'orders');
  onSnapshot(ordersCol, snap=>{
    const list=document.getElementById('ordersList');
    if(!list){ console.warn('startListeners: #ordersList não encontrado'); return; }
    try{ list.innerHTML=''; }catch(e){ console.warn('Não foi possível limpar ordersList', e); return; }
    snap.forEach(s=>{
      const d=s.data(); const el=document.createElement('div'); el.className='item';
      el.innerHTML = `<div><strong>${d.productName||'Venda'}</strong><div class="muted">${d.customer||''} — ${d.total||''}</div></div>
        <div><button class="btn" data-id="${s.id}" data-ord="ship">Marcar enviado</button></div>`;
      list.appendChild(el);
    });
    list.querySelectorAll('button').forEach(b=> b.addEventListener('click', async (ev)=>{
      const id = ev.currentTarget.dataset.id; const ref = doc(db,'orders',id);
      await updateDoc(ref,{status:'shipped'});
    }));
  }, err=>{ console.error('Orders onSnapshot error', err); });

  // product add / edit form
  const productForm = document.getElementById('productForm');
  const submitBtn = document.getElementById('productSubmitBtn');
  const cancelBtn = document.getElementById('productCancelBtn');
  productForm && productForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    // If modal save button exists, delegate to it (handles uploads and validation)
    const modalSave = document.getElementById('saveProductBtn');
    if(modalSave){
      modalSave.click();
      return;
    }
  });

  cancelBtn && cancelBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    resetProductForm();
  });

  // services listeners & form
  const servicesCol = collection(db,'services');
  onSnapshot(servicesCol, snap=>{
    const list = document.getElementById('servicesList');
    if(!list) return;
    list.innerHTML = '';
    snap.forEach(docSnap=>{
      const data = docSnap.data();
      const el = document.createElement('div'); el.className='item';
      el.innerHTML = `<div><strong>${data.name}</strong><div class="muted">R$ ${data.price||''}</div><div class="muted">${data.description||''}</div></div>
        <div>
          <button class="btn" data-id="${docSnap.id}" data-saction="edit">Editar</button>
          <button class="btn danger" data-id="${docSnap.id}" data-saction="delete">Apagar</button>
        </div>`;
      list.appendChild(el);
    });
  }, err=>{ console.error('Services onSnapshot error', err); });

const loginForm = document.getElementById('loginForm');
}

async function handleProductAction(ev){
  const id = ev.currentTarget.dataset.id; const action = ev.currentTarget.dataset.action;
  if(action==='delete'){
    if(confirm('Apagar este produto?')) await deleteDoc(doc(db,'products',id));
  }else if(action==='edit'){
    try{
      const snap = await getDoc(doc(db,'products',id));
      if(snap.exists()){
        const data = snap.data();
        // If modal form exists, populate modal fields and open it (preferred)
        const modalEl = document.getElementById('productModal');
        if(modalEl){
          // fill modal inputs (ids from modal)
          const setIf = (sel, val)=>{ const el = document.getElementById(sel); if(el) el.value = val||''; };
          setIf('p_name', data.name);
          setIf('p_brand', data.brand);
          setIf('p_model', data.model);
          setIf('p_storage', data.storage);
          setIf('p_ram', data.ram);
          setIf('p_color', data.color);
          setIf('p_category', data.category);
          setIf('p_price', data.price);
          setIf('p_price_promo', data.pricePromo);
          setIf('p_status', data.status);
          setIf('p_description', data.description);
          // set edit id on save button
          const sp = document.getElementById('saveProductBtn'); if(sp) sp.dataset.editId = snap.id;
          const mt = document.getElementById('modalTitle'); if(mt) mt.textContent = 'Editar produto';
          openModal('#productModal');
        } else {
          // fallback to older inline form if present
          const pid = document.getElementById('p_id'); if(pid) pid.value = snap.id;
          const nameEl = document.getElementById('p_name'); if(nameEl) nameEl.value = data.name||'';
          const brandEl = document.getElementById('p_brand'); if(brandEl) brandEl.value = data.brand||'';
          const priceEl = document.getElementById('p_price'); if(priceEl) priceEl.value = data.price||'';
          const imageEl = document.getElementById('p_image'); if(imageEl) imageEl.value = data.image||'';
          const submitBtnEl = document.getElementById('productSubmitBtn'); if(submitBtnEl) submitBtnEl.textContent = 'Atualizar';
          const cancelBtnEl = document.getElementById('productCancelBtn'); if(cancelBtnEl) cancelBtnEl.style.display = 'inline-block';
        }
      }
    }catch(err){alert('Erro ao carregar produto: '+err.message)}
  }
}

function resetProductForm(){
  const elOrNull = id => document.getElementById(id);
  if(elOrNull('p_id')) elOrNull('p_id').value = '';
  if(elOrNull('p_name')) elOrNull('p_name').value = '';
  if(elOrNull('p_brand')) elOrNull('p_brand').value = '';
  if(elOrNull('p_price')) elOrNull('p_price').value = '';
  if(elOrNull('p_image')) elOrNull('p_image').value = '';
  const submitBtn = document.getElementById('productSubmitBtn');
  const cancelBtn = document.getElementById('productCancelBtn');
  if(submitBtn) submitBtn.textContent = 'Adicionar';
  if(cancelBtn) cancelBtn.style.display = 'none';
}

console.log('Admin panel loaded');
