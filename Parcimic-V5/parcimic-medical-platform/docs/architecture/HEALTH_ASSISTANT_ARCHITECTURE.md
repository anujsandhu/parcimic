# Parcimic AI - Health Assistant Architecture

## Overview
The Parcimic AI assistant has been refactored into a **strict, domain-limited health assistant** with multi-layer control. The assistant ONLY handles health-related queries and is designed to be safe, concise, and grounded in user context.

## Architecture: 4-Stage Pipeline

```
User Query
    ↓
[1] INPUT CLASSIFICATION
    ↓
[2] GUARDRAIL FILTERING
    ↓
[3] CONTEXT INJECTION + LLM CALL
    ↓
[4] OUTPUT VALIDATION
    ↓
Response to User
```

---

## Stage 1: Input Classification

**Purpose**: Classify each user query BEFORE calling the LLM to prevent wasted API calls and ensure domain focus.

**Implementation**: `client/src/utils/healthClassifier.js`

### Classification Categories
- `health` - Health-related query (allowed)
- `non-health` - Clearly not health-related (blocked)
- `uncertain` - Ambiguous query (requires clarification)

### Classification Method

**A) Keyword Matching**
- **Health Keywords** (100+ terms):
  - Symptoms: fever, cough, pain, fatigue, nausea, etc.
  - Vitals: temperature, heart rate, blood pressure, oxygen, etc.
  - Medical: sepsis, diabetes, infection, medication, etc.
  - Healthcare: doctor, hospital, clinic, emergency, etc.
  - Body parts: head, chest, stomach, heart, lung, etc.

- **Non-Health Keywords**:
  - Technology: code, programming, javascript, html, etc.
  - Entertainment: movie, music, game, sport, etc.
  - General: weather, politics, recipe, travel, etc.

**B) Pattern Matching**
- Health query patterns:
  - "What does X mean?"
  - "How to reduce/treat X?"
  - "Should I see a doctor?"
  - "My result/score/reading..."
  - "Is X normal/high/low?"

**C) Confidence Scoring**
```javascript
// Strong non-health: confidence 0.9
nonHealthMatches > 0 && healthMatches === 0

// Strong health: confidence 0.9
healthMatches >= 2

// Moderate health: confidence 0.7-0.8
healthMatches === 1 || matches health pattern

// Uncertain: confidence 0.3-0.5
No clear indicators
```

### Example Classifications

```javascript
// HEALTH (allowed)
"What does my fever mean?" → health (0.9)
"Should I see a doctor?" → health (0.8)
"My risk score is 65" → health (0.9)
"How to lower blood pressure?" → health (0.9)

// NON-HEALTH (blocked)
"Write me a JavaScript function" → non-health (0.9)
"What's the weather today?" → non-health (0.9)
"Tell me a joke" → non-health (0.9)

// UNCERTAIN (clarification)
"What is normal?" → uncertain (0.4)
"Help me" → uncertain (0.3)
```

---

## Stage 2: Guardrail Filtering

**Purpose**: Hard block non-health queries and request clarification for uncertain ones.

**Implementation**: `client/src/pages/Assistant.jsx`

### Blocking Logic

```javascript
if (classification.category === 'non-health') {
  // BLOCK: No LLM call
  return blockedMessage;
}

if (classification.category === 'uncertain' && confidence < 0.5) {
  // CLARIFY: Ask user to rephrase
  return clarificationMessage;
}

// ALLOW: Proceed to LLM
```

### Blocked Message
```
"I can only help with health-related questions like symptoms, 
medications, or your health check results.

Try asking:
• "What does my risk score mean?"
• "What should I do about fever?"
• "When should I see a doctor?""
```

### Clarification Message
```
"I'm not sure if this is health-related. Could you clarify?

I can help with:
• Understanding your health results
• Explaining symptoms
• Medication guidance
• When to seek medical help"
```

---

## Stage 3: Context Injection + LLM Call

**Purpose**: Inject user health data into prompts for grounded, personalized responses.

**Implementation**: `client/src/utils/healthContext.js`

### User Context Data

The system automatically loads and injects:

1. **Latest Health Check**
   - Risk score (0-100)
   - Risk level (low/moderate/high)
   - Vital signs (HR, temp, BP, O2)

2. **Recent Symptoms**
   - Fever, fatigue, cough, breathing difficulty
   - Confusion, abdominal pain, etc.

3. **Current Medications**
   - Name, dosage, frequency
   - Status (taken/pending)

### Context Building

```javascript
// Example context string
User Health Context:
Latest Health Check: Risk score 45/100 (moderate risk)
Recent Symptoms: fever, fatigue (7/10), cough (5/10)
Current Medications: Paracetamol (500mg), Amoxicillin (250mg)
Recent Vitals: HR: 95 bpm, Temp: 38.2°C, O2: 96%, BP: 125 mmHg

User Question: What does my fever mean?
```

### System Prompt (Strict)

```
You are Parcimic AI, a personal health assistant.

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

If a query is not health-related, respond: 
"I can only help with health-related questions."

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
- When to seek help (if relevant)
```

### LLM Call Configuration

```javascript
{
  systemPrompt: getSystemPrompt(),
  message: buildPromptWithContext(userQuery, userData),
  history: last6Messages,
  maxTokens: 500  // Enforce brevity (~5-6 lines)
}
```

---

## Stage 4: Output Validation

**Purpose**: Validate LLM responses to ensure they remain health-focused and safe.

**Implementation**: `client/src/utils/healthClassifier.js`

### Validation Checks

1. **Code Detection**
   - Block responses containing: ` ``` `, `function(`, `const `, `let `, `var `, `import `
   - Prevents coding assistance

2. **Non-Health Content**
   - Check for non-health indicators (2+ matches = block)
   - Keywords: programming, movie, politics, recipe, etc.

3. **Length Enforcement**
   - Hard limit: 600 characters
   - Truncate with "..." if exceeded

### Validation Response

```javascript
if (!validation.isValid) {
  return "I can only assist with health-related topics.";
}
```

---

## Safety Features

### 1. Rate Limiting
- Max tokens: 500 (server-side)
- Prevents long essays
- Enforces concise responses

### 2. Timeout Fallback
- API timeout: 15-30 seconds
- Graceful error handling
- User-friendly error messages

### 3. Conversation History
- Limited to last 6 messages
- Excludes blocked messages
- Prevents context pollution

### 4. Logging (Debug Mode)
```javascript
console.log('[Health Classifier]', {
  query: "What is fever?",
  category: "health",
  confidence: 0.9,
  reason: "Contains 1 health keyword",
  blocked: false,
  timestamp: "2024-01-15T10:30:00Z"
});
```

---

## UI Behavior

### Visual Indicators

**Normal Response**:
- Blue avatar with MessageCircle icon
- White bubble with border

**Blocked Response**:
- Yellow/warning avatar with AlertCircle icon
- Warning-colored bubble
- Helpful suggestions included

### Suggestion Chips

Pre-defined health questions shown on first load:
- "What does my risk score mean?"
- "What is sepsis in simple terms?"
- "When should I go to the hospital?"
- "What does a high heart rate mean?"
- "How can I lower my fever at home?"
- "What are early warning signs?"

### Footer Disclaimer
```
"Health guidance only • Not a substitute for professional medical advice"
```

---

## Response Constraints

### Format Guidelines
- **Max length**: 5-6 lines (500 tokens)
- **Language**: Plain, non-technical
- **Structure**: 
  - Brief explanation (2-3 lines)
  - What to do next (2-3 lines)
  - When to seek help (if relevant)

### Example Response

**User**: "What does my fever mean?"

**Assistant**:
```
A fever of 38.2°C indicates your body is fighting an infection or illness. 
This is a natural immune response, but it's important to monitor it.

What to do:
• Rest and stay hydrated
• Take paracetamol if uncomfortable
• Monitor your temperature every few hours

Seek medical help if your fever goes above 39.5°C, lasts more than 3 days, 
or if you develop severe symptoms like difficulty breathing or confusion.
```

---

## File Structure

```
client/src/
├── utils/
│   ├── healthClassifier.js    # Stage 1 & 4: Classification & Validation
│   ├── healthContext.js        # Stage 3: Context building
│   └── api.js                  # API calls
├── pages/
│   └── Assistant.jsx           # Main chat UI with pipeline
└── ...

server.js                        # Backend LLM endpoint
```

---

## Future Enhancements (Optional)

### 1. ML-Based Classification
Replace keyword matching with a lightweight ML classifier:
- Fine-tuned BERT/DistilBERT model
- Better handling of edge cases
- Improved confidence scoring

### 2. Moderation API
Integrate OpenAI Moderation API or similar:
- Detect harmful content
- Filter inappropriate queries
- Enhanced safety layer

### 3. Intent Detection
Add intent classification:
- `symptom_inquiry`
- `medication_question`
- `result_interpretation`
- `emergency_assessment`

### 4. Multi-Language Support
Extend classification to other languages:
- Translate keywords
- Language-specific patterns
- Localized responses

### 5. Feedback Loop
Collect user feedback on responses:
- "Was this helpful?"
- Improve classification over time
- Fine-tune system prompts

---

## Testing Checklist

### Classification Tests
- [ ] Health queries are allowed
- [ ] Non-health queries are blocked
- [ ] Uncertain queries request clarification
- [ ] Greetings are allowed
- [ ] Edge cases handled properly

### Context Injection Tests
- [ ] User data loads correctly
- [ ] Context is formatted properly
- [ ] Responses reference user data
- [ ] Works without user data

### Output Validation Tests
- [ ] Code snippets are blocked
- [ ] Non-health responses are blocked
- [ ] Length limits are enforced
- [ ] Valid responses pass through

### UI Tests
- [ ] Blocked messages show warning style
- [ ] Suggestions work correctly
- [ ] Loading states display properly
- [ ] Error handling works

---

## Monitoring & Metrics

### Key Metrics to Track
1. **Classification Accuracy**
   - % of queries correctly classified
   - False positive rate (health blocked)
   - False negative rate (non-health allowed)

2. **Block Rate**
   - % of queries blocked
   - Most common blocked queries
   - Clarification request rate

3. **Response Quality**
   - Average response length
   - User satisfaction (if feedback added)
   - Context usage rate

4. **Performance**
   - Classification time (<10ms)
   - LLM response time (<5s)
   - Error rate

---

## Summary

The Parcimic AI assistant now behaves as:

✅ **A focused health assistant**
- Only answers health-related questions
- Blocks non-health queries immediately
- Requests clarification when uncertain

✅ **Safe and reliable**
- Strict system prompts
- Output validation
- No diagnoses or prescriptions
- Encourages seeking medical help

✅ **Context-aware**
- Uses user health data
- Personalized responses
- Grounded in actual results

❌ **NOT a general chatbot**
- Won't answer coding questions
- Won't discuss politics or entertainment
- Won't provide random information

❌ **NOT a medical professional**
- Provides guidance only
- Uses safe language ("may indicate")
- Always recommends professional help for serious issues
