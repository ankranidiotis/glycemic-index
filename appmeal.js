let db;
const meal = []; // Array για το γεύμα (τροφές + ποσότητες + μονάδες)

async function initSQL() {
    try {
        // Check if initSqlJs is defined
        if (typeof initSqlJs === "undefined") {
            console.error("initSqlJs is not defined!");
            return;  // Exit if the function is not available
        }

        // Initialize sql.js
        const SQL = await initSqlJs({
            locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.6.0/dist/${file}`
        });

        // Fetch the SQLite database file
        // The timestamp is adding a unique signature and the updated database is loaded 
        // all the time which prevents browser cache to load an old version of the database. 
        const response = await fetch('assets/food_database.sqlite?' + new Date().getTime());
        
        if (!response.ok) {
            throw new Error('Failed to fetch the database file');
        }

        const buffer = await response.arrayBuffer();  // Read the file into ArrayBuffer
        db = new SQL.Database(new Uint8Array(buffer));  // Load the database from the ArrayBuffer

        loadFoods();  // Populate the dropdown with food names
        loadUnits();  // Populate the units dropdown
    } catch (error) {
        console.error('Error loading the database:', error);  // Catch and log any errors
    }
}

// Function to populate the dropdown with food names from the database
function loadFoods() {
    const query = "SELECT NAME FROM FOOD";  
    const result = db.exec(query)[0];  // Execute the query to fetch the food names

    if (!result || !result.values || result.values.length === 0) {
        console.error("No data found in the database.");
        return;  // If no data found, exit the function
    }

    const foodSelect = document.getElementById("food-select");

    // Clear the dropdown before adding new items
    if (foodSelect) {
        foodSelect.innerHTML = "";

        // Add the default option (blank and disabled)
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Επιλέξτε τροφή:";
        defaultOption.disabled = true;
        defaultOption.selected = true;
        foodSelect.appendChild(defaultOption);

        // Add each food name to the dropdown as an option
        result.values.forEach(row => {
            const option = document.createElement("option");
            option.value = row[0];  // The value of the option is the food name
            option.textContent = row[0];  // The displayed text is the food name
            foodSelect.appendChild(option);
        });
    }
}

// Function to populate the units dropdown 
async function loadUnits() {
  try {
    const res = db.exec(`SELECT MEASURER FROM MEASURE ORDER BY MEASURER`);

    const select = document.getElementById('unit');
    // Διατήρησε το placeholder, αφαίρεσε τις παλιές επιλογές
    select.querySelectorAll('option:not([disabled])').forEach(o => o.remove());

    if (!res.length || !res[0].values.length) return;

    res[0].values.forEach(([measurer]) => {
      const opt = document.createElement('option');
      opt.value = measurer;
      opt.textContent = measurer;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('Failed to load units:', err);
  }
}

// κάλεσέ το στο init σου αφού φορτώσει η DB
function repopulateUnits(units) {
  const select = document.getElementById('unit');
  if (!select) return;

  const prev = select.value;
  // κράτα το placeholder, καθάρισε τα υπόλοιπα
  select.querySelectorAll('option:not([disabled])').forEach(o => o.remove());

  units.forEach(measurer => {
    const opt = document.createElement('option');
    opt.value = measurer;
    opt.textContent = measurer;
    select.appendChild(opt);
  });

  // αν η προηγούμενη επιλογή υπάρχει ακόμη, κράτησέ την
  if (units.includes(prev)) select.value = prev;
}

function loadAllUnits() {
  const res = db.exec(`
    SELECT DISTINCT MEASURER
    FROM MEASURE
    ORDER BY MEASURER COLLATE NOCASE
  `);
  const units = (res[0]?.values || []).map(([m]) => m);
  repopulateUnits(units);
}

function ensureGrams(units) {
  const set = new Set((units || []).map(String));
  set.add('γρ.'); // <-- πάντα πρόσθεσε γραμμάρια
  // φέρε το 'γρ.' πρώτο, μετά αλφαβητικά
  return Array.from(set).sort((a, b) => (a === 'γρ.' ? -1 : b === 'γρ.' ? 1 : a.localeCompare(b, 'el', {sensitivity: 'base'})));
}

function filterUnitsByFood(foodName) {
  if (!db || !foodName) return;

  const res = db.exec(`
    SELECT DISTINCT m.MEASURER
    FROM MEASURE m
    INNER JOIN CONVERSION c ON c.MEASURER = m.MEASURER
    WHERE c.FOODNAME = ?
    ORDER BY m.MEASURER COLLATE NOCASE
  `, [foodName]);

  const units = (res[0]?.values || []).map(([m]) => m);
  repopulateUnits(ensureGrams(units)); // <-- πάντα θα έχει 'g'
}


// σύνδεση με το dropdown τροφής
document.getElementById('food-select').addEventListener('change', (e) => {
  const foodName = e.target.value;
  filterUnitsByFood(foodName);
});

// Προσθήκη τροφής στο γεύμα
document.getElementById("add-food").addEventListener("click", function() {
    const foodName = document.getElementById("food-select").value;
    const quantity = parseFloat(document.getElementById("quantity").value);
    const unit = document.getElementById("unit").value;

    if (foodName && quantity > 0 && unit) {
        meal.push({ foodName, quantity, unit});

        // Εμφάνιση τροφής στο γεύμα
        const mealList = document.getElementById("meal-list");
        const listItem = document.createElement("li");
        listItem.textContent = `${foodName} - ${quantity} ${unit}`;
        mealList.appendChild(listItem);

        // Καθαρισμός του πεδίου ποσότητας
        document.getElementById("quantity").value = "";  // Reset to default value
    }
});

// Υπολογισμός GL του γεύματος
document.getElementById("calculate-gl").addEventListener("click", function() {
    let totalGL = 0;

    meal.forEach(item => {
        const result = db.exec(`SELECT GLYCEMIC_INDEX, CARBS_PER_100G FROM FOOD WHERE NAME = ?`, [item.foodName])[0];

        if (result && result.values.length > 0) {
            const glycemicIndex = result.values[0][0];
            const carbsPer100g = result.values[0][1];

            // Αν οι μονάδες δεν είναι γραμμάρια,
            if (item.unit !== 'γρ.'){
                const conversionResult = db.exec(`
                    SELECT TOGRAMS
                    FROM CONVERSION
                    WHERE FOODNAME = ? AND MEASURER = ?
                `, [item.foodName, item.unit])[0];

                if (conversionResult && conversionResult.values.length > 0){
                    const tograms = conversionResult.values[0][0];
                    item.quantity = tograms * item.quantity; // το νέο quantity είναι σε γρ.
                    item.unit = 'γρ.';
                }
            }

            // Υπολογισμός του GL για τη συγκεκριμένη τροφή
            const gl = (carbsPer100g * item.quantity / 100) * glycemicIndex /100;

            totalGL += gl;
        }
    });

    //////// Εμφάνιση του συνολικού GL ////////////////////

    // Add badge
    const glElement = document.getElementById("total-gl");
    glElement.classList.add("badge", "fs-6");

    if (totalGL <= 10) {
        // Low GL (green)
        glElement.classList.add("bg-success");  
    } else if (totalGL > 10 && totalGL < 20) {
        // Medium GL (orange)
        glElement.classList.add("bg-warning"); 
    } else {
        // High GL (red)
        glElement.classList.add("bg-danger");  
    }

    // Set the GL value as the badge content with one decimal place
    glElement.textContent = totalGL.toFixed(1);

});

document.getElementById('reset-meal').addEventListener('click', () => {
  if (!confirm('Θέλεις σίγουρα να ξεκινήσεις νέο γεύμα;')) return;
  window.location.reload(); 
});

// Initialize the database and populate the dropdown when the page loads
window.addEventListener('load', initSQL);


// Activate all popovers
document.addEventListener('DOMContentLoaded', function () {
  const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
  [...popoverTriggerList].forEach(el => new bootstrap.Popover(el));
});


//////////////////////////////// Dark Mode ///////////////////////////////////////

// Toggle dark mode
document.getElementById('dark-mode-toggle').addEventListener('click', function() {
    // Toggle the 'dark-mode' class on the body and other elements
    document.body.classList.toggle('dark-mode');
    document.querySelector('.container').classList.toggle('dark-mode');

    const cards = document.querySelectorAll('.card');
    if (cards){
        cards.forEach(card => {
            card.classList.toggle('dark-mode');
        });
    }

    const labels = document.querySelectorAll('.form-label');
    if (labels){
        labels.forEach(label => {
            label.classList.toggle('dark-mode');
        });
    }

    document.querySelector('.form-select').classList.toggle('dark-mode');
    document.querySelector('.btn').classList.toggle('dark-mode');

    const icon = document.createElement('i');

    // Change the button text based on the current mode
    if (document.body.classList.contains('dark-mode')) {
        icon.className = 'bi bi-sun-fill';  // Set class for sun icon
        localStorage.setItem('dark-mode', 'enabled'); // Save preference
    } else {
        icon.className = 'bi bi-moon-stars-fill';  // Set class for moon icon
        localStorage.setItem('dark-mode', 'disabled'); // Save preference
    }

    // Clear existing content and append the new icon
    this.innerHTML = '';  // Clear current content
    this.appendChild(icon);  // Append the new icon
});

// Check for stored dark mode preference and apply it on page load
if (localStorage.getItem('dark-mode') === 'enabled') {
    document.body.classList.add('dark-mode');
    document.querySelector('.container').classList.add('dark-mode');

    const cards = document.querySelectorAll('.card');
    if (cards){
        cards.forEach(card => {
            card.classList.add('dark-mode');
        });
    }

    const formSelectElement = document.querySelector('.form-select');
    if (formSelectElement) {
        formSelectElement.classList.add('dark-mode');
    }

    const labels = document.querySelectorAll('.form-label');
    if (labels){
        labels.forEach(label => {
            label.classList.add('dark-mode');
        });
    }

    document.querySelector('.btn').classList.add('dark-mode');
    document.getElementById('dark-mode-toggle').innerHTML = '';
    const icon = document.createElement('i');
    icon.className = 'bi bi-sun-fill';  // Set class for sun icon
    document.getElementById('dark-mode-toggle').appendChild(icon);
}
