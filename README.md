# Resume Screening App

A simple web application for automated resume screening and classification using machine learning. This app allows you to upload a PDF or Word (DOCX) resume, extracts and cleans the text, and predicts the most relevant job category using a trained model.

## Features

- **File Upload**: Upload resumes in PDF or DOCX format.
- **Text Extraction**: Automatically extracts text from uploaded resumes.
- **Text Cleaning**: Removes unnecessary elements such as hashtags, mentions, URLs, special characters, punctuation, and common stopwords.
- **Resume Classification**: Uses a pre-trained machine learning model to predict the resume's job category.
- **Category Mapping**: Maps predicted category codes to human-readable job categories.
- **User Interface**: Built with Streamlit for a clean and interactive experience.

## Supported Categories

Some of the job categories the model can predict:
- Data Science
- HR
- Advocate
- Arts
- Web Designing
- Mechanical Engineer
- Sales
- Health and Fitness
- Civil Engineer
- Java Developer
- Business Analyst
- SAP Developer
- Automation Testing
- Electrical Engineering
- Operations Manager
- Python Developer
- DevOps Engineer
- Network Security Engineer
- PMO
- Database
- Hadoop
- ETL Developer
- DotNet Developer
- Blockchain
- Testing

(See the `category_mapping` dictionary in `app.py` for the full list.)

## Getting Started

### Prerequisites

- Python 3.7+
- pip

### Installation

1. **Clone this repository** and navigate to the project directory.

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Model Files**:  
   Ensure the following model files are present in the `Model/` directory:
   - `resume_screening_model.pkl`
   - `tfid.pkl`

   *(You can train your own model using the provided Jupyter notebook: `Resume_Screening_Model.ipynb`.)*

### Running the App

Activate Venv (Virtual Environment Before Activating)
Start the Flask server:
```bash
python app.py
```

Open the displayed local URL in your browser to use the app.

## File Structure

- `app.py` — Main Streamlit application.
- `requirements.txt` — Project dependencies.
- `Resume_Screening_Model.ipynb` — Jupyter notebook for data exploration, model training, and experimentation.
- `Model/` — Folder containing the trained model (`resume_screening_model.pkl`) and TF-IDF vectorizer (`tfid.pkl`).

## How It Works

1. **Upload**: User uploads a PDF or DOCX resume.
2. **Extraction**: The app extracts text using PyMuPDF for PDFs and python-docx for DOCX files.
3. **Cleaning**: The text is cleaned by removing noise and stopwords.
4. **Vectorization**: Clean text is transformed using the pre-trained TF-IDF vectorizer.
5. **Prediction**: The processed vector is passed into the trained machine learning model for prediction.
6. **Result**: The predicted job category is displayed to the user.

## Example Usage

1. Run the app.
2. Upload a resume (PDF/DOCX).
3. View predicted job category and extracted resume text.

## Model Training

To train your own model or inspect the training process:
- See `Resume_Screening_Model.ipynb` for end-to-end steps including:
  - Loading and visualizing data
  - Text preprocessing
  - Model building and evaluation
  - Saving the trained model and vectorizer

## Dependencies

Main dependencies include:
- streamlit
- PyMuPDF
- python-docx
- scikit-learn
- pickle

(See `requirements.txt` for the complete list.)

## License

This project is for educational and demonstration purposes.

---

**Author:** OkYashGajjar
