import re
import random
from datetime import datetime


class ChatHandler:
    """Handles natural language chat-based mental health assessment with 5-level conversation"""
    
    def __init__(self):
        self.symptom_patterns = self._load_symptom_patterns()
        self.level_responses = self._load_level_responses()
        self.empathy_responses = self._load_empathy_responses()
        self.symptom_suggestions = self._load_symptom_suggestions()
    
    def _load_symptom_patterns(self):
        """Load regex patterns for symptom detection"""
        return {
            'sadness': [
                r'\b(sad|depressed|down|unhappy|miserable|hopeless|empty|low mood)\b',
                r'\b(feeling low|feeling blue|no joy|lost interest)\b',
                r'\b(crying|tears|grief)\b'
            ],
            'anxiety': [
                r'\b(anxious|worried|nervous|tense|stressed|panic|fear)\b',
                r'\b(can\'t relax|on edge|restless|uneasy)\b',
                r'\b(worry|worrying|overthinking)\b'
            ],
            'sleep': [
                r'\b(can\'t sleep|insomnia|trouble sleeping|sleep problems|sleepless)\b',
                r'\b(sleeping too much|oversleeping|tired all day)\b',
                r'\b(nightmares|bad dreams|wake up)\b'
            ],
            'energy': [
                r'\b(tired|fatigue|exhausted|no energy|drained|weak)\b',
                r'\b(can\'t get out of bed|too tired|lethargic)\b'
            ],
            'concentration': [
                r'\b(can\'t focus|can\'t concentrate|distracted|unfocused)\b',
                r'\b(trouble thinking|mind racing|foggy|confused)\b',
                r'\b(forgetful|memory)\b'
            ],
            'social': [
                r'\b(avoid people|avoiding|don\'t want to see anyone|isolated)\b',
                r'\b(alone|lonely|withdrawn)\b',
                r'\b(scared of people|judgment|embarrassed)\b'
            ],
            'panic': [
                r'\b(panic|heart racing|palpitations)\b',
                r'\b(can\'t breathe|shortness of breath|chest)\b',
                r'\b(sudden fear|intense fear)\b'
            ],
            'appetite': [
                r'\b(no appetite|not eating|lost weight|overeating)\b',
                r'\b(eating too much|weight gain|binge)\b'
            ],
            'mood_swings': [
                r'\b(mood swings|ups and downs|irritable|angry)\b',
                r'\b(emotional|crying easily|outbursts)\b'
            ],
            'worthlessness': [
                r'\b(worthless|useless|failure|burden|guilty)\b',
                r'\b(hate myself|self-blame|shame)\b'
            ],
            'suicidal': [
                r'\b(suicide|suicidal|kill myself|end my life|want to die)\b',
                r'\b(better off dead|no point living)\b'
            ]
        }
    
    def _load_symptom_suggestions(self):
        """Suggestions based on detected symptoms - from dataset patterns"""
        return {
            'sadness': {
                'related': ['loss of interest', 'hopelessness', 'low energy', 'sleep changes'],
                'question': "People experiencing sadness often also feel a loss of interest in activities they used to enjoy. Have you noticed this?"
            },
            'anxiety': {
                'related': ['restlessness', 'difficulty relaxing', 'excessive worry', 'nervousness'],
                'question': "Anxiety often comes with physical symptoms like restlessness or difficulty relaxing. Do you experience these?"
            },
            'sleep': {
                'related': ['fatigue', 'difficulty concentrating', 'irritability', 'low energy'],
                'question': "Sleep problems often affect daytime energy and concentration. How has this been impacting your daily life?"
            },
            'energy': {
                'related': ['fatigue', 'difficulty with daily tasks', 'loss of motivation', 'physical weakness'],
                'question': "Low energy often makes daily tasks feel overwhelming. Are you finding it hard to complete normal activities?"
            },
            'concentration': {
                'related': ['poor memory', 'difficulty making decisions', 'mental fog', 'easily distracted'],
                'question': "Concentration issues often affect decision-making and memory. Have you noticed these patterns?"
            },
            'social': {
                'related': ['loneliness', 'fear of judgment', 'avoiding interaction', 'low confidence'],
                'question': "Social avoidance often comes with fear of judgment or low confidence. Do these resonate with you?"
            },
            'panic': {
                'related': ['rapid heartbeat', 'sweating', 'trembling', 'fear of losing control'],
                'question': "Panic symptoms often include physical sensations like rapid heartbeat or sweating. Do you experience these?"
            },
            'appetite': {
                'related': ['weight changes', 'emotional eating', 'loss of taste', 'irregular meals'],
                'question': "Appetite changes often lead to weight fluctuations. Have you noticed changes in your weight?"
            },
            'mood_swings': {
                'related': ['irritability', 'emotional outbursts', 'unpredictable moods', 'impulsive behavior'],
                'question': "Mood swings can sometimes lead to impulsive decisions or emotional outbursts. Is this familiar to you?"
            },
            'worthlessness': {
                'related': ['guilt', 'self-criticism', 'feeling like a burden', 'low self-esteem'],
                'question': "Feelings of worthlessness often come with excessive guilt or self-criticism. Do you relate to this?"
            }
        }
    
    def _load_level_responses(self):
        """Load responses for each of the 5 conversation levels"""
        return {
            1: [
                "Thank you for sharing. To understand better, could you tell me about your sleep patterns lately? Any trouble falling asleep or staying asleep?",
                "I appreciate you opening up. How has your sleep been? This often tells us a lot about mental wellbeing.",
                "Thank you. Let's start by understanding your daily patterns - how well have you been sleeping recently?"
            ],
            2: [
                "I see. Now, how about your appetite and energy levels? Have you noticed any changes there?",
                "Thank you. Are you experiencing any changes in appetite or feeling more tired than usual?",
                "Understood. Have you noticed any shifts in your eating habits or overall energy throughout the day?"
            ],
            3: [
                "That's helpful. Have you had difficulty concentrating or making decisions lately?",
                "Thank you for sharing. How has your concentration been? Any trouble focusing on tasks?",
                "I appreciate that. Do you find yourself easily distracted or having memory issues?"
            ],
            4: [
                "I'm getting a clearer picture. {suggestion}",
                "Thank you for being open. {suggestion}",
                "This helps a lot. {suggestion}"
            ],
            5: [
                "I now have a comprehensive understanding of your symptoms. I'm ready to provide your personalized assessment with specific recommendations.",
                "Thank you for sharing all of this. I have enough information to generate your detailed mental health assessment.",
                "I appreciate your openness throughout our conversation. Your assessment with personalized insights is ready."
            ]
        }
    
    def _load_empathy_responses(self):
        """Load empathetic response templates"""
        return [
            "I hear you.",
            "Thank you for trusting me with this.",
            "That sounds challenging.",
            "I understand.",
            "I appreciate you sharing."
        ]
    
    def get_welcome_message(self):
        """Get initial welcome message"""
        return {
            'message': "Hello! I'm MindEase AI. I'll ask you a few questions to understand your mental health better. Please answer honestly - your responses help me provide accurate insights. What symptoms or feelings have been bothering you lately?",
            'type': 'greeting',
            'level': 1
        }
    
    def process_message(self, user_message, chat_history):
        """Process user message and generate level-based response"""
        symptoms_detected = self._detect_symptoms(user_message)
        
        if self._is_crisis(symptoms_detected):
            return self._generate_crisis_response(), symptoms_detected
        
        user_messages = [msg for msg in chat_history if msg['role'] == 'user']
        level = min(len(user_messages) + 1, 5)
        
        all_symptoms = set(symptoms_detected)
        for msg in chat_history:
            if msg['role'] == 'user':
                all_symptoms.update(self._detect_symptoms(msg['message']))
        
        response = self._generate_level_response(level, list(all_symptoms), symptoms_detected)
        
        return response, symptoms_detected
    
    def _detect_symptoms(self, text):
        """Detect symptoms in user message"""
        text_lower = text.lower()
        detected = []
        
        for symptom_category, patterns in self.symptom_patterns.items():
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    detected.append(symptom_category)
                    break
        
        return detected
    
    def _is_crisis(self, symptoms):
        """Check if message indicates crisis"""
        return 'suicidal' in symptoms
    
    def _generate_crisis_response(self):
        """Generate crisis response"""
        return {
            'message': "I'm very concerned about what you've shared. Your safety is most important right now. Please reach out immediately:\n\nNational Suicide Prevention Lifeline: 1-800-273-8255 (24/7)\nCrisis Text Line: Text HOME to 741741\nEmergency: 911\n\nYou're not alone, and help is available.",
            'type': 'crisis',
            'crisis_resources': [
                {'name': 'National Suicide Prevention Lifeline', 'phone': '1-800-273-8255'},
                {'name': 'Crisis Text Line', 'text': 'Text HOME to 741741'},
                {'name': 'Emergency', 'phone': '911'}
            ]
        }
    
    def _generate_level_response(self, level, all_symptoms, current_symptoms):
        """Generate response based on conversation level"""
        empathy = random.choice(self.empathy_responses)
        
        if level <= 3:
            level_response = random.choice(self.level_responses[level])
            return {
                'message': f"{empathy} {level_response}",
                'type': 'follow_up',
                'level': level,
                'detected_symptoms': current_symptoms
            }
        
        elif level == 4:
            # Level 4: Suggest related symptoms based on what's detected
            suggestion = "Based on what you've shared, have you also noticed any physical tension, changes in your daily routine, or feeling overwhelmed?"
            
            if all_symptoms:
                primary_symptom = all_symptoms[0]
                if primary_symptom in self.symptom_suggestions:
                    suggestion = self.symptom_suggestions[primary_symptom]['question']
            
            response_template = random.choice(self.level_responses[4])
            response = response_template.format(suggestion=suggestion)
            
            return {
                'message': f"{empathy} {response}",
                'type': 'confirmation',
                'level': level,
                'detected_symptoms': current_symptoms,
                'suggested_symptoms': self.symptom_suggestions.get(all_symptoms[0] if all_symptoms else 'sadness', {}).get('related', [])
            }
        
        else:
            # Level 5: Ready for assessment
            response = random.choice(self.level_responses[5])
            return {
                'message': f"{empathy} {response}",
                'type': 'ready_for_assessment',
                'level': level,
                'detected_symptoms': current_symptoms
            }
    
    def should_end_conversation(self, chat_history, symptoms_detected):
        """Check if 5 questions have been asked"""
        user_messages = [msg for msg in chat_history if msg['role'] == 'user']
        return len(user_messages) >= 5
    
    def generate_summary_prompt(self, chat_history):
        """Generate summary prompt"""
        return {
            'message': "I have gathered enough information. Type 'show results' to see your comprehensive assessment.",
            'type': 'summary_prompt',
            'options': ['Show my results', 'I want to share more']
        }
