import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Current date context for all AI interactions (Critical for 2025 awareness)
export const getCurrentContext = () => {
  const now = new Date();
  return {
    currentDate: now.toISOString().split('T')[0], // 2025-07-02
    currentYear: 2025,
    currentQuarter: 'Q3 2025',
    lastYear: 2024,
    contextPrompt: `
      You are operating in July 2025. When creating content:
      - Reference current events from 2025
      - Mention "this year" when referring to 2025
      - Use "last year" for 2024 events
      - Be aware of technological advances since 2024
      - Understand the current business/economic climate of mid-2025
      - Reference recent developments (Q1/Q2 2025)
      - Project forward into late 2025 and early 2026
      - Never sound like you're writing from 2024
    `
  };
};

export default openai;