/**
 * Test script to verify QUESTION intent detection
 */

const testCases = [
  // Should detect QUESTION - General questions in Spanish
  { text: "qué es esto", expected: "QUESTION" },
  { text: "qué color tiene", expected: "QUESTION" },
  { text: "cómo funciona", expected: "QUESTION" },
  { text: "cuánto cuesta", expected: "QUESTION" },
  { text: "cuántos hay", expected: "QUESTION" },
  { text: "cuál es el más grande", expected: "QUESTION" },
  { text: "dónde está", expected: "QUESTION" },
  { text: "cuándo expira", expected: "QUESTION" },
  { text: "quién es", expected: "QUESTION" },
  { text: "por qué está roto", expected: "QUESTION" },
  { text: "para qué sirve", expected: "QUESTION" },
  { text: "de qué está hecho", expected: "QUESTION" },
  { text: "dime el precio", expected: "QUESTION" },
  { text: "explícame esto", expected: "QUESTION" },
  { text: "cuéntame más", expected: "QUESTION" },
  { text: "es un producto orgánico", expected: "QUESTION" },
  { text: "hay alguna advertencia", expected: "QUESTION" },
  { text: "puede usarlo un niño", expected: "QUESTION" },
  { text: "tiene garantía", expected: "QUESTION" },
  
  // Should detect QUESTION - General questions in English
  { text: "what is this", expected: "QUESTION" },
  { text: "how does it work", expected: "QUESTION" },
  { text: "where is it", expected: "QUESTION" },
  { text: "when does it expire", expected: "QUESTION" },
  { text: "who made this", expected: "QUESTION" },
  { text: "why is it broken", expected: "QUESTION" },
  { text: "which one is better", expected: "QUESTION" },
  { text: "can you read the label", expected: "QUESTION" },
  { text: "tell me about this", expected: "QUESTION" },
  { text: "is there a warning", expected: "QUESTION" },
  { text: "are there any ingredients", expected: "QUESTION" },
  { text: "does it contain sugar", expected: "QUESTION" },
  { text: "do you see a date", expected: "QUESTION" },
  
  // Should detect DESCRIBE
  { text: "describe", expected: "DESCRIBE" },
  { text: "qué ves", expected: "DESCRIBE" },
  
  // Should detect REPEAT
  { text: "repite", expected: "REPEAT" },
  
  // Should detect HELP
  { text: "ayuda", expected: "HELP" },
];

// Pattern definitions (from CommandIntent.ts)
const INTENT_PATTERNS = [
  {
    type: 'DESCRIBE',
    patterns: [
      /\bdescrib[ea]?\b/i,
      /\bqu[eé]\s+(hay|ves|tienes?)\b/i,
      /\bwhat('s|.is)?\s+(in\s+front|around|there)\b/i,
    ],
  },
  {
    type: 'QUESTION',
    patterns: [
      // Patrones generales de preguntas en español
      /^qu[eé]\s+/i,
      /^c[oó]mo\s+/i,
      /^cu[aá]nto[s]?\s+/i,
      /^cu[aá]l[es]?\s+/i,
      /^d[oó]nde\s+/i,
      /^cu[aá]ndo\s+/i,
      /^qui[eé]n[es]?\s+/i,
      /^por\s+qu[eé]\s+/i,
      /^para\s+qu[eé]\s+/i,
      /\bde\s+qu[eé]\s+/i,
      /\bdime\s+/i,
      /\bexpl[ií]came\s+/i,
      /\bcu[eé]ntame\s+/i,
      /\bes\s+un[a]?\s+/i,
      /\bhay\s+/i,
      /\bpuede[s]?\s+/i,
      /\btiene[s]?\s+/i,
      
      // Patrones generales de preguntas en inglés
      /^what\s+/i,
      /^how\s+/i,
      /^where\s+/i,
      /^when\s+/i,
      /^who\s+/i,
      /^why\s+/i,
      /^which\s+/i,
      /^can\s+you\s+/i,
      /^tell\s+me\s+/i,
      /^is\s+there\s+/i,
      /^are\s+there\s+/i,
      /^does\s+/i,
      /^do\s+you\s+/i,
    ],
  },
  {
    type: 'REPEAT',
    patterns: [
      /\brepite\b/i,
      /\brepetir\b/i,
      /\brepeat\b/i,
    ],
  },
  {
    type: 'HELP',
    patterns: [
      /\bayuda\b/i,
      /\bhelp\b/i,
    ],
  },
];

function detectIntent(text) {
  for (const { type, patterns } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return { type, match: text.match(pattern)[0] };
      }
    }
  }
  return { type: 'UNKNOWN', match: null };
}

console.log('Testing QUESTION intent detection...\n');

let passed = 0;
let failed = 0;

for (const { text, expected } of testCases) {
  const result = detectIntent(text);
  const success = result.type === expected;
  
  if (success) {
    console.log(`✓ "${text}" → ${result.type} (matched: "${result.match}")`);
    passed++;
  } else {
    console.log(`✗ "${text}" → ${result.type} (expected: ${expected})`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('\n✓ All tests passed! QUESTION intent is working correctly.');
} else {
  console.log('\n✗ Some tests failed. Check the patterns.');
  process.exit(1);
}
