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
                hideTooltip();
            });
            div.addEventListener("mouseover", (e) => showTooltip(e, charge.code, true));
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
            <div class="modifier-header">${modifier.code} - ${modifier.name}</div>
            <div class="modifier-effect">Effect: ${modifier.effect}</div>
        `;
        div.addEventListener('click', () => {
            div.classList.toggle('active');
            calculateTotals();
        });
        div.addEventListener('mouseover', (e) => showTooltip(e, modifier.code, false));
        div.addEventListener('mouseout', hideTooltip);
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
        li.addEventListener("mouseover", (e) => showTooltip(e, charge.code, true));
        li.addEventListener("mouseout", hideTooltip);
        list.appendChild(li);
    });
}

function showTooltip(e, code, isCharge) {
    hideTooltip();
    const description = isCharge 
        ? chargeDescriptions.find(desc => desc.code === code)?.description
        : modifiers.find(mod => mod.code === code)?.description;
    if (description) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = description;
        document.body.appendChild(tooltip);
        
        const rect = e.currentTarget.getBoundingClientRect();
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

    const activeModifiers = Array.from(document.querySelectorAll('.modifier-item.active'))
        .map(div => modifiers.find(m => div.textContent.includes(m.code)));
    
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
    const fineContainer = document.getElementById('total-fines-container');
    
    timeContainer.querySelectorAll('.hut-message, .limit-exceeded').forEach(msg => msg.remove());
    fineContainer.querySelectorAll('.limit-exceeded').forEach(msg => msg.remove());

    const timeElement = document.getElementById('total-time');
    timeElement.textContent = `${years} years, ${days} days`;
    timeElement.className = years >= 7 ? 'exceeded' : '';
    
    if (years >= 7) {
        const limitExceeded = document.createElement('span');
        limitExceeded.className = 'limit-exceeded';
        limitExceeded.innerHTML = ' &#9432;';
        limitExceeded.title = '7 years max';
        timeElement.appendChild(limitExceeded);
    }

    const fineElement = document.getElementById('total-fines');
    fineElement.textContent = `$${fines}`;
    fineElement.className = fines >= 300 ? 'exceeded' : '';
    
    if (fines >= 300) {
        const limitExceeded = document.createElement('span');
        limitExceeded.className = 'limit-exceeded';
        limitExceeded.innerHTML = ' &#9432;';
        limitExceeded.title = '$300 max';
        fineElement.appendChild(limitExceeded);
    }

    if (hutCharges.length > 0) {
        const hutElement = document.createElement('p');
        hutElement.textContent = 'HUT charges detected: ' + hutCharges.join(', ');
        hutElement.className = 'hut-message';
        timeContainer.appendChild(hutElement);
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
    document.getElementById('total-time').className = '';
    document.getElementById('total-fines').textContent = '$0';
    document.getElementById('total-fines').className = '';
    
    const timeContainer = document.getElementById('total-time-container');
    timeContainer.querySelectorAll('.hut-message, .limit-exceeded').forEach(msg => msg.remove());
    
    const fineContainer = document.getElementById('total-fines-container');
    fineContainer.querySelectorAll('.limit-exceeded').forEach(msg => msg.remove());
    
    hideTooltip();
    document.querySelectorAll('.modifier-item').forEach(item => item.classList.remove('active'));
}
