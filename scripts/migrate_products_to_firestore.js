/**
 * Script de migração: carrega `data/products.json` e `data/services.json` (se existir)
 * e envia os documentos para o Firestore usando Firebase Admin SDK.
 *
 * Uso:
 * 1. Crie um service account no Firebase Console (Project Settings -> Service accounts -> Generate new private key)
 *    e salve o JSON como `firebase-service-account.json` na raiz do projeto (NÃO comitar este arquivo).
 * 2. Instale dependências e execute:
 *    npm install firebase-admin
 *    node scripts/migrate_products_to_firestore.js
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const servicePath = path.join(__dirname,'..','firebase-service-account.json');
if(!fs.existsSync(servicePath)){
  console.error('Arquivo firebase-service-account.json não encontrado na raiz do projeto.');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(require(servicePath)) });
const db = admin.firestore();

async function migrateCollection(filePath, collectionName){
  if(!fs.existsSync(filePath)) return console.log(`Arquivo ${filePath} não existe — pulando ${collectionName}`);
  const raw = fs.readFileSync(filePath,'utf8');
  const data = JSON.parse(raw);
  const items = data.products || data.services || data;
  if(!Array.isArray(items)) return console.error('Formato inesperado em', filePath);
  console.log(`Migrando ${items.length} itens para a coleção '${collectionName}'...`);
  for(const item of items){
    // use id se existir, senão crie automático
    const docRef = item.id ? db.collection(collectionName).doc(String(item.id)) : db.collection(collectionName).doc();
    const toWrite = Object.assign({}, item);
    // remover campos indesejados ou normalizar
    await docRef.set(toWrite);
    console.log(` -> gravado ${docRef.id}`);
  }
}

async function run(){
  try{
    await migrateCollection(path.join(__dirname,'..','data','products.json'),'products');
    await migrateCollection(path.join(__dirname,'..','data','services.json'),'services');
    console.log('Migração concluída.');
    process.exit(0);
  }catch(err){
    console.error('Erro na migração:',err);
    process.exit(2);
  }
}

run();
