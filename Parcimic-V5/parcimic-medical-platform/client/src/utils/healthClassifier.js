/**
 * Health Query Classifier
 * Determines if a user query is health-related before calling the LLM
 */

// Comprehensive health-related keywords
const HEALTH_KEYWORDS = [
  // Symptoms
  'fever', 'cough', 'pain', 'ache', 'symptom', 'sick', 'ill', 'fatigue', 'tired',
  'dizzy', 'nausea', 'vomit', 'diarrhea', 'constipation', 'headache', 'migraine',
  'breathing', 'breath', 'shortness', 'wheeze', 'chest', 'throat', 'sore',
  'rash', 'itch', 'swelling', 'inflammation', 'infection', 'wound', 'injury',
  'bleeding', 'bruise', 'burn', 'cut', 'fracture', 'sprain',
  
  // Vital signs & measurements
  'temperature', 'heart', 'pulse', 'bp', 'blood pressure', 'oxygen', 'o2',
  'saturation', 'glucose', 'sugar', 'weight', 'bmi', 'vital',
  
  // Medical conditions
  'sepsis', 'diabetes', 'hypertension', 'asthma', 'copd', 'pneumonia',
  'covid', 'flu', 'cold', 'allergy', 'disease', 'condition', 'disorder',
  'syndrome', 'chronic', 'acute',
  
  // Medications & treatment
  'medicine', 'medication', 'drug', 'pill', 'tablet', 'capsule', 'dose',
  'dosage', 'prescription', 'antibiotic', 'painkiller', 'treatment',
  'therapy', 'vaccine', 'injection', 'inhaler',
  
  // Healthcare
  'doctor', 'hospital', 'clinic', 'emergency', 'ambulance', 'nurse',
  'physician', 'specialist', 'appointment', 'checkup', 'diagnosis',
  'test', 'lab', 'scan', 'xray', 'mri', 'ct',
  
  // Health data
  'health', 'medical', 'risk', 'score', 'result', 'check', 'monitor',
  'track', 'record', 'history', 'report',
  
  // Body parts
  'head', 'eye', 'ear', 'nose', 'mouth', 'tooth', 'neck', 'shoulder',
  'arm', 'hand', 'finger', 'back', 'spine', 'stomach', 'abdomen',
  'leg', 'knee', 'foot', 'toe', 'skin', 'bone', 'muscle', 'joint',
  'heart', 'lung', 'liver', 'kidney', 'brain',
];

// Non-health keywords (strong indicators)
const NON_HEALTH_KEYWORDS = [
  'code', 'programming', 'javascript', 'python', 'html', 'css', 'function',
  'variable', 'array', 'loop', 'algorithm', 'database', 'api', 'server',
  'weather', 'movie', 'music', 'game', 'sport', 'politics', 'news',
  'recipe', 'cooking', 'travel', 'hotel', 'flight', 'car', 'shopping',
  'joke', 'story', 'poem', 'song', 'book', 'movie', 'celebrity',
];

/**
 * Classify a user query into health/non-health/uncertain
 * @param {string} query - User input
 * @returns {Object} - { category: 'health'|'non-health'|'uncertain', confidence: number, reason: string }
 */
export function classifyQuery(query) {
  if (!query || typeof query !== 'string') {
    return { category: 'uncertain', confidence: 0, reason: 'Empty or invalid query' };
  }

  const normalized = query.toLowerCase().trim();
  
  // Check for very short queries
  if (normalized.length < 3) {
    return { category: 'uncertain', confidence: 0.3, reason: 'Query too short' };
  }

  // Count health keyword matches
  let healthMatches = 0;
  let nonHealthMatches = 0;
  
  HEALTH_KEYWORDS.forEach(keyword => {
    if (normalized.includes(keyword)) {
      healthMatches++;
    }
  });
  
  NON_HEALTH_KEYWORDS.forEach(keyword => {
    if (normalized.includes(keyword)) {
      nonHealthMatches++;
    }
  });

  // Strong non-health indicators
  if (nonHealthMatches > 0 && healthMatches === 0) {
    return { 
      category: 'non-health', 
      confidence: 0.9, 
      reason: `Contains non-health keywords: ${nonHealthMatches}` 
    };
  }

  // Strong health indicators
  if (healthMatches >= 2) {
    return { 
      category: 'health', 
      confidence: 0.9, 
      reason: `Contains ${healthMatches} health keywords` 
    };
  }

  // Single health keyword
  if (healthMatches === 1) {
    return { 
      category: 'health', 
      confidence: 0.7, 
      reason: 'Contains 1 health keyword' 
    };
  }

  // Check for health-related patterns
  const healthPatterns = [
    /what (is|are|does|do|should|can|could|would).*(mean|indicate|suggest|cause|help|treat|cure)/i,
    /how (to|do|can|should).*(reduce|lower|increase|improve|treat|manage|prevent)/i,
    /(should i|do i need to|when to|is it safe).*(see|visit|call|go to).*(doctor|hospital|clinic)/i,
    /my (result|score|reading|level|test)/i,
    /(normal|high|low|abnormal).*(range|level|value|reading)/i,
  ];

  for (const pattern of healthPatterns) {
    if (pattern.test(normalized)) {
      return { 
        category: 'health', 
        confidence: 0.8, 
        reason: 'Matches health query pattern' 
      };
    }
  }

  // Check for greetings (allow these)
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'thanks', 'thank you'];
  if (greetings.some(g => normalized === g || normalized.startsWith(g + ' ') || normalized.endsWith(' ' + g))) {
    return { 
      category: 'health', 
      confidence: 0.9, 
      reason: 'Greeting or courtesy message' 
    };
  }

  // If no matches but query is short and simple, assume health-related (be lenient)
  if (normalized.split(' ').length <= 3 && healthMatches === 0 && nonHealthMatches === 0) {
    return { 
      category: 'uncertain', 
      confidence: 0.6, 
      reason: 'Short query without clear indicators - allowing through' 
    };
  }

  // Default to uncertain
  return { 
    category: 'uncertain', 
    confidence: 0.4, 
    reason: 'No clear health or non-health indicators' 
  };
}

/**
 * Get a blocked message for non-health queries
 * @returns {string}
 */
export function getBlockedMessage() {
  return "I can only help with health-related questions like symptoms, medications, or your health check results.\n\nTry asking:\n• \"What does my risk score mean?\"\n• \"What should I do about fever?\"\n• \"When should I see a doctor?\"";
}

/**
 * Get a clarification message for uncertain queries
 * @returns {string}
 */
export function getClarificationMessage() {
  return "I'm not sure if this is health-related. Could you clarify?\n\nI can help with:\n• Understanding your health results\n• Explaining symptoms\n• Medication guidance\n• When to seek medical help";
}

/**
 * Validate LLM output to ensure it's health-related
 * @param {string} response - LLM response
 * @returns {Object} - { isValid: boolean, sanitizedResponse: string }
 */
export function validateOutput(response) {
  if (!response || typeof response !== 'string') {
    return { 
      isValid: false, 
      sanitizedResponse: "I can only assist with health-related topics." 
    };
  }

  const normalized = response.toLowerCase();

  // Check for code snippets
  if (normalized.includes('```') || normalized.includes('function(') || 
      normalized.includes('const ') || normalized.includes('let ') ||
      normalized.includes('var ') || normalized.includes('import ')) {
    return { 
      isValid: false, 
      sanitizedResponse: "I can only assist with health-related topics." 
    };
  }

  // Check for non-health content indicators
  const nonHealthIndicators = [
    'programming', 'code', 'javascript', 'python', 'html',
    'movie', 'film', 'music', 'song', 'game', 'sport',
    'politics', 'election', 'president', 'government',
    'recipe', 'cooking', 'restaurant', 'travel', 'hotel',
  ];

  let nonHealthCount = 0;
  nonHealthIndicators.forEach(indicator => {
    if (normalized.includes(indicator)) {
      nonHealthCount++;
    }
  });

  if (nonHealthCount >= 2) {
    return { 
      isValid: false, 
      sanitizedResponse: "I can only assist with health-related topics." 
    };
  }

  // Response seems valid
  return { 
    isValid: true, 
    sanitizedResponse: response 
  };
}

/**
 * Log classification for debugging
 * @param {string} query
 * @param {Object} classification
 * @param {boolean} blocked
 */
export function logClassification(query, classification, blocked) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Health Classifier]', {
      query: query.substring(0, 50),
      category: classification.category,
      confidence: classification.confidence,
      reason: classification.reason,
      blocked,
      timestamp: new Date().toISOString(),
    });
  }
}
