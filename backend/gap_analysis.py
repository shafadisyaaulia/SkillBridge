import re


class GapAnalyzer:
    def __init__(self, skill_taxonomy: dict, learning_resources: dict):
        self.skill_taxonomy = skill_taxonomy
        self.resources = learning_resources
        # Bangun reverse mapping: skill (cleaned) -> category
        self.skill_to_category: dict[str, str] = {}
        for category, skills in skill_taxonomy.items():
            for skill in skills:
                # Hapus regex escape character agar bisa dicocokkan dengan string biasa
                clean = re.sub(r"\\(.)", r"\1", skill).lower()
                self.skill_to_category[clean] = category

    def _normalize(self, skills: list) -> set:
        return {s.lower().strip() for s in skills if s.strip()}

    def analyze(self, user_skills: list, target_job_skills: list) -> dict:
        user_set = self._normalize(user_skills)
        target_set = self._normalize(target_job_skills)

        matched = user_set & target_set
        missing = target_set - user_set

        match_pct = (len(matched) / len(target_set) * 100) if target_set else 0.0

        # Kelompokkan missing skills berdasarkan kategori
        gap_by_category: dict[str, list] = {}
        for skill in sorted(missing):
            cat = self.skill_to_category.get(skill, "other")
            gap_by_category.setdefault(cat, []).append(skill)

        # Data radar chart per kategori
        all_categories = sorted(self.skill_taxonomy.keys())
        user_scores = []
        required_scores = []
        for cat in all_categories:
            cat_skills = {
                re.sub(r"\\(.)", r"\1", s).lower()
                for s in self.skill_taxonomy[cat]
            }
            u_count = len(user_set & cat_skills)
            r_count = len(target_set & cat_skills)
            if r_count > 0:
                user_scores.append(round(u_count / r_count * 100))
                required_scores.append(100)
            else:
                # Kategori ini tidak dibutuhkan target job
                user_scores.append(100 if u_count > 0 else 0)
                required_scores.append(0)

        return {
            "match_percentage": round(match_pct, 1),
            "matched_skills": sorted(matched),
            "missing_skills": sorted(missing),
            "gap_by_category": gap_by_category,
            "radar_chart_data": {
                "categories": all_categories,
                "user_scores": user_scores,
                "required_scores": required_scores,
            },
        }

    def recommend(self, missing_skills: list) -> dict:
        recommendations = []
        skills_not_covered = []

        for skill in missing_skills:
            skill_lower = skill.lower().strip()
            resource_title = self.resources.get(skill_lower)
            if resource_title:
                recommendations.append(
                    {
                        "skill": skill_lower,
                        "resources": [
                            {
                                "title": resource_title,
                                "provider": "IBM SkillsBuild",
                                "url": "https://skillsbuild.org/",
                                "level": "Intermediate",
                            }
                        ],
                    }
                )
            else:
                skills_not_covered.append(skill_lower)

        return {
            "recommendations": recommendations,
            "total_skills_covered": len(recommendations),
            "skills_not_covered": skills_not_covered,
        }
