import re
import pickle
import fitz  # PyMuPDF
import docx
import json
import os
import requests
import logging
import datetime
import time 
from functools import wraps
from dotenv import load_dotenv
from flask import Flask, request, jsonify, render_template, redirect

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'your-secret-key-change-in-production')

# Rate limiting storage
request_history = {}

def rate_limit(max_requests=10, window=60):
    """Rate limiting decorator"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_ip = request.remote_addr
            current_time = time.time()
            
            if client_ip not in request_history:
                request_history[client_ip] = []
            
            # Clean old requests
            request_history[client_ip] = [req_time for req_time in request_history[client_ip] 
                                        if current_time - req_time < window]
            
            if len(request_history[client_ip]) >= max_requests:
                return jsonify({'error': 'Rate limit exceeded. Please try again later.'}), 429
            
            request_history[client_ip].append(current_time)
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def validate_file(file):
    """Enhanced file validation"""
    if not file:
        return False, "No file provided"
    
    # Check file size (10MB limit)
    file.seek(0, 2)  # Seek to end
    file_size = file.tell()
    file.seek(0)  # Reset to beginning
    
    if file_size > 10 * 1024 * 1024:  # 10MB
        return False, "File size exceeds 10MB limit"
    
    # Check file extension
    allowed_extensions = {'.pdf', '.docx'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        return False, f"File type {file_ext} not supported. Please use PDF or DOCX files."
    
    # Check MIME type
    if file_ext == '.pdf' and not file.content_type.startswith('application/pdf'):
        return False, "Invalid PDF file"
    elif file_ext == '.docx' and not file.content_type.startswith('application/vnd.openxmlformats-officedocument.wordprocessingml.document'):
        return False, "Invalid DOCX file"
    
    return True, "File is valid"

# Load the trained models and category mapping
try:
    with open('Model/resume_screening_model.pkl', 'rb') as model_file:
        model = pickle.load(model_file)
        logger.info("Model loaded successfully")
    with open('Model/tfid.pkl', 'rb') as tfid_file:
        tfid = pickle.load(tfid_file)
        logger.info("TF-IDF vectorizer loaded successfully")
except FileNotFoundError as e:
    logger.error(f"Model files not found: {e}")
    print("Error: Model files not found. Please ensure 'resume_screening_model.pkl' and 'tfid.pkl' are in the 'Model' directory.")
    model = None
    tfid = None
except Exception as e:
    logger.error(f"Error loading models: {e}")
    model = None
    tfid = None

category_mapping = {
    6: 'Data Science', 12: 'HR', 0:'Advocate', 1:'Arts', 24: 'Web Designing',
    16:'Mechanical Engineer', 22: 'Sales', 14: 'Health and fitness',
    5: 'Civil Engineer', 15: 'Java Developer', 4:'Business Analyst',
    21:'SAP Developer', 2:'Automation Testing', 11:'Electrical Engineering',
    18:'Operations Manager', 20:'Python Developer', 8 :'DevOps Engineer',
    17 :'Network Security Engineer', 19 :'PMO', 7 :'Database',
    13 :'Hadoop', 10 :'ETL Developer', 9 :'DotNet Developer',
    3 :'Blockchain', 23 :'Testing'
}

# Define stopwords
stop_words = set([
    'the', 'is', 'in', 'and', 'to', 'with', 'a', 'an', 'of', 'for', 'on', 'at', 
    'by', 'this', 'that', 'are', 'was', 'it', 'be', 'as', 'from', 'or', 'has', 
    'have', 'had', 'but', 'not', 'he', 'she', 'they', 'you', 'we', 'his', 'her'
])

def extract_text_from_file(file):
    """
    Extracts text from a PDF or DOCX file.
    """
    file_type = file.filename.split('.')[-1].lower()
    text = ""
    if file_type == 'pdf':
        try:
            doc = fitz.open(stream=file.read(), filetype='pdf')
            for page in doc:
                text += page.get_text()
        except ImportError:
            return "Error: PyMuPDF (fitz) not installed. Please run 'pip install pymupdf'."
    elif file_type == 'docx':
        doc = docx.Document(file)
        text = "\n".join([para.text for para in doc.paragraphs])
    return text

def clean_data(extracted_file_data):
    """
    Cleans text by removing URLs, mentions, hashtags, newlines, and special characters.
    """
    Text = re.sub(r'http\S+', ' ', extracted_file_data)
    Text = re.sub(r'@\S+', ' ', Text)
    Text = re.sub(r'#\S+', ' ', Text)
    Text = re.sub(r'\n', ' ', Text)
    Text = re.sub(r'\r', ' ', Text)
    Text = re.sub(r'[^\w\s]', ' ', Text)
    Text = re.sub(r'\s+', ' ', Text).strip()
    Text = re.sub(r"[\u2600-\u26FF\u2700-\u27BF]+", " ", Text)
    Text = re.sub('RT|CC', '', Text)
    
    Text = Text.lower()

    words = Text.split()
    cleaned_words = [word for word in words if word not in stop_words]

    return ' '.join(cleaned_words)

def format_genai_response(text):
    """
    Formats the GenAI response to make it more readable and properly structured.
    """
    # Clean up any remaining markdown or special characters
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)  # Remove **text** but keep the text
    text = re.sub(r'\*(.*?)\*', r'\1', text)      # Remove *text* but keep the text
    text = re.sub(r'#+\s*', '', text)             # Remove # headings
    text = re.sub(r'`(.*?)`', r'\1', text)        # Remove `code` formatting
    
    # Convert line breaks to proper HTML
    text = text.replace('\n', '<br>')
    
    # Add proper spacing and structure for main sections
    text = re.sub(r'(Analysis|Suggestions)', r'<br><br><strong style="font-size: 1.3em; color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; display: block; margin-bottom: 15px;">\1</strong>', text)
    
    # Format subsection headers
    text = re.sub(r'(Strengths:|Areas for Enhancement:|Key Improvements:)', r'<br><br><strong style="font-size: 1.1em; color: #059669; display: block; margin-bottom: 10px;">\1</strong>', text)
    
    # Add bullet points for lists and improve spacing
    text = re.sub(r'^- ', r'<br>• ', text)
    text = re.sub(r'^-', r'<br>•', text)
    
    # Add extra spacing around bullet points
    text = re.sub(r'(<br>• .*?)(<br>• )', r'\1<br>\2', text)
    
    # Clean up multiple line breaks
    text = re.sub(r'(<br>){3,}', '<br><br>', text)
    
    # Add some styling and make it more readable - no height constraints
    text = f'<div style="line-height: 1.7; font-size: 15px; color: #374151; padding: 20px; background: #fafafa; border-radius: 8px; border-left: 4px solid #4f46e5; width: 100%;">{text}</div>'
    
    return text

def get_genai_suggestions(cleaned_text, predicted_role):
    """
    Generates suggestions for resume improvement using GenAI.
    """
    try:
        api_key = os.getenv("GENAI_API_KEY")
        if not api_key:
            logger.error("GENAI_API_KEY not found in environment variables")
            return "Error: GENAI_API_KEY not found in environment variables. Please create a .env file."

        logger.info("Generating GenAI suggestions...")

        system_prompt = f"""
        You are a professional and concise resume analyst.
        Your task is to provide clear, actionable suggestions for improving a resume.
        
        IMPORTANT FORMATTING RULES:
        1. Do NOT use any markdown symbols like ** or * or # or any special characters
        2. Use plain text only
        3. Make your response easy to read with proper spacing
        4. Use clear section headings without any symbols
        
        Provide your response in this exact format:
        
        Analysis
        
        Strengths:
        - [First strength with specific details]
        - [Second strength with specific details]
        - [Third strength with specific details]
        
        Areas for Enhancement:
        - [First area that needs improvement]
        - [Second area that needs improvement]
        - [Third area that needs improvement]
        
        Suggestions
        
        Key Improvements:
        - [First actionable improvement suggestion]
        - [Second actionable improvement suggestion]
        - [Third actionable improvement suggestion]
        
        Keep each point concise but specific. Focus on actionable advice that the user can implement.
        also give suggestion of ATS Friendly templates (in form of links also, makes it more better, make sure you provide the right link (cross verify it))
        """
        
        user_query = f"""
        Here is the cleaned resume text:
        "{cleaned_text}"

        The predicted job role for this resume is: "{predicted_role}"
        
        Based on this, please provide your analysis and suggestions for improvement, formatted as instructed.
        """
        
        apiUrl = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key={api_key}"
        
        payload = {
            "contents": [{"parts": [{"text": user_query}]}],
            "systemInstruction": {"parts": [{"text": system_prompt}]},
            "tools": [{"google_search": {}}]
        }
        
        headers = {'Content-Type': 'application/json'}
        
        logger.info("Sending request to GenAI API...")
        response = requests.post(apiUrl, headers=headers, data=json.dumps(payload), timeout=30)
        
        if not response.ok:
            logger.error(f"GenAI API error: {response.status_code} - {response.text}")
            response.raise_for_status()
        
        result = response.json()
        logger.info("GenAI API response received successfully")
        
        if result and 'candidates' in result and result['candidates'][0]['content']['parts'][0]['text']:
            genai_text = result['candidates'][0]['content']['parts'][0]['text']
            logger.info("GenAI suggestions generated successfully")
            # Format the response to make it more readable
            formatted_text = format_genai_response(genai_text)
            return formatted_text
        else:
            logger.warning("Unexpected GenAI API response format")
            return "GenAI suggestions could not be generated. Please check the API response for details."

    except requests.exceptions.RequestException as e:
        logger.error(f"Network error during GenAI analysis: {str(e)}")
        return f"A network error occurred during GenAI analysis: {str(e)}"
    except Exception as e:
        logger.error(f"Error during GenAI analysis: {e}", exc_info=True)
        return f"An error occurred during GenAI analysis: {e}"

@app.route('/')
def index():
    """
    Serves the main HTML page.
    """
    return render_template('index.html')

@app.route('/health')
def health():
    """
    Health check endpoint for debugging.
    """
    try:
        model_status = "loaded" if model is not None else "missing"
        tfid_status = "loaded" if tfid is not None else "missing"
        api_key_status = "present" if os.getenv("GENAI_API_KEY") else "missing"
        
        return jsonify({
            'status': 'healthy',
            'model': model_status,
            'tfid': tfid_status,
            'api_key': api_key_status,
            'timestamp': str(datetime.datetime.now())
        })
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500

@app.route('/results')
def results():
    """
    Serves the results page.
    """
    from flask import session
    
    logger.info(f"Session contents: {dict(session)}")
    
    # Check if we have results in session
    if 'resume_analysis_results' in session:
        result_data = session['resume_analysis_results']
        logger.info(f"Found results in session: {result_data}")
        # Clear the session data after retrieving it
        session.pop('resume_analysis_results', None)
        return render_template('results.html', result_data=result_data)
    else:
        logger.info("No results in session, showing empty results page")
        # No results in session, show empty results page
        return render_template('results.html', result_data=None)

@app.route('/predict', methods=['POST'])
@rate_limit(max_requests=5, window=60)  # 5 requests per minute
def predict():
    """
    Handles resume file upload, processing, and prediction.
    """
    try:
        if 'file' not in request.files:
            logger.warning("No file part in request")
            return jsonify({'error': 'No file part in the request'}), 400
        
        file = request.files['file']
        if file.filename == '':
            logger.warning("No selected file")
            return jsonify({'error': 'No selected file'}), 400

        # Enhanced file validation
        is_valid, validation_message = validate_file(file)
        if not is_valid:
            logger.warning(f"File validation failed: {validation_message}")
            return jsonify({'error': validation_message}), 400

        logger.info(f"Processing file: {file.filename}")

        if not model or not tfid:
            logger.error("Model files are missing")
            return jsonify({'error': 'Model files are missing. Please check the server logs.'}), 500

        extracted_text = extract_text_from_file(file)
        if "Error:" in extracted_text:
            logger.error(f"Text extraction error: {extracted_text}")
            return jsonify({'error': extracted_text}), 500
        
        logger.info(f"Extracted text length: {len(extracted_text)}")
        
        cleaned_text = clean_data(extracted_text)
        logger.info(f"Cleaned text length: {len(cleaned_text)}")

        if not cleaned_text:
            logger.warning("Could not extract or clean text from file")
            return jsonify({'error': 'Could not extract or clean text from the file.'}), 400

        vectorized_input = tfid.transform([cleaned_text])
        prediction = model.predict(vectorized_input)
        predicted_role = category_mapping.get(prediction[0], 'Unknown')
        
        logger.info(f"Predicted role: {predicted_role}")

        genai_suggestions = get_genai_suggestions(cleaned_text, predicted_role)
        logger.info("GenAI suggestions generated successfully")

        # Store results in session and redirect to results page
        result_data = {
            'success': True,
            'predicted_role': predicted_role,
            'extracted_text': extracted_text,
            'genai_suggestions': genai_suggestions
        }
        
        # Store in session for better data handling
        from flask import session
        session['resume_analysis_results'] = result_data
        logger.info(f"Stored results in session: {result_data}")
        
        # Return redirect response
        return jsonify({
            'success': True,
            'redirect_url': '/results'
        })

    except Exception as e:
        logger.error(f"Error in predict function: {str(e)}", exc_info=True)
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

if __name__ == '__main__':
    # Production configuration
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', 5000))
    
    # Security headers for production
    @app.after_request
    def add_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response
    
    # Production server configuration
    if not debug_mode:
        logger.info("Starting production server...")
        app.run(host=host, port=port, debug=False, threaded=True)
    else:
        logger.info("Starting development server...")
        app.run(host=host, port=port, debug=True)