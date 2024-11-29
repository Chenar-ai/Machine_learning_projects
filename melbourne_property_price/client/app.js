
document.addEventListener("DOMContentLoaded", function () {
    // DOM elements
    const suburbDropdown = document.getElementById("uisuburb");
    const typeDropdown = document.getElementById("uitype");
    const predictForm = document.querySelector(".form"); 
    const resultDiv = document.getElementById("predict-btn");

    // Backend API URL
    const API_BASE_URL = "/api";

    // Fetch and populate the suburbs dropdown
    async function loadSuburbs() {
        try {
            const response = await fetch(`${API_BASE_URL}/suburbs`);
            if (!response.ok) throw new Error("Failed to load suburbs");
            const data = await response.json();
            
            // In case of the response is an object 
            const suburbs = Array.isArray(data) ? data : data.suburbs || [];

            
            if (suburbs.length > 0) {
                suburbs.forEach((suburb) => {
                    const option = document.createElement("option");
                    option.value = suburb;
                    option.textContent = suburb;
                    suburbDropdown.appendChild(option);
                });

                
            // Adding "Other" suburb option manually to the dropdown list
            const otherOption = document.createElement("option");
            otherOption.value = "Other";
            otherOption.textContent = "Other";
            suburbDropdown.appendChild(otherOption);
            
            } else {
                console.error("Invalid suburbs data format:", data);
                alert("Failed to load suburbs. Invalid data format.");
            }
        } catch (error) {
            console.error("Error loading suburbs:", error);
            alert("Failed to load suburbs.");
        }
    }

    // Fetch and populate the types dropdown
    async function loadTypes() {
        try {
            const response = await fetch(`${API_BASE_URL}/types`);
            if (!response.ok) throw new Error("Failed to load property types");
            const data = await response.json();
            
            // Check if the response is an object and extract the types array
            const types = Array.isArray(data) ? data : data.types || [];

            
            if (types.length > 0) {
                types.forEach((type) => {
                    const option = document.createElement("option");
                    option.value = type;
                    option.textContent = type;
                    typeDropdown.appendChild(option);
                });
                
            // Adding "Unit" type option manually to the dropdown list
            const unitOption = document.createElement("option");
            unitOption.value = "Unit";
            unitOption.textContent = "Unit";
            typeDropdown.appendChild(unitOption);


            } else {
                console.error("Invalid types data format:", data);
                alert("Failed to load property types. Invalid data format.");
            }
        } catch (error) {
            console.error("Error loading types:", error);
            alert("Failed to load property types.");
        }
    }

    async function handlePrediction(event) {
        event.preventDefault(); 
    
        
        const formData = new FormData(predictForm);
        const rooms = formData.get("numRooms");
        const bedrooms = formData.get("numBedooms");
        const bathrooms = formData.get("numBathooms");
        const carparks = formData.get("numCarparks");
        const landsize = formData.get("landarea");
        const buildingarea = formData.get("building area");
        const suburb = formData.get("suburb");
        const type = formData.get("type");
    
        
        if (!rooms || !bedrooms || !bathrooms || !carparks || !landsize || !buildingarea || !suburb || !type) {
            alert("Please fill out all the fields.");
            return;
        }
    
        if (parseFloat(landsize) < parseFloat(buildingarea)) {
            alert("Land size cannot be smaller than building area. Please correct the input.");
            return;
        }
    
        // Prepare data for submission
        const data = {
            rooms: parseInt(rooms),
            bedroom: parseInt(bedrooms),
            bathroom: parseInt(bathrooms),
            carpark: parseInt(carparks),
            landsize: parseFloat(landsize),
            buildingarea: parseFloat(buildingarea),
            suburb: suburb,
            type: type,
        };
    
        // Send data to the backend for prediction
        try {
            const response = await fetch(`${API_BASE_URL}/predict`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
    
            if (!response.ok) throw new Error("Prediction failed");
    
            const result = await response.json();
            resultDiv.textContent = `Predicted Price: $${result.predicted_price}`;
            resultDiv.style.display = "block";
        } catch (error) {
            console.error("Error making prediction:", error);
            alert("Failed to get prediction. Please try again.");
        }
    }
    

    // Load initial data
    loadSuburbs();
    loadTypes();

    // Form submission event listener
    predictForm.addEventListener("submit", handlePrediction);
});
