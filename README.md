F1 Lap Time Prediction ML

This project is a complete machine-learning system designed to predict Formula 1 lap times using real telemetry data. It combines a FastAPI backend, a trained Random Forest model, and a React frontend into one unified application. The goal is to simulate realistic lap performance by blending track metadata, driver tiers, tyre details, weather conditions, and live telemetry sector speeds.

The backend collects data using FastF1, a powerful library that exposes official F1 timing, session, and weather information. This data is cleaned, processed, and used to train a lap-time prediction model. The model itself is saved as a pickle file and exposed through a simple API endpoint that accepts a driver, track, compound, tyre age, sector speeds, and temperature inputs. It returns both the raw prediction and a rounded, user-friendly lap time.
In addition to predictions, the backend includes a realtime analytics engine that streams live or historical session insights using Server-Sent Events. This allows the frontend to display meaningful statistics—average lap time, sample driver metrics, speed trends, and quick-lap summaries—without blocking or refreshing the page.

The React frontend (hybrid-ml-genai-frontend) acts as the interface for all of this. Users can input conditions, choose drivers and circuits, and instantly receive predicted lap times. The interface is designed to feel like a lightweight F1 analytics dashboard, capable of running predictions while also offering telemetry-driven summaries generated on demand.

The project is structured to be clean, modular, and extendable. FastF1 cache data and large model files are intentionally ignored from the repository to keep the project lightweight. Anyone cloning the repo can retrain the model using the provided training script, run the backend server, and launch the frontend with minimal setup.

Overall, this repository showcases a practical combination of motorsport data engineering, machine learning, and full-stack application development—allowing users to explore how telemetry, physics, and driver performance translate into predictable lap behaviour in an F1 car.
