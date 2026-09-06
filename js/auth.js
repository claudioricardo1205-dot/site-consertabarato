import firebaseConfig from '../firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore, doc, setDoc, addDoc, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Garante a extração limpa das propriedades de configuração
const configValues = firebaseConfig.default || firebaseConfig;

console.log("Credenciais ativas do Firebase:", configValues);

// Inicializa os serviços com o objeto desestruturado
const app = initializeApp({ ...configValues });
const auth = getAuth(app);
const db = getFirestore(app);
// Sinaliza que o módulo foi carregado com sucesso
window.__authModuleLoaded = true;

// UI elements (revolvido a duplicidade do loginBtn)
const loginBtn = document.getElementById('loginBtn');
const authModal = document.getElementById('authModal');
const authClose = document.getElementById('authClose');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const showResetLink = document.getElementById('showResetLink');
const resetFormPublic = document.getElementById('resetFormPublic');
const publicResetBtn = document.getElementById('publicResetBtn');
const showLoginFromReset = document.getElementById('showLoginFromReset');
const loginFormPublic = document.getElementById('loginFormPublic');
const registerFormPublic = document.getElementById('registerFormPublic');
const authMessages = document.getElementById('authMessages');

function openAuth(){ authModal.classList.add('open'); authModal.setAttribute('aria-hidden','false'); }
function closeAuth(){ authModal.classList.remove('open'); authModal.setAttribute('aria-hidden','true'); }

loginBtn && loginBtn.addEventListener('click', ()=>{ openAuth(); });
authClose && authClose.addEventListener('click', ()=> closeAuth());
showRegister && showRegister.addEventListener('click', ()=>{ loginFormPublic.style.display='none'; registerFormPublic.style.display='block'; document.getElementById('authTitle').textContent='Criar conta'; authMessages.textContent=''; });
showLogin && showLogin.addEventListener('click', ()=>{ registerFormPublic.style.display='none'; resetFormPublic && (resetFormPublic.style.display='none'); loginFormPublic.style.display='block'; document.getElementById('authTitle').textContent='Entrar'; authMessages.textContent=''; });

showResetLink && showResetLink.addEventListener('click', (e)=>{ e.preventDefault(); loginFormPublic.style.display='none'; registerFormPublic.style.display='none'; resetFormPublic.style.display='block'; document.getElementById('authTitle').textContent='Recuperar senha'; authMessages.textContent=''; });
showLoginFromReset && showLoginFromReset.addEventListener('click', (e)=>{ e.preventDefault(); resetFormPublic.style.display='none'; loginFormPublic.style.display='block'; document.getElementById('authTitle').textContent='Entrar'; authMessages.textContent=''; });

loginFormPublic && loginFormPublic.addEventListener('submit', async (e)=>{
    e.preventDefault();
    console.log('public login submit');
    const email = document.getElementById('publicEmail').value;
    const password = document.getElementById('publicPassword').value;
    try {
        // 1. Efetua o login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // 2. Força a atualização do token para ler a claim de admin
        const idTokenResult = await userCredential.user.getIdTokenResult(true);

        if (authMessages) {
            authMessages.textContent = 'Logado com sucesso.';
        }

        // 3. Redireciona se for Administrador ou fecha a janela se for cliente comum
        if (idTokenResult.claims.admin) {
          window.location.href = 'admin/index.html'; 
        } else {
            closeAuth();
        }
    } catch(err) {
        if (authMessages) {
            authMessages.textContent = 'Erro: ' + err.message;
        }
    }
});

registerFormPublic && registerFormPublic.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const name = document.getElementById('publicName').value;
  const cpf = document.getElementById('publicCPF').value;
  const phone = document.getElementById('publicPhone').value;
  const address = document.getElementById('publicAddress').value;
  const email = document.getElementById('publicRemail').value;
  const password = document.getElementById('publicRpassword').value;
  try{
    const userCred = await createUserWithEmailAndPassword(auth,email,password);
    const uid = userCred.user.uid;
    // save profile in Firestore
    await setDoc(doc(db,'customers',uid),{name,cpf,phone,address,email,created:Date.now()});
    authMessages.textContent = 'Conta criada. Você foi logado.';
    closeAuth();
  }catch(err){ authMessages.textContent = 'Erro: '+err.message }
});

// Update header to show user when logged in
const userDisplay = document.createElement('div'); userDisplay.id='userDisplay';
const headerCtas = document.querySelector('.header-ctas');
if(headerCtas) headerCtas.insertBefore(userDisplay, headerCtas.firstChild);

onAuthStateChanged(auth, user=>{
  if(user){
    userDisplay.innerHTML = `<span style="margin-right:0.6rem">Olá, ${user.email}</span><a href="account.html" class="btn btn-outline">Minha Conta</a><button id="publicLogout" class="btn btn-outline">Sair</button>`;
    const out = document.getElementById('publicLogout');
    out && out.addEventListener('click', ()=> signOut(auth));
    // hide default login button
    loginBtn && (loginBtn.style.display='none');
  } else {
    userDisplay.innerHTML = '';
    loginBtn && (loginBtn.style.display='inline-block');
  }
});

// Associate quote submissions with authenticated user
const publicQuoteForm = document.getElementById('quoteForm');
publicQuoteForm && publicQuoteForm.addEventListener('submit', async (e)=>{
  // this form currently opens WhatsApp via js/app.js; we add a Firestore save when user is logged
  try{
    const user = auth.currentUser;
    if(!user) return; // not logged - nothing to save
    e.preventDefault();
    const fd = new FormData(publicQuoteForm);
    const docRef = await addDoc(collection(db,'quotes'),{
      uid: user.uid,
      email: user.email,
      name: fd.get('name'),
      phone: fd.get('phone'),
      brand: fd.get('brand'),
      model: fd.get('model'),
      issue: fd.get('issue'),
      description: fd.get('description'),
      created: Date.now(),
      status: 'new'
    });
    console.log('Orçamento salvo:', docRef.id);
  }catch(err){ console.error('Erro ao salvar orçamento localmente:',err) }
});

// Hide prices for non-authenticated users
function updatePriceVisibility(user){
  document.querySelectorAll('.price').forEach(el=>{
    if(user){
      el.style.display = '';
      const placeholder = el.dataset.placeholderEl && document.getElementById(el.dataset.placeholderEl);
      if(placeholder) placeholder.remove();
    } else {
      // replace price with a small 'Entrar para ver preço' label if not already
      if(!el.dataset.hidden){
        const span = document.createElement('span');
        span.className = 'muted';
        span.id = 'price_placeholder_'+Math.random().toString(36).slice(2,8);
        span.textContent = 'Entrar para ver preço';
        el.parentNode.insertBefore(span, el);
        el.dataset.placeholderEl = span.id;
        el.style.display = 'none';
        el.dataset.hidden = 'true';
      }
    }
  });
}

onAuthStateChanged(auth, (u)=> updatePriceVisibility(u));

// close modal on click outside
authModal && authModal.addEventListener('click', (ev)=>{ if(ev.target===authModal) closeAuth(); });

// password reset
publicResetBtn && publicResetBtn.addEventListener('click', async (ev)=>{
  ev.preventDefault();
  const email = document.getElementById('resetEmail').value;
  try{
    await sendPasswordResetEmail(auth, email);
    authMessages.textContent = 'Instruções de reset enviadas para o e-mail.';
  }catch(err){ authMessages.textContent = 'Erro: '+err.message }
});

console.log('Auth script loaded');
// mark module loaded for non-module fallback detection
try{ window.__authModuleLoaded = true; }catch(e){}
