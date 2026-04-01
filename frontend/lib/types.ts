export type ParsedResume = {
  name?: string;
  email?: string;
  phone?: string;
  skills?: string[];
  experience?: string[];
  education?: string;
  projects?: string[];
};

export type ParsedJobDescription = {
  title?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  responsibilities?: string[];
};

export type UploadResponse = {
  job_description: ParsedJobDescription;
  resumes: ParsedResume[];
  ranked_resumes?: Array<{
    name?: string;
    phone?: string;
    email?: string;
    total_score?: number;
    score_breakdown?: {
      skills?: number;
      experience?: number;
      education?: number;
    };
    matched_skills?: string[];
    unmatched_skills?: string[];
    extra_skills?: string[];
  }>;
  run_id?: string | null;
};

/** 0–100 per resume section vs JD (transparent breakdown). */
export type SectionScores = {
  skills: number;
  experience: number;
  education: number;
  projects: number;
  certifications: number;
};

export type RankedResume = ParsedResume & {
  rank: number;
  fitScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  sectionScores: SectionScores;
};
