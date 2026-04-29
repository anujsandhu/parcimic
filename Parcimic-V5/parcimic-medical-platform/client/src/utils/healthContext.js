/**
 * Health Context Builder
 * Injects user health data into LLM prompts for better, grounded responses
 */

/**
 * Build context string from user health data
 * @param {Object} userData - User health information
 * @returns {string} - Formatted context
 */
export function buildHealthContext(userData = {}) {
  const contextParts = [];

  // Risk score and level
  if (userData.riskScore !== undefined && userData.riskLevel) {
    contextParts.push(`Latest Health Check: Risk score ${userData.riskScore}/100 (${userData.riskLevel} risk)`);
  }

  // Recent symptoms
  if (userData.symptoms && Object.keys(userData.symptoms).length > 0) {
    const symptomsList = [];
    if (userData.symptoms.fever) symptomsList.push('fever');
    if (userData.symptoms.fatigue > 3) symptomsList.push(`fatigue (${userData.symptoms.fatigue}/10)`);
    if (userData.symptoms.cough > 3) symptomsList.push(`cough (${userData.symptoms.cough}/10)`);
    if (userData.symptoms.breathing > 3) symptomsList.push(`breathing difficulty (${userData.symptoms.breathing}/10)`);
    if (userData.symptoms.shortnessBreath) symptomsList.push('shortness of breath');
    if (userData.symptoms.confusion) symptomsList.push('confusion');
    if (userData.symptoms.abdominalPain) symptomsList.push('abdominal pain');
    
    if (symptomsList.length > 0) {
      contextParts.push(`Recent Symptoms: ${symptomsList.join(', ')}`);
    }
  }

  // Medications
  if (userData.medications && userData.medications.length > 0) {
    const medsList = userData.medications
      .slice(0, 5)
      .map(m => `${m.name} (${m.dosage})`)
      .join(', ');
    contextParts.push(`Current Medications: ${medsList}`);
  }

  // Vitals
  if (userData.vitals) {
    const vitalsList = [];
    if (userData.vitals.heartRate) vitalsList.push(`HR: ${userData.vitals.heartRate} bpm`);
    if (userData.vitals.temp) vitalsList.push(`Temp: ${userData.vitals.temp}°C`);
    if (userData.vitals.o2Sat) vitalsList.push(`O2: ${userData.vitals.o2Sat}%`);
    if (userData.vitals.sysBP) vitalsList.push(`BP: ${userData.vitals.sysBP} mmHg`);
    
    if (vitalsList.length > 0) {
      contextParts.push(`Recent Vitals: ${vitalsList.join(', ')}`);
    }
  }

  return contextParts.length > 0 ? contextParts.join('\n') : null;
}

/**
 * Get the strict system prompt for the health assistant
 * @returns {string}
 */
export function getSystemPrompt() {
  return `You are Parcimic AI, a personal health assistant.

You ONLY answer questions related to:
- Symptoms and what they might indicate
- Medications and their general use
- Basic health guidance and wellness
- User's health check results and data
- When to seek medical attention

You MUST NOT answer:
- Coding or programming questions
- General knowledge or trivia
- Politics, entertainment, or unrelated topics
- Specific medical diagnoses
- Prescription recommendations

If a query is not health-related, respond: "I can only help with health-related questions."

Rules:
1. Keep answers simple, short, and clear (5-6 lines maximum)
2. Use non-technical, plain language
3. Do NOT provide specific diagnoses
4. Do NOT suggest specific prescriptions
5. Use safe phrases: "may indicate", "could be", "might suggest"
6. Always encourage seeking medical help if symptoms are serious
7. You are not a doctor - you provide guidance only
8. If user data is provided, reference it naturally
9. Use bullet points (max 3) when listing information
10. End with actionable advice when appropriate

Response format:
- Brief explanation (2-3 lines)
- What it means or what to do (2-3 lines)
- When to seek help (if relevant)`;
}

/**
 * Build the complete prompt with context
 * @param {string} userQuery - User's question
 * @param {Object} userData - User health data
 * @returns {string}
 */
export function buildPromptWithContext(userQuery, userData = {}) {
  const context = buildHealthContext(userData);
  
  if (context) {
    return `User Health Context:
${context}

User Question: ${userQuery}

Provide a helpful, concise response using the context above when relevant.`;
  }
  
  return `User Question: ${userQuery}

Provide a helpful, concise response.`;
}

/**
 * Extract user data from session/props
 * @param {Object} lastResult - Latest health check result
 * @param {Array} medications - User medications
 * @param {Object} recentSymptoms - Recent symptom check-in
 * @returns {Object}
 */
export function extractUserData(lastResult = null, medications = [], recentSymptoms = null) {
  const userData = {};

  if (lastResult) {
    userData.riskScore = lastResult.score;
    userData.riskLevel = lastResult.riskLevel;
    userData.vitals = lastResult.vitals;
  }

  if (medications && medications.length > 0) {
    userData.medications = medications.map(m => ({
      name: m.name,
      dosage: m.dosage,
      status: m.status,
    }));
  }

  if (recentSymptoms) {
    userData.symptoms = recentSymptoms;
  }

  return userData;
}
