from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager
import pickle
import json
import numpy as np
import os
from fastapi.middleware.cors import CORSMiddleware






# Initialize global variables
model = None
data_columns = None



@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, data_columns

    # Load artifacts during app startup
    artifacts_path = "./artifacts"
    model_path = os.path.join(artifacts_path, "melbourne_home_prices.pickle")
    columns_path = os.path.join(artifacts_path, "columns.json")

    if not os.path.exists(model_path) or not os.path.exists(columns_path):
        raise FileNotFoundError("Artifacts not found. Please ensure melbourne_home_prices.pickle and columns.json exist in ./artifacts/")

    # Load the model
    with open(model_path, "rb") as f:
        model = pickle.load(f)

    # Load column data
    with open(columns_path, "r") as f:
        data_columns = json.load(f)["data_columns"]

    print("Artifacts loaded successfully.")

    # Yield control to the application
    yield

    # Perform cleanup tasks during shutdown
    print("Server shutting down...")

# Initialize FastAPI app with lifespan
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins. You can restrict this to specific domains.
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)






class PricePredictionRequest(BaseModel):
    rooms: int
    bedroom: int
    bathroom: int
    carpark: int
    landsize: float
    buildingarea: float
    suburb: str
    type: str


@app.post("/predict")
def predict_price(request: PricePredictionRequest):
    global model, data_columns

    # Ensure artifacts are loaded
    if model is None or data_columns is None:
        raise HTTPException(status_code=500, detail="Artifacts not loaded. Please restart the server.")

    # Prepare input feature vector
    x = np.zeros(len(data_columns))

    # Populate numerical features
    x[data_columns.index("rooms")] = request.rooms
    x[data_columns.index("bedroom")] = request.bedroom
    x[data_columns.index("bathroom")] = request.bathroom
    x[data_columns.index("carpark")] = request.carpark
    x[data_columns.index("landsize(sqm)")] = request.landsize
    x[data_columns.index("buildingarea(sqm)")] = request.buildingarea

    # Normalize and check suburb
    suburb_key = request.suburb.lower()  # Convert to lowercase for case-insensitive comparison
    if suburb_key in [col.lower() for col in data_columns]:  # Compare all suburb columns as lowercase
        x[data_columns.index(suburb_key)] = 1
    elif suburb_key == "Other": # considering one-hot-encoded dropped column
        pass


    # Normalize and check property type
    type_key = request.type.lower()  # Convert to lowercase for case-insensitive comparison
    if type_key in [col.lower() for col in data_columns]:  # Compare all types as lowercase
        x[data_columns.index(type_key)] = 1
    elif type_key == "Unit": # considering one-hot-encoded dropped column
        pass



    # Make prediction
    try:
        prediction = model.predict([x])[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model prediction error: {str(e)}")

    return {"predicted_price": round(prediction, 2)}


# Health check endpoint
@app.get("/health-check")
def health_check():
    if model and data_columns:
        return {"status": "OK"}
    return {"status": "ERROR", "message": "Artifacts not loaded"}



@app.get("/suburbs")
def get_suburbs():
    # Extract the suburbs from data_columns (ignoring numerical columns)
    suburbs = [col for col in data_columns if col not in ["rooms", "bedroom", "bathroom", "carpark", "landsize(sqm)", "buildingarea(sqm)", "house", "townhouse"]]
    return {"suburbs": suburbs} # The dropped column (Other) will later be added manually by js code



@app.get("/types")
def get_property_types():
    # Extract the types from data_columns (ignoring numerical columns and suburbs)
    property_types = [col for col in data_columns if col in ["house","townhouse"]]
    return {"types": property_types} # The dropped column (Unit) will later be added manually by js code
