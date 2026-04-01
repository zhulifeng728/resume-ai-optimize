export function buildReviewDocPrompt(resumeText: string): Array<{ role: 'system' | 'user'; content: string }> {
  return [
    {
      role: 'system',
      content: `You are a senior technical interviewer. Based on the resume provided, generate a comprehensive technical review document for interview preparation.

The document should be in Markdown format with these sections:

# Technical Review Document

## 1. Core Tech Stack Review
For each technology mentioned in the resume, provide:
- Key concepts to review
- Common interview questions
- Best practices

## 2. Project Deep-Dive Questions
For each project in the resume:
- Architecture questions
- Design decision questions
- Challenge/solution scenarios

## 3. System Design Topics
Based on the candidate's experience level:
- Relevant system design problems
- Key concepts to discuss

## 4. Behavioral Questions
Based on the projects and experience:
- Leadership scenarios
- Conflict resolution
- Technical decision-making

## 5. Study Plan
- Priority topics (high/medium/low)
- Recommended study timeline
- Resources

Be thorough and specific to the candidate's actual experience.`,
    },
    {
      role: 'user',
      content: `Generate a technical review document based on this resume:\n\n${resumeText}`,
    },
  ];
}
