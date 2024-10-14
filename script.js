let charges = [];
let chargeDescriptions = [];
let selectedCharges = [];

// Load JSON data
Promise.all([
    fetch('charges.json').then(response => response.json()),
    fetch('charge_descriptions.json').then(response => response.json())
])
.then(([chargesData, descriptionsData]) => {
    charges = chargesData.charges;
    chargeDescriptions = descriptionsData;
    populateChargeDropdown();
    setupEventListeners();
})
.catch(error => console.error('Error loading data:', error));

// Populate charge dropdown
function populateChargeDropdown() {
    const dropdown = document.getElementById('charge-dropdown');
    charges.forEach(charge => {
        const option = document.createElement('option');
        option.value = charge.code;
        option.textContent = `${charge.code} - ${charge.name}`;
        dropdown.appendChild(option);
    });
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('add-charge').addEventListener('click', addCharge);
    document.getElementById('clear-selection').addEventListener('click', clearSelection);
    document.getElementById('search-input').addEventListener('input', searchCharges);
}

// Functions to be implemented
function addCharge() {
    // TODO: Implement adding a charge
}

function clearSelection() {
    // TODO: Implement clearing the selection
}

function searchCharges() {
    // TODO: Implement charge search
}

function updateSelectedChargesList() {
    // TODO: Implement updating the selected charges list
}

function calculateTotals() {
    // TODO: Implement calculation of total time and fines
}
