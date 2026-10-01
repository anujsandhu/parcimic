# Firestore Data Model Implementation Guide

## Overview

This guide walks through implementing Parcimic's secure, scalable Firestore data model. It covers:
1. ✅ Schema deployment
2. ✅ Index creation
3. ✅ Security rules application
4. ✅ Cloud Functions setup
5. ✅ Client-side usage patterns

---

## Phase 1: Deployment Checklist

### 1.1 Pre-Deployment Verification

```bash
# ✅ Verify Firebase CLI installed
firebase --version

# ✅ Verify you're logged in
firebase login

# ✅ List projects
firebase projects:list

# ✅ Set active project
firebase use YOUR_PROJECT_ID

# ✅ Verify firestore exists
firebase firestore:describe
```

### 1.2 Deploy Security Rules

**File:** `firestore.rules`

```bash
# Deploy rules only
firebase deploy --only firestore:rules

# Deploy with verbose output
firebase deploy --only firestore:rules -- --debug

# Verify rules are live
firebase firestore:indexes:list
```

**Test Rules Locally (emulator):**
```bash
# Start emulator
firebase emulators:start

# Run tests (requires firebase-testing library)
npm run test:firestore
```

### 1.3 Deploy Firestore Indexes

**File:** `firestore.indexes.json`

```bash
# Deploy indexes
firebase deploy --only firestore:indexes

# Monitor index creation status
firebase firestore:indexes:list

# Watch deployment progress
firebase firestore:indexes:list --filter "state:BUILDING"
```

⏱️ **Note:** Index creation can take 5-15 minutes. Check Firebase Console → Firestore → Indexes.

### 1.4 Deploy Cloud Functions

**Directory:** `functions/`

```bash
# Initialize functions if needed
firebase init functions

# Install dependencies
cd functions && npm install

# Deploy functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:createUserOnAuth

# Monitor logs
firebase functions:log --limit 50
```

**Verify Deployment:**
```bash
firebase functions:list

# Test callable function
firebase functions:shell
> getUserStatistics()
```

---

## Phase 2: Data Model Initialization

### 2.1 Create Initial Collections

Firestore auto-creates collections on first document write. To ensure structure:

```javascript
// Initialize collections on first app load
import { 
  createDocumentWithId,
  COLLECTIONS 
} from './utils/firestoreCRUD';

export const initializeUserData = async (userId) => {
  // Profile will be created by Cloud Function on auth
  // But you can init others manually if needed
  
  try {
    // Verify profile exists
    const profile = await getProfile(userId);
    if (!profile) {
      console.warn('Profile not found, creating...');
      await createProfile(userId, {
        fullName: 'User',
        phone: null,
        // ... other fields
      });
    }
  } catch (error) {
    console.error('Error initializing user data:', error);
  }
};
```

### 2.2 Verify Firestore Structure

**In Firebase Console:**

1. Go to Firestore → Collections
2. Verify these collections exist (will show after first writes):
   - ✅ users
   - ✅ profiles
   - ✅ healthRecords
   - ✅ symptoms
   - ✅ medications
   - ✅ alerts
   - ✅ timeline

**Via CLI:**
```bash
firebase firestore:get-options
firebase firestore:--describe
```

---

## Phase 3: Client Implementation

### 3.1 Schema Constants

Use centralized schema constants throughout your app:

```javascript
import { COLLECTIONS, ENUMS, LIMITS } from './utils/firestoreSchema';

// Access collection names
db.collection(COLLECTIONS.HEALTH_RECORDS);

// Access enums
const modes = [ENUMS.HEALTH_MODE.VITALS, ENUMS.HEALTH_MODE.SYMPTOMS];

// Access limits
const docs = await queryDocuments(
  COLLECTIONS.HEALTH_RECORDS,
  conditions,
  orderBy,
  LIMITS.QUERY_LIMIT_DEFAULT
);
```

### 3.2 Validation Before Writing

**ALWAYS validate before creating documents:**

```javascript
import { 
  validateHealthRecord, 
  ValidationResult 
} from './utils/firestoreValidation';

export const saveHealthCheck = async (userId, data) => {
  // Validate
  const validation = validateHealthRecord({
    userId,
    mode: 'hybrid',
    inputData: { /* vitals */ },
    symptoms: ['fever', 'fatigue'],
    riskScore: 65,
    riskLevel: 'high',
    explanation: 'Concerning vitals...'
  });

  if (!validation.valid) {
    console.error('Validation failed:', validation.errors);
    // Show user feedback
    return;
  }

  // Create document
  try {
    const result = await createHealthRecord(userId, {
      // data here
    });
    console.log('Health record created:', result.id);
  } catch (error) {
    console.error('Error creating record:', error);
  }
};
```

### 3.3 Reading User Data

**Get user's health records:**
```javascript
import { getUserHealthRecords } from './utils/firestoreCRUD';

export const loadUserHealth = async (userId) => {
  try {
    const records = await getUserHealthRecords(userId, 10);
    return records;
  } catch (error) {
    console.error('Error loading health records:', error);
    return [];
  }
};
```

**Get today's symptom check-in:**
```javascript
import { getTodaySymptom } from './utils/firestoreCRUD';

export const checkTodaysSymptoms = async (userId) => {
  const today = await getTodaySymptom(userId);
  if (today) {
    console.log('Already checked in today:', today);
    return today;
  }
  return null;
};
```

**Query with custom filters:**
```javascript
import { queryDocuments } from './utils/firestoreCRUD';

const highRiskRecords = await queryDocuments(
  COLLECTIONS.HEALTH_RECORDS,
  [
    { field: 'userId', operator: '==', value: userId },
    { field: 'riskLevel', operator: '==', value: 'high' }
  ],
  { field: 'createdAt', direction: 'desc' },
  20
);
```

### 3.4 Creating Related Documents

**Create health check with timeline & alerts:**

```javascript
import { createHealthCheckWithTimeline } from './utils/firestoreCRUD';

export const submitHealthCheck = async (userId, vitals, symptoms) => {
  try {
    const result = await createHealthCheckWithTimeline(
      userId,
      // Health record data
      {
        mode: 'hybrid',
        inputData: vitals,
        symptoms: symptoms,
        riskScore: calculateRisk(vitals, symptoms),
        riskLevel: getRiskLevel(riskScore),
        explanation: aiRecommendation
      },
      // Timeline data
      {
        type: ENUMS.TIMELINE_TYPE.RISK,
        summary: `Health check: Risk ${riskLevel}`
      },
      // Alert data (only if high risk)
      riskScore > 64 ? [{
        type: ENUMS.ALERT_TYPE.RISK,
        severity: 'high',
        message: `High risk detected (${riskScore}). Seek medical attention.`
      }] : []
    );

    console.log('Health check saved:', result.healthRecordId);
    return result;
  } catch (error) {
    console.error('Error saving health check:', error);
    throw error;
  }
};
```

### 3.5 Updating Documents

```javascript
import { updateDocument } from './utils/firestoreCRUD';

// Update alert read status
export const markAlertRead = async (alertId) => {
  try {
    await updateDocument(COLLECTIONS.ALERTS, alertId, {
      read: true
    });
    console.log('Alert marked as read');
  } catch (error) {
    console.error('Error updating alert:', error);
  }
};

// Update profile
export const updateUserProfile = async (userId, updates) => {
  try {
    const updated = await updateProfile(userId, updates);
    console.log('Profile updated');
    return updated;
  } catch (error) {
    console.error('Error updating profile:', error);
  }
};
```

### 3.6 Batch Operations

```javascript
import { batchCreateDocuments, batchUpdateDocuments } from './utils/firestoreCRUD';

// Create multiple medication logs at once
export const logMultipleMeds = async (userId, logs) => {
  try {
    const created = await batchCreateDocuments(
      COLLECTIONS.MEDICATION_LOGS,
      logs,
      userId
    );
    console.log(`Created ${created.length} medication logs`);
    return created;
  } catch (error) {
    console.error('Error creating medication logs:', error);
  }
};

// Update multiple alerts
export const markManyAlertsRead = async (alertIds) => {
  try {
    await batchUpdateDocuments(
      COLLECTIONS.ALERTS,
      alertIds.map(id => ({
        docId: id,
        data: { read: true }
      }))
    );
    console.log(`Marked ${alertIds.length} alerts as read`);
  } catch (error) {
    console.error('Error updating alerts:', error);
  }
};
```

### 3.7 Error Handling

```javascript
import { FirestoreError } from './utils/firestoreCRUD';

export const safeHealthRecordCreate = async (userId, data) => {
  try {
    const result = await createHealthRecord(userId, data);
    return result;
  } catch (error) {
    if (error instanceof FirestoreError) {
      switch (error.code) {
        case 'validation-error':
          console.error('Data validation failed:', error.message);
          // Show user: "Please enter all required fields"
          break;
        case 'permission-denied':
          console.error('Access denied:', error.message);
          // Show user: "You do not have permission"
          break;
        case 'not-found':
          console.error('Resource not found:', error.message);
          break;
        default:
          console.error('Firestore error:', error.message);
      }
    } else {
      console.error('Unknown error:', error);
    }
  }
};
```

---

## Phase 4: Testing

### 4.1 Unit Tests - Validation

```javascript
// __tests__/firestoreValidation.test.js
import { validateHealthRecord } from '../src/utils/firestoreValidation';

describe('Health Record Validation', () => {
  it('rejects insufficient vitals', () => {
    const result = validateHealthRecord({
      userId: 'user123',
      mode: 'vitals',
      inputData: { heartRate: 80 }, // Only 1 vital
      symptoms: [],
      riskLevel: 'low',
      explanation: 'test'
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(expect.stringContaining('vitals'));
  });

  it('accepts valid hybrid mode', () => {
    const result = validateHealthRecord({
      userId: 'user123',
      mode: 'hybrid',
      inputData: {
        heartRate: 95,
        temperature: 38.5,
        respiratoryRate: 22,
        oxygenSaturation: 95
      },
      symptoms: ['fever', 'fatigue'],
      riskScore: 65,
      riskLevel: 'high',
      explanation: 'test'
    });
    expect(result.valid).toBe(true);
  });
});
```

### 4.2 Integration Tests - CRUD

```javascript
// __tests__/firestoreCRUD.test.js
import { 
  createHealthRecord, 
  getUserHealthRecords 
} from '../src/utils/firestoreCRUD';

describe('Health Record CRUD', () => {
  const testUserId = 'test-user-123';
  let recordId;

  it('creates a health record', async () => {
    const result = await createHealthRecord(testUserId, {
      mode: 'hybrid',
      inputData: { /* vitals */ },
      symptoms: ['fever'],
      riskLevel: 'high',
      riskScore: 70,
      explanation: 'test'
    });
    expect(result.id).toBeDefined();
    recordId = result.id;
  });

  it('retrieves user records', async () => {
    const records = await getUserHealthRecords(testUserId, 10);
    expect(Array.isArray(records)).toBe(true);
    expect(records.length).toBeGreaterThan(0);
  });
});
```

### 4.3 Security Rules Testing

```bash
# In Firebase Console
# Go to: Firestore → Security rules → Use emulator

# Test data:
# {
#   "userId": "user123",
#   "content": "data"
# }

# Should allow (user is owner):
read: auth.uid == 'user123'

# Should deny (user is not owner):
read: auth.uid == 'different-user'
```

### 4.4 Performance Testing

```javascript
// Test query performance
export const benchmarkQuery = async (userId) => {
  const start = performance.now();
  
  const records = await queryDocuments(
    COLLECTIONS.HEALTH_RECORDS,
    [{ field: 'userId', operator: '==', value: userId }],
    { field: 'createdAt', direction: 'desc' },
    100
  );
  
  const end = performance.now();
  console.log(`Query took ${end - start}ms, returned ${records.length} records`);
};

// Benchmark: Should complete in < 1000ms
// With proper indexes
```

---

## Phase 5: Monitoring & Maintenance

### 5.1 Firebase Console Monitoring

**Location:** Firebase Console → Firestore

- **Dashboard:** Storage usage, document counts
- **Indexes:** Creation status, query performance
- **Rules:** Validation & security
- **Backups:** Scheduled exports (use managed exports)

### 5.2 Cloud Functions Monitoring

**Location:** Firebase Console → Functions

```bash
# View logs
firebase functions:log --limit 100

# Filter by function name
firebase functions:log createUserOnAuth --limit 50

# Real-time logs
firebase functions:log --follow
```

### 5.3 Performance Metrics

**Track:**
- ✅ Query latency (should be < 500ms)
- ✅ Write latency (should be < 1000ms)
- ✅ Storage growth (set alerts at thresholds)
- ✅ Index creation time
- ✅ Function execution time

```javascript
// Client-side performance tracking
export const trackFirestoreMetrics = async () => {
  // Query latency
  const queryStart = performance.now();
  await getUserHealthRecords(userId);
  const queryTime = performance.now() - queryStart;
  
  // Log to analytics
  analytics.logEvent('firestore_query_latency', {
    collection: 'healthRecords',
    latency_ms: queryTime
  });
};
```

### 5.4 Data Cleanup Tasks

**Automated (Cloud Functions):**
- ✅ Delete alerts older than 90 days: `cleanupOldAlerts`
- ✅ Archive timeline older than 6 months: `archiveOldTimeline`

**Manual cleanup:**
```bash
# Delete test user data
firebase functions:call manualDeleteUserData --data '{"uid":"test-user-123"}'
```

---

## Phase 6: Troubleshooting

### Issue: "Missing or insufficient permissions"

**Solution:**
```javascript
// Verify userId is set in document
{
  userId: request.auth.uid,  // ✅ Correct
  // ...
}

// Check security rules deployed
firebase deploy --only firestore:rules

// Test in emulator
firebase emulators:start
```

### Issue: "Indexes building" / Query timeout

**Solution:**
```bash
# Check index status
firebase firestore:indexes:list

# Wait for "READY" status (5-15 minutes typical)

# Verify index in config
cat firestore.indexes.json | grep -A 5 "your-collection"
```

### Issue: "Document exceeds maximum size"

**Solution:**
- Max doc size: 1 MB
- Split large documents into subcollections
- Move file uploads to Cloud Storage

```javascript
// Split into subcollection instead of nested object
// ❌ Bad: Single 2MB document
{
  userId: "123",
  largeData: { /* 2MB */ }
}

// ✅ Good: Use subcollection
{
  userId: "123"
}

// In subcollection:
healthRecords/{recordId}/details/{detailId}
```

### Issue: Cloud Functions not triggering

**Solution:**
```bash
# Verify function deployed
firebase functions:list

# Check logs for errors
firebase functions:log createTimelineOnHealthRecord --limit 50

# Test with sample data
firebase firestore:shell
> db.collection('healthRecords').add({
    userId: 'test-user',
    riskLevel: 'high',
    // ...
  })
```

---

## Phase 7: Security Best Practices

### 7.1 Access Control

✅ **DO:**
- Set userId on all documents
- Validate userId matches auth.uid
- Use security rules as first line of defense
- Validate client-side & server-side

❌ **DON'T:**
- Trust client-side validation alone
- Store sensitive data unencrypted
- Bypass security rules
- Allow public read access

### 7.2 Data Privacy

✅ **DO:**
- Implement GDPR deletion: `deleteUserData` function
- Use document-level encryption for PII
- Audit access logs
- Version sensitive collections

❌ **DON'T:**
- Store passwords (use Firebase Auth)
- Store credit cards (use payment processor)
- Log health data to analytics
- Share data between users

### 7.3 Compliance

**GDPR Compliance:**
```javascript
// Right to deletion
deleteAllUserData(userId); // Cloud Function
```

**HIPAA Compliance:**
- ✅ Encryption in transit (Firestore uses SSL/TLS)
- ✅ Encryption at rest (Firestore default)
- ✅ Access logs (Firebase audit logs)
- ✅ Data integrity (Firestore transactions)

---

## Quick Reference

### Common Operations

```javascript
// Create
await createHealthRecord(userId, data);

// Read
const records = await getUserHealthRecords(userId, 10);

// Update
await updateDocument(COLLECTIONS.ALERTS, alertId, { read: true });

// Delete
await deleteDocument(COLLECTIONS.ALERTS, alertId);

// Query
const highRisk = await queryDocuments(
  COLLECTIONS.HEALTH_RECORDS,
  [
    { field: 'userId', operator: '==', value: userId },
    { field: 'riskLevel', operator: '==', value: 'high' }
  ],
  { field: 'createdAt', direction: 'desc' },
  10
);

// Batch
await batchCreateDocuments(COLLECTIONS.SYMPTOMS, symptomsArray, userId);

// Transaction
await createHealthCheckWithTimeline(userId, healthData, timelineData, alertsData);
```

### Configuration

```bash
# Deploy all
firebase deploy

# Deploy specific
firebase deploy --only firestore:rules firestore:indexes functions

# Use staging project
firebase use --add staging

# Emulate locally
firebase emulators:start
```

---

## Next Steps

1. ✅ Complete Phase 1-2: Deploy schema & indexes
2. ✅ Phase 3: Implement client-side CRUD
3. ✅ Phase 4: Write tests
4. ✅ Phase 5: Monitor production
5. ✅ Phase 6: Troubleshoot issues as they arise
6. ✅ Phase 7: Maintain security & compliance

**Estimated Timeline:**
- Phase 1-2: 30 minutes
- Phase 3: 2 hours
- Phase 4: 2 hours
- Phase 5-7: Ongoing

For questions, refer to [FIRESTORE_SCHEMA.md](./FIRESTORE_SCHEMA.md) for complete schema documentation.
