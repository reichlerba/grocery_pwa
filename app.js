//  Written by Benjamin Reichler
//  Implements main logic: adding/deleting items, connect UI and storage

const cats = Object.freeze({
    FRESCOS: "Frescos",
    PAN: "Pan",
    INGREDIENTES: "Ingredientes",
    CARNE: "Carne",
    LACTEOS: "Lácteos",
    CONGELADOS: "Congelados",
    OTRO: "Otro"
});

let allItems = [];

const mainList = document.getElementById("main-list");
const laterList = document.getElementById("for-later-list");
const themeButton = document.getElementById("theme-toggle");
const addButton = document.getElementById("add-button");
const quickBar = document.getElementById("quick-add-bar");
const modalOverlay = document.getElementById("modal-overlay");
const submitAdd = document.getElementById("submit-itemAdd");
const submitCancel = document.getElementById("cancel-itemAdd");
const categoryButtons = document.querySelectorAll(".category-button");

const pixelsToSwipeToRemoveItem = 170;
const millisecondsToHoldQuickAddToEdit = 750;
let selectedCategory = "Frescos";

// localStorage operations
function saveData() {
    localStorage.setItem("allItems", JSON.stringify(allItems));
}

function loadData() {
    const savedItems = localStorage.getItem("allItems");
    if(savedItems) {
        allItems = JSON.parse(savedItems).map(item => ({
            // default categories, incase an item loaded is missing a field
            category: "Otro",
            location: "none", // can be "none", "main", or "later"
            quickItem: false,
            ...item
        }));
    }
}
loadData();
clearUnusedItemsFromAllItems();

if("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
}

// rendering

if(localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-theme");
}

function renderQuickBar() {
    quickBar.innerHTML = "";
    // get quickAdds from allItems
    const quickAdds = allItems.filter(item => item.quickItem);

    quickAdds.forEach(item => {
        const btn = document.createElement("button");
        btn.className = "quick-item";
        btn.textContent = item.name;

        let wasLongPress = false;
        let holdTimer;
        btn.addEventListener("pointerdown", () => {
            wasLongPress = false;
            holdTimer = setTimeout(() => {
                wasLongPress = true;
                removeFromQuickAdd(item.name);
            }, millisecondsToHoldQuickAddToEdit);
        });

        btn.addEventListener("pointerup", () => {
            clearTimeout(holdTimer);
            if(!wasLongPress) {
                addToMainList(item.name, item.category);
            }
        });

        btn.addEventListener("pointermove", () => {
            clearTimeout(holdTimer);
        });

        quickBar.appendChild(btn);
    });
}
renderQuickBar();

function removeFromQuickAdd(itemName) {
    const itemToRemove = allItems.find(i => i.name === itemName);
    if(itemToRemove) {
        itemToRemove.quickItem = false;
    }
    saveData();
    renderQuickBar();
}

function addNewQuickAdd(name, category) {
    name = name.trim();
    const existing = allItems.find(item => item.name.toLowerCase() === name.toLowerCase());
    if(existing) {
        existing.quickItem = true;
        saveData();
        renderQuickBar();
        return;
    }

    // item not in allItems yet, need to create it
    allItems.push({name, category, location: "none", quickItem: true});
    saveData();
    renderQuickBar();
}

function addToMainList(itemName, category) {
    itemName = itemName.trim();
    nameLower = itemName.toLowerCase();
    const existing = allItems.find(item => item.name && item.name.toLowerCase() === nameLower);
    if(existing) {
        existing.location = "main";
    } else {
        allItems.push({
            name: itemName,
            category: category,
            location: "main",
            quickItem: false
        });
    }
    saveData();
    renderList();
}

function addToForLater(itemName, category) {
    itemName = itemName.trim();
    nameLower = itemName.toLowerCase();
    const existing = allItems.find(item => item.name && item.name.toLowerCase() === nameLower);
    if(existing) {
        existing.location = "later";
    } else {
        allItems.push({
            name: itemName,
            category: category,
            location: "later",
            quickItem: false
        });
    }
    saveData();
    renderList();
}

// prevents localStorage from getting too large
// removes each item from allItems with a "none" location and isn't a quickItem
function clearUnusedItemsFromAllItems() {
    for(let i = allItems.length - 1; i >= 0; i--) {
        curr = allItems[i];
        if(curr.location === "none" && !curr.quickItem) {
            deleteFromAllItems(curr.name);
        }
    }
}
function deleteFromAllItems(itemName) {
    allItems = allItems.filter(item => item.name !== itemName);
    saveData();
}

function removeFromMainList(itemName) {
    itemName = itemName.trim();
    const itemToRemove = allItems.find(i => i.name.toLowerCase() === itemName.toLowerCase());
    if(itemToRemove) {
        itemToRemove.location = "none";
    }
    saveData();
    renderList();
}

function removeFromLater(itemName) { 
    // just needs to change location to "none", which is the same as removeFromMainList:
    removeFromMainList(itemName);
}

function renderList() {
    // mainList
    mainList.innerHTML = "";

    Object.values(cats).forEach(category => {
        const selectionItems = allItems.filter(item => item.category === category && item.location === "main");

        if(selectionItems.length === 0) {
            // none in this category
            return;
        }
        // items in allItems of this category
        selectionItems.forEach(item => {
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

    // laterList
    laterList.innerHTML = "";
    Object.values(cats).forEach(category => {
        const selectionItems = allItems.filter(item => item.category === category && item.location === "later");

        if(selectionItems.length === 0) {
            // none in this category
            return;
        }

        if(laterList.children.length === 0) {
            // selectionItems isn't empty but laterList is so far
            // i.e. we are about to add the first element to laterList
            // add header
            const header = document.createElement("h3");
            header.textContent = "Luego";
            header.style.textAlign = "center";
            laterList.appendChild(header);
        }

        for(const item of selectionItems) {
            const div = document.createElement("div");
            div.className = "list-item";
            div.classList.add("later-item");

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
                    // added deletion animation:
                    div.style.transform = `translateX(${swipeDistance > 0 ? "100%" : "-100%"})`;

                    div.style.opacity = "0";

                    setTimeout(() => {
                        removeFromLater(item.name);
                    }, 200);

                }
            });

            // X button
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "✕";
            deleteButton.className = "delete-button";
            deleteButton.addEventListener("click", () => {
                removeFromLater(item.name);
            });

            // put together and display
            const textSpan = document.createElement("span");
            textSpan.textContent = item.name;
            div.appendChild(deleteButton);
            div.appendChild(textSpan);
            laterList.appendChild(div);

        }
    });
}
renderList();

function closeModal() {
    modalOverlay.classList.add("hidden");
    document.getElementById("item-input").value = "";
    document.getElementById("quick-checkbox").checked = false;
}

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

    const isForLater = document.getElementById("for-later-checkbox").checked;
    const addToQuick = document.getElementById("quick-checkbox").checked;

    if(isForLater) {
        addToForLater(itemName, category);
    } else {
        addToMainList(itemName, category);
    }
    
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
