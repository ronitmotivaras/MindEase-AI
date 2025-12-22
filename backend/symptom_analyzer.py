import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
import json


class SymptomAnalyzer:
    """Analyzes symptoms and provides mental health condition predictions"""
    
    def __init__(self):
        self.conditions = self._load_conditions()
        self.symptom_keywords = self._build_symptom_keywords()
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=1000)
        self._train_vectorizer()
    
    def _load_conditions(self):
        """Load mental health conditions database"""
        return {
            "Depression": {
                "description": "A mood disorder causing persistent feelings of sadness and loss of interest",
                "symptoms": [
                    "persistent sad mood",
                    "loss of interest",
                    "weight changes",
                    "sleep disturbances",
                    "fatigue",
                    "feelings of worthlessness",
                    "difficulty concentrating",
                    "thoughts of death or suicide",
                    "irritability",
                    "body aches"
                ],
                "severity_thresholds": {"mild": 3, "moderate": 5, "severe": 7}
            },
            "Generalized Anxiety Disorder": {
                "description": "Excessive worry and anxiety about various aspects of daily life",
                "symptoms": [
                    "excessive worry",
                    "restlessness",
                    "easily fatigued",
                    "difficulty concentrating",
                    "irritability",
                    "muscle tension",
                    "sleep problems",
                    "feeling nervous",
                    "sense of danger",
                    "increased heart rate"
                ],
                "severity_thresholds": {"mild": 3, "moderate": 5, "severe": 7}
            },
            "Panic Disorder": {
                "description": "Recurrent unexpected panic attacks with persistent concern",
                "symptoms": [
                    "sudden intense fear",
                    "heart palpitations",
                    "sweating",
                    "trembling",
                    "shortness of breath",
                    "chest pain",
                    "nausea",
                    "feeling dizzy",
                    "fear of dying",
                    "numbness"
                ],
                "severity_thresholds": {"mild": 3, "moderate": 5, "severe": 7}
            },
            "Social Anxiety Disorder": {
                "description": "Intense fear of social situations and being judged by others",
                "symptoms": [
                    "fear of social situations",
                    "worry about embarrassment",
                    "fear of judgment",
                    "social anxiety",
                    "avoidance of social events",
                    "physical symptoms in social settings",
                    "difficulty with eye contact",
                    "fear of strangers",
                    "post-event analysis"
                ],
                "severity_thresholds": {"mild": 3, "moderate": 5, "severe": 7}
            },
            "PTSD": {
                "description": "Mental health condition triggered by experiencing or witnessing trauma",
                "symptoms": [
                    "intrusive memories",
                    "flashbacks",
                    "nightmares",
                    "emotional distress",
                    "avoidance of trauma reminders",
                    "negative thoughts",
                    "emotional numbness",
                    "being easily startled",
                    "difficulty sleeping",
                    "hypervigilance"
                ],
                "severity_thresholds": {"mild": 3, "moderate": 5, "severe": 7}
            },
            "OCD": {
                "description": "Pattern of unwanted thoughts and fears leading to repetitive behaviors",
                "symptoms": [
                    "recurring unwanted thoughts",
                    "intense anxiety from obsessions",
                    "repetitive behaviors",
                    "compulsive checking",
                    "excessive cleaning",
                    "need for symmetry",
                    "intrusive thoughts about harm",
                    "time-consuming rituals",
                    "significant distress",
                    "daily life interference"
                ],
                "severity_thresholds": {"mild": 3, "moderate": 5, "severe": 7}
            },
            "Bipolar Disorder": {
                "description": "Mental health condition causing extreme mood swings",
                "symptoms": [
                    "elevated mood periods",
                    "increased energy",
                    "decreased need for sleep",
                    "racing thoughts",
                    "rapid speech",
                    "risky behavior",
                    "depressive periods",
                    "extreme mood changes",
                    "inflated self-esteem",
                    "poor concentration"
                ],
                "severity_thresholds": {"mild": 3, "moderate": 5, "severe": 7}
            },
            "ADHD": {
                "description": "Pattern of inattention and/or hyperactivity-impulsivity",
                "symptoms": [
                    "difficulty sustaining attention",
                    "easily distracted",
                    "difficulty organizing",
                    "forgetfulness",
                    "fidgeting",
                    "difficulty sitting still",
                    "excessive talking",
                    "interrupting others",
                    "difficulty waiting",
                    "impulsive decisions"
                ],
                "severity_thresholds": {"mild": 3, "moderate": 5, "severe": 7}
            }
        }
    
    def _build_symptom_keywords(self):
        """Build keyword mapping for symptom detection"""
        keywords = {
            # Depression keywords
            "sad": ["Depression"],
            "depressed": ["Depression"],
            "hopeless": ["Depression"],
            "worthless": ["Depression"],
            "suicidal": ["Depression"],
            "crying": ["Depression"],
            "empty": ["Depression"],
            
            # Anxiety keywords
            "worry": ["Generalized Anxiety Disorder"],
            "anxious": ["Generalized Anxiety Disorder", "Panic Disorder"],
            "nervous": ["Generalized Anxiety Disorder", "Social Anxiety Disorder"],
            "tense": ["Generalized Anxiety Disorder"],
            "restless": ["Generalized Anxiety Disorder"],
            
            # Panic keywords
            "panic": ["Panic Disorder"],
            "heart racing": ["Panic Disorder"],
            "palpitations": ["Panic Disorder"],
            "chest pain": ["Panic Disorder"],
            "dizzy": ["Panic Disorder"],
            
            # Social anxiety keywords
            "embarrassed": ["Social Anxiety Disorder"],
            "judged": ["Social Anxiety Disorder"],
            "social fear": ["Social Anxiety Disorder"],
            "avoid people": ["Social Anxiety Disorder"],
            
            # PTSD keywords
            "trauma": ["PTSD"],
            "flashback": ["PTSD"],
            "nightmare": ["PTSD"],
            "triggered": ["PTSD"],
            
            # OCD keywords
            "obsessive": ["OCD"],
            "compulsive": ["OCD"],
            "checking": ["OCD"],
            "ritual": ["OCD"],
            "repetitive": ["OCD"],
            
            # Bipolar keywords
            "manic": ["Bipolar Disorder"],
            "euphoric": ["Bipolar Disorder"],
            "mood swing": ["Bipolar Disorder"],
            "energetic": ["Bipolar Disorder"],
            
            # ADHD keywords
            "distracted": ["ADHD"],
            "hyperactive": ["ADHD"],
            "impulsive": ["ADHD", "Bipolar Disorder"],
            "unfocused": ["ADHD"],
            "fidget": ["ADHD"]
        }
        return keywords
    
    def _train_vectorizer(self):
        """Train TF-IDF vectorizer on symptoms"""
        all_symptoms = []
        for condition in self.conditions.values():
            all_symptoms.extend(condition['symptoms'])
        
        if all_symptoms:
            self.vectorizer.fit(all_symptoms)
    
    def extract_symptoms(self, text):
        """Extract symptoms from user text"""
        text_lower = text.lower()
        found_symptoms = []
        
        # Check for keyword matches
        for keyword, conditions in self.symptom_keywords.items():
            if keyword in text_lower:
                found_symptoms.append(keyword)
        
        return found_symptoms
    
    def get_possible_conditions(self, symptoms):
        """Get possible conditions based on symptoms"""
        condition_scores = {}
        
        for symptom in symptoms:
            if symptom in self.symptom_keywords:
                for condition in self.symptom_keywords[symptom]:
                    condition_scores[condition] = condition_scores.get(condition, 0) + 1
        
        # Sort by score
        sorted_conditions = sorted(
            condition_scores.items(), 
            key=lambda x: x[1], 
            reverse=True
        )
        
        return [
            {
                'name': cond,
                'confidence': score / len(symptoms) if symptoms else 0,
                'matched_symptoms': score
            }
            for cond, score in sorted_conditions
        ]
    
    def analyze_questionnaire(self, responses):
        """Analyze questionnaire responses"""
        # Count positive responses per condition
        condition_matches = {}
        
        for response in responses:
            answer = response.get('answer', '')
            if answer.lower() in ['yes', 'often', 'always', 'true']:
                # Increment condition scores based on question
                # This would be more sophisticated with actual questionnaire mapping
                pass
        
        # Calculate results
        results = self._calculate_results(condition_matches)
        return results
    
    def analyze_chat_symptoms(self, symptoms, chat_history):
        """Analyze symptoms collected from chat"""
        condition_scores = {}
        
        # Count symptom occurrences
        for symptom in symptoms:
            if symptom in self.symptom_keywords:
                for condition in self.symptom_keywords[symptom]:
                    if condition not in condition_scores:
                        condition_scores[condition] = {
                            'count': 0,
                            'symptoms': []
                        }
                    condition_scores[condition]['count'] += 1
                    condition_scores[condition]['symptoms'].append(symptom)
        
        # Build results
        results = []
        for condition_name, data in condition_scores.items():
            if condition_name in self.conditions:
                condition_info = self.conditions[condition_name]
                symptom_count = data['count']
                
                # Determine severity
                severity = self._determine_severity(
                    symptom_count, 
                    condition_info['severity_thresholds']
                )
                
                # Calculate confidence
                total_symptoms = len(condition_info['symptoms'])
                confidence = min(symptom_count / total_symptoms, 1.0) * 100
                
                results.append({
                    'condition': condition_name,
                    'description': condition_info['description'],
                    'confidence': round(confidence, 2),
                    'severity': severity,
                    'matched_symptoms': data['symptoms'],
                    'symptom_count': symptom_count
                })
        
        # Sort by confidence
        results.sort(key=lambda x: x['confidence'], reverse=True)
        
        return {
            'assessment_date': pd.Timestamp.now().isoformat(),
            'total_symptoms_detected': len(set(symptoms)),
            'conditions_identified': results,
            'recommendations': self._generate_recommendations(results)
        }
    
    def _determine_severity(self, symptom_count, thresholds):
        """Determine severity level"""
        if symptom_count >= thresholds['severe']:
            return 'Severe'
        elif symptom_count >= thresholds['moderate']:
            return 'Moderate'
        elif symptom_count >= thresholds['mild']:
            return 'Mild'
        else:
            return 'Minimal'
    
    def _generate_recommendations(self, results):
        """Generate recommendations based on results"""
        recommendations = []
        
        if not results:
            recommendations.append({
                'type': 'info',
                'message': 'Based on the assessment, no significant mental health concerns were detected.'
            })
        else:
            # Get highest confidence result
            top_result = results[0]
            
            if top_result['confidence'] > 70:
                recommendations.append({
                    'type': 'urgent',
                    'message': 'We strongly recommend consulting with a mental health professional soon.'
                })
            elif top_result['confidence'] > 50:
                recommendations.append({
                    'type': 'moderate',
                    'message': 'Consider speaking with a mental health professional about your symptoms.'
                })
            else:
                recommendations.append({
                    'type': 'info',
                    'message': 'Some symptoms detected. Monitoring your mental health is important.'
                })
            
            # Add general recommendations
            recommendations.append({
                'type': 'general',
                'message': 'Practice self-care: regular exercise, adequate sleep, and healthy eating.'
            })
            
            recommendations.append({
                'type': 'general',
                'message': 'Stay connected with friends and family for emotional support.'
            })
        
        # Add disclaimer
        recommendations.append({
            'type': 'disclaimer',
            'message': 'This assessment is not a substitute for professional medical advice. Always consult a healthcare provider for diagnosis and treatment.'
        })
        
        return recommendations
    
    def _calculate_results(self, condition_matches):
        """Calculate assessment results"""
        results = []
        
        for condition_name, score in condition_matches.items():
            if condition_name in self.conditions:
                condition_info = self.conditions[condition_name]
                
                severity = self._determine_severity(
                    score,
                    condition_info['severity_thresholds']
                )
                
                results.append({
                    'condition': condition_name,
                    'description': condition_info['description'],
                    'score': score,
                    'severity': severity
                })
        
        return results
    
    def get_all_conditions(self):
        """Get list of all conditions"""
        return [
            {
                'name': name,
                'description': info['description']
            }
            for name, info in self.conditions.items()
        ]
    
    def get_condition_details(self, condition_name):
        """Get detailed information about a condition"""
        if condition_name in self.conditions:
            return {
                'name': condition_name,
                **self.conditions[condition_name]
            }
        return None
