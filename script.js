// Complete script for Ranch Roleplay Time and Fine Calculator
// Last updated: [current date]

let charges = [];
let chargeDescriptions = [];
let selectedCharges = [];
let tooltipTimeout;
let modifiers = [
    { code: "P.C. 5101", abbr: "AA", name: "Aiding and Abetting", effect: "50% of time", description: "Consists of Aiding and Abetting, Conspiracy, and Accessory After the Fact" },
    { code: "P.C. 5102", abbr: "PSE", name: "Public Servants Enhancement", effect: "Add 60 Days", description: "USE ONLY IN FELONY CRIMES. Public Servant Refers to; Law Enforcement, Government and Doctors. Shall not apply to Capital Murder" },
    { code: "P.C. 5103", abbr: "TTS", name: "Threat to Society", effect: "Add 3 Years", description: "Decided by Judge. This status adds 3 years (3 OOC days) to overall sentence." },
    { code: "P.C. 5104", abbr: "HO", name: "Habitual Offender", effect: "Add 100 Days", description: "Decided by Judge. This status adds 100 days to overall sentence." },
    { code: "P.C. 5105", abbr: "PNO", name: "Public Nuisance Offender", effect: "Add 60 Days", description: "Decided by a Judge. This status adds 60 days to overall sentence." }
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
}

function populateDropdown(chargesToShow) {
    const dropdown = document.getElementById("charge-dropdown");
    dropdown.innerHTML = '';
    chargesToShow.forEach(charge => {
        const div = document.createElement("div");
        div.className = 'charge-item ' + getChargeClass(charge.code);
        div.innerHTML = `
            <div class="charge-info">
                <span class="charge-name">${charge.code} - ${charge.name}</span>
                <span class="charge-details">${charge.maxTime} ${charge.timeUnit}, $${charge.maxFine}</span>
            </div>
            <div class="modifier-buttons"></div>
        `;
        div.addEventListener("click", (e) => {
            if (!e.target.closest('.modifier-button')) {
                addCharge(charge);
            }
        });
        div.addEventListener("mouseover", (e) => showChargeTooltip(e, charge));
        div.addEventListener("mouseout", hideTooltip);

        const modifierButtons = div.querySelector('.modifier-buttons');
        modifiers.forEach(modifier => {
            const button = document.createElement('button');
            button.className = 'modifier-button';
            button.textContent = modifier.abbr;
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                addCharge(charge, modifier);
            });
            button.addEventListener('mouseover', (e) => {
                e.stopPropagation();
                showModifierTooltip(e, modifier);
            });
            button.addEventListener('mouseout', hideTooltip);
            modifierButtons.appendChild(button);
        });

        dropdown.appendChild(div);
    });
}

function getChargeClass(code) {
    const pcNumber = parseInt(code.split(' ')[1]);
    if (pcNumber >= 1101 && pcNumber <= 1105) return 'capital-felony';
    if (pcNumber >= 2101 && pcNumber <= 2107) return 'felony-first';
    if (pcNumber >= 2201 && pcNumber <= 2207) return 'felony-second';
    if (pcNumber >= 2301 && pcNumber <= 2312) return 'felony-third';
    if (pcNumber >= 3101 && pcNumber <= 3111) return 'misdemeanor-first';
    if (pcNumber >= 3201 && pcNumber <= 3208) return 'misdemeanor-second';
    if (pcNumber >= 3301 && pcNumber <= 3306) return 'misdemeanor-third';
    if (pcNumber >= 4101 && pcNumber <= 4103) return 'infraction';
    return '';
}

function getChargeType(chargeClass) {
    switch(chargeClass) {
        case 'capital-felony': return 'Capital Felony';
        case 'felony-first': return 'State Felony 1st Degree';
        case 'felony-second': return 'State Felony 2nd Degree';
        case 'felony-third': return 'State Felony 3rd Degree';
        case 'misdemeanor-first': return 'Misdemeanor 1st Degree';
        case 'misdemeanor-second': return 'Misdemeanor 2nd Degree';
        case 'misdemeanor-third': return 'Misdemeanor 3rd Degree';
        case 'infraction': return 'Non-Criminal Infraction';
        default: return '';
    }
}

function setupEventListeners() {
    document.getElementById('clear-selection').addEventListener('click', clearSelection);
}

function addCharge(charge, modifier = null) {
    const chargeWithModifier = { ...charge, modifier };
    selectedCharges.push(chargeWithModifier);
    updateSelectedChargesList();
    calculateTotals();
    document.getElementById('charge-search').value = '';
    document.getElementById('charge-dropdown').style.display = 'none';
}

function updateSelectedChargesList() {
    const list = document.getElementById('selected-charges-list');
    list.innerHTML = '';
    selectedCharges.forEach((charge, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="remove-charge">−</span>
            <span>${charge.code} - ${charge.name} ${charge.modifier ? `(${charge.modifier.abbr})` : ''} (${charge.maxTime} ${charge.timeUnit}, $${charge.maxFine})</span>
        `;
        li.querySelector('.remove-charge').onclick = (e) => {
            e.stopPropagation();
            removeCharge(index);
        };
        li.addEventListener("mouseover", (e) => showChargeTooltip(e, charge));
        li.addEventListener("mouseout", hideTooltip);
        list.appendChild(li);
    });
}

function showChargeTooltip(e, charge) {
    hideTooltip();
    const description = chargeDescriptions.find(desc => desc.code === charge.code)?.description;
    if (description) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.innerHTML = `
            <p class="tooltip-description">${description}</p>
            <p class="charge-type ${getChargeClass(charge.code)}">${getChargeType(getChargeClass(charge.code))}</p>
        `;
        document.body.appendChild(tooltip);
        
        const rect = e.currentTarget.getBoundingClientRect();
        tooltip.style.left = `${rect.right + 10}px`;
        tooltip.style.top = `${rect.top}px`;
        tooltip.style.display = 'block';
    }
}

function showModifierTooltip(e, modifier) {
    hideTooltip();
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip modifier-tooltip';
    tooltip.innerHTML = `
        <small>${modifier.code}</small><br>
        ${modifier.name}<br>
        Effect: ${modifier.effect}
    `;
    document.body.appendChild(tooltip);
    
    const rect = e.currentTarget.getBoundingClientRect();
    tooltip.style.left = `${rect.right + 5}px`;
    tooltip.style.top = `${rect.top}px`;
    tooltip.style.display = 'block';
}

function hideTooltip() {
    const tooltips = document.querySelectorAll('.tooltip');
    tooltips.forEach(tooltip => tooltip.remove());
}

function calculateTotals() {
    let totalDays = 0;
    let totalYears = 0;
    let totalFines = 0;
    let hutCharges = [];

    selectedCharges.forEach(charge => {
        let chargeDays = 0;
        let chargeFine = 0;

        if (charge.maxTime === 'HUT') {
            hutCharges.push(charge.code);
        } else if (charge.timeUnit === 'days') {
            chargeDays = parseInt(charge.maxTime);
        } else if (charge.timeUnit === 'years') {
            chargeDays = parseInt(charge.maxTime) * 1440; // Convert years to days
        }
        
        if (charge.maxFine !== 'N/A') {
            chargeFine = parseInt(charge.maxFine);
        }

        // Apply modifier if present
        if (charge.modifier) {
            switch(charge.modifier.code) {
                case "P.C. 5101":
                    chargeDays *= 0.5;
                    chargeFine *= 0.5;
                    break;
                case "P.C. 5102":
                    chargeDays += 60;
                    break;
                case "P.C. 5103":
                    chargeDays += 3 * 1440; // 3 years
                    break;
                case "P.C. 5104":
                    chargeDays += 100;
                    break;
                case "P.C. 5105":
                    chargeDays += 60;
                    break;
            }
        }

        totalDays += chargeDays;
        totalFines += chargeFine;
    });

    // Convert days to years based on the specified rules
    if (totalDays >= 401) {
        totalYears = Math.floor((totalDays - 301) / 100) + 1;
        totalDays = totalDays - (totalYears * 100 + 301);
    }

    // Round values
    totalDays = Math.round(totalDays);
    totalFines = Math.round(totalFines);

    updateDisplay(totalYears, totalDays, totalFines, hutCharges);
}


function updateDisplay(years, days, fines, hutCharges) {
    const timeContainer = document.getElementById('total-time-container');
    timeContainer.innerHTML = '';

    const timeElement = document.createElement('p');
    const totalDays = years * 1440 + days;
    timeElement.innerHTML = `Total Time: <span id="total-time">${years} years, ${days} days</span> <span class="total-days">(${totalDays} days)</span>`;
    timeElement.querySelector('#total-time').className = years >= 7 ? 'exceeded' : '';
    
    if (years >= 7) {
        const limitExceeded = document.createElement('span');
        limitExceeded.className = 'limit-exceeded';
        limitExceeded.innerHTML = ' &#9432;';
        limitExceeded.title = 'Exceeds 7 year limit';
        timeElement.querySelector('#total-time').appendChild(limitExceeded);
    }

    timeContainer.appendChild(timeElement);

    const fineElement = document.getElementById('total-fines');
    fineElement.textContent = `$${fines}`;
    fineElement.className = fines >= 300 ? 'exceeded' : '';
    
    if (fines >= 300) {
        const limitExceeded = document.createElement('span');
        limitExceeded.className = 'limit-exceeded';
        limitExceeded.innerHTML = ' &#9432;';
        limitExceeded.title = 'Exceeds $300 limit';
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
    calculateTotals();
    hideTooltip();
}
