from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from datetime import datetime
import json
import os
from symptom_analyzer import SymptomAnalyzer
from questionnaire_handler import QuestionnaireHandler
from chat_handler import ChatHandler

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize handlers
symptom_analyzer = SymptomAnalyzer()
questionnaire_handler = QuestionnaireHandler()
chat_handler = ChatHandler()

# Store user sessions
user_sessions = {}


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Mental Health Assessment API is running',
        'timestamp': datetime.now().isoformat()
    }), 200


@app.route('/api/start-session', methods=['POST'])
def start_session():
    """Start a new assessment session"""
    data = request.json
    session_id = data.get('session_id', datetime.now().strftime('%Y%m%d%H%M%S%f'))
    assessment_type = data.get('type', 'questionnaire')  # 'questionnaire' or 'chat'
    
    user_sessions[session_id] = {
        'type': assessment_type,
        'started_at': datetime.now().isoformat(),
        'responses': [],
        'current_question': 0,
        'symptoms_detected': [],
        'chat_history': []
    }
    
    if assessment_type == 'questionnaire':
        first_question = questionnaire_handler.get_first_question()
        return jsonify({
            'session_id': session_id,
            'type': 'questionnaire',
            'question': first_question
        }), 200
    else:
        welcome_message = chat_handler.get_welcome_message()
        return jsonify({
            'session_id': session_id,
            'type': 'chat',
            'message': welcome_message
        }), 200


@app.route('/api/questionnaire/answer', methods=['POST'])
def submit_answer():
    """Submit answer to questionnaire"""
    data = request.json
    session_id = data.get('session_id')
    answer = data.get('answer')
    
    if session_id not in user_sessions:
        return jsonify({'error': 'Invalid session'}), 400
    
    session = user_sessions[session_id]
    
    # Store the answer
    session['responses'].append({
        'question_index': session['current_question'],
        'answer': answer,
        'timestamp': datetime.now().isoformat()
    })
    
    # Get next question or results
    next_question = questionnaire_handler.get_next_question(
        session['current_question'], 
        session['responses']
    )
    
    session['current_question'] += 1
    
    if next_question is None:
        # Assessment complete
        results = symptom_analyzer.analyze_questionnaire(session['responses'])
        return jsonify({
            'completed': True,
            'results': results
        }), 200
    else:
        return jsonify({
            'completed': False,
            'question': next_question,
            'progress': questionnaire_handler.get_progress(session['current_question'])
        }), 200


@app.route('/api/chat/message', methods=['POST'])
def chat_message():
    """Handle chat message from user"""
    data = request.json
    session_id = data.get('session_id')
    message = data.get('message')
    
    if session_id not in user_sessions:
        return jsonify({'error': 'Invalid session'}), 400
    
    session = user_sessions[session_id]
    
    # Add user message to history
    session['chat_history'].append({
        'role': 'user',
        'message': message,
        'timestamp': datetime.now().isoformat()
    })
    
    # Process the message and extract symptoms
    response, symptoms_found = chat_handler.process_message(
        message, 
        session['chat_history']
    )
    
    # Update detected symptoms
    session['symptoms_detected'].extend(symptoms_found)
    
    # Add bot response to history
    session['chat_history'].append({
        'role': 'bot',
        'message': response,
        'timestamp': datetime.now().isoformat()
    })
    
    return jsonify({
        'response': response,
        'symptoms_detected': list(set(session['symptoms_detected']))
    }), 200


@app.route('/api/chat/analyze', methods=['POST'])
def analyze_chat():
    """Analyze chat conversation and provide assessment"""
    data = request.json
    session_id = data.get('session_id')
    
    if session_id not in user_sessions:
        return jsonify({'error': 'Invalid session'}), 400
    
    session = user_sessions[session_id]
    
    # Analyze all collected symptoms
    results = symptom_analyzer.analyze_chat_symptoms(
        session['symptoms_detected'],
        session['chat_history']
    )
    
    return jsonify({
        'results': results
    }), 200


@app.route('/api/symptoms/search', methods=['POST'])
def search_symptoms():
    """Search for symptoms in text"""
    data = request.json
    text = data.get('text', '')
    
    symptoms = symptom_analyzer.extract_symptoms(text)
    possible_conditions = symptom_analyzer.get_possible_conditions(symptoms)
    
    return jsonify({
        'symptoms_found': symptoms,
        'possible_conditions': possible_conditions
    }), 200


@app.route('/api/conditions', methods=['GET'])
def get_conditions():
    """Get all mental health conditions"""
    conditions = symptom_analyzer.get_all_conditions()
    return jsonify({'conditions': conditions}), 200


@app.route('/api/condition/<condition_name>', methods=['GET'])
def get_condition_details(condition_name):
    """Get details about a specific condition"""
    details = symptom_analyzer.get_condition_details(condition_name)
    if details:
        return jsonify(details), 200
    else:
        return jsonify({'error': 'Condition not found'}), 404


@app.route('/api/session/<session_id>', methods=['GET'])
def get_session(session_id):
    """Get session information"""
    if session_id in user_sessions:
        return jsonify(user_sessions[session_id]), 200
    else:
        return jsonify({'error': 'Session not found'}), 404


@app.route('/api/session/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    """Delete a session"""
    if session_id in user_sessions:
        del user_sessions[session_id]
        return jsonify({'message': 'Session deleted'}), 200
    else:
        return jsonify({'error': 'Session not found'}), 404


if __name__ == '__main__':
    print("=" * 50)
    print("Mental Health Assessment API Server")
    print("=" * 50)
    print("Server starting on http://localhost:5000")
    print("\nAvailable Endpoints:")
    print("  POST /api/start-session - Start new assessment")
    print("  POST /api/questionnaire/answer - Submit questionnaire answer")
    print("  POST /api/chat/message - Send chat message")
    print("  POST /api/chat/analyze - Get chat analysis")
    print("  POST /api/symptoms/search - Search symptoms in text")
    print("  GET  /api/conditions - Get all conditions")
    print("  GET  /api/condition/<name> - Get condition details")
    print("=" * 50)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
