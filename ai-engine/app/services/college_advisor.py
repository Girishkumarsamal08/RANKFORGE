from typing import List, Dict

class CollegeAdvisorService:
    # Database of top colleges in India categorized by typical GATE score/marks cutoffs
    COLLEGES_DATA = {
        "IISc": {
            "name": "IISc Bangalore",
            "min_marks": 75.0,
            "type": "IISC",
            "tier": 1,
            "description": "Premier research institute. Requires top 100 All India Rank."
        },
        "IITB": {
            "name": "IIT Bombay",
            "min_marks": 72.0,
            "type": "IIT",
            "tier": 1,
            "description": "Highly sought-after, especially for Computer Science and Microelectronics."
        },
        "IITD": {
            "name": "IIT Delhi",
            "min_marks": 70.0,
            "type": "IIT",
            "tier": 1,
            "description": "Excellent infrastructure and industry connections."
        },
        "IITK": {
            "name": "IIT Kanpur",
            "min_marks": 68.0,
            "type": "IIT",
            "tier": 1,
            "description": "Known for academic rigor and strong computer science/theoretical research."
        },
        "IITM": {
            "name": "IIT Madras",
            "min_marks": 68.0,
            "type": "IIT",
            "tier": 1,
            "description": "Consistently ranked #1 in NIRF. Superb research culture."
        },
        "IITKGP": {
            "name": "IIT Kharagpur",
            "min_marks": 65.0,
            "type": "IIT",
            "tier": 1,
            "description": "Huge campus, excellent placements across all engineering streams."
        },
        "IITR": {
            "name": "IIT Roorkee",
            "min_marks": 63.0,
            "type": "IIT",
            "tier": 1,
            "description": "Outstanding core engineering programs and research history."
        },
        "IITG": {
            "name": "IIT Guwahati",
            "min_marks": 61.0,
            "type": "IIT",
            "tier": 1,
            "description": "Highly active coding culture and scenic campus."
        },
        # Tier 2: Mid IITs & Top NITs
        "IITH": {
            "name": "IIT Hyderabad",
            "min_marks": 58.0,
            "type": "IIT",
            "tier": 2,
            "description": "Excellent research focus, strong proximity to Hyderabad tech hub."
        },
        "IITBHU": {
            "name": "IIT BHU Varanasi",
            "min_marks": 56.0,
            "type": "IIT",
            "tier": 2,
            "description": "Reputed historical legacy, great placement statistics."
        },
        "IITIND": {
            "name": "IIT Indore",
            "min_marks": 55.0,
            "type": "IIT",
            "tier": 2,
            "description": "Rapidly growing research profile and modern infrastructure."
        },
        "NITT": {
            "name": "NIT Trichy",
            "min_marks": 55.0,
            "type": "NIT",
            "tier": 2,
            "description": "Consistently ranked as the top NIT in India."
        },
        "NITS": {
            "name": "NIT Surathkal (Karnataka)",
            "min_marks": 54.0,
            "type": "NIT",
            "tier": 2,
            "description": "Stunning beach campus and excellent placement records."
        },
        "NITW": {
            "name": "NIT Warangal",
            "min_marks": 53.0,
            "type": "NIT",
            "tier": 2,
            "description": "Strong alumni network and robust academic performance."
        },
        "IIITB": {
            "name": "IIIT Bangalore",
            "min_marks": 52.0,
            "type": "IIIT",
            "tier": 2,
            "description": "Excellent specialized PG courses in IT/Software Systems."
        },
        # Tier 3: New IITs & Mid NITs
        "IITGND": {
            "name": "IIT Gandhinagar",
            "min_marks": 50.0,
            "type": "IIT",
            "tier": 3,
            "description": "Interdisciplinary research structure and modern campus."
        },
        "IITRPR": {
            "name": "IIT Ropar",
            "min_marks": 49.0,
            "type": "IIT",
            "tier": 3,
            "description": "Rising placements, strong academic curriculum."
        },
        "IITPTN": {
            "name": "IIT Patna",
            "min_marks": 48.0,
            "type": "IIT",
            "tier": 3,
            "description": "Good placements and active coding society."
        },
        "MNNIT": {
            "name": "MNNIT Allahabad",
            "min_marks": 48.0,
            "type": "NIT",
            "tier": 3,
            "description": "Extremely popular for CS with historically high placements."
        },
        "NITK": {
            "name": "NIT Calicut",
            "min_marks": 46.0,
            "type": "NIT",
            "tier": 3,
            "description": "Top-tier NIT in South India with a beautiful green campus."
        },
        "MNIT": {
            "name": "MNIT Jaipur",
            "min_marks": 45.0,
            "type": "NIT",
            "tier": 3,
            "description": "Excellent campus life and decent core/IT placements."
        },
        "VNIT": {
            "name": "VNIT Nagpur",
            "min_marks": 45.0,
            "type": "NIT",
            "tier": 3,
            "description": "Central location, highly respected state-level engineering reputation."
        },
        "IIITD": {
            "name": "IIIT Delhi",
            "min_marks": 44.0,
            "type": "IIIT",
            "tier": 3,
            "description": "Research-focused, highly structured courses in Artificial Intelligence."
        },
        # Tier 4: Lower NITs & Top State/Private
        "NITD": {
            "name": "NIT Durgapur",
            "min_marks": 38.0,
            "type": "NIT",
            "tier": 4,
            "description": "Good local brand, solid academic foundation."
        },
        "NITSIL": {
            "name": "NIT Silchar",
            "min_marks": 36.0,
            "type": "NIT",
            "tier": 4,
            "description": "Excellent computer engineering infrastructure and low cost of living."
        },
        "COEP": {
            "name": "COEP Tech University Pune",
            "min_marks": 35.0,
            "type": "STATE",
            "tier": 4,
            "description": "One of Asia's oldest engineering institutes, high regional prestige in Maharashtra."
        },
        "JU": {
            "name": "Jadavpur University Kolkata",
            "min_marks": 34.0,
            "type": "STATE",
            "tier": 4,
            "description": "Extremely low fees and ROI that rivals top IITs."
        },
        "PEC": {
            "name": "PEC Chandigarh",
            "min_marks": 33.0,
            "type": "STATE",
            "tier": 4,
            "description": "Rich legacy, strong alumni network in Northern India."
        },
        "BITSP": {
            "name": "BITS Pilani (HD program)",
            "min_marks": 32.0,
            "type": "PRIVATE",
            "tier": 4,
            "description": "Admits via GATE scores for select branches, top-tier private curriculum."
        }
    }

    @classmethod
    def get_recommendations(cls, score: float, branch: str, query: str) -> str:
        # Standardize inputs
        branch = branch.upper()
        
        # Scaling score: The database cutoffs represent marks out of 100.
        # But wait! RANKFORGE test maximum score is 12.0 marks (6 questions * 2.0 marks each).
        # We need to scale the user's score to the 100-mark GATE equivalent:
        # (user_score / 12) * 100
        scaled_marks = (score / 12.0) * 100.0 if score <= 12.0 else score
        scaled_marks = max(0.0, min(100.0, scaled_marks))

        # Classify user standing based on scaled marks
        standing = ""
        suggested_tiers = []
        if scaled_marks >= 70:
            standing = "Exceptional (Top-Tier IITs & IISc)"
            suggested_tiers = [1, 2]
        elif scaled_marks >= 52:
            standing = "Very Good (Mid IITs, Top NITs, IIITs)"
            suggested_tiers = [2, 3]
        elif scaled_marks >= 40:
            standing = "Good (New IITs, Mid NITs)"
            suggested_tiers = [3, 4]
        elif scaled_marks >= 30:
            standing = "Qualifying (Lower NITs, Top State & Private Colleges)"
            suggested_tiers = [4]
        else:
            standing = "Below Average (Needs Improvement)"
            suggested_tiers = []

        # Filter colleges user is eligible for based on cutoffs
        eligible_colleges = []
        ambitious_colleges = []
        
        for code, info in cls.COLLEGES_DATA.items():
            if scaled_marks >= info["min_marks"]:
                eligible_colleges.append(info)
            elif scaled_marks >= info["min_marks"] - 8.0:
                ambitious_colleges.append(info)

        # Sort lists by score requirement descending
        eligible_colleges = sorted(eligible_colleges, key=lambda x: x["min_marks"], reverse=True)
        ambitious_colleges = sorted(ambitious_colleges, key=lambda x: x["min_marks"], reverse=True)

        # Analyze query keywords to tailor the focus of the response
        focus_type = None
        q_lower = query.lower()
        if "iit" in q_lower:
            focus_type = "IIT"
        elif "nit" in q_lower:
            focus_type = "NIT"
        elif "iiit" in q_lower:
            focus_type = "IIIT"

        # Construct the response markdown
        response = f"### 🤖 AI College Admissions Advisor\n\n"
        response += f"Based on your profile, your mock test score of **{score:.2f}/12.00** scales to approximately **{scaled_marks:.1f} out of 100** in a standard GATE paper difficulty. Here is your evaluation for the **{branch}** engineering stream:\n\n"
        response += f"*   **Current standing:** `{standing}`\n"
        response += f"*   **Projected cutoff match:** Meets requirements for **{len(eligible_colleges)}** premium national colleges.\n\n"

        if not eligible_colleges and not ambitious_colleges:
            response += "❌ **Recommendation Status:** Your current score is below the typical admission cutoffs for Tier-4 NITs and State Universities. We recommend reviewing your **Weak Topics** (found on your dashboard) and attempting more mock exams to bring your score above 30/100 (approx 3.6/12 marks).\n"
            return response

        # 1. Direct Referrals (Match Tiers)
        response += "#### 🎓 Recommended Referrals (High Chance of Admission)\n"
        if eligible_colleges:
            count = 0
            for col in eligible_colleges:
                if focus_type and col["type"] != focus_type and col["type"] != "IISC":
                    continue
                response += f"*   **{col['name']}** ({col['type']}): {col['description']} (Typical GATE Cutoff: ~`{col['min_marks']} marks`)\n"
                count += 1
                if count >= 4:
                    break
        else:
            response += "*No direct matches in this category yet. Keep practicing to unlock Tier-1 to Tier-3 institutes!*\n"

        # 2. Ambitious Tiers (Slightly above current score)
        if ambitious_colleges:
            response += "\n#### 🎯 Target/Ambitious Referrals (Slightly Above Current Score)\n"
            response += "With a marginal score boost of **3 to 8 marks**, these premium institutes will fall into your safe admission range:\n"
            count = 0
            for col in ambitious_colleges:
                if focus_type and col["type"] != focus_type and col["type"] != "IISC":
                    continue
                response += f"*   **{col['name']}** ({col['type']}): {col['description']} (Requires: ~`{col['min_marks']} marks`)\n"
                count += 1
                if count >= 3:
                    break

        # 3. Strategy advice
        response += "\n#### 💡 Strategy Recommendation\n"
        if scaled_marks < 50:
            response += "To expand your admission list into the IITs, prioritize high-yield math and aptitude sections. Standardize your revision workflow on topics showing low accuracy in your dashboard radar chart."
        else:
            response += "You are in a strong position. Aim for absolute perfection in numerical answer type (NAT) questions (which have no negative markings) to secure a top 500 All India Rank (AIR) and qualify for direct IISC/IIT research interviews."

        return response
