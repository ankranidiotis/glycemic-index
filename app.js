let db;

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
        const response = await fetch('assets/food_database.sqlite');
        
        if (!response.ok) {
            throw new Error('Failed to fetch the database file');
        }

        const buffer = await response.arrayBuffer();  // Read the file into ArrayBuffer
        db = new SQL.Database(new Uint8Array(buffer));  // Load the database from the ArrayBuffer

        loadFoods();  // Populate the dropdown with food names
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
    foodSelect.innerHTML = "";

    // Add the default option (blank and disabled)
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Επιλέξτε:";
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


// Function to load the food details when a food item is selected
function loadFoodInfo() {
    const foodName = document.getElementById("food-select").value;

    // If no food is selected, exit the function
    if (!foodName) {
        return;
    }

    // Query to fetch the details of the selected food
    const query = `SELECT * FROM FOOD WHERE NAME = ?`;
    const result = db.exec(query, [foodName])[0];  // Execute the query with the selected food name

    // Check if the query returns valid data
    if (result && result.values.length > 0) {
        // Populate the food details

        // Category
        document.getElementById("category").textContent = result.values[0][1]; 

        ////////////////// Glycemic Index ////////////////////////////
        let gi = result.values[0][2];

        // Get the glycemic index element
        const giElement = document.getElementById("glycemic-index");

        // Reset previous styles
        giElement.style.color = "black";  // Default color
        giElement.style.backgroundColor = "";  // Reset background color
        giElement.style.padding = "0";  // Reset padding
        giElement.style.borderRadius = "0";  // Reset border radius

        // Apply color coding and design changes
        if (gi <= 55) {
            // Low GI (green)
            giElement.style.color = "white";
            giElement.style.backgroundColor = "green";
            giElement.style.padding = "5px 10px";
            giElement.style.borderRadius = "5px";
            giElement.title = "Χαμηλός GI - Ιδανικό για έλεγχο σακχάρου";
        } else if (gi > 55 && gi < 70) {
            // Medium GI (orange)
            giElement.style.color = "white";
            giElement.style.backgroundColor = "orange";
            giElement.style.padding = "5px 10px";
            giElement.style.borderRadius = "5px";
            giElement.title = "Μέσος GI - Μέτρια επίδραση στο σάκχαρο";
        } else {
            // High GI (red)
            giElement.style.color = "white";
            giElement.style.backgroundColor = "red";
            giElement.style.padding = "5px 10px";
            giElement.style.borderRadius = "5px";
            giElement.title = "Υψηλό GI - Μπορεί να προκαλέσει απότομη αύξηση σακχάρου";
        }
        giElement.textContent = gi;


        ////////////////// Glycemic Load per 100g ////////////////////////////
        let gl = result.values[0][2] * result.values[0][3] / 100; 
        const glElement = document.getElementById("glycemic-load");

        // Reset previous styles
        glElement.style.color = "black";  // Default color
        glElement.style.backgroundColor = "";  // Reset background color
        glElement.style.padding = "0";  // Reset padding
        glElement.style.borderRadius = "0";  // Reset border radius

        // Apply color coding and design changes
        if (gl <= 10) {
            // Low GL (green)
            glElement.style.color = "white";
            glElement.style.backgroundColor = "green";
            glElement.style.padding = "5px 10px";
            glElement.style.borderRadius = "5px";
            glElement.title = "Χαμηλό GL - Ιδανικό για έλεγχο σακχάρου";
        } else if (gl > 10 && gl < 20) {
            // Medium GL (orange)
            glElement.style.color = "white";
            glElement.style.backgroundColor = "orange";
            glElement.style.padding = "5px 10px";
            glElement.style.borderRadius = "5px";
            glElement.title = "Μέσο GL - Μέτρια επίδραση στο σάκχαρο";
        } else {
            // High GL (red)
            glElement.style.color = "white";
            glElement.style.backgroundColor = "red";
            glElement.style.padding = "5px 10px";
            glElement.style.borderRadius = "5px";
            glElement.title = "Υψηλό GL - Μπορεί να προκαλέσει απότομη αύξηση σακχάρου";
        }
        glElement.textContent = gl.toFixed(1);
     
        
        ////////////////// Carbs per 100g ////////////////////////////
        document.getElementById("carbs").textContent = result.values[0][3]; 

        ////////////////// source URL ////////////////////////////
        const sourceUrl = result.values[0][4];  
        const sourceElement = document.getElementById("source");
        sourceElement.href = sourceUrl;  
        sourceElement.textContent = sourceUrl;  // Optionally, you can display the URL as text too
    } else {
        console.error('No data found for the selected food.');
    }
}



// Initialize the database and populate the dropdown when the page loads
window.onload = initSQL;


document.getElementById('dark-mode-toggle').addEventListener('click', function() {
    // Toggle the 'dark-mode' class on the body and other elements
    document.body.classList.toggle('dark-mode');
    document.querySelector('.container').classList.toggle('dark-mode');
    document.querySelector('.card').classList.toggle('dark-mode');
    document.querySelector('.form-select').classList.toggle('dark-mode');
    document.querySelector('.form-label').classList.toggle('dark-mode');
    document.querySelector('.btn').classList.toggle('dark-mode');

    // Change the button text based on the current mode
    if (document.body.classList.contains('dark-mode')) {
        this.textContent = 'Disable Dark Mode';
        localStorage.setItem('dark-mode', 'enabled'); // Save preference
    } else {
        this.textContent = 'Enable Dark Mode';
        localStorage.setItem('dark-mode', 'disabled'); // Save preference
    }
});

// Check for stored dark mode preference and apply it on page load
if (localStorage.getItem('dark-mode') === 'enabled') {
    document.body.classList.add('dark-mode');
    document.querySelector('.container').classList.add('dark-mode');
    document.querySelector('.card').classList.add('dark-mode');
    document.querySelector('.form-select').classList.add('dark-mode');
    document.querySelector('.form-label').classList.add('dark-mode');
    document.querySelector('.btn').classList.add('dark-mode');
    document.getElementById('dark-mode-toggle').textContent = 'Disable Dark Mode';
}
