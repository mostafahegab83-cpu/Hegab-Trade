/* StockPilot — Battery & Tire Inventory (vanilla JS, localStorage) */

const LOW_STOCK = 5;
const KEY = 'stockpilot_v1';

const defaultState = {
  records: [],
  adjustments: [],
  productTypes: ['Battery','Tire'],
  brands: [],
  sizes: [],
  suppliers: [],
};

let state = load();
function load(){ try{ const r = localStorage.getItem(KEY); return r ? {...defaultState, ...JSON.parse(r)} : {...defaultState}; }catch{ return {...defaultState}; } }
function save(){ localStorage.setItem(KEY, JSON.stringify(state)); render(); }
function uid(){ return Math.random().toString(36).slice(2)+Date.now().toString(36); }
function uniqAdd(arr,v){ if(!v) return arr; const t=v.trim(); if(!t) return arr; if(arr.some(x=>x.toLowerCase()===t.toLowerCase())) return arr; return [...arr,t]; }
function remember(r){
  state.productTypes = uniqAdd(state.productTypes, r.productType);
  state.brands = uniqAdd(state.brands, r.brand);
  state.sizes = uniqAdd(state.sizes, r.size);
  if(r.supplier) state.suppliers = uniqAdd(state.suppliers, r.supplier);
}
function fmt(n){ return Number(n||0).toLocaleString('en-US',{maximumFractionDigits:0}); }
function toast(msg, kind=''){ const el=document.getElementById('toast'); el.textContent=msg; el.className='show '+kind; setTimeout(()=>el.className='',2200); }

/* -------- Routing -------- */
document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',e=>{
  e.preventDefault();
  const p = a.dataset.page;
  document.querySelectorAll('#nav a').forEach(x=>x.classList.toggle('active',x===a));
  document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id==='page-'+p));
  render();
}));

/* -------- Records CRUD -------- */
function addRecord(rec){
  const r = {id:uid(), date:new Date().toISOString(), ...rec};
  state.records.unshift(r); remember(r); save();
}
function updateRecord(id, patch){
  state.records = state.records.map(r=>r.id===id?{...r,...patch}:r);
  const r = state.records.find(x=>x.id===id); if(r) remember(r); save();
}
function deleteRecord(id){
  if(!confirm('Delete this record?')) return;
  state.records = state.records.filter(r=>r.id!==id);
  state.adjustments = state.adjustments.filter(a=>a.recordId!==id);
  save();
}

/* -------- Dashboard -------- */
let chartBrand, chartType;
function renderDashboard(){
  if(!document.getElementById('page-dashboard').classList.contains('active')) return;
  const recs = state.records;
  const totalValue = recs.reduce((s,r)=>s+r.price*r.quantity,0);
  const totalQty = recs.reduce((s,r)=>s+r.quantity,0);
  const bats = recs.filter(r=>r.productType.toLowerCase()==='battery');
  const tires = recs.filter(r=>r.productType.toLowerCase()==='tire');
  const low = recs.filter(r=>r.quantity<=LOW_STOCK).length;

  document.getElementById('kpi-value').textContent = 'EGP '+fmt(totalValue);
  document.getElementById('kpi-qty').textContent = fmt(totalQty);
  document.getElementById('kpi-bat').textContent = fmt(bats.reduce((s,r)=>s+r.quantity,0));
  document.getElementById('kpi-tire').textContent = fmt(tires.reduce((s,r)=>s+r.quantity,0));
  document.getElementById('kpi-low').textContent = fmt(low);

  // chip groups
  const group=(rows,key)=>{ const m=new Map(); rows.forEach(r=>m.set(r[key],(m.get(r[key])||0)+r.quantity)); return [...m.entries()]; };
  const chips=(el,data)=>{ el.innerHTML = data.length? data.map(([n,v])=>`<span class="chip">${n}: <b>${v}</b></span>`).join('') : '<span class="muted small">—</span>'; };
  chips(document.getElementById('batBrand'), group(bats,'brand'));
  chips(document.getElementById('batSize'), group(bats,'size'));
  chips(document.getElementById('tireBrand'), group(tires,'brand'));
  chips(document.getElementById('tireSize'), group(tires,'size'));

  // value by brand
  const valMap = new Map();
  recs.forEach(r=>valMap.set(r.brand,(valMap.get(r.brand)||0)+r.price*r.quantity));
  const brandData = [...valMap.entries()].sort((a,b)=>b[1]-a[1]);
  drawBar('chartBrand', brandData.map(d=>d[0]), brandData.map(d=>d[1]), 'EGP', c=>chartBrand=c, chartBrand);

  // qty by type
  const typeData = [['Battery',bats.reduce((s,r)=>s+r.quantity,0)],['Tire',tires.reduce((s,r)=>s+r.quantity,0)]];
  drawDoughnut('chartType', typeData.map(d=>d[0]), typeData.map(d=>d[1]), c=>chartType=c, chartType);

  // table
  const q = document.getElementById('dashSearch').value.trim().toLowerCase();
  const tf = document.getElementById('dashType').value;
  const filtered = recs.filter(r=>{
    if(tf!=='all' && r.productType!==tf) return false;
    if(!q) return true;
    return [r.brand,r.size,r.invoiceNumber,r.productType,String(r.price)].join(' ').toLowerCase().includes(q);
  });
  const tb = document.querySelector('#dashTable tbody');
  tb.innerHTML = filtered.length? filtered.map(r=>`
    <tr><td>${r.productType}</td><td><b>${r.brand}</b></td><td>${r.size}</td>
    <td class="r">${r.quantity}${r.quantity<=LOW_STOCK?'<span class="tag-low">LOW</span>':''}</td>
    <td class="r">EGP ${fmt(r.price)}</td><td class="r"><b>EGP ${fmt(r.price*r.quantity)}</b></td></tr>`).join('')
    : `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--muted)">No records yet. Add an invoice to get started.</td></tr>`;
}

function drawBar(id, labels, data, prefix, setter, prev){
  if(prev) prev.destroy();
  const ctx = document.getElementById(id).getContext('2d');
  setter(new Chart(ctx,{type:'bar',data:{labels,datasets:[{data,backgroundColor:'#2563eb',borderRadius:6}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ${prefix} ${fmt(c.parsed.y)}`}}},scales:{y:{beginAtZero:true,ticks:{callback:v=>fmt(v)}}}}}));
}
function drawDoughnut(id, labels, data, setter, prev){
  if(prev) prev.destroy();
  const ctx = document.getElementById(id).getContext('2d');
  setter(new Chart(ctx,{type:'doughnut',data:{labels,datasets:[{data,backgroundColor:['#2563eb','#16a34a','#f59e0b','#a855f7','#ef4444']}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}}}}));
}

document.getElementById('dashSearch').addEventListener('input',renderDashboard);
document.getElementById('dashType').addEventListener('change',renderDashboard);

/* -------- Inventory page -------- */
let invSort={key:'date',dir:'desc'}, invPage=0; const PAGE_SIZE=10;
function renderInventory(){
  if(!document.getElementById('page-inventory').classList.contains('active')) return;
  const q = document.getElementById('invSearch').value.trim().toLowerCase();
  let rows = state.records.slice();
  if(q) rows = rows.filter(r=>[r.brand,r.size,r.invoiceNumber,r.productType,String(r.price),r.supplier||''].join(' ').toLowerCase().includes(q));
  rows.sort((a,b)=>{ const av=a[invSort.key], bv=b[invSort.key]; if(av<bv) return invSort.dir==='asc'?-1:1; if(av>bv) return invSort.dir==='asc'?1:-1; return 0; });
  const pages = Math.max(1, Math.ceil(rows.length/PAGE_SIZE));
  if(invPage>=pages) invPage = pages-1;
  const view = rows.slice(invPage*PAGE_SIZE,(invPage+1)*PAGE_SIZE);
  document.getElementById('invCount').textContent = rows.length+' records';
  document.getElementById('pageInfo').textContent = `Page ${invPage+1} of ${pages}`;
  const tb = document.querySelector('#invTable tbody');
  tb.innerHTML = view.length? view.map(r=>`
    <tr data-id="${r.id}">
      <td contenteditable data-f="productType">${r.productType}</td>
      <td contenteditable data-f="brand"><b>${r.brand}</b></td>
      <td contenteditable data-f="size">${r.size}</td>
      <td contenteditable data-f="price">${r.price}</td>
      <td contenteditable data-f="quantity">${r.quantity}</td>
      <td contenteditable data-f="invoiceNumber">${r.invoiceNumber||''}</td>
      <td class="muted small">${new Date(r.date).toLocaleDateString()}</td>
      <td contenteditable data-f="notes">${r.notes||''}</td>
      <td class="r"><button class="btn icon" onclick="deleteRecord('${r.id}')">🗑</button></td>
    </tr>`).join('')
    : `<tr><td colspan="9" style="text-align:center;padding:30px;color:var(--muted)">No records.</td></tr>`;
  tb.querySelectorAll('[contenteditable]').forEach(td=>{
    td.addEventListener('blur',()=>{
      const id=td.parentElement.dataset.id, f=td.dataset.f;
      let val = td.textContent.trim();
      if(f==='price'||f==='quantity') val = Number(val)||0;
      updateRecord(id,{[f]:val});
    });
  });
}
document.querySelectorAll('#invTable th[data-sort]').forEach(th=>th.addEventListener('click',()=>{
  const k=th.dataset.sort; if(invSort.key===k) invSort.dir = invSort.dir==='asc'?'desc':'asc'; else { invSort.key=k; invSort.dir='asc'; }
  renderInventory();
}));
document.getElementById('invSearch').addEventListener('input',()=>{ invPage=0; renderInventory(); });
document.getElementById('prevPage').addEventListener('click',()=>{ if(invPage>0){ invPage--; renderInventory(); } });
document.getElementById('nextPage').addEventListener('click',()=>{ invPage++; renderInventory(); });

/* -------- Add Invoice -------- */
let lines = [emptyLine()];
function emptyLine(){ return {productType:'Battery',brand:'',size:'',quantity:1,price:0}; }
function renderInvoicePage(){
  document.getElementById('invDate').value ||= new Date().toISOString().slice(0,10);
  const cont = document.getElementById('lines');
  cont.innerHTML = lines.map((l,i)=>`
    <div class="line-item">
      <div><label>Type</label>${ac(`l-type-${i}`,l.productType,state.productTypes,(v)=>{lines[i].productType=v;})}</div>
      <div><label>Brand</label>${ac(`l-brand-${i}`,l.brand,state.brands,(v)=>{lines[i].brand=v;},'ACDELCO')}</div>
      <div><label>Size / Model</label>${ac(`l-size-${i}`,l.size,state.sizes,(v)=>{lines[i].size=v;},'TD70')}</div>
      <div><label>Quantity</label><input type="number" min="1" value="${l.quantity}" oninput="lines[${i}].quantity=Number(this.value);updTotal()"/></div>
      <div><label>Unit Price</label><input type="number" min="0" value="${l.price}" oninput="lines[${i}].price=Number(this.value);updTotal()"/></div>
      <div><label>&nbsp;</label><button class="btn icon" onclick="removeLine(${i})" ${lines.length===1?'disabled':''}>🗑</button></div>
    </div>`).join('');
  // wire autocompletes
  lines.forEach((_,i)=>{
    wireAC(`l-type-${i}`, state.productTypes, v=>{lines[i].productType=v;});
    wireAC(`l-brand-${i}`, state.brands,        v=>{lines[i].brand=v;});
    wireAC(`l-size-${i}`,  state.sizes,         v=>{lines[i].size=v;});
  });
  wireAC('invSupplier', state.suppliers, v=>{}, true);
  updTotal();
}
function ac(id,val,_sug,_set,ph=''){
  return `<div class="ac"><input id="${id}" autocomplete="off" value="${val||''}" placeholder="${ph}"/><ul class="ac-list"></ul></div>`;
}
function wireAC(id, suggestions, onPick, isPlain=false){
  const input = document.getElementById(id); if(!input) return;
  const list = isPlain ? input.parentElement.querySelector('.ac-list') : input.nextElementSibling;
  const open=()=>{ const q=input.value.trim().toLowerCase();
    const f = suggestions.filter(s=>!q||s.toLowerCase().includes(q)).slice(0,8);
    list.innerHTML = f.map(s=>`<li>${s}</li>`).join('');
    list.classList.toggle('open', f.length>0);
    list.querySelectorAll('li').forEach(li=>li.addEventListener('mousedown',e=>{e.preventDefault();input.value=li.textContent;onPick(li.textContent);list.classList.remove('open');}));
  };
  input.addEventListener('input',()=>{ onPick(input.value); open(); });
  input.addEventListener('focus', open);
  input.addEventListener('blur', ()=>setTimeout(()=>list.classList.remove('open'),150));
}
function addLine(){ lines.push(emptyLine()); renderInvoicePage(); }
function removeLine(i){ lines.splice(i,1); renderInvoicePage(); }
function updTotal(){ const t = lines.reduce((s,l)=>s+l.price*l.quantity,0); document.getElementById('invTotal').textContent='EGP '+fmt(t); }
function saveInvoice(){
  const num = document.getElementById('invNumber').value.trim();
  if(!num){ toast('Invoice number is required','error'); return; }
  const valid = lines.filter(l=>l.brand.trim()&&l.size.trim()&&l.quantity>0);
  if(!valid.length){ toast('Add at least one valid item','error'); return; }
  const date = document.getElementById('invDate').value || new Date().toISOString().slice(0,10);
  const supplier = document.getElementById('invSupplier').value.trim();
  const notes = document.getElementById('invNotes').value.trim();
  valid.forEach(l=>addRecord({
    productType:l.productType, brand:l.brand, size:l.size,
    quantity:l.quantity, price:l.price, invoiceNumber:num,
    supplier:supplier||undefined, notes:notes||undefined,
    date:new Date(date).toISOString()
  }));
  if(supplier) state.suppliers = uniqAdd(state.suppliers, supplier);
  toast(`Invoice ${num} saved · ${valid.length} item(s) added`);
  document.getElementById('invNumber').value=''; document.getElementById('invSupplier').value=''; document.getElementById('invNotes').value='';
  lines=[emptyLine()]; renderInvoicePage();
  // jump to dashboard
  document.querySelector('#nav a[data-page="dashboard"]').click();
}

/* -------- Adjustments -------- */
function renderAdjust(){
  if(!document.getElementById('page-adjust').classList.contains('active')) return;
  const sel = document.getElementById('adjRecord');
  sel.innerHTML = '<option value="">Choose item…</option>' + state.records.map(r=>`<option value="${r.id}">${r.productType} · ${r.brand} · ${r.size} (qty ${r.quantity})</option>`).join('');
  const ul = document.getElementById('adjHistory');
  ul.innerHTML = state.adjustments.length? state.adjustments.map(a=>{
    const r = state.records.find(x=>x.id===a.recordId);
    const cls = a.delta>0?'h-up':a.delta<0?'h-down':'h-set';
    const icon = a.delta>0?'+':a.delta<0?'−':'=';
    const dcls = a.delta>0?'up':a.delta<0?'down':'';
    return `<li><div class="h-icon ${cls}">${icon}</div>
      <div class="h-meta"><div class="t">${r?`${r.brand} · ${r.size}`:'Deleted record'}</div><div class="s">${a.reason} · ${new Date(a.date).toLocaleString()}</div></div>
      <div class="h-delta ${dcls}">${a.delta>0?'+':''}${a.delta}</div></li>`;
  }).join('') : `<li style="justify-content:center;color:var(--muted)">No adjustments yet.</li>`;
}
function applyAdjust(){
  const id = document.getElementById('adjRecord').value;
  const r = state.records.find(x=>x.id===id);
  if(!r){ toast('Select a record','error'); return; }
  const mode = document.getElementById('adjMode').value;
  const amount = Number(document.getElementById('adjAmount').value)||0;
  let delta = 0;
  if(mode==='increase') delta = amount;
  else if(mode==='decrease') delta = -amount;
  else delta = amount - r.quantity;
  const newQty = Math.max(0, r.quantity+delta);
  state.records = state.records.map(x=>x.id===id?{...x,quantity:newQty}:x);
  state.adjustments.unshift({id:uid(), recordId:id, delta, reason:document.getElementById('adjReason').value||mode, date:new Date().toISOString()});
  document.getElementById('adjReason').value=''; document.getElementById('adjAmount').value=1;
  toast(`Stock adjusted (${delta>0?'+':''}${delta})`); save();
}

/* -------- Excel / PDF -------- */
function exportExcel(){
  const data = state.records.map(r=>({ProductType:r.productType,Brand:r.brand,Size:r.size,Price:r.price,Quantity:r.quantity,TotalValue:r.price*r.quantity,InvoiceNumber:r.invoiceNumber,Supplier:r.supplier||'',Notes:r.notes||'',Date:r.date}));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Inventory');
  XLSX.writeFile(wb, `inventory-${Date.now()}.xlsx`);
}
document.getElementById('importFile').addEventListener('change',e=>{
  const f = e.target.files[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload = ev=>{
    const data = new Uint8Array(ev.target.result);
    const wb = XLSX.read(data,{type:'array'});
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    let n=0;
    rows.forEach(r=>{
      const pt = r.ProductType||r.productType; const br=r.Brand||r.brand; const sz=r.Size||r.size;
      if(!pt||!br||!sz) return;
      addRecord({productType:String(pt),brand:String(br),size:String(sz),
        price:Number(r.Price||r.price||0),quantity:Number(r.Quantity||r.quantity||0),
        invoiceNumber:String(r.InvoiceNumber||r.invoiceNumber||''),
        supplier:r.Supplier||r.supplier||undefined, notes:r.Notes||r.notes||undefined});
      n++;
    });
    toast(`Imported ${n} records`); e.target.value='';
  };
  reader.readAsArrayBuffer(f);
});
async function exportPDF(){
  const node = document.getElementById('report');
  const canvas = await html2canvas(node,{backgroundColor:'#ffffff',scale:2});
  const img = canvas.toDataURL('image/png');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p','mm','a4');
  const pw = pdf.internal.pageSize.getWidth();
  const ph = (canvas.height * pw) / canvas.width;
  pdf.addImage(img,'PNG',0,0,pw,ph);
  pdf.save(`inventory-dashboard-${Date.now()}.pdf`);
}

/* -------- Main render -------- */
function render(){ renderDashboard(); renderInventory(); renderInvoicePage(); renderAdjust(); }
render();
