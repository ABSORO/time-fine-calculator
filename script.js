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
    setupAutocomplete();
    setupEventListeners();
})
.catch(error => console.error('Error loading data:', error));

function setupAutocomplete() {
    const input = document.getElementById("charge-search");
    const autocompleteList = document.getElementById("autocomplete-list");
    let currentFocus;

    input.addEventListener("input", function(e) {
        const val = this.value;
        closeAllLists();
        if (!val) { return false; }
        currentFocus = -1;

        const filteredCharges = charges.filter(charge => 
            charge.code.toLowerCase().includes(val.toLowerCase()) || 
            charge.name.toLowerCase().includes(val.toLowerCase())
        );

        filteredCharges.forEach(charge => {
            const div = document.createElement("DIV");
            div.innerHTML = `<strong>${charge.code}</strong> - ${charge.name}`;
            div.addEventListener("click", function(e) {
                input.value = `${charge.code} - ${charge.name}`;
                closeAllLists();
            });
            div.addEventListener("mouseover", function(e) {
                showTooltip(e, charge.code);
            });
            div.addEventListener("mouseout", hideTooltip);
            autocompleteList.appendChild(div);
        });
    });

    input.addEventListener("keydown", function(e) {
        let x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) {
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) {
            e.preventDefault();
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            }
        }
    });

    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
        for (let i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(elmnt) {
        const x = document.getElementsByClassName("autocomplete-items");
        for (let i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != input) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }

    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}

function setupEventListeners() {
    document.getElementById('add-charge').addEventListener('click', addCharge);
    document.getElementById('clear-selection').addEventListener('click', clearSelection);
}

function addCharge() {
    const input = document.getElementById('charge-search');
    const selectedCharge = charges.find(charge => 
        `${charge.code} - ${charge.name}` === input.value
    );
    if (selectedCharge) {
        selectedCharges.push(selectedCharge);
        updateSelectedChargesList();
        calculateTotals();
        input.value = ''; // Clear the input after adding
    }
}

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
        
        // Add hover functionality
        li.addEventListener("mouseover", function(e) {
            showTooltip(e, charge.code);
        });
        li.addEventListener("mouseout", hideTooltip);
        
        list.appendChild(li);
    });
}

function showTooltip(e, chargeCode) {
    const description = chargeDescriptions.find(desc => desc.code === chargeCode)?.description;
    if (description) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = description;
        document.body.appendChild(tooltip);
        
        const rect = e.target.getBoundingClientRect();
        tooltip.style.left = `${rect.right + 10}px`;
        tooltip.style.top = `${rect.top}px`;
        tooltip.style.display = 'block';
    }
}

function hideTooltip() {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
        tooltip.remove();
    }
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
}
