import os
import json
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
from google.genai import types
from PIL import Image
import io
from printer_main import print_text

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Gemini Keys
api_keys = []
# Primary key
if os.getenv("GEMINI_API_KEY"):
    api_keys.append(os.getenv("GEMINI_API_KEY"))

# Numbered keys (e.g., GEMINI_API_KEY_2, GEMINI_API_KEY_3...)
i = 2
while True:
    key = os.getenv(f"GEMINI_API_KEY_{i}")
    if key:
        api_keys.append(key)
        i += 1
    else:
        break

# Fallback key (legacy support)
if os.getenv("GEMINI_API_KEY_FALLBACK"):
    api_keys.append(os.getenv("GEMINI_API_KEY_FALLBACK"))

# Remove duplicates while preserving order
api_keys = list(dict.fromkeys(api_keys))

if not api_keys:
    print("Warning: No GEMINI_API_KEY found in .env file.")

# Load Data
try:
    # Get the directory of the current script
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(BASE_DIR, 'data.csv')
    tag_path = os.path.join(BASE_DIR, 'data_tag.csv')

    # Load tags and main data
    tags_df = pd.read_csv(tag_path)
    works_df = pd.read_csv(data_path)
    
    # Create a summary string for the prompt
    # Format: "Title (Author): [Tags]"
    # We use tags_df for matching because it has the emotion tags.
    # We assume '작품명' is the join key.
    
    # Check column names based on previous read_file output
    # tags_df columns: 작품 장르,작품명,저자,감정 태그
    # works_df columns: 작품 장르,작품명,저자,작품 내용,작성자
    
    # Clean up column names (strip whitespace just in case)
    tags_df.columns = [c.strip() for c in tags_df.columns]
    works_df.columns = [c.strip() for c in works_df.columns]

    # Pre-process the works list for the prompt
    works_list_str = ""
    for index, row in tags_df.iterrows():
        works_list_str += f"- {row['작품명']} ({row['저자']}): {row['감정 태그']}\n"
        
    print(f"Loaded {len(tags_df)} works for recommendation.")

except Exception as e:
    print(f"Error loading CSV files: {e}")
    works_list_str = ""
    tags_df = pd.DataFrame()
    works_df = pd.DataFrame()

@app.route('/analyze', methods=['POST'])
def analyze_and_recommend():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        # Read image
        image_bytes = file.read()
        
        # Prepare prompt
        prompt_text = f"""
        You are an AI literary therapist.
        **Answer in Korean.**
        Task:
        1. Analyze the mood based on the facial expressions and clothing of the people in the image.
        2. Determine the user's current emotional state.
        3. Select ONE literary work from the provided list below that best matches or comforts this emotion. 
           **Crucial:** You must base your recommendation heavily on the 'Emotion Tags' provided for each work. Match the detected mood with the most relevant tags.
        
        List of Works (Title (Author): [Emotion Tags]):
        {works_list_str}
        
        Output Requirements:
        Return ONLY a JSON object with this structure:
        {{
           "detected_emotion": "description of the face/mood",
           "recommended_work_title": "exact title from the list",
           "reason": "explanation linking the facial emotion to the work's tags"
        }}
        """

        # Generate response with API key rotation
        response = None
        last_exception = None
        
        for key in api_keys:
            try:
                # Initialize client with current key
                current_client = genai.Client(api_key=key)
                
                response = current_client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=[
                        types.Part.from_bytes(
                            data=image_bytes,
                            mime_type=file.mimetype or 'image/jpeg'
                        ),
                        prompt_text
                    ],
                    config=types.GenerateContentConfig(
                        temperature=1,
                        top_p=0.95,
                        top_k=40,
                        max_output_tokens=8192,
                        response_mime_type="application/json",
                    )
                )
                # If we get here, it succeeded
                print(f"Successfully used API key ending in ...{key[-4:] if len(key) > 4 else key}")
                break
            except Exception as e:
                print(f"API key ending in ...{key[-4:] if len(key) > 4 else key} failed: {e}")
                last_exception = e
                continue
        
        if response is None:
            if last_exception:
                raise last_exception
            else:
                raise Exception("No valid Gemini API keys available.")
        
        try:
            # Clean up potential markdown formatting
            text_response = response.text
            if text_response.startswith('```json'):
                text_response = text_response.replace('```json', '', 1).replace('```', '', 1)
            elif text_response.startswith('```'):
                text_response = text_response.replace('```', '', 2) # Remove start and end
            
            result = json.loads(text_response.strip())
            print(f"DEBUG: Gemini raw result: {result}")
        except (json.JSONDecodeError, AttributeError, ValueError) as e:
            return jsonify({"error": "Failed to parse Gemini response", "raw": str(response.text), "details": str(e)}), 500
            
        # Helper to safely get keys with variations
        def get_value(data, keys, default=None):
            for key in keys:
                if key in data:
                    return data[key]
            return default

        recommended_title = get_value(result, ["recommended_work_title", "title", "work", "recommended_work"])
        detected_emotion = get_value(result, ["detected_emotion", "emotion", "mood"], "분석된 감정 없음")
        reason = get_value(result, ["reason", "explanation", "analysis"], "상세한 분석 내용을 생성하지 못했습니다.")
        
        if not recommended_title:
             print("DEBUG: Work title missing in response.")
             return jsonify({"error": "Gemini did not return a work title", "analysis": result}), 500

        # Clean up the recommended title
        clean_title = recommended_title.strip()
        
        # Handle cases where Gemini returns "Title (Author)"
        if '(' in clean_title:
            clean_title = clean_title.split('(')[0].strip()

        # Find the full details in works_df
        # Ensure works_df titles are clean strings
        works_df['작품명'] = works_df['작품명'].astype(str).str.strip()
        
        # Look for exact match first
        work_details = works_df[works_df['작품명'] == clean_title]
        
        if work_details.empty:
            # Try partial match (work contains title or title contains work)
            # This handles cases where one is a substring of the other
            work_details = works_df[works_df['작품명'].apply(lambda x: x in clean_title or clean_title in x)]
            
        if work_details.empty:
             print(f"Failed to find work. Recommended: '{recommended_title}', Cleaned: '{clean_title}'")
             return jsonify({
                 "error": "Recommended work not found in database", 
                 "recommended_title": recommended_title,
                 "cleaned_title": clean_title,
                 "analysis": result
             }), 404

        # Get the first match
        work_row = work_details.iloc[0]
        
        # Replace NaN with None for valid JSON serialization
        work_row = work_row.where(pd.notnull(work_row), None)
        
        response_data = {
            "analysis": {
                "detected_emotion": detected_emotion,
                "reason": reason
            },
            "recommendation": {
                "title": work_row['작품명'],
                "author": work_row['저자'],
                "genre": work_row['작품 장르'],
                "content": work_row['작품 내용'],
            }
        }

        # Get username from request (default to '익명' if not provided)
        username = request.form.get('username', '익명')
        
        print_text(work_row['작품 내용'], title=work_row['작품명'], username=username, reason=reason)

        return jsonify(response_data)

    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
