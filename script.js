// Complete script for Ranch Roleplay Time and Fine Calculator
// Last updated: [current date]

let charges = [];
let chargeDescriptions = [];
let selectedCharges = [];
let tooltipTimeout;

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
            div.textContent = `${charge.code} - ${charge.name}`;
            div.addEventListener("click", function() {
                input.value = this.textContent;
                dropdown.style.display = "none";
                addCharge(charge);
                hideTooltip(); // Hide tooltip when charge is selected
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

    // Convert days to years if necessary
    if (totalDays >= 401) {
        let extraYears = Math.floor((totalDays - 301) / 100);
        totalYears += extraYears;
        totalDays = totalDays - (extraYears * 100 + 301);
    }

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
        hutElement.className
