"""
Optional: Claude AI Integration for Enhanced NLP
This module provides advanced natural language understanding using Anthropic's Claude API

To use this:
1. pip install anthropic
2. Set your API key in .env: ANTHROPIC_API_KEY=your_key_here
3. Import and use in chat_handler.py
"""

import os
from anthropic import Anthropic


class ClaudeNLPEnhancer:
    """Enhanced NLP using Claude AI for better symptom detection and empathetic responses"""
    
    def __init__(self):
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment variables")
        
        self.client = Anthropic(api_key=api_key)
        self.model = "claude-3-5-sonnet-20241022"
    
    def analyze_mental_health_text(self, user_message, conversation_history=None):
        """
        Analyze user message for mental health symptoms using Claude
        
        Args:
            user_message (str): The user's message
            conversation_history (list): Previous conversation context
            
        Returns:
            dict: Analysis results with symptoms, sentiment, and recommendations
        """
        
        # Build conversation context
        context = ""
        if conversation_history:
            for msg in conversation_history[-3:]:  # Last 3 messages for context
                role = "User" if msg['role'] == 'user' else "Assistant"
                context += f"{role}: {msg['message']}\n"
        
        prompt = f"""You are a compassionate mental health assessment assistant. Analyze the following message for mental health symptoms.

Previous context:
{context}

Current message: {user_message}

Please provide:
1. A list of mental health symptoms detected (e.g., sadness, anxiety, sleep problems, etc.)
2. Possible mental health conditions that match these symptoms
3. The emotional tone/sentiment of the message
4. An empathetic, supportive response that:
   - Acknowledges their feelings
   - Asks a relevant follow-up question to gather more information
   - Is warm but professional

Format your response as JSON with these keys:
- symptoms: array of detected symptoms
- possible_conditions: array of possible conditions
- sentiment: string describing emotional tone
- empathetic_response: your supportive response
- follow_up_question: a relevant question to ask next
- crisis_indicators: boolean (true if urgent/crisis situation detected)

Important: If you detect any indication of suicidal thoughts or self-harm, set crisis_indicators to true."""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )
            
            # Parse Claude's response
            response_text = message.content[0].text
            
            # Try to extract JSON (Claude usually wraps it in markdown)
            import json
            import re
            
            # Remove markdown code blocks if present
            json_match = re.search(r'```json\n(.*?)\n```', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_str = response_text
            
            analysis = json.loads(json_str)
            return analysis
            
        except Exception as e:
            print(f"Error analyzing with Claude: {str(e)}")
            return {
                "symptoms": [],
                "possible_conditions": [],
                "sentiment": "neutral",
                "empathetic_response": "I hear you. Can you tell me more about what you're experiencing?",
                "follow_up_question": "How long have you been feeling this way?",
                "crisis_indicators": False
            }
    
    def generate_assessment_summary(self, symptoms_list, conversation_history):
        """
        Generate a comprehensive assessment summary using Claude
        
        Args:
            symptoms_list (list): All detected symptoms
            conversation_history (list): Complete conversation
            
        Returns:
            dict: Comprehensive assessment with recommendations
        """
        
        # Build conversation summary
        conversation_text = "\n".join([
            f"{msg['role']}: {msg['message']}" 
            for msg in conversation_history
        ])
        
        prompt = f"""Based on this mental health assessment conversation, provide a comprehensive summary and recommendations.

Conversation:
{conversation_text}

Detected symptoms: {', '.join(symptoms_list)}

Please provide:
1. A summary of the person's mental state
2. Identified mental health conditions with confidence levels (0-100%)
3. Severity assessment for each condition (Minimal/Mild/Moderate/Severe)
4. Specific recommendations for next steps
5. Any red flags or urgent concerns

Format as JSON with these keys:
- summary: brief overview of mental state
- conditions: array of objects with {name, confidence, severity, description}
- recommendations: array of recommendation objects with {type, priority, action}
- urgent_concerns: array of any crisis indicators
- overall_risk_level: Low/Moderate/High/Critical

Be thorough but compassionate. Remember this is for screening purposes only, not diagnosis."""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=2048,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )
            
            response_text = message.content[0].text
            
            # Extract JSON
            import json
            import re
            
            json_match = re.search(r'```json\n(.*?)\n```', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_str = response_text
            
            assessment = json.loads(json_str)
            return assessment
            
        except Exception as e:
            print(f"Error generating summary with Claude: {str(e)}")
            return None
    
    def suggest_follow_up_questions(self, current_symptoms, conversation_history):
        """
        Suggest relevant follow-up questions based on detected symptoms
        
        Returns:
            list: Array of suggested questions
        """
        
        prompt = f"""Given these detected symptoms in a mental health assessment: {', '.join(current_symptoms)}

Suggest 3 relevant follow-up questions that would help:
1. Clarify the severity of symptoms
2. Understand the duration and frequency
3. Identify triggers or patterns
4. Assess impact on daily functioning

Make questions empathetic, open-ended, and clinically relevant.
Return as JSON array of strings."""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=512,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )
            
            response_text = message.content[0].text
            import json
            import re
            
            json_match = re.search(r'```json\n(.*?)\n```', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_str = response_text
            
            questions = json.loads(json_str)
            return questions
            
        except Exception as e:
            print(f"Error generating questions with Claude: {str(e)}")
            return [
                "Can you tell me more about when these symptoms started?",
                "How are these symptoms affecting your daily life?",
                "Have you noticed any patterns or triggers?"
            ]


# Example usage in your chat_handler.py:
"""
from claude_nlp_enhancer import ClaudeNLPEnhancer

class ChatHandler:
    def __init__(self):
        try:
            self.nlp_enhancer = ClaudeNLPEnhancer()
            self.use_enhanced_nlp = True
        except ValueError:
            self.use_enhanced_nlp = False
            print("Claude API not configured, using basic NLP")
    
    def process_message(self, user_message, chat_history):
        if self.use_enhanced_nlp:
            analysis = self.nlp_enhancer.analyze_mental_health_text(
                user_message, 
                chat_history
            )
            return analysis['empathetic_response'], analysis['symptoms']
        else:
            # Fall back to basic pattern matching
            return self._basic_process_message(user_message, chat_history)
"""
