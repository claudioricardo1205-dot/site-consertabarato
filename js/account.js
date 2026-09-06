import firebaseConfig from '../firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const profileArea = document.getElementById('profileArea');
const myQuotes = document.getElementById('myQuotes');
const myOrders = document.getElementById('myOrders');

onAuthStateChanged(auth, async (user)=>{
  if(!user){
    profileArea.innerHTML = '<p>Você não está logado. <a href="/">Entrar</a></p>';
    myQuotes.innerHTML = '';
    myOrders.innerHTML = '';
    return;
  }
  profileArea.innerHTML = `<p><strong>${user.email}</strong></p>`;

  // carregar perfil detalhado
  try{
    const prof = await (await getDocs(query(collection(db,'customers'), where('__name__','==',user.uid)))).docs[0];
    if(prof && prof.exists()){
      const pd = prof.data();
      profileArea.innerHTML = `
        <p><strong>${pd.name||user.email}</strong></p>
        <p>CPF: ${pd.cpf||'—'}</p>
        <p>WhatsApp: ${pd.phone||'—'}</p>
        <p>Endereço: ${pd.address||'—'}</p>
        <p>Email: ${pd.email||user.email}</p>
      `;
    }
  }catch(err){ console.warn('Não foi possível carregar perfil detalhado',err) }

  // carregar orçamentos do usuário
  try{
    const q = query(collection(db,'quotes'), where('uid','==',user.uid));
    const snap = await getDocs(q);
    if(snap.empty) myQuotes.innerHTML = '<p>Nenhum orçamento encontrado.</p>';
    else{
      myQuotes.innerHTML = '';
      snap.forEach(s=>{
        const d = s.data();
        const el = document.createElement('div'); el.className='item';
        el.innerHTML = `<div><strong>${d.brand||''} ${d.model||''}</strong><div class="muted">${d.phone||''} — ${new Date(d.created||0).toLocaleString()}</div><div>${d.description||''}</div></div>`;
        myQuotes.appendChild(el);
      });
    }
  }catch(err){ myQuotes.innerHTML = '<p>Erro ao carregar orçamentos.</p>'; console.error(err) }

  // carregar ordens
  try{
    const q2 = query(collection(db,'orders'), where('uid','==',user.uid));
    const snap2 = await getDocs(q2);
    if(snap2.empty) myOrders.innerHTML = '<p>Nenhuma compra encontrada.</p>';
    else{
      myOrders.innerHTML = '';
      snap2.forEach(s=>{
        const d=s.data(); const el=document.createElement('div'); el.className='item';
        el.innerHTML = `<div><strong>${d.productName||''}</strong><div class="muted">${d.total||''} — ${d.status||''}</div></div>`;
        myOrders.appendChild(el);
      });
    }
  }catch(err){ myOrders.innerHTML = '<p>Erro ao carregar compras.</p>'; console.error(err) }
});

console.log('Account script loaded');
