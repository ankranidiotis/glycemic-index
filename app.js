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
        // The timestamp is adding a unique signature and the updated database is loaded 
        // all the time which prevents browser cache to load an old version of the database. 
        const response = await fetch('assets/food_database.sqlite?' + new Date().getTime());
        
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


// Function to load the food details when a food item is selected
function loadFoodInfo() {
    const foodName = document.getElementById("food-select").value;

    // If no food is selected, exit the function
    if (!foodName) {
        return;
    }

    // Show content after a selection is made
    document.getElementById('food-details').classList.remove('d-none');
    document.getElementById('food-details').classList.add('d-block'); 
    
    document.getElementById('front-image').classList.remove('d-block');
    document.getElementById('front-image').classList.add('d-none');


    // Query to fetch the details of the selected food
    const query = `SELECT * FROM FOOD WHERE NAME = ?`;
    const result = db.exec(query, [foodName])[0];

    // Check if the query returns valid data
    if (result && result.values.length > 0) {

        // Food name
        document.getElementById("food-name").textContent = result.values[0][0]; 

        // Category
        document.getElementById("category").textContent = result.values[0][1]; 

        ////////////////// Glycemic Index ////////////////////////////
        let gi = result.values[0][2];

        // Get the glycemic index element
        const giElement = document.getElementById("glycemic-index");

        // Reset previous styles
        giElement.classList.remove("badge", "bg-success", "bg-warning", "bg-danger"); 

        // Apply color coding and design changes using Bootstrap's badge classes
        giElement.classList.add("badge", "fs-6"); 
        if (gi <= 55) {
            // Low GI (green)
            giElement.classList.add("bg-success");  
            giElement.title = "Χαμηλός GI - Ιδανικό για έλεγχο σακχάρου";
        } else if (gi > 55 && gi < 70) {
            // Medium GI (orange)
            giElement.classList.add("bg-warning");  
            giElement.title = "Μέσος GI - Μέτρια επίδραση στο σάκχαρο";
        } else {
            // High GI (red)
            giElement.classList.add("bg-danger");   
            giElement.title = "Υψηλό GI - Μπορεί να προκαλέσει απότομη αύξηση σακχάρου";
        }

        // Set the GI value as the badge content
        giElement.textContent = gi;


        ////////////////// Glycemic Load per 100g ////////////////////////////
        let gl = result.values[0][2] * result.values[0][3] / 100; 
        const glElement = document.getElementById("glycemic-load");

        // Reset previous styles (no need for inline styles anymore, since we're using Bootstrap badges)
        glElement.classList.remove("badge", "bg-success", "bg-warning", "bg-danger"); // Remove any old badge classes

        // Add badge
        glElement.classList.add("badge", "fs-6");

        if (gl <= 10) {
            // Low GL (green)
            glElement.classList.add("bg-success");  
            glElement.title = "Χαμηλό GL - Ιδανικό για έλεγχο σακχάρου";
        } else if (gl > 10 && gl < 20) {
            // Medium GL (orange)
            glElement.classList.add("bg-warning"); 
            glElement.title = "Μέσο GL - Μέτρια επίδραση στο σάκχαρο";
        } else {
            // High GL (red)
            glElement.classList.add("bg-danger");  
            glElement.title = "Υψηλό GL - Μπορεί να προκαλέσει απότομη αύξηση σακχάρου";
        }

        // Set the GL value as the badge content with one decimal place
        glElement.textContent = gl.toFixed(1);
     
        
        ////////////////// Carbs per 100g ////////////////////////////
        document.getElementById("carbs").textContent = result.values[0][3] + "g"; 

        ////////////////// Maximum Quantity ////////////////////////////
        if (result.values[0][3] > 0 && gi > 0){
            document.getElementById("maximum-quantity").textContent = (100000 / (result.values[0][3] * gi)).toFixed(1) + "g " + result.values[0][6].toLowerCase(); 
        } else {
            document.getElementById("maximum-quantity").textContent = "Χωρίς όριο";  
        }
        
        ////////////////// source URL ////////////////////////////
        const sourceUrl = result.values[0][4];
        if (sourceUrl != null) {
            const sourceElement = document.getElementById("source");
            sourceElement.setAttribute("href", sourceUrl);
            sourceElement.setAttribute("target", "_blank");
            sourceElement.textContent = "Πηγή";
        }

        ////////////////// food image ////////////////////////////
        const foodImage = './img/' + result.values[0][8] + '.webp';
        document.getElementById("food-image").src = foodImage;
        document.getElementById("food-image").alt = result.values[0][0] + ' Image';  

        ////////////////// serving ////////////////////////////
        if (result.values[0][5]){
            const carbs = result.values[0][7] * result.values[0][3] / 100;
            const glserving = carbs * gi / 100;
            const serving = result.values[0][5] + ' ' + result.values[0][6].toLowerCase() + ' ' + foodName.toLowerCase() + ' (' + result.values[0][7] + 'g)' + ' έχει GL ' + glserving.toFixed(1);
            document.getElementById("serving").textContent = serving; 
        }
        else{
            document.getElementById("serving").textContent = "";
        }

    } else {
        console.error('No data found for the selected food.');
    }
}

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


// Initialize the database and populate the dropdown when the page loads
window.onload = initSQL;
