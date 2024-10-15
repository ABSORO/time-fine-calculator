// Complete script for Ranch Roleplay Time and Fine Calculator
// Last updated: [current date]

let charges = [];
let chargeDescriptions = [];
let selectedCharges = [];
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

    populateDropdown(charges);

    input.addEventListener("focus", () => dropdown.style.display = "block");
    input.addEventListener("input", () => {
        const filteredCharges = charges.filter(charge => 
            charge.code.toLowerCase().includes(input.value.toLowerCase()) || 
            charge.name.toLowerCase().includes(input.value.toLowerCase())
        );
        populateDropdown(filteredCharges);
    });

    document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target) && e.target !== input) {
            dropdown.style.display = "none";
        }
        hideTooltip();
    });

    function populateDropdown(chargesToShow) {
        dropdown.innerHTML = '';
        chargesToShow.forEach(charge => {
            const div = document.createElement("div");
            div.innerHTML = `
                <span>${charge.code} - ${charge.name}</span>
                <span class="charge-details">${charge.maxTime} ${charge.timeUnit}, $${charge.maxFine}</span>
            `;
            div.addEventListener("click", () => {
                input.value = `${charge.code} - ${charge.name}`;
                dropdown.style.display = "none";
                addCharge(charge);
            });
            div.addEventListener("mouseover", (e) => showTooltip(e, charge.code));
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
        div.innerHTML = `
            <label>
                <input type="checkbox" name="modifier" value="${modifier.code}" id="${modifier.code}">
                ${modifier.code} - ${modifier.name}
            </label>
            <div class="modifier-effect">${modifier.effect}</div>
            <div class="modifier-description">${modifier.description}</div>
        `;
        div.querySelector('input').addEventListener('change', calculateTotals);
        modifierContainer.appendChild(div);
    });
}

function addCharge(selectedCharge) {
    if (selectedCharge) {
        selectedCharges.push(selectedCharge);
        updateSelectedChargesList();
        calculateTotals();
        document.getElementById('charge-search').value = '';
    }
}

function updateSelectedChargesList() {
    const list = document.getElementById('selected-charges-list');
    list.innerHTML = '';
    selectedCharges.forEach((charge, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="remove-charge">−</span>
            <span>${charge.code} - ${charge.name} (${charge.maxTime} ${charge.timeUnit}, $${charge.maxFine})</span>
        `;
        li.querySelector('.remove-charge').onclick = (e) => {
            e.stopPropagation();
            removeCharge(index);
        };
        li.addEventListener("mouseover", (e) => showTooltip(e, charge.code));
        li.addEventListener("mouseout", hideTooltip);
        list.appendChild(li);
    });
}

function showTooltip(e, chargeCode) {
    hideTooltip();
    const description = chargeDescriptions.find(desc => desc.code === chargeCode)?.description;
    if (description) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = description;
        document.body.appendChild(tooltip);
        
        const rect = e.target.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        
        tooltip.style.left = `${rect.right + 10}px`;
        tooltip.style.top = `${rect.top + scrollY}px`;
        tooltip.style.display = 'block';
    }
}

function hideTooltip() {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) tooltip.remove();
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

    const activeModifiers = Array.from(document.querySelectorAll('input[name="modifier"]:checked'))
        .map(input => modifiers.find(m => m.code === input.value));
    
    activeModifiers.forEach(modifier => {
        switch(modifier.code) {
            case "P.C. 5101":
                totalDays *= 0.5;
                totalYears *= 0.5;
                totalFines *= 0.5;
                break;
            case "P.C. 5102":
                totalDays += 60;
                break;
            case "P.C. 5103":
                totalYears += 3;
                break;
            case "P.C. 5104":
                totalDays += 100;
                break;
            case "P.C. 5105":
                totalDays += 60;
                break;
        }
    });

    if (totalDays >= 401) {
        let extraYears = Math.floor((totalDays - 301) / 100);
        totalYears += extraYears;
        totalDays = totalDays - (extraYears * 100 + 301);
    }

    totalDays = Math.round(totalDays);
    totalYears = Math.round(totalYears);
    totalFines = Math.round(totalFines);

    updateDisplay(totalYears, totalDays, totalFines, hutCharges);
}

function updateDisplay(years, days, fines, hutCharges) {
    const timeContainer = document.getElementById('total-time-container');
    timeContainer.querySelectorAll('.hut-message').forEach(msg => msg.remove());

    document.getElementById('total-time').textContent = `${years} years, ${days} days`;
    document.getElementById('total-fines').textContent = `$${fines}`;

    if (hutCharges.length > 0) {
        const hutElement = document.createElement('p');
        hutElement.textContent = 'HUT charges detected: ' + hutCharges.join(', ');
        hutElement.style.color = 'red';
        hutElement.className = 'hut-message';
        timeContainer.insertBefore(hutElement, timeContainer.firstChild);
    }
}

function removeCharge(index) {
    selectedCharges.splice(index, 1);
    updateSelectedChargesList();
    calculateTotals();
}

function clearSelection() {
    selectedCharges = [];
    updateSelectedChargesList();
    document.getElementById('total-time').textContent = '0 years, 0 days';
    document.getElementById('total-fines').textContent = '$0';
    document.getElementById('total-time-container').querySelectorAll('.hut-message').forEach(msg => msg.remove());
    hideTooltip();
    document.querySelectorAll('input[name="modifier"]').forEach(checkbox => checkbox.checked = false);
}
