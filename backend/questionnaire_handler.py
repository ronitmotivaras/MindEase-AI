class QuestionnaireHandler:
    """Handles questionnaire-based mental health assessment"""
    
    def __init__(self):
        self.questions = self._load_questions()
        self.total_questions = len(self.questions)
    
    def _load_questions(self):
        """Load all assessment questions"""
        return [
            # General screening questions
            {
                "id": 0,
                "question": "How would you rate your overall mood over the past two weeks?",
                "type": "scale",
                "options": ["Very Poor", "Poor", "Neutral", "Good", "Very Good"],
                "category": "general"
            },
            {
                "id": 1,
                "question": "Have you been feeling sad, down, or hopeless most of the day, nearly every day?",
                "type": "yes_no",
                "category": "depression"
            },
            {
                "id": 2,
                "question": "Have you lost interest or pleasure in activities you usually enjoy?",
                "type": "yes_no",
                "category": "depression"
            },
            {
                "id": 3,
                "question": "Have you experienced significant changes in your appetite or weight?",
                "type": "yes_no",
                "category": "depression"
            },
            {
                "id": 4,
                "question": "How often do you have trouble falling asleep, staying asleep, or sleeping too much?",
                "type": "frequency",
                "options": ["Never", "Rarely", "Sometimes", "Often", "Always"],
                "category": "sleep"
            },
            {
                "id": 5,
                "question": "Do you feel tired or have little energy most days?",
                "type": "yes_no",
                "category": "depression"
            },
            {
                "id": 6,
                "question": "Do you feel worthless or excessively guilty about things?",
                "type": "yes_no",
                "category": "depression"
            },
            {
                "id": 7,
                "question": "Do you have difficulty concentrating or making decisions?",
                "type": "yes_no",
                "category": "cognitive"
            },
            {
                "id": 8,
                "question": "Have you had thoughts of death or suicide?",
                "type": "yes_no",
                "category": "crisis",
                "critical": True
            },
            {
                "id": 9,
                "question": "How often do you feel nervous, anxious, or on edge?",
                "type": "frequency",
                "options": ["Never", "Rarely", "Sometimes", "Often", "Always"],
                "category": "anxiety"
            },
            {
                "id": 10,
                "question": "Do you find it difficult to control your worry?",
                "type": "yes_no",
                "category": "anxiety"
            },
            {
                "id": 11,
                "question": "Do you worry excessively about many different things?",
                "type": "yes_no",
                "category": "anxiety"
            },
            {
                "id": 12,
                "question": "Have you experienced sudden episodes of intense fear or panic?",
                "type": "yes_no",
                "category": "panic"
            },
            {
                "id": 13,
                "question": "During these episodes, did you experience physical symptoms like racing heart, sweating, or shortness of breath?",
                "type": "yes_no",
                "category": "panic",
                "depends_on": 12
            },
            {
                "id": 14,
                "question": "Do you avoid certain places or situations because they make you anxious?",
                "type": "yes_no",
                "category": "avoidance"
            },
            {
                "id": 15,
                "question": "Do you feel anxious in social situations where you might be judged by others?",
                "type": "yes_no",
                "category": "social_anxiety"
            },
            {
                "id": 16,
                "question": "Do you avoid social situations because of fear or anxiety?",
                "type": "yes_no",
                "category": "social_anxiety"
            },
            {
                "id": 17,
                "question": "Have you experienced or witnessed a traumatic event?",
                "type": "yes_no",
                "category": "trauma"
            },
            {
                "id": 18,
                "question": "Do you have recurring, distressing memories or nightmares about a traumatic event?",
                "type": "yes_no",
                "category": "ptsd",
                "depends_on": 17
            },
            {
                "id": 19,
                "question": "Do you avoid thoughts, feelings, or reminders of a traumatic experience?",
                "type": "yes_no",
                "category": "ptsd",
                "depends_on": 17
            },
            {
                "id": 20,
                "question": "Do you have recurring, unwanted thoughts that cause anxiety?",
                "type": "yes_no",
                "category": "ocd"
            },
            {
                "id": 21,
                "question": "Do you feel driven to perform certain behaviors or rituals repeatedly?",
                "type": "yes_no",
                "category": "ocd"
            },
            {
                "id": 22,
                "question": "Do you spend a lot of time checking things, counting, or seeking reassurance?",
                "type": "yes_no",
                "category": "ocd"
            },
            {
                "id": 23,
                "question": "Have you experienced periods of unusually high energy or euphoria?",
                "type": "yes_no",
                "category": "bipolar"
            },
            {
                "id": 24,
                "question": "During these high-energy periods, did you need much less sleep than usual?",
                "type": "yes_no",
                "category": "bipolar",
                "depends_on": 23
            },
            {
                "id": 25,
                "question": "Do you have racing thoughts or talk more rapidly than usual?",
                "type": "yes_no",
                "category": "bipolar"
            },
            {
                "id": 26,
                "question": "Do you have difficulty sustaining attention on tasks?",
                "type": "yes_no",
                "category": "adhd"
            },
            {
                "id": 27,
                "question": "Are you easily distracted or have trouble organizing tasks?",
                "type": "yes_no",
                "category": "adhd"
            },
            {
                "id": 28,
                "question": "Do you often fidget, feel restless, or have difficulty sitting still?",
                "type": "yes_no",
                "category": "adhd"
            },
            {
                "id": 29,
                "question": "On a scale of 1-10, how much do these symptoms interfere with your daily life?",
                "type": "scale_numeric",
                "options": list(range(1, 11)),
                "category": "impact"
            },
            {
                "id": 30,
                "question": "How long have you been experiencing these symptoms?",
                "type": "duration",
                "options": [
                    "Less than 2 weeks",
                    "2 weeks to 1 month",
                    "1-3 months",
                    "3-6 months",
                    "More than 6 months"
                ],
                "category": "duration"
            }
        ]
    
    def get_first_question(self):
        """Get the first question"""
        return self._format_question(self.questions[0])
    
    def get_next_question(self, current_index, responses):
        """Get next question based on previous responses"""
        next_index = current_index + 1
        
        # Check if assessment is complete
        if next_index >= len(self.questions):
            return None
        
        next_question = self.questions[next_index]
        
        # Check if question depends on previous answer
        if 'depends_on' in next_question:
            dependent_index = next_question['depends_on']
            dependent_response = self._get_response_by_index(responses, dependent_index)
            
            # Skip if dependent question was answered "No"
            if dependent_response and dependent_response.get('answer', '').lower() == 'no':
                return self.get_next_question(next_index, responses)
        
        return self._format_question(next_question)
    
    def _get_response_by_index(self, responses, question_index):
        """Get response for a specific question index"""
        for response in responses:
            if response.get('question_index') == question_index:
                return response
        return None
    
    def _format_question(self, question):
        """Format question for frontend"""
        formatted = {
            'id': question['id'],
            'question': question['question'],
            'type': question['type']
        }
        
        if 'options' in question:
            formatted['options'] = question['options']
        
        if question.get('critical', False):
            formatted['critical'] = True
            formatted['crisis_info'] = {
                'message': 'If you are in crisis or having thoughts of suicide, please contact:',
                'hotlines': [
                    {
                        'name': 'National Suicide Prevention Lifeline',
                        'number': '1-800-273-8255',
                        'text': 'Text HOME to 741741'
                    },
                    {
                        'name': 'Crisis Text Line',
                        'text': 'Text HELLO to 741741'
                    }
                ]
            }
        
        return formatted
    
    def get_progress(self, current_index):
        """Calculate progress percentage"""
        return round((current_index / self.total_questions) * 100, 1)
    
    def analyze_responses(self, responses):
        """Analyze all responses and calculate scores"""
        category_scores = {
            'depression': 0,
            'anxiety': 0,
            'panic': 0,
            'social_anxiety': 0,
            'ptsd': 0,
            'ocd': 0,
            'bipolar': 0,
            'adhd': 0
        }
        
        for response in responses:
            question_id = response.get('question_index')
            answer = response.get('answer', '')
            
            if question_id < len(self.questions):
                question = self.questions[question_id]
                category = question.get('category')
                
                # Score based on answer type
                if question['type'] == 'yes_no' and answer.lower() == 'yes':
                    if category in category_scores:
                        category_scores[category] += 1
                elif question['type'] == 'frequency':
                    freq_scores = {
                        'Never': 0,
                        'Rarely': 1,
                        'Sometimes': 2,
                        'Often': 3,
                        'Always': 4
                    }
                    if category in category_scores and answer in freq_scores:
                        category_scores[category] += freq_scores[answer]
        
        return category_scores
