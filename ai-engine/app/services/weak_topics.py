from typing import Dict, List, Any
from app.schemas.prediction import WeakTopicsInput, WeakTopicsOutput, TopicAnalysis, UserAnswerInput

class WeakTopicsService:
    @staticmethod
    def analyze_weak_topics(data: WeakTopicsInput) -> WeakTopicsOutput:
        # Group answers by (subject, topic)
        grouped: Dict[tuple, List[UserAnswerInput]] = {}
        for ans in data.answers:
            key = (ans.subject, ans.topic)
            if key not in grouped:
                grouped[key] = []
            grouped[key].append(ans)
            
        topic_analyses: List[TopicAnalysis] = []
        high_priority_count = 0
        weakest_topics_list = []

        for (subject, topic), answers_list in grouped.items():
            correct_count = sum(1 for a in answers_list if a.is_correct)
            total_count = len(answers_list)
            accuracy = correct_count / total_count if total_count > 0 else 0.0
            
            avg_time = sum(a.time_spent_seconds for a in answers_list) / total_count if total_count > 0 else 0.0
            
            # Decide priority based on accuracy and speed
            if accuracy < 0.60:
                priority = "HIGH"
                high_priority_count += 1
                weakest_topics_list.append(topic)
            elif accuracy < 0.80:
                priority = "MEDIUM"
            else:
                priority = "LOW"
                
            topic_analyses.append(TopicAnalysis(
                subject=subject,
                topic=topic,
                accuracy=round(accuracy, 2),
                average_time_seconds=round(avg_time, 1),
                recommendation_priority=priority
            ))
            
        # Sort topic analyses so high priority is first, then ascending accuracy
        topic_analyses.sort(key=lambda x: (x.recommendation_priority == "LOW", x.recommendation_priority == "MEDIUM", x.accuracy))

        # Generate action recommendations
        recommendations = []
        if high_priority_count > 0:
            weakest_str = ", ".join(weakest_topics_list[:3])
            recommendations.append(f"Immediate Action Required: Revise core theory for {weakest_str}. Use GATE-specific resources.")
            recommendations.append("Solve 15-20 Subject-wise previous year questions (PYQs) with a timer.")
        else:
            recommendations.append("Accuracy levels are good. Target reducing average solve times under 120 seconds per question.")
            
        recommendations.append("Conduct a full-length formula revision cycle and practice mixed NAT questions.")
        recommendations.append("Join an active test analysis forum or check AI recommendation notes on the platform.")

        return WeakTopicsOutput(
            weak_topics=topic_analyses,
            recommendations=recommendations
        )
