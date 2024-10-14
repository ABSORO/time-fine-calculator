let charges = [];
let chargeDescriptions = [];

// Fetch charges data
Promise.all([
    fetch('charges.json').then(response => response.json()),
    fetch('charge_descriptions.json').then(response => response.json())
])
.then(([chargesData, descriptionsData]) => {
    charges = chargesData.charges;
    chargeDescriptions = descriptionsData;
    populateChargeDropdown();
})
.catch(error => console.error('Error loading data:', error));

// Modify the populateChargeDropdown function
function populateChargeDropdown() {
    const dropdown = document.getElementById('charge-dropdown');
    charges.forEach(charge => {
        const option = document.createElement('option');
        option.value = charge.code;
        option.textContent = `${charge.code} - ${charge.name}`;
        dropdown.appendChild(option);
    });
}

// Add an event listener to show description
document.getElementById('charge-dropdown').addEventListener('change', (e) => {
    const descriptionBox = document.getElementById('charge-description');
    const selectedCode = e.target.value;
    const description = chargeDescriptions.find(desc => desc.code === selectedCode)?.description;
    descriptionBox.textContent = description || 'No description available.';
});
