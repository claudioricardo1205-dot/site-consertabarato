#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(q, ans => res(ans && ans.trim())));

function slugify(s){
  return s.toString().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

async function run(){
  try{
    const dataPath = path.join(__dirname,'..','data','products.json');
    const imagesDir = path.join(__dirname,'..','images','products');
    await fs.mkdir(imagesDir, { recursive: true });

    const raw = await fs.readFile(dataPath,'utf8');
    const json = JSON.parse(raw);
    const products = Array.isArray(json.products) ? json.products : [];
    const maxId = products.reduce((m,p)=> Math.max(m, Number(p.id)||0), 0);
    const id = maxId + 1;

    console.log('\nAdicionando novo produto (id='+id+')');
    const name = await ask('Nome do produto: ');
    const brand = await ask('Marca: ');
    const model = await ask('Modelo: ');
    const storage = await ask('Armazenamento (ex: 128GB): ');
    const condition = await ask('Condição (novo/seminovo): ');
    const price = await ask('Preço (ex: 1.299,00): ');
    const info = await ask('Descrição curta: ');
    const status = await ask('Status (available/vendido) [available]: ') || 'available';
    const featuredAns = await ask('Destaque? (s/N): ');
    const featured = /^s/i.test(featuredAns);
    const tag = await ask('Tag (ex: NOVO/SEMINOVO) [deixe vazio para nenhum]: ');
    const defaultFileName = `${id}-${slugify(name||brand||'product')}.svg`;
    const imageDefault = path.join('images','products', defaultFileName).replace(/\\/g,'/');
    let image = await ask(`Caminho da imagem [${imageDefault}]: `);
    if(!image) image = imageDefault;
    const createSvgAns = await ask('Criar placeholder SVG local (s/N)? ');

    const product = {
      id: id,
      name: name || `Produto ${id}`,
      brand: brand || '',
      model: model || '',
      storage: storage || '',
      condition: condition || 'seminovo',
      price: price || '',
      info: info || '',
      status: status || 'available',
      featured: featured,
      tag: tag || '',
      image: image
    };

    products.push(product);
    json.products = products;
    await fs.writeFile(dataPath, JSON.stringify(json, null, 2), 'utf8');
    console.log('\nProduto salvo em data/products.json');

    if(/^s/i.test(createSvgAns)){
      // generate simple SVG placeholder
      const svgPath = path.join(__dirname,'..', image);
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">\n  <rect width="100%" height="100%" fill=\"#ffffff\" />\n  <text x=\"50%\" y=\"45%\" font-family=\"Arial, Helvetica, sans-serif\" font-size=\"28\" fill=\"#333\" text-anchor=\"middle\">${product.name}</text>\n  <text x=\"50%\" y=\"60%\" font-family=\"Arial, Helvetica, sans-serif\" font-size=\"18\" fill=\"#777\" text-anchor=\"middle\">${product.brand} • ${product.storage} • ${product.condition}</text>\n</svg>`;
      await fs.writeFile(svgPath, svgContent, 'utf8');
      console.log('Placeholder SVG criado em', svgPath);
    }

    console.log('\nConcluído. Recarregue a página no navegador (use servidor HTTP).');
    rl.close();
  }catch(err){
    console.error('Erro:', err.message || err);
    rl.close();
    process.exit(1);
  }
}

run();
