// Complete script for Ranch Roleplay Time and Fine Calculator
// Last updated: [current date]

let charges = [];
let chargeDescriptions = [];
let selectedCharges = [];
let tooltipTimeout;
let modifiers = [
    { code: "P.C. 5101", name: "Aiding and Abetting", effect: "50% of time", description: "Consists of Aiding and Abetting, Conspiracy, and Accessory After the Fact" },
    { code: "P.C. 5102", name: "Public Servants Enhancement", effect: "Add 60 Days", description: "USE ONLY IN FELONY CRIMES. Public Servant Refers to; Law Enforcement, Government and Doctors. Shall not apply to Capital Murder" },
    { code: "P.C. 5103", name: "Threat to Society", effect: "Add 3 Years", description: "Decided by Judge. This status adds 3 years (3 OOC days) to overall sentence." },
    { code: "P.C. 5104", name: "Habitual Offender", effect: "Add 100 Days", description: "Decided by Judge. This status adds 100 days to overall sentence." },
    { code: "P.C. 5105", name: "Public Nuisance Offender", effect: "Add 60 Days", description: "Decided by a Judge. This status adds 60 days to overall sentence." }
];

// Load JSON data
Promise.all([
    fetch('charges.json').then(response => response.json()),
    fetch('charge_descriptions.json').then(response => response.json())
])
.then(([chargesData, descriptionsData]) => {
    charges = chargesData.charges;
    chargeDescriptions = descriptionsData;
    setupAutocomplete();
    setupEventListeners();
    setupModifiers();
})
.catch(error => console.error('Error loading data:', error));

function setupAutocomplete() {
    const input = document.getElementById("charge-search");
    const dropdown = document.getElementById("charge-dropdown");

    // Populate dropdown initially
    populateDropdown(charges);

    // Toggle dropdown visibility
    input.addEventListener("focus", () => {
        dropdown.style.display = "block";
    });

    // Filter charges on input
    input.addEventListener("input", function() {
        const filteredCharges = charges.filter(charge => 
            charge.code.toLowerCase().includes(this.value.toLowerCase()) || 
            charge.name.toLowerCase().includes(this.value.toLowerCase())
        );
        populateDropdown(filteredCharges);
    });

    // Handle click outside
    document.addEventListener("click", function(e) {
        if (!dropdown.contains(e.target) && e.target !== input) {
            dropdown.style.display = "none";
        }
        hideTooltip(); // Hide tooltip when clicking outside
    });

    function populateDropdown(chargesToShow) {
        dropdown.innerHTML = '';
        chargesToShow.forEach(charge => {
            const div = document.createElement("div");
            div.innerHTML = `
                <span>${charge.code} - ${charge.name}</span>
                <span class="charge-details">${charge.maxTime} ${charge.timeUnit}, $${charge.maxFine}</span>
            `;
            div.addEventListener("click", function() {
                input.value = `${charge.code} - ${charge.name}`;
                dropdown.style.display = "none";
                addCharge(charge);
                hideTooltip();
            });
            div.addEventListener("mouseover", function(e) {
                showTooltip(e, charge.code);
            });
            div.addEventListener("mouseout", hideTooltip);
            dropdown.appendChild(div);
        });
    }
}

function setupEventListeners() {
    document.getElementById('clear-selection').addEventListener('click', clearSelection);
}

function setupModifiers() {
    const modifierContainer = document.getElementById('modifier-container');
    modifiers.forEach(modifier => {
        const div = document.createElement('div');
        div.className = 'modifier-item';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'modifier';
        checkbox.value = modifier.code;
        checkbox.id = modifier.code;
        checkbox.addEventListener('change', calculateTotals);
        const label = document.createElement('label');
        label.htmlFor = modifier.code;
        label.innerHTML = `${checkbox.outerHTML} ${modifier.code} - ${modifier.name}`;
        const effect = document.createElement('div');
        effect.className = 'modifier-effect';
        effect.textContent = `Effect: ${modifier.effect}`;
        const description = document.createElement('p');
        description.className = 'modifier-description';
        description.textContent = modifier.description;
        div.appendChild(label);
        div.appendChild(effect);
        div.appendChild(description);
        modifierContainer.appendChild(div);
    });
}

function addCharge(selectedCharge) {
    if (selectedCharge) {
        selectedCharges.push(selectedCharge);
        updateSelectedChargesList();
        calculateTotals();
        document.getElementById('charge-search').value = ''; // Clear the input after adding
    }
}

function updateSelectedChargesList() {
    const list = document.getElementById('selected-charges-list');
    list.innerHTML = '';
    selectedCharges.forEach((charge, index) => {
        const li = document.createElement('li');
        
        // Add remove button
        const removeButton = document.createElement('span');
        removeButton.textContent = '−';
        removeButton.className = 'remove-charge';
        removeButton.onclick = (e) => {
            e.stopPropagation(); // Prevent event from bubbling up
            removeCharge(index);
            hideTooltip(); // Hide tooltip when charge is removed
        };
        li.appendChild(removeButton);
        
        // Add charge text
        const chargeText = document.createElement('span');
        chargeText.textContent = `${charge.code} - ${charge.name} (${charge.maxTime} ${charge.timeUnit}, $${charge.maxFine})`;
        li.appendChild(chargeText);
        
        // Add hover functionality
        li.addEventListener("mouseover", function(e) {
            showTooltip(e, charge.code);
        });
        li.addEventListener("mouseout", hideTooltip);
        
        list.appendChild(li);
    });
}

function showTooltip(e, chargeCode) {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = setTimeout(() => {
        hideTooltip(); // Hide any existing tooltip
        const description = chargeDescriptions.find(desc => desc.code === chargeCode)?.description;
        if (description) {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = description;
            document.body.appendChild(tooltip);
            
            const rect = e.currentTarget.getBoundingClientRect();
            tooltip.style.left = `${rect.right + 10}px`;
            tooltip.style.top = `${rect.top}px`;
            tooltip.style.display = 'block';
        }
    }, 100); // 100ms delay
}

function hideTooltip() {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = setTimeout(() => {
        const tooltip = document.querySelector('.tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }, 100); // 100ms delay
}

function calculateTotals() {
    let totalDays = 0;
    let totalYears = 0;
    let totalFines = 0;
    let hutCharges = [];

    selectedCharges.forEach(charge => {
        if (charge.maxTime === 'HUT') {
            hutCharges.push(charge.code);
        } else if (charge.timeUnit === 'days') {
            totalDays += parseInt(charge.maxTime);
        } else if (charge.timeUnit === 'years') {
            totalYears += parseInt(charge.maxTime);
        }
        if (charge.maxFine !== 'N/A') {
            totalFines += parseInt(charge.maxFine);
        }
    });

    // Apply modifiers
    const activeModifiers = Array.from(document.querySelectorAll('input[name="modifier"]:checked'))
        .map(input => modifiers.find(m => m.code === input.value));
    
    activeModifiers.forEach(modifier => {
        if (modifier.code === "P.C. 5101") {
            totalDays *= 0.5;
            totalYears *= 0.5;
            totalFines *= 0.5;
        } else if (modifier.code === "P.C. 5102") {
            totalDays += 60;
        } else if (modifier.code === "P.C. 5103") {
            totalYears += 3;
        } else if (modifier.code === "P.C. 5104") {
            totalDays += 100;
        } else if (modifier.code === "P.C. 5105") {
            totalDays += 60;
        }
    });

    // Convert days to years if necessary
    if (totalDays >= 401) {
        let extraYears = Math.floor((totalDays - 301) / 100);
        totalYears += extraYears;
        totalDays = totalDays - (extraYears * 100 + 301);
    }

    // Round values
    totalDays = Math.round(totalDays);
    totalYears = Math.round(totalYears);
    totalFines = Math.round(totalFines);

    // Update display
    const timeContainer = document.getElementById('total-time-container');
    
    // Remove any existing HUT messages
    const existingHutMessages = timeContainer.querySelectorAll('.hut-message');
    existingHutMessages.forEach(msg => msg.remove());

    // Update total time
    const timeElement = document.getElementById('total-time');
    timeElement.textContent = `${totalYears} years, ${totalDays} days`;
    
    // Add HUT message if applicable
    if (hutCharges.length > 0) {
        const hutElement = document.createElement('p');
        hutElement.textContent = 'HUT charges detected: ' + hutCharges.join(', ');
        hutElement.style.color = 'red';
        hutElement.className = 'hut-message';
        timeContainer.insertBefore(hutElement, timeContainer.firstChild);
    }

    // Update total fines
    document.getElementById('total-fines').textContent = `$${totalFines}`;
}

function removeCharge(index) {
    selectedCharges.splice(index, 1);
    updateSelectedChargesList();
    calculateTotals();
}

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
    hideTooltip(); // Hide tooltip when selection is cleared

    // Uncheck all modifiers
    document.querySelectorAll('input[name="modifier"]').forEach(checkbox => checkbox.checked = false);
}
