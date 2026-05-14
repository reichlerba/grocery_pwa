//  Unused for now...

export function saveList(list) {
    localStorage.setItem("grocery", JSON.stringify(list));
}

export function loadList() {
    return JSON.parse(localStorage.getItem("grocery")) || [];
}
