export function buildResumeOptimizePrompt(resumeText: string, jobDescription: string): Array<{ role: 'system' | 'user'; content: string }> {
  return [
    {
      role: 'system',
      content: `You are an expert resume optimizer. Your task is to optimize a resume to better match a specific job description while maintaining truthfulness.

Rules:
1. NEVER fabricate experiences, skills, or qualifications
2. Rewrite bullet points to highlight relevant skills and achievements
3. Use keywords from the job description naturally
4. Quantify achievements where possible
5. Improve action verbs and conciseness
6. Reorganize sections for maximum impact

Output format: Return a JSON object with this structure:
{
  "optimizedResume": "The full optimized resume text",
  "sections": [
    {
      "title": "Section name",
      "original": "Original text for this section",
      "optimized": "Optimized text for this section",
      "explanation": "Why this change was made"
    }
  ],
  "matchScore": 85,
  "suggestions": ["Additional suggestion 1", "Additional suggestion 2"]
}`,
    },
    {
      role: 'user',
      content: `## Job Description\n${jobDescription}\n\n## Resume\n${resumeText}\n\nPlease optimize this resume for the job description above. Return the result as JSON.`,
    },
  ];
}
