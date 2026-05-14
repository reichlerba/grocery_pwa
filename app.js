//  Written by Benjamin Reichler
//  Implements main logic: adding/deleting items, connect UI and storage

const cats = Object.freeze({
    PRODUCTOS: "Productos",
    PAN: "Pan",
    INGREDIENTES: "Ingredientes",
    CARNE: "Carne",
    LACTEOS: "Lácteos",
    CONGELADOS: "Congelados",
    OTRO: "Otro"
});

let quickAdds = [
    { name: "Leche", category: cats.LACTEOS }, 
    { name: "Yogur", category: cats.LACTEOS }, 
    { name: "Huevos", category: cats.LACTEOS },
    { name: "Manzanas", category: cats.PRODUCTOS},
    { name: "Platanos", category: cats.PRODUCTOS},
    { name: "Naranjas", category: cats.PRODUCTOS},
    { name: "Tortillas", category: cats.PAN},
    { name: "Verduras", category: cats.CONGELADOS},
    { name: "Pollo", category: cats.CARNE},
    { name: "Azúcar", category: cats.INGREDIENTES},
    { name: "Desodorante", category: cats.OTRO}
]
let allItems = [];

const mainList = document.getElementById("main-list");
const themeButton = document.getElementById("theme-toggle");
const addButton = document.getElementById("add-button");
const quickBar = document.getElementById("quick-add-bar");
const modalOverlay = document.getElementById("modal-overlay");
const submitAdd = document.getElementById("submit-itemAdd");
const submitCancel = document.getElementById("cancel-itemAdd");
const categoryButtons = document.querySelectorAll(".category-button");

const pixelsToSwipeToRemoveItem = 170;
const millisecondsToHoldQuickAddToEdit = 750;
let selectedCategory = "Productos";

// localStorage operations
function saveData() {
    localStorage.setItem("allItems", JSON.stringify(allItems));
    localStorage.setItem("quickAdds", JSON.stringify(quickAdds));
}

function loadData() {
    const savedItems = localStorage.getItem("allItems");
    const savedQuicks = localStorage.getItem("quickAdds");

    if(savedItems) {
        allItems = JSON.parse(savedItems);
    }
    if(savedQuicks) {
        quickAdds = JSON.parse(savedQuicks);
    }
}
loadData();

if("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
}

// rendering

if(localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-theme");
}

function renderQuickBar() {
    quickBar.innerHTML = "";
    quickAdds.forEach(item => {
        const btn = document.createElement("button");
        btn.className = "quick-item";
        btn.textContent = item.name;

        btn.addEventListener("click", () => {
            addToMainList(item.name, item.category);
        });
        // hold to delete
        let holdTimer;
        btn.addEventListener("touchstart", () => {
            holdTimer = setTimeout(() => {
                removeFromQuickAdd(item.name);
            }, millisecondsToHoldQuickAddToEdit); 
        });
        // cancel if early release/move (such as swiping through options)
        btn.addEventListener("touchend", () => {
            clearTimeout(holdTimer);
        });
        btn.addEventListener("touchmove", () => {
            clearTimeout(holdTimer);
        });

        quickBar.appendChild(btn);
    });
}
renderQuickBar();

function removeFromQuickAdd(itemName) {
    quickAdds = quickAdds.filter(
        item => item.name !== itemName
    );
    saveData();
    renderQuickBar();
}

function addNewQuickAdd(name, category) {
    if(quickAdds.some(item => item.name.toLowerCase() === name.toLowerCase())) return;
    quickAdds.push({ name: name, category});
    saveData();
    renderQuickBar();
}

function addToMainList(itemName, category) {
    itemName = itemName.trim();
    if(allItems.some(item => item.name === itemName)) {
        return; // already in list
    }

    allItems.push({
        name: itemName,
        category: category
    });

    renderList();
    saveData();
}

function removeFromMainList(itemName) {
    allItems = allItems.filter(
        item => item.name !== itemName
    );
    saveData();
    renderList();
}

function renderList() {
    mainList.innerHTML = "";

    Object.values(cats).forEach(category => {
        const selectionItems = allItems.filter(item => item.category === category);

        if(selectionItems.length === 0) {
            // nonde in this category
            return;
        }

        // food category header, unneeded
        // const header = document.createElement("h3");
        // header.textContent = category;
        // mainList.appendChild(header);

        // food items in allItems of this category
        selectionItems.forEach(item => {
            // item name
            const div = document.createElement("div");
            div.className = "list-item";
            div.classList.add(item.category);

            // listen for swipe removal
            let swipeStartX = 0;
            div.addEventListener("touchstart", (e) => {
                swipeStartX = e.touches[0].clientX;
            });
            div.addEventListener("touchend", (e) => {
                const swipeEndX = e.changedTouches[0].clientX;
                const swipeDistance = swipeEndX - swipeStartX;
                // use Math.abs if swiping left and right should have same effect
                if(Math.abs(swipeDistance) > pixelsToSwipeToRemoveItem) {
                    // removeFromMainList(item.name);

                    // added deletion animation:
                    div.style.transform = `translateX(${swipeDistance > 0 ? "100%" : "-100%"})`;

                    div.style.opacity = "0";

                    setTimeout(() => {
                        removeFromMainList(item.name);
                    }, 200);

                }
            });

            // X button
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "✕";
            deleteButton.className = "delete-button";
            deleteButton.addEventListener("click", () => {
                removeFromMainList(item.name);
            });

            // put together and display
            const textSpan = document.createElement("span");
            textSpan.textContent = item.name;
            div.appendChild(deleteButton);
            div.appendChild(textSpan);
            mainList.appendChild(div);
        });
    });
}
renderList();

function closeModal() {
    modalOverlay.classList.add("hidden");
    document.getElementById("item-input").value = "";
    document.getElementById("quick-checkbox").checked = false;
}

document.querySelectorAll(".quick-item").forEach(btn => {
    btn.addEventListener("click", () => {
        addToMainList(btn.textContent);
    });
});

addButton.addEventListener("click", () => {
    modalOverlay.classList.remove("hidden");
});

submitAdd.addEventListener("click", () => {
    const itemName = document.getElementById("item-input").value.trim();
    if(!itemName) {
        closeModal();
        return;
    }

    const category = selectedCategory; // document.getElementById("category-select").value; this was used when the html used the <select> drop down menu to choose category

    const addToQuick = document.getElementById("quick-checkbox").checked;

    addToMainList(itemName, category);
    if(addToQuick) {
        addNewQuickAdd(itemName, category);
    }

    closeModal();
});

submitCancel.addEventListener("click", closeModal);

modalOverlay.addEventListener("click", (e) => {
    if(e.target === modalOverlay) {
        closeModal();
    }
});

categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
        // selecting one button should leave only that button selected and none others

        // deselect all buttons
        categoryButtons.forEach(btn => {
            btn.classList.remove("selected");
        });

        // select only clicked button
        button.classList.add("selected");

        // store selected
        selectedCategory = button.dataset.category;
    });
});

themeButton.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    localStorage.setItem(
        "darkMode",
        document.body.classList.contains("dark-theme")
    );
});
