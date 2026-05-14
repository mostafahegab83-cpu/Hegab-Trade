import {
  db,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from "./firebase.js";

let records = [];

const recordsCollection = collection(db, "records");

const itemNameInput = document.getElementById("itemName");
const quantityInput = document.getElementById("quantity");
const priceInput = document.getElementById("price");
const notesInput = document.getElementById("notes");

const recordsTable = document.getElementById("recordsTable");
const totalItemsElement = document.getElementById("totalItems");
const totalQuantityElement = document.getElementById("totalQuantity");
const totalValueElement = document.getElementById("totalValue");
const connectionStatus = document.getElementById("connectionStatus");

function createId() {
  return Date.now().toString() + "-" + Math.random().toString(36).substring(2, 10);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 2
  });
}

function clearForm() {
  itemNameInput.value = "";
  quantityInput.value = "";
  priceInput.value = "";
  notesInput.value = "";
  itemNameInput.focus();
}

async function addRecord() {
  const itemName = itemNameInput.value.trim();
  const quantity = Number(quantityInput.value);
  const price = Number(priceInput.value);
  const notes = notesInput.value.trim();

  if (!itemName) {
    alert("Please enter item name");
    return;
  }

  if (!quantity || quantity <= 0) {
    alert("Please enter valid quantity");
    return;
  }

  if (!price || price < 0) {
    alert("Please enter valid price");
    return;
  }

  const id = createId();

  const record = {
    id,
    itemName,
    quantity,
    price,
    notes,
    createdAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, "records", id), record);
    clearForm();
  } catch (error) {
    console.error("Error adding record:", error);
    alert("Error adding item. Check Firebase settings.");
  }
}

async function editRecord(id) {
  const currentRecord = records.find((record) => record.id === id);

  if (!currentRecord) {
    alert("Record not found");
    return;
  }

  const newItemName = prompt("Item name:", currentRecord.itemName);
  if (newItemName === null) return;

  const newQuantity = prompt("Quantity:", currentRecord.quantity);
  if (newQuantity === null) return;

  const newPrice = prompt("Price:", currentRecord.price);
  if (newPrice === null) return;

  const newNotes = prompt("Notes:", currentRecord.notes || "");
  if (newNotes === null) return;

  const updatedRecord = {
    ...currentRecord,
    itemName: newItemName.trim(),
    quantity: Number(newQuantity),
    price: Number(newPrice),
    notes: newNotes.trim(),
    updatedAt: serverTimestamp()
  };

  if (!updatedRecord.itemName) {
    alert("Item name cannot be empty");
    return;
  }

  if (!updatedRecord.quantity || updatedRecord.quantity <= 0) {
    alert("Quantity must be valid");
    return;
  }

  if (updatedRecord.price < 0) {
    alert("Price must be valid");
    return;
  }

  try {
    await setDoc(doc(db, "records", id), updatedRecord);
  } catch (error) {
    console.error("Error updating record:", error);
    alert("Error updating item.");
  }
}

async function deleteRecord(id) {
  const confirmDelete = confirm("Are you sure you want to delete this item?");

  if (!confirmDelete) {
    return;
  }

  try {
    await deleteDoc(doc(db, "records", id));
  } catch (error) {
    console.error("Error deleting record:", error);
    alert("Error deleting item.");
  }
}

function renderRecords() {
  if (!records.length) {
    recordsTable.innerHTML = `
      <tr>
        <td colspan="7">No items yet</td>
      </tr>
    `;
    return;
  }

  recordsTable.innerHTML = records
    .map((record) => {
      const quantity = Number(record.quantity || 0);
      const price = Number(record.price || 0);
      const total = quantity * price;

      let dateText = "";

      if (record.createdAt && record.createdAt.toDate) {
        dateText = record.createdAt.toDate().toLocaleDateString();
      } else {
        dateText = "-";
      }

      return `
        <tr>
          <td>${record.itemName || ""}</td>
          <td>${formatNumber(quantity)}</td>
          <td>${formatNumber(price)}</td>
          <td>${formatNumber(total)}</td>
          <td>${record.notes || ""}</td>
          <td>${dateText}</td>
          <td>
            <div class="actions">
              <button class="edit" onclick="editRecord('${record.id}')">Edit</button>
              <button class="delete" onclick="deleteRecord('${record.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function calculateTotals() {
  const totalItems = records.length;

  const totalQuantity = records.reduce((sum, record) => {
    return sum + Number(record.quantity || 0);
  }, 0);

  const totalValue = records.reduce((sum, record) => {
    return sum + Number(record.quantity || 0) * Number(record.price || 0);
  }, 0);

  totalItemsElement.textContent = formatNumber(totalItems);
  totalQuantityElement.textContent = formatNumber(totalQuantity);
  totalValueElement.textContent = formatNumber(totalValue);
}

function updateUI() {
  renderRecords();
  calculateTotals();
}

function startRealtimeSync() {
  onSnapshot(
    recordsCollection,
    (snapshot) => {
      records = snapshot.docs.map((document) => {
        return {
          id: document.id,
          ...document.data()
        };
      });

      records.sort((a, b) => {
        const aTime = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
        const bTime = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
        return bTime - aTime;
      });

      connectionStatus.textContent = "Connected to Firebase - data is shared between devices";
      connectionStatus.classList.add("connected");

      updateUI();
    },
    (error) => {
      console.error("Firestore connection error:", error);

      connectionStatus.textContent = "Firebase connection error - check console/Firebase rules";
      connectionStatus.classList.remove("connected");

      recordsTable.innerHTML = `
        <tr>
          <td colspan="7">Error loading data from Firebase</td>
        </tr>
      `;
    }
  );
}

window.addRecord = addRecord;
window.editRecord = editRecord;
window.deleteRecord = deleteRecord;

startRealtimeSync();
