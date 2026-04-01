export function buildResumeAnalyzePrompt(jobDescription: string): Array<{ role: 'system' | 'user'; content: string }> {
  return [
    {
      role: 'system',
      content: `You are a job description analyzer. Extract key information from the job description.

Return a JSON object:
{
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill1", "skill2"],
  "experienceLevel": "junior|mid|senior|lead",
  "keyResponsibilities": ["resp1", "resp2"],
  "keywords": ["keyword1", "keyword2"]
}`,
    },
    {
      role: 'user',
      content: `Analyze this job description:\n\n${jobDescription}`,
    },
  ];
}
