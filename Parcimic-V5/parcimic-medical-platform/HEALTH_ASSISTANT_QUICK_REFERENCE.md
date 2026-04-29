# Health Assistant - Quick Reference

## Quick Start

The Parcimic AI assistant uses a 4-stage pipeline to ensure safe, health-focused responses:

```
Query → Classify → Filter → Context + LLM → Validate → Response
```

## Adding New Health Keywords

Edit `client/src/utils/healthClassifier.js`:

```javascript
const HEALTH_KEYWORDS = [
  // Add your keywords here
  'newSymptom', 'newCondition', 'newMedication',
  // ...
];
```

## Customizing System Prompt

Edit `client/src/utils/healthContext.js`:

```javascript
export function getSystemPrompt() {
  return `You are Parcimic AI, a personal health assistant.
  
  // Modify rules here
  `;
}
```

## Adjusting Classification Confidence

Edit `client/src/utils/healthClassifier.js`:

```javascript
// Current thresholds
if (healthMatches >= 2) {
  return { category: 'health', confidence: 0.9 }; // Adjust 0.9
}

// In Assistant.jsx
if (classification.category === 'uncertain' && confidence < 0.5) {
  // Adjust 0.5 threshold
}
```

## Changing Response Length

**Client-side** (`client/src/pages/Assistant.jsx`):
```javascript
if (response.length > 600) {  // Adjust 600
  response = response.substring(0, 600) + '...';
}
```

**Server-side** (`server.js`):
```javascript
const maxTokens = 500; // Adjust token limit
const reply = await callAI(messages, maxTokens);
```

## Testing Classification

```javascript
import { classifyQuery } from './utils/healthClassifier';

// Test queries
console.log(classifyQuery("What is fever?"));
// → { category: 'health', confidence: 0.9, reason: '...' }

console.log(classifyQuery("Write me code"));
// → { category: 'non-health', confidence: 0.9, reason: '...' }
```

## Debugging

Enable debug logging in `client/src/utils/healthClassifier.js`:

```javascript
// Already enabled in development mode
if (process.env.NODE_ENV === 'development') {
  console.log('[Health Classifier]', { ... });
}
```

## Common Customizations

### 1. Allow More Uncertain Queries
```javascript
// In Assistant.jsx, change:
if (classification.category === 'uncertain' && confidence < 0.3) {
  // Lower threshold from 0.5 to 0.3
}
```

### 2. Add Custom Blocked Messages
```javascript
// In healthClassifier.js
export function getBlockedMessage(category) {
  if (category === 'coding') {
    return "I'm a health assistant, not a coding assistant.";
  }
  return "I can only help with health-related questions.";
}
```

### 3. Disable Context Injection
```javascript
// In Assistant.jsx
const userPrompt = content; // Instead of buildPromptWithContext(content, userData)
```

### 4. Add More Suggestion Chips
```javascript
// In Assistant.jsx
const SUGGESTIONS = [
  'What does my risk score mean?',
  'Your new suggestion here',
  // ...
];
```

## API Reference

### `classifyQuery(query)`
Classifies a user query.

**Returns**: `{ category, confidence, reason }`

### `buildHealthContext(userData)`
Builds context string from user health data.

**Returns**: `string | null`

### `getSystemPrompt()`
Returns the strict system prompt.

**Returns**: `string`

### `buildPromptWithContext(query, userData)`
Combines query with user context.

**Returns**: `string`

### `validateOutput(response)`
Validates LLM response.

**Returns**: `{ isValid, sanitizedResponse }`

## Environment Variables

No additional environment variables needed. The health assistant uses existing LLM configuration.

## Performance Tips

1. **Classification is fast** (~1ms) - no API calls
2. **Context building is instant** - just string formatting
3. **LLM call is the bottleneck** (2-5 seconds)
4. **Validation is fast** (~1ms) - simple checks

## Troubleshooting

### Issue: Too many queries blocked
**Solution**: Lower confidence threshold or add more health keywords

### Issue: Non-health queries getting through
**Solution**: Add keywords to `NON_HEALTH_KEYWORDS` array

### Issue: Responses too long
**Solution**: Reduce `maxTokens` in server.js

### Issue: Context not showing in responses
**Solution**: Check if user data is loading correctly in Assistant.jsx

## File Locations

```
Classification:  client/src/utils/healthClassifier.js
Context:         client/src/utils/healthContext.js
UI:              client/src/pages/Assistant.jsx
Backend:         server.js (llm/chat endpoint)
```

## Quick Test Commands

```bash
# Run development server
npm run dev

# Test in browser console
import { classifyQuery } from './utils/healthClassifier';
classifyQuery("test query");
```
