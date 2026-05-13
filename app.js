/* Firebase */
import { db } from "./firebase.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* -------- Original App Code -------- */
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

function load(){
  try{
    const r = localStorage.getItem(KEY);
    return r ? {...defaultState, ...JSON.parse(r)} : {...defaultState};
  }catch{
    return {...defaultState};
  }
}

function save(){
  localStorage.setItem(KEY, JSON.stringify(state));
  render();
}

function uid(){
  return Math.random().toString(36).slice(2)+Date.now().toString(36);
}

function uniqAdd(arr,v){
  if(!v) return arr;
  const t=v.trim();
  if(!t) return arr;
  if(arr.some(x=>x.toLowerCase()===t.toLowerCase())) return arr;
  return [...arr,t];
}

function remember(r){
  state.productTypes = uniqAdd(state.productTypes, r.productType);
  state.brands = uniqAdd(state.brands, r.brand);
  state.sizes = uniqAdd(state.sizes, r.size);
  if(r.supplier) state.suppliers = uniqAdd(state.suppliers, r.supplier);
}

function toast(msg){
  alert(msg);
}

/* ✅ FIXED FUNCTION */
async function saveInvoice(){

  const num = document.getElementById('invNumber').value.trim();
  if(!num){ alert('Invoice number required'); return; }

  const valid = lines.filter(l => l.brand && l.size && l.quantity>0);
  if(!valid.length){ alert('Add at least one item'); return; }

  const date = document.getElementById('invDate').value || new Date().toISOString().slice(0,10);
  const supplier = document.getElementById('invSupplier').value;
  const notes = document.getElementById('invNotes').value;

  try {
    for (const l of valid){

      /* ✅ SAVE TO FIREBASE */
      await addDoc(collection(db, "products"),{
        productType: l.productType,
        brand: l.brand,
        size: l.size,
        quantity: l.quantity,
        price: l.price,
        invoiceNumber: num,
        supplier: supplier,
        notes: notes,
        date: new Date(date)
      });

      /* ✅ KEEP LOCAL STORAGE */
      const record = {
        id: uid(),
        productType:l.productType,
        brand:l.brand,
        size:l.size,
        quantity:l.quantity,
        price:l.price,
        invoiceNumber:num,
        supplier:supplier,
        notes:notes,
        date:new Date(date).toISOString()
      };

      state.records.unshift(record);
      remember(record);
    }

    save();

    alert("✅ Saved successfully to Firebase");

  } catch (e){
    console.error(e);
    alert("❌ Firebase error");
  }
}

/* Dummy minimal UI logic */
let lines = [{productType:'Battery',brand:'',size:'',quantity:1,price:0}];

function render(){
  console.log("Rendering...");
}

render();