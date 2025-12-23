# Project Context: Emotional Literature Vending Machine (감정 문학 자판기)

## Project Overview

This project is a full-stack web application designed to analyze a user's facial expression from an uploaded image or camera capture and recommend a literary work that matches or comforts their detected emotion.

The core logic uses **Google Gemini** for image analysis and emotion detection, matching the result against a curated database of literary works tagged with emotions.

### Architecture

*   **Frontend:** React (powered by Vite)
    *   UI Library: React Bootstrap
    *   Features: Image upload, Webcam capture, API integration, Result display.
*   **Backend:** Python (Flask)
    *   AI Model: Google Gemini (`google-genai`)
    *   Data Handling: Pandas (CSV based database)
    *   API: Exposes endpoints for image analysis and recommendation.

## Directory Structure

*   **`backend/`**: Contains the Flask server code and data files.
    *   `app.py`: Main Flask application entry point. Handles API requests, Gemini integration, and data retrieval.
    *   `data.csv`: Database of literary works (Title, Author, Content, etc.).
    *   `data_tag.csv`: Tagging database used for matching emotions to works.
    *   `requirements.txt`: Python dependencies.
    *   `.env`: Configuration file for environment variables (e.g., `GEMINI_API_KEY`).
*   **`frontend/`**: Contains the React client code.
    *   `src/App.jsx`: Main application component managing UI state (upload/camera modes) and API calls.
    *   `package.json`: Frontend dependencies and scripts.
    *   `vite.config.js`: Vite configuration.

## Setup and Running

### Prerequisites

*   Node.js & npm
*   Python 3.12+
*   Google Gemini API Key

### Backend Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment (optional but recommended):
    ```bash
    python -m venv .venv
    source .venv/bin/activate  # On Windows: .venv\Scripts\activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure Environment:
    *   Create a `.env` file in the `backend/` directory.
    *   Add your API key: `GEMINI_API_KEY=your_actual_api_key_here`
5.  Start the server:
    ```bash
    python app.py
    ```
    *   The server will run on `http://localhost:5000`.

### Frontend Setup

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    *   The application will be accessible at the URL provided by Vite (usually `http://localhost:5173`).

## Development Conventions

*   **Language:** Python (Backend), JavaScript/JSX (Frontend).
*   **Styling:** React Bootstrap (Bootstrap 5) is used for layout and components. Custom styles in `App.css`.
*   **API Communication:** Axios is used in the frontend to communicate with the Flask backend.
*   **Data Matching:** The backend matches emotions by comparing Gemini's analysis with tags in `data_tag.csv`.
*   **Error Handling:** The frontend displays error alerts using Bootstrap components. The backend returns JSON error responses with status codes.
