/**
 * Smart Hearing & Speech Intent Classifier for StealthGhost AI
 * Intelligently identifies when an interviewer is asking a technical/behavioral question,
 * filters background small-talk/noise, and triggers rapid auto-answering.
 */

const QUESTION_STARTERS = [
  'how',
  'what',
  'why',
  'when',
  'where',
  'which',
  'who',
  'can you',
  'could you',
  'would you',
  'will you',
  'explain',
  'describe',
  'tell me',
  'walk me through',
  'design',
  'implement',
  'compare',
  'differentiate',
  'have you ever',
  'is it possible',
  'how would you',
  'what happens if',
  'what is the difference',
  'how does',
  'why would',
  'in your opinion',
  'what are your thoughts',
  'assume we have',
  'suppose you are',
];

const FILLER_PHRASES = new Set([
  'yeah',
  'yes',
  'yep',
  'ok',
  'okay',
  'cool',
  'alright',
  'all right',
  'right',
  'sure',
  'um',
  'uh',
  'uh huh',
  'got it',
  'makes sense',
  'can you hear me',
  'hello',
  'hi',
  'hey',
  'thank you',
  'thanks',
  'perfect',
  'great',
  'awesome',
  'no problem',
  'sounds good',
  'good morning',
  'good afternoon',
]);

export function isFillerOrNoise(text: string): boolean {
  if (!text) return true;
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  if (normalized.length === 0) return true;
  if (FILLER_PHRASES.has(normalized)) return true;
  
  // Single-word non-question tokens under 4 letters
  if (normalized.split(/\s+/).length === 1 && normalized.length <= 4) {
    if (!['why', 'how', 'what'].includes(normalized)) {
      return true;
    }
  }
  return false;
}

export function isInterviewQuestion(text: string, strictFilter: boolean = true): boolean {
  if (!text || text.trim().length < 8) return false;

  const normalized = text.toLowerCase().trim();

  // If marked with question mark, it's definitely a question
  if (normalized.includes('?')) return true;

  // Filter out filler words if strict mode
  if (strictFilter && isFillerOrNoise(normalized)) {
    return false;
  }

  // Check question starter prefixes
  for (const starter of QUESTION_STARTERS) {
    if (normalized.startsWith(starter) || normalized.includes(' ' + starter + ' ')) {
      return true;
    }
  }

  // Interview question patterns (e.g. "your experience with...", "difference between...")
  if (
    normalized.includes('difference between') ||
    normalized.includes('pros and cons') ||
    normalized.includes('trade-off') ||
    normalized.includes('tradeoff') ||
    normalized.includes('time complexity') ||
    normalized.includes('space complexity') ||
    normalized.includes('how you handle') ||
    normalized.includes('how you would') ||
    normalized.includes('walk through') ||
    normalized.includes('talk about a time')
  ) {
    return true;
  }

  // In non-strict mode, any sentence longer than 25 characters without obvious filler can qualify
  if (!strictFilter && normalized.length > 25) {
    return true;
  }

  return false;
}
