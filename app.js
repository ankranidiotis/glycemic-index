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
        document.getElementById("category").textContent = result.values[0][1]; // Category
        document.getElementById("glycemic-index").textContent = result.values[0][2]; // Glycemic Index
        document.getElementById("carbs").textContent = result.values[0][3]; // Carbs per 100g
        document.getElementById("source").textContent = result.values[0][4]; // Data Source
    } else {
        console.error('No data found for the selected food.');
    }
}

// Initialize the database and populate the dropdown when the page loads
window.onload = initSQL;
