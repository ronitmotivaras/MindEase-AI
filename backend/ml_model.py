"""
Mental Health ML Model - Uses trained model on mental health dataset
"""
import pandas as pd
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re


class MentalHealthModel:
    """ML Model for mental health condition prediction"""
    
    def __init__(self):
        self.data_path = os.path.join(os.path.dirname(__file__), 'data', 'mental_health_dataset.csv')
        self.conditions_data = None
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 3), max_features=5000, stop_words='english')
        self.condition_vectors = None
        self._load_and_train()
    
    def _load_and_train(self):
        """Load dataset and train the model"""
        try:
            self.conditions_data = pd.read_csv(self.data_path)
            print(f"Loaded mental health dataset with {len(self.conditions_data)} conditions")
            self._train_model()
        except FileNotFoundError:
            print(f"Dataset not found. Using default conditions.")
            self._use_default_conditions()
    
    def _use_default_conditions(self):
        """Use default conditions if dataset is not available"""
        default_data = {
            'condition': ['Depression', 'Anxiety Disorder', 'Stress', 'Bipolar Disorder', 
                         'Obsessive Compulsive Disorder', 'Post Traumatic Stress Disorder', 
                         'Social Anxiety Disorder', 'Insomnia'],
            'symptoms': [
                'persistent sadness, loss of interest, low energy, fatigue, hopelessness, difficulty concentrating, sleep changes, appetite changes, worthlessness',
                'excessive worry, restlessness, rapid heartbeat, sweating, trembling, difficulty sleeping, nervousness, panic attacks',
                'feeling overwhelmed, irritability, headaches, muscle tension, trouble sleeping, difficulty relaxing, poor concentration, pressure',
                'extreme mood swings, high energy, low mood, impulsive behavior, racing thoughts, reduced sleep, loss of interest',
                'repetitive thoughts, fear of contamination, repeated checking, ritual behavior, anxiety, excessive cleanliness, uncontrollable thoughts',
                'flashbacks, nightmares, trauma avoidance, emotional numbness, hypervigilance, anger, sleep difficulty',
                'fear of social situations, avoiding interaction, fear of judgment, sweating, shaking, difficulty speaking, low confidence',
                'difficulty falling asleep, frequent waking, daytime tiredness, irritability, poor concentration, sleep anxiety, restless thoughts'
            ]
        }
        self.conditions_data = pd.DataFrame(default_data)
        self._train_model()
    
    def _train_model(self):
        """Train TF-IDF vectorizer on symptoms"""
        if self.conditions_data is None:
            return
        all_symptoms = self.conditions_data['symptoms'].tolist()
        self.condition_vectors = self.vectorizer.fit_transform(all_symptoms)
    
    def predict_conditions(self, user_text: str, top_k: int = 5) -> list:
        """Predict mental health conditions based on user input text"""
        if self.condition_vectors is None:
            return []
        
        processed_text = self._preprocess_text(user_text)
        user_vector = self.vectorizer.transform([processed_text])
        similarities = cosine_similarity(user_vector, self.condition_vectors).flatten()
        top_indices = similarities.argsort()[-top_k:][::-1]
        
        results = []
        for idx in top_indices:
            if similarities[idx] > 0.01:
                condition = self.conditions_data.iloc[idx]
                matched_symptoms = self._get_matched_symptoms(user_text.lower(), condition['symptoms'])
                results.append({
                    'condition': condition['condition'],
                    'confidence': round(float(similarities[idx]) * 100, 2),
                    'matched_symptoms': matched_symptoms,
                    'severity': self._calculate_severity(similarities[idx], len(matched_symptoms))
                })
        return results
    
    def _preprocess_text(self, text: str) -> str:
        """Preprocess text for better matching"""
        text = text.lower()
        synonyms = {
            'sad': 'sadness depression down unhappy',
            'anxious': 'anxiety worry nervous worried',
            'tired': 'fatigue exhausted low energy',
            'scared': 'fear anxiety panic afraid',
            'angry': 'irritability anger frustrated',
            'nervous': 'anxiety worry restless',
            'panic': 'panic attack anxiety fear',
            'sleep': 'insomnia sleep difficulty sleeping',
        }
        enhanced_text = text
        for word, syns in synonyms.items():
            if word in text:
                enhanced_text += ' ' + syns
        return enhanced_text
    
    def _get_matched_symptoms(self, user_text: str, condition_symptoms: str) -> list:
        """Find which symptoms from the condition match the user text"""
        symptoms_list = [s.strip() for s in condition_symptoms.split(',')]
        matched = []
        user_words = set(re.findall(r'\b\w+\b', user_text.lower()))
        
        for symptom in symptoms_list:
            symptom_words = set(re.findall(r'\b\w+\b', symptom.lower()))
            if symptom_words & user_words:
                matched.append(symptom.strip())
        return matched
    
    def _calculate_severity(self, confidence: float, matched_count: int) -> str:
        """Calculate severity based on confidence and matched symptoms"""
        score = confidence * 100 + (matched_count * 5)
        if score >= 70:
            return 'Severe'
        elif score >= 50:
            return 'Moderate'
        elif score >= 30:
            return 'Mild'
        return 'Minimal'
    
    def get_condition_info(self, condition_name: str) -> dict:
        """Get detailed information about a specific condition"""
        if self.conditions_data is None:
            return None
        condition_row = self.conditions_data[
            self.conditions_data['condition'].str.lower() == condition_name.lower()
        ]
        if condition_row.empty:
            return None
        condition = condition_row.iloc[0]
        return {
            'name': condition['condition'],
            'symptoms': condition['symptoms'].split(', '),
            'description': self._get_condition_description(condition['condition'])
        }
    
    def _get_condition_description(self, condition_name: str) -> str:
        """Get description for a condition"""
        descriptions = {
            'Depression': 'A mood disorder causing persistent feelings of sadness and loss of interest.',
            'Anxiety Disorder': 'Excessive worry and anxiety that interferes with daily activities.',
            'Stress': 'Physical and emotional response to demanding situations.',
            'Bipolar Disorder': 'Mental health condition with extreme mood swings.',
            'Obsessive Compulsive Disorder': 'Unwanted thoughts leading to repetitive behaviors.',
            'Post Traumatic Stress Disorder': 'Condition triggered by experiencing trauma.',
            'Social Anxiety Disorder': 'Intense fear of social situations.',
            'Insomnia': 'Sleep disorder causing difficulty falling or staying asleep.'
        }
        return descriptions.get(condition_name, 'A mental health condition.')
    
    def get_all_conditions(self) -> list:
        """Get list of all conditions in the dataset"""
        if self.conditions_data is None:
            return []
        return [
            {'name': row['condition'], 'description': self._get_condition_description(row['condition'])}
            for _, row in self.conditions_data.iterrows()
        ]


# Singleton instance
_model_instance = None

def get_model():
    """Get or create the ML model singleton"""
    global _model_instance
    if _model_instance is None:
        _model_instance = MentalHealthModel()
    return _model_instance
