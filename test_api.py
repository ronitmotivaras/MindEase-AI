"""
API Testing Script for Mental Health Assessment Backend
Run this to test all endpoints
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5000"

def test_health_check():
    """Test health check endpoint"""
    print("\n" + "="*50)
    print("Testing Health Check...")
    print("="*50)
    
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

def test_questionnaire_flow():
    """Test complete questionnaire flow"""
    print("\n" + "="*50)
    print("Testing Questionnaire Flow...")
    print("="*50)
    
    # Start session
    print("\n1. Starting questionnaire session...")
    response = requests.post(
        f"{BASE_URL}/api/start-session",
        json={"type": "questionnaire"}
    )
    data = response.json()
    session_id = data['session_id']
    print(f"Session ID: {session_id}")
    print(f"First Question: {data['question']['question']}")
    
    # Answer a few questions
    answers = ["Often", "Yes", "Yes", "Sometimes", "Yes"]
    
    for i, answer in enumerate(answers):
        print(f"\n2.{i+1}. Submitting answer: {answer}")
        response = requests.post(
            f"{BASE_URL}/api/questionnaire/answer",
            json={
                "session_id": session_id,
                "answer": answer
            }
        )
        data = response.json()
        
        if data.get('completed'):
            print("Assessment completed!")
            print(f"Results: {json.dumps(data['results'], indent=2)}")
            break
        else:
            print(f"Progress: {data.get('progress', 0)}%")
            print(f"Next Question: {data['question']['question']}")
    
    return session_id

def test_chat_flow():
    """Test chat-based assessment flow"""
    print("\n" + "="*50)
    print("Testing Chat Flow...")
    print("="*50)
    
    # Start chat session
    print("\n1. Starting chat session...")
    response = requests.post(
        f"{BASE_URL}/api/start-session",
        json={"type": "chat"}
    )
    data = response.json()
    session_id = data['session_id']
    print(f"Session ID: {session_id}")
    print(f"Welcome Message: {data['message']['message']}")
    
    # Simulate conversation
    messages = [
        "I've been feeling really sad and hopeless for the past few weeks",
        "I can't sleep at night and I'm always tired during the day",
        "I don't want to see anyone or do anything anymore",
        "Sometimes I feel like giving up"
    ]
    
    for i, message in enumerate(messages):
        print(f"\n2.{i+1}. User: {message}")
        response = requests.post(
            f"{BASE_URL}/api/chat/message",
            json={
                "session_id": session_id,
                "message": message
            }
        )
        data = response.json()
        print(f"Bot: {data['response']['message']}")
        print(f"Symptoms Detected: {data['symptoms_detected']}")
    
    # Get analysis
    print("\n3. Getting analysis...")
    response = requests.post(
        f"{BASE_URL}/api/chat/analyze",
        json={"session_id": session_id}
    )
    data = response.json()
    print(f"\nAnalysis Results:")
    print(json.dumps(data['results'], indent=2))
    
    return session_id

def test_symptom_search():
    """Test symptom search endpoint"""
    print("\n" + "="*50)
    print("Testing Symptom Search...")
    print("="*50)
    
    test_texts = [
        "I feel anxious and can't stop worrying about everything",
        "I have been experiencing panic attacks with heart palpitations",
        "I'm having intrusive thoughts and checking things repeatedly"
    ]
    
    for text in test_texts:
        print(f"\nSearching in: '{text}'")
        response = requests.post(
            f"{BASE_URL}/api/symptoms/search",
            json={"text": text}
        )
        data = response.json()
        print(f"Symptoms Found: {data['symptoms_found']}")
        print(f"Possible Conditions: {data['possible_conditions']}")

def test_conditions_endpoints():
    """Test conditions endpoints"""
    print("\n" + "="*50)
    print("Testing Conditions Endpoints...")
    print("="*50)
    
    # Get all conditions
    print("\n1. Getting all conditions...")
    response = requests.get(f"{BASE_URL}/api/conditions")
    data = response.json()
    print(f"Total Conditions: {len(data['conditions'])}")
    
    for condition in data['conditions'][:3]:  # Show first 3
        print(f"  - {condition['name']}")
    
    # Get specific condition
    print("\n2. Getting details for 'Depression'...")
    response = requests.get(f"{BASE_URL}/api/condition/Depression")
    data = response.json()
    print(f"Description: {data['description']}")
    print(f"Number of Symptoms: {len(data['symptoms'])}")

def run_all_tests():
    """Run all tests"""
    print("\n")
    print("="*60)
    print("MENTAL HEALTH API - COMPREHENSIVE TEST SUITE")
    print("="*60)
    print(f"Testing server at: {BASE_URL}")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Test health
        if not test_health_check():
            print("\n❌ Server is not running! Please start the server first.")
            return
        
        print("\n✅ Server is running!")
        
        # Run tests
        test_conditions_endpoints()
        test_symptom_search()
        test_questionnaire_flow()
        test_chat_flow()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS COMPLETED SUCCESSFULLY!")
        print("="*60)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to server!")
        print("Make sure the server is running: python app.py")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")

if __name__ == "__main__":
    run_all_tests()
