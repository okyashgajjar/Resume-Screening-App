import streamlit as st
import fitz # PyMuPDF
import docx
import pickle
import re


# Making UI & Extracting Text From PDF/DOCX

st.title('Resume Screening App')

uploaded_file = st.file_uploader('Upload PDF or Word File Here', type=['pdf', 'docx'])

if uploaded_file:
    st.success('✅ Content successfully fetched')
else:
    st.warning('⚠️ Content not found or file is empty')


def extract_file_from_pdf(file) :
    doc = fitz.open(stream=file.read(), filetype='pdf')
    text = ""
    for page in doc :
        text = text + page.get_text()
    return text

def extract_text_from_docx(file):
    doc = docx.Document(file)
    text = "\n".join([para.text for para in doc.paragraphs])
    return text

if uploaded_file is not None :
    file_type = uploaded_file.name.split('.')[-1].lower()

    if file_type == 'pdf' :
        extracted_file_data = extract_file_from_pdf(uploaded_file)
    elif file_type == 'docx' :
        extracted_file_data = extract_text_from_docx(uploaded_file)
    else :
        st.warning("Unsupported file type")
        # extracted_file_data = ""



# A function who removes the unnecessary data from file (Hashtags, Mentions, URLS, Special Latters, Punctuations, stopwords)

stop_words = set([
    'the', 'is', 'in', 'and', 'to', 'with', 'a', 'an', 'of', 'for', 'on', 'at', 
    'by', 'this', 'that', 'are', 'was', 'it', 'be', 'as', 'from', 'or', 'has', 
    'have', 'had', 'but', 'not', 'he', 'she', 'they', 'you', 'we', 'his', 'her'
])

def clean_data(extracted_file_data) :
    
    Text = re.sub('http\S+', ' ', extracted_file_data)       # remove URLs
    Text = re.sub('@\S+', ' ', Text)                # remove @mentions
    Text = re.sub('#\S+', ' ', Text)                # remove hashtags
    Text = re.sub('\n', ' ', Text)                  # remove newline characters
    Text = re.sub('\r', ' ', Text)                  # remove carriage returns
    Text = re.sub('[^\w\s]', ' ', Text)             # remove punctuation
    Text = re.sub('\s+', ' ', Text).strip()         # remove extra whitespaces
    Text = re.sub(r"[\u2600-\u26FF\u2700-\u27BF]+", " ", Text)  # remove emoji ranges
    Text = re.sub('RT|CC', '', Text)
    
    # Lowercase for consistent stopword removal
    Text = Text.lower()

    # Split and remove stopwords
    words = Text.split()
    cleaned_words = [word for word in words if word not in stop_words]

    return ' '.join(cleaned_words)

# st.text_area("CleanData:", clean_data(extracted_file_data), height=300)

category_mapping = {
   6: 'Data Science',
   12: 'HR',
    0:'Advocate',
    1:'Arts',
   24: 'Web Designing',
   16:'Mechanical Engineer',
   22: 'Sales',
   14: 'Health and fitness',
   5: 'Civil Engineer',
   15: 'Java Developer',
    4:'Business Analyst',
    21:'SAP Developer',
    2:'Automation Testing',
    11:'Electrical Engineering',
    18:'Operations Manager',
    20:'Python Developer',
   8 :'DevOps Engineer',
   17 :'Network Security Engineer',
   19 :'PMO',
   7 :'Database',
   13 :'Hadoop',
   10 :'ETL Developer',
   9 :'DotNet Developer',
   3 :'Blockchain',
   23 :'Testing'
}


model = pickle.load(open('Model/resume_screening_model.pkl', 'rb'))
tfid = pickle.load(open('Model/tfid.pkl', 'rb'))

if uploaded_file : 
    extracted_text = extracted_file_data  # from PDF or DOCX


    # Clean it
    cleaned_text = clean_data(extracted_text)  # Must return a string

    # Vectorize it (WRAP IN LIST!)
    vectorized_input = tfid.transform([cleaned_text])

    # Predict
    prediction = model.predict(vectorized_input)

    # Map output
    prediction_output = category_mapping[prediction[0]]

    # Show result
    st.success(f"Predicted Category: {prediction_output}")
    st.subheader("Extracted Resume Data:")
    st.text_area("Output", extracted_file_data, height=200)