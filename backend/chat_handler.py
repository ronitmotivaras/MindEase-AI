import re
import random
from datetime import datetime


class ChatHandler:
    """Handles natural language chat-based mental health assessment"""
    
    def __init__(self):
        self.conversation_stage = 'greeting'
        self.symptom_patterns = self._load_symptom_patterns()
        self.follow_up_questions = self._load_follow_up_questions()
        self.empathy_responses = self._load_empathy_responses()
    
    def _load_symptom_patterns(self):
        """Load regex patterns for symptom detection"""
        return {
            'sadness': [
                r'\b(sad|depressed|down|unhappy|miserable|hopeless|empty)\b',
                r'\b(feeling low|feeling blue)\b',
                r'\b(crying|tears)\b'
            ],
            'anxiety': [
                r'\b(anxious|worried|nervous|tense|stressed|panic)\b',
                r'\b(can\'t relax|on edge|restless)\b',
                r'\b(worry|worrying)\b'
            ],
            'sleep': [
                r'\b(can\'t sleep|insomnia|trouble sleeping|sleep problems)\b',
                r'\b(sleeping too much|oversleeping)\b',
                r'\b(nightmares|bad dreams)\b'
            ],
            'energy': [
                r'\b(tired|fatigue|exhausted|no energy|drained)\b',
                r'\b(can\'t get out of bed|too tired)\b'
            ],
            'concentration': [
                r'\b(can\'t focus|can\'t concentrate|distracted|unfocused)\b',
                r'\b(trouble thinking|mind racing|foggy)\b'
            ],
            'social': [
                r'\b(avoid people|avoiding social|don\'t want to see anyone)\b',
                r'\b(isolated|alone|lonely)\b',
                r'\b(scared of people|fear of judgment|embarrassed)\b'
            ],
            'panic': [
                r'\b(panic attack|heart racing|palpitations)\b',
                r'\b(can\'t breathe|shortness of breath|chest pain)\b',
                r'\b(sudden fear|intense fear)\b'
            ],
            'trauma': [
                r'\b(trauma|traumatic|ptsd|flashback)\b',
                r'\b(triggered|reminders of)\b'
            ],
            'obsessive': [
                r'\b(obsessive thoughts|can\'t stop thinking|intrusive thoughts)\b',
                r'\b(checking|ritual|compulsive|repeatedly)\b'
            ],
            'mood_swings': [
                r'\b(mood swings|ups and downs|manic|euphoric)\b',
                r'\b(really high energy|don\'t need sleep)\b'
            ],
            'impulsivity': [
                r'\b(impulsive|reckless|risky behavior)\b',
                r'\b(can\'t sit still|hyperactive|fidget)\b'
            ],
            'worthlessness': [
                r'\b(worthless|useless|failure|burden)\b',
                r'\b(hate myself|guilty)\b'
            ],
            'suicidal': [
                r'\b(suicide|suicidal|kill myself|end my life|want to die)\b',
                r'\b(better off dead|no point living)\b'
            ]
        }
    
    def _load_follow_up_questions(self):
        """Load follow-up questions based on detected symptoms"""
        return {
            'sadness': [
                "I hear that you're feeling down. How long have you been feeling this way?",
                "That sounds really difficult. Have you noticed if anything in particular triggers these sad feelings?",
                "Thank you for sharing. Have you lost interest in activities you used to enjoy?"
            ],
            'anxiety': [
                "It sounds like you're experiencing a lot of worry. Can you tell me more about what you're anxious about?",
                "I understand anxiety can be overwhelming. Do you notice physical symptoms when you feel anxious, like a racing heart or sweating?",
                "Does this anxiety happen in specific situations, or is it more constant throughout the day?"
            ],
            'sleep': [
                "Sleep problems can really affect how we feel. How many hours are you sleeping on average?",
                "Is it more difficult falling asleep, staying asleep, or both?",
                "Have these sleep issues been affecting your daily functioning?"
            ],
            'social': [
                "Social situations can be challenging. What specifically makes you want to avoid them?",
                "How do you feel before, during, and after social interactions?",
                "Has avoiding social situations been affecting your relationships or work?"
            ],
            'panic': [
                "Panic attacks can be very frightening. How often do these episodes occur?",
                "What physical symptoms do you experience during these episodes?",
                "Do you worry about having another panic attack?"
            ],
            'suicidal': [
                "I'm really concerned about what you've shared. Are you having thoughts of harming yourself right now?",
                "Your safety is the most important thing. Do you have a plan or means to hurt yourself?",
                "Have you told anyone else about these thoughts?"
            ]
        }
    
    def _load_empathy_responses(self):
        """Load empathetic response templates"""
        return [
            "Thank you for sharing that with me. It takes courage to talk about these things.",
            "I hear you, and what you're experiencing sounds really challenging.",
            "That must be very difficult to deal with. I appreciate you opening up.",
            "I understand this isn't easy to talk about. You're doing the right thing by seeking help.",
            "What you're feeling is valid, and I'm here to help you work through this."
        ]
    
    def get_welcome_message(self):
        """Get initial welcome message"""
        return {
            'message': "Hello! I'm here to help you assess your mental health. This is a safe space where you can share what you're experiencing. Feel free to describe your symptoms, feelings, or concerns in your own words. What brings you here today?",
            'type': 'greeting'
        }
    
    def process_message(self, user_message, chat_history):
        """Process user message and generate response"""
        # Detect symptoms in message
        symptoms_detected = self._detect_symptoms(user_message)
        
        # Check for crisis situation
        if self._is_crisis(symptoms_detected):
            return self._generate_crisis_response(), symptoms_detected
        
        # Generate empathetic response
        response = self._generate_response(user_message, symptoms_detected, chat_history)
        
        return response, symptoms_detected
    
    def _detect_symptoms(self, text):
        """Detect symptoms in user message using pattern matching"""
        text_lower = text.lower()
        detected = []
        
        for symptom_category, patterns in self.symptom_patterns.items():
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    detected.append(symptom_category)
                    break  # Only add category once
        
        return detected
    
    def _is_crisis(self, symptoms):
        """Check if message indicates crisis situation"""
        return 'suicidal' in symptoms
    
    def _generate_crisis_response(self):
        """Generate immediate crisis response"""
        return {
            'message': "I'm very concerned about what you've shared. Your safety is the most important thing right now. Please reach out to a crisis helpline immediately:",
            'type': 'crisis',
            'crisis_resources': [
                {
                    'name': 'National Suicide Prevention Lifeline',
                    'phone': '1-800-273-8255',
                    'available': '24/7'
                },
                {
                    'name': 'Crisis Text Line',
                    'text': 'Text HOME to 741741',
                    'available': '24/7'
                },
                {
                    'name': 'Emergency',
                    'phone': '911',
                    'note': 'For immediate danger'
                }
            ],
            'follow_up': "Would you like to talk about what's making you feel this way? I'm here to listen."
        }
    
    def _generate_response(self, user_message, symptoms_detected, chat_history):
        """Generate appropriate response based on context"""
        # Start with empathy
        empathy = random.choice(self.empathy_responses)
        
        # Determine what to ask about
        if not symptoms_detected:
            # No specific symptoms detected, ask open-ended question
            return {
                'message': f"{empathy} Can you tell me more about how you've been feeling lately? For example, how has your mood, sleep, and energy level been?",
                'type': 'clarification'
            }
        
        # We detected symptoms, ask follow-up
        primary_symptom = symptoms_detected[0]  # Focus on first detected
        
        if primary_symptom in self.follow_up_questions:
            follow_up = random.choice(self.follow_up_questions[primary_symptom])
            
            return {
                'message': f"{empathy} {follow_up}",
                'type': 'follow_up',
                'detected_symptoms': symptoms_detected
            }
        
        # Default response
        return {
            'message': f"{empathy} Can you tell me more about what you're experiencing? How long have these symptoms been affecting you?",
            'type': 'general'
        }
    
    def should_end_conversation(self, chat_history, symptoms_detected):
        """Determine if enough information has been gathered"""
        # End conversation after sufficient exchanges
        user_messages = [msg for msg in chat_history if msg['role'] == 'user']
        
        # Need at least 4-5 exchanges to gather enough info
        if len(user_messages) >= 5:
            return True
        
        # Or if we've detected symptoms from multiple categories
        if len(set(symptoms_detected)) >= 4:
            return True
        
        return False
    
    def generate_summary_prompt(self, chat_history):
        """Generate prompt to ask user if they want analysis"""
        return {
            'message': "Thank you for sharing all of this with me. I've gathered enough information to provide you with an assessment. Would you like me to analyze what we've discussed and give you some insights?",
            'type': 'summary_prompt',
            'options': ['Yes, show me the assessment', 'I want to share more']
        }
