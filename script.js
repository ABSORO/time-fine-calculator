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
// Add charge to selection
function addCharge() {
    const dropdown = document.getElementById('charge-dropdown');
    const selectedCharge = charges.find(charge => charge.code === dropdown.value);
    if (selectedCharge) {
        selectedCharges.push(selectedCharge);
        updateSelectedChargesList();
        calculateTotals();
        
        // Display the description
        const description = chargeDescriptions.find(desc => desc.code === selectedCharge.code)?.description;
        document.getElementById('charge-description').textContent = description || 'No description available.';
    }
}

// Update selected charges list
function updateSelectedChargesList() {
    const list = document.getElementById('selected-charges-list');
    list.innerHTML = '';
    selectedCharges.forEach((charge, index) => {
        const li = document.createElement('li');
        li.textContent = `${charge.code} - ${charge.name} (${charge.maxTime} ${charge.timeUnit}, $${charge.maxFine})`;
        
        // Add remove button
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.onclick = () => removeCharge(index);
        li.appendChild(removeButton);
        
        list.appendChild(li);
    });
}

function checkForHUTCharges() {
    const hutCharges = selectedCharges.filter(charge => charge.maxTime === 'HUT');
    if (hutCharges.length > 0) {
        return 'HUT charges detected: ' + hutCharges.map(charge => charge.code).join(', ');
    }
    return '';
}

// Calculate totals
function calculateTotals() {
    let totalDays = 0;
    let totalYears = 0;
    let totalFines = 0;

    selectedCharges.forEach(charge => {
        if (charge.timeUnit === 'days') {
            totalDays += parseInt(charge.maxTime);
        } else if (charge.timeUnit === 'years') {
            if (charge.maxTime !== 'HUT') {
                totalYears += parseInt(charge.maxTime);
            }
        }
        if (charge.maxFine !== 'N/A') {
            totalFines += parseInt(charge.maxFine);
        }
    });

    // Convert days to years if necessary
    if (totalDays >= 401) {
        let extraYears = Math.floor((totalDays - 301) / 100);
        totalYears += extraYears;
        totalDays = totalDays - (extraYears * 100 + 301);
    }

    // Check for HUT charges
    const hutMessage = checkForHUTCharges();

    // Update display
    const timeContainer = document.getElementById('total-time-container');
    const timeElement = document.getElementById('total-time');
    
    // Remove any existing HUT messages
    const existingHutMessages = timeContainer.querySelectorAll('.hut-message');
    existingHutMessages.forEach(msg => msg.remove());

    timeElement.textContent = `${totalYears} years, ${totalDays} days`;
    if (hutMessage) {
        const hutElement = document.createElement('div');
        hutElement.textContent = hutMessage;
        hutElement.style.color = 'red';
        hutElement.className = 'hut-message';
        timeContainer.insertBefore(hutElement, timeElement);
    }

    document.getElementById('total-fines').textContent = `$${totalFines}`;
}
 
// Remove charge
function removeCharge(index) {
    selectedCharges.splice(index, 1);
    updateSelectedChargesList();
    calculateTotals();
}

// Clear selection
function clearSelection() {
    selectedCharges = [];
    updateSelectedChargesList();
    
    // Clear the total time and fines display
    document.getElementById('total-time').textContent = '0 years, 0 days';
    document.getElementById('total-fines').textContent = '$0';
    
    // Remove any existing HUT messages
    const timeContainer = document.getElementById('total-time-container');
    const hutMessages = timeContainer.querySelectorAll('.hut-message');
    hutMessages.forEach(msg => msg.remove());
    
    document.getElementById('charge-description').textContent = '';
}

// Search charges
function searchCharges() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const dropdown = document.getElementById('charge-dropdown');
    
    dropdown.innerHTML = '<option value="">Select a charge</option>';
    
    charges.filter(charge => 
        charge.code.toLowerCase().includes(searchTerm) || 
        charge.name.toLowerCase().includes(searchTerm)
    ).forEach(charge => {
        const option = document.createElement('option');
        option.value = charge.code;
        option.textContent = `${charge.code} - ${charge.name}`;
        dropdown.appendChild(option);
    });
}

