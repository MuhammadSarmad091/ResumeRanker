import type {
  ParsedJobDescription,
  ParsedResume,
  RankedResume,
  SectionScores,
} from "./types";

export type SectionWeights = SectionScores;

function normalizeToken(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .replace(/\s+/g, " ");
}

function tokens(s: string): Set<string> {
  const n = normalizeToken(s);
  return new Set(n.split(" ").filter((t) => t.length > 1));
}

function tokenDiceSimilarity(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 && tb.size === 0) return 100;
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const x of ta) {
    if (tb.has(x) && x.length > 2) inter += 1;
  }
  return Math.round((2 * inter) / (ta.size + tb.size) * 100);
}

function skillLikelyMatch(jdSkill: string, resumeSkill: string): boolean {
  const a = normalizeToken(jdSkill);
  const b = normalizeToken(resumeSkill);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const ta = tokens(jdSkill);
  const tb = tokens(resumeSkill);
  for (const x of ta) {
    if (tb.has(x) && x.length > 2) return true;
  }
  return false;
}

function resumeSkillMatchesJdSkill(
  jdSkill: string,
  resumeSkills: string[]
): boolean {
  return resumeSkills.some((rs) => skillLikelyMatch(jdSkill, rs));
}

function responsibilityOverlap(
  responsibilities: string[],
  haystack: string
): number {
  if (!responsibilities.length) return 0;
  let hits = 0;
  for (const r of responsibilities) {
    const t = normalizeToken(r);
    if (t.length < 4) continue;
    const words = t.split(" ").filter((w) => w.length > 3);
    const significant = words.slice(0, 5).join(" ");
    if (significant && haystack.includes(significant)) hits += 1;
    else if (t.length > 6 && haystack.includes(t.slice(0, 12))) hits += 0.5;
  }
  return Math.min(1, hits / Math.max(1, responsibilities.length));
}

function certificationHeuristic(resume: ParsedResume): number {
  const blob = normalizeToken(
    [
      ...(resume.skills ?? []),
      ...(resume.experience ?? []),
      resume.education ?? "",
      ...(resume.projects ?? []),
    ].join(" ")
  );
  const hints = [
    "certified",
    "certification",
    "certificate",
    " aws ",
    "pmp",
    "scrum master",
    "google cloud",
    "azure",
    "microsoft certified",
    "cpa",
    "cissp",
  ];
  let hits = 0;
  for (const h of hints) {
    const p = h.trim();
    if (p && blob.includes(p)) hits += 1;
  }
  if (hits === 0) return 35;
  return Math.min(100, 40 + hits * 15);
}

export function computeSectionScores(
  jd: ParsedJobDescription,
  resume: ParsedResume
): SectionScores {
  const jdSkills = (jd.skills ?? []).filter(Boolean);
  const responsibilities = (jd.responsibilities ?? []).filter(Boolean);
  const resumeSkills = resume.skills ?? [];
  const expLines = resume.experience ?? [];
  const expText = normalizeToken(expLines.join(" "));
  const projText = normalizeToken((resume.projects ?? []).join(" "));

  const matched = jdSkills.filter((s) =>
    resumeSkillMatchesJdSkill(s, resumeSkills)
  );
  const skillDen = Math.max(jdSkills.length, 1);
  const skills = Math.round((matched.length / skillDen) * 100);

  const respOnExp = responsibilityOverlap(responsibilities, expText) * 100;
  const jdExpFit = tokenDiceSimilarity(jd.experience ?? "", expLines.join(" "));
  const experience = Math.round((respOnExp + jdExpFit) / 2);

  const education = tokenDiceSimilarity(
    jd.education ?? "",
    resume.education ?? ""
  );

  const projects = Math.round(
    responsibilityOverlap(responsibilities, projText) * 100
  );

  const certifications = certificationHeuristic(resume);

  return {
    skills,
    experience,
    education,
    projects,
    certifications,
  };
}

function weightedFit(scores: SectionScores, w: SectionWeights): number {
  const sum =
    scores.skills * w.skills +
    scores.experience * w.experience +
    scores.education * w.education +
    scores.projects * w.projects +
    scores.certifications * w.certifications;
  const den =
    w.skills + w.experience + w.education + w.projects + w.certifications;
  if (den <= 0) return 0;
  return Math.min(100, Math.round(sum / den));
}

const DEFAULT_WEIGHTS: SectionWeights = {
  skills: 32,
  experience: 28,
  education: 12,
  projects: 18,
  certifications: 10,
};

export function rankResumesAgainstJd(
  jd: ParsedJobDescription,
  resumes: ParsedResume[],
  sectionWeights?: Partial<SectionWeights>
): RankedResume[] {
  const w: SectionWeights = {
    skills: sectionWeights?.skills ?? DEFAULT_WEIGHTS.skills,
    experience: sectionWeights?.experience ?? DEFAULT_WEIGHTS.experience,
    education: sectionWeights?.education ?? DEFAULT_WEIGHTS.education,
    projects: sectionWeights?.projects ?? DEFAULT_WEIGHTS.projects,
    certifications:
      sectionWeights?.certifications ?? DEFAULT_WEIGHTS.certifications,
  };

  type Row = {
    resume: ParsedResume;
    origIndex: number;
    fitScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    sectionScores: SectionScores;
  };

  const jdSkills = (jd.skills ?? []).filter(Boolean);

  const rows: Row[] = resumes.map((resume, origIndex) => {
    const resumeSkills = resume.skills ?? [];
    const matchedSkills = jdSkills.filter((s) =>
      resumeSkillMatchesJdSkill(s, resumeSkills)
    );
    const missingSkills = jdSkills.filter(
      (s) => !resumeSkillMatchesJdSkill(s, resumeSkills)
    );
    const sectionScores = computeSectionScores(jd, resume);
    const fitScore = weightedFit(sectionScores, w);

    return {
      resume,
      origIndex,
      fitScore,
      matchedSkills,
      missingSkills,
      sectionScores,
    };
  });

  rows.sort((a, b) => {
    if (b.fitScore !== a.fitScore) return b.fitScore - a.fitScore;
    return a.origIndex - b.origIndex;
  });

  return rows.map((row, i) => ({
    ...row.resume,
    rank: i + 1,
    fitScore: row.fitScore,
    matchedSkills: row.matchedSkills,
    missingSkills: row.missingSkills,
    sectionScores: row.sectionScores,
  }));
}
