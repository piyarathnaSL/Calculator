// References
const auth = firebase.auth();
const database = firebase.database();

let items = [];
let currentOther = [];
let userId = null;

// Login button
document.getElementById("loginBtn").addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            userId = result.user.uid;
            document.getElementById("userEmail").innerText = `Logged in as: ${result.user.email}`;
            loadItems();
        })
        .catch((error) => alert(error.message));
});

// Auto check login state
auth.onAuthStateChanged((user) => {
    if (user) {
        userId = user.uid;
        document.getElementById("userEmail").innerText = `Logged in as: ${user.email}`;
        loadItems();
    }
});

// Add "Other Expense" for current item
function addOther() {
    const name = document.getElementById("otherName").value;
    const amount = parseFloat(document.getElementById("otherAmount").value);
    if (!name || isNaN(amount)) {
        alert("Enter valid other expense");
        return;
    }
    currentOther.push({ name, amount });
    const li = document.createElement("li");
    li.textContent = `${name}: LKR ${amount}`;
    document.getElementById("otherList").appendChild(li);
    document.getElementById("otherName").value = "";
    document.getElementById("otherAmount").value = "";
}

// Add a full item
function addItem() {
    if (!userId) {
        alert("Please login first!");
        return;
    }

    const item = {
        name: document.getElementById("itemName").value,
        import: parseFloat(document.getElementById("importCost").value) || 0,
        packaging: parseFloat(document.getElementById("packagingCost").value) || 0,
        delivery: parseFloat(document.getElementById("deliveryCost").value) || 0,
        marketing: parseFloat(document.getElementById("marketingCost").value) || 0,
        other: currentOther || []
    };

    if (!item.name) {
        alert("Item name required");
        return;
    }

    items.push(item);
    currentOther = [];
    document.getElementById("otherList").innerHTML = "";
    clearInputs();
    renderItems();
    saveItems(); // Save to Firebase
}

// Calculate item total
function itemTotal(item) {
    const otherTotal = (item.other || []).reduce((sum, o) => sum + o.amount, 0);
    return item.import + item.packaging + item.delivery + item.marketing + otherTotal;
}

// Render all items with delete buttons
function renderItems() {
    const list = document.getElementById("itemList");
    list.innerHTML = "";
    let grand = 0;

    items.forEach((item, index) => {
        if (!item.other) item.other = [];
        const total = itemTotal(item);
        grand += total;

        const li = document.createElement("li");

        // Item name + total
        const itemText = document.createElement("span");
        itemText.innerHTML = `<strong>${item.name}</strong> → LKR ${total.toFixed(2)} `;
        li.appendChild(itemText);

        // Delete Item button
        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete Item";
        delBtn.addEventListener("click", () => deleteItem(index));
        li.appendChild(delBtn);

        // Other expenses list
        const otherList = document.createElement("ul");
        item.other.forEach((o, oIndex) => {
            const oli = document.createElement("li");
            oli.textContent = `${o.name}: LKR ${o.amount} `;

            const delOtherBtn = document.createElement("button");
            delOtherBtn.textContent = "Delete";
            delOtherBtn.addEventListener("click", () => deleteOther(index, oIndex));

            oli.appendChild(delOtherBtn);
            otherList.appendChild(oli);
        });

        li.appendChild(otherList);
        list.appendChild(li);
    });

    document.getElementById("grandTotal").innerText = `Grand Total: LKR ${grand.toFixed(2)}`;
}



// Clear input fields
function clearInputs() {
    document.getElementById("itemName").value = "";
    document.getElementById("importCost").value = "";
    document.getElementById("packagingCost").value = "";
    document.getElementById("deliveryCost").value = "";
    document.getElementById("marketingCost").value = "";
}

// Delete a full item
function deleteItem(index) {
    if (confirm(`Are you sure you want to delete "${items[index].name}"?`)) {
        items.splice(index, 1);
        renderItems();
        saveItems();
    }
}

// Delete a specific "Other Expense"
function deleteOther(itemIndex, otherIndex) {
    const otherName = items[itemIndex].other[otherIndex].name;
    if (confirm(`Delete "${otherName}" from this item?`)) {
        items[itemIndex].other.splice(otherIndex, 1);
        renderItems();
        saveItems();
    }
}

// Save all items to Firebase
function saveItems() {
    firebase.database().ref("users/" + userId + "/items").set(items);
}

// Load items from Firebase
function loadItems() {
    firebase.database().ref("users/" + userId + "/items").get()
        .then((snapshot) => {
            if (snapshot.exists()) {
                items = snapshot.val().map(item => ({ ...item, other: item.other || [] }));
                renderItems();
            }
        })
        .catch((error) => console.error(error));
}
