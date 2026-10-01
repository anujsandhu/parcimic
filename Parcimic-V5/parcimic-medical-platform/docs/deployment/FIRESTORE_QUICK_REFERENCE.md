# Firestore Data Model — Quick Reference Card

## Collections at a Glance

```
users/{userId}              → Auth mirror (created by Cloud Fn)
profiles/{userId}           → User profile (self-owned)
familyMembers/{memberId}    → Family members (self-owned)
healthRecords/{recordId}    → Risk assessments (self-owned, immutable)
symptoms/{entryId}          → Daily check-ins (self-owned)
labResults/{labId}          → Lab tests (self-owned)
medications/{medId}         → Med plans (self-owned)
medicationLogs/{logId}      → Med adherence (self-owned)
alerts/{alertId}            → System alerts (backend writes)
timeline/{eventId}          → Unified events (backend writes)
locations/{locationId}      → Location history (self-owned)
```

---

## Access Control (Who Can Do What)

| Collection | Create | Read | Update | Delete |
|---|:---:|:---:|:---:|:---:|
| profiles | Self | Self | Self | Self |
| familyMembers | Self | Self | Self | Self |
| healthRecords | Self | Self | ❌ | Self |
| symptoms | Self | Self | Self* | Self |
| medications | Self | Self | Self | Self |
| medicationLogs | Self | Self | Self | Self |
| alerts | Backend | Self | Self* | Self |
| timeline | Backend | Self | ❌ | Self |
| locations | Self | Self | ❌ | Self |

*Can only update specific fields (read for alerts, notes for symptoms)

---

## Quick CRUD Usage

### Create Document
```javascript
import { createHealthRecord } from '@/utils/firestoreCRUD';

await createHealthRecord(userId, {
  mode: 'hybrid',
  inputData: { heartRate: 95, temperature: 38.5, ... },
  symptoms: ['fever', 'fatigue'],
  riskScore: 65,
  riskLevel: 'high',
  explanation: 'Elevated vitals suggest infection'
});
```

### Read Document
```javascript
import { getProfile, getUserHealthRecords } from '@/utils/firestoreCRUD';

const profile = await getProfile(userId);
const records = await getUserHealthRecords(userId, 10);
```

### Update Document
```javascript
import { updateDocument } from '@/utils/firestoreCRUD';

await updateDocument('alerts', alertId, { read: true });
```

### Delete Document
```javascript
import { deleteDocument } from '@/utils/firestoreCRUD';

await deleteDocument('alerts', alertId);
```

### Query with Filters
```javascript
import { queryDocuments } from '@/utils/firestoreCRUD';

const results = await queryDocuments(
  'healthRecords',
  [
    { field: 'userId', operator: '==', value: userId },
    { field: 'riskLevel', operator: '==', value: 'high' }
  ],
  { field: 'createdAt', direction: 'desc' },
  20
);
```

### Batch Operations
```javascript
import { batchCreateDocuments, batchUpdateDocuments } from '@/utils/firestoreCRUD';

// Batch create
await batchCreateDocuments('symptoms', symptomsArray, userId);

// Batch update
await batchUpdateDocuments('alerts', [
  { docId: 'alert1', data: { read: true } },
  { docId: 'alert2', data: { read: true } }
]);
```

---

## Validation

### Always Validate Before Creating

```javascript
import { validateHealthRecord } from '@/utils/firestoreValidation';

const validation = validateHealthRecord(data);
if (!validation.valid) {
  console.error('Errors:', validation.errors);
  return;
}
```

### Collection Validators
```javascript
validateProfile(data)          → Check profile fields
validateHealthRecord(data)     → Check health data, mode, vitals
validateSymptom(data)          → Check symptoms, at least 1 true
validateMedication(data)       → Check med schedule, dates
validateMedicationLog(data)    → Check status, time
validateAlert(data)            → Check type, severity, message
validateLocation(data)         → Check lat/lng bounds
```

---

## Field Reference

### healthRecords
```javascript
{
  userId: string,                    // Required
  memberId: string | null,           // null = self
  mode: 'vitals' | 'symptoms' | 'hybrid',
  inputData: {
    heartRate, temperature, respiratoryRate, 
    oxygenSaturation, bloodPressureSys, 
    bloodPressureDia, wbc, lactate
  },
  symptoms: string[],                // ['fever', 'fatigue']
  riskScore: 0-100 | null,
  riskLevel: 'low' | 'medium' | 'high' | 'concern',
  explanation: string,               // AI recommendation
  createdAt: Timestamp              // Auto-set
}
```

### symptoms
```javascript
{
  userId: string,
  memberId: string | null,
  fever: boolean,
  cough: boolean,
  fatigue: boolean,
  breathingDifficulty: boolean,
  confusion: boolean,
  notes: string | null,
  createdAt: Timestamp
}
```

### medications
```javascript
{
  userId: string,
  memberId: string | null,
  name: string,
  dosage: string,
  schedule: {
    times: ['08:00', '20:00'],      // 24-hour format
    frequency: 'daily' | 'weekly' | 'as-needed'
  },
  startDate: 'YYYY-MM-DD',
  endDate: 'YYYY-MM-DD' | null,
  reminderEnabled: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### alerts
```javascript
{
  userId: string,
  memberId: string | null,
  type: 'risk' | 'symptom' | 'medication',
  severity: 'low' | 'medium' | 'high',
  message: string,
  read: boolean,
  relatedRecordId: string | null,
  createdAt: Timestamp
}
```

---

## Constants Reference

```javascript
import { COLLECTIONS, ENUMS, LIMITS, RISK_RANGES } from '@/utils/firestoreSchema';

// Collections
COLLECTIONS.HEALTH_RECORDS
COLLECTIONS.SYMPTOMS
COLLECTIONS.MEDICATIONS
COLLECTIONS.ALERTS
COLLECTIONS.TIMELINE

// Enums
ENUMS.HEALTH_MODE.VITALS
ENUMS.HEALTH_MODE.SYMPTOMS
ENUMS.HEALTH_MODE.HYBRID

ENUMS.RISK_LEVEL.LOW
ENUMS.RISK_LEVEL.MEDIUM
ENUMS.RISK_LEVEL.HIGH

ENUMS.ALERT_TYPE.RISK
ENUMS.ALERT_TYPE.SYMPTOM
ENUMS.ALERT_TYPE.MEDICATION

ENUMS.ALERT_SEVERITY.LOW
ENUMS.ALERT_SEVERITY.MEDIUM
ENUMS.ALERT_SEVERITY.HIGH

// Limits
LIMITS.QUERY_LIMIT_DEFAULT      // 25
LIMITS.MAX_BATCH_WRITES         // 500
LIMITS.MAX_DOC_SIZE_KB          // 1024

// Risk ranges
RISK_RANGES.LOW                 // { min: 0, max: 34 }
RISK_RANGES.MEDIUM              // { min: 35, max: 64 }
RISK_RANGES.HIGH                // { min: 65, max: 100 }
```

---

## Common Queries

### User's Latest Health Check
```javascript
const records = await getUserHealthRecords(userId, 1);
const latest = records[0];
```

### Today's Symptom Entry
```javascript
const today = await getTodaySymptom(userId);
if (today) {
  // User already checked in
}
```

### Unread Alerts
```javascript
const unread = await getUserAlerts(userId, true, 50);
```

### Family Member's History
```javascript
const familyRecords = await getFamilyMemberHealthRecords(
  userId, 
  memberId, 
  10
);
```

### Medication Adherence
```javascript
const logs = await getMedicationAdherence(userId, medId, 30); // Last 30 days
const taken = logs.filter(l => l.status === 'taken').length;
const compliance = (taken / logs.length) * 100;
```

### High Risk Records
```javascript
const highRisk = await queryDocuments(
  'healthRecords',
  [
    { field: 'userId', operator: '==', value: userId },
    { field: 'riskLevel', operator: '==', value: 'high' }
  ],
  { field: 'createdAt', direction: 'desc' },
  5
);
```

### Timeline Events by Type
```javascript
const symptoms = await getTimelineByType(userId, 'symptom', 20);
const risks = await getTimelineByType(userId, 'risk', 20);
```

---

## Batch Operations

### Batch Create Multiple
```javascript
const symptomEntries = [
  { fever: true, cough: false, ... },
  { fever: false, cough: true, ... }
];
await batchCreateDocuments('symptoms', symptomEntries, userId);
```

### Batch Mark Alerts Read
```javascript
const unread = await getUserAlerts(userId, true, 100);
const updates = unread.map(alert => ({
  docId: alert.id,
  data: { read: true }
}));
await batchUpdateDocuments('alerts', updates);
```

### Batch Delete
```javascript
const alertIds = ['alert1', 'alert2', 'alert3'];
await batchDeleteDocuments('alerts', alertIds);
```

---

## Error Handling

```javascript
import { FirestoreError } from '@/utils/firestoreCRUD';

try {
  await createHealthRecord(userId, data);
} catch (error) {
  if (error instanceof FirestoreError) {
    switch (error.code) {
      case 'validation-error':
        // Data validation failed
        console.error(error.message); // Lists validation errors
        break;
      case 'permission-denied':
        // User doesn't have access
        break;
      case 'not-found':
        // Resource doesn't exist
        break;
      default:
        // Other Firestore error
    }
  }
}
```

---

## Deployment Commands

```bash
# Deploy everything
firebase deploy

# Deploy specific
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only functions

# Check status
firebase firestore:indexes:list
firebase functions:list

# View logs
firebase functions:log
firebase functions:log --follow
```

---

## Security Rules Reference

```javascript
// Allow user to read their own profile
match /profiles/{userId} {
  allow read: if request.auth.uid == userId;
}

// Allow user to create health record with their userId
match /healthRecords/{recordId} {
  allow create: if request.auth.uid == request.resource.data.userId;
}

// Allow read own documents
match /{collection}/{docId} {
  allow read: if request.auth.uid == resource.data.userId;
}
```

---

## Validation Rules Checklist

### Before Creating healthRecord:
- ✅ Mode is one of: vitals, symptoms, hybrid
- ✅ If vitals mode: ≥4 vital signs present
- ✅ If symptoms mode: ≥2 symptoms true
- ✅ If hybrid: both vitals AND symptoms
- ✅ RiskLevel is valid: low, medium, high, concern
- ✅ Explanation is 5-1000 characters
- ✅ userId matches auth user

### Before Creating Symptom:
- ✅ At least 1 symptom is true
- ✅ userId matches auth user

### Before Creating Medication:
- ✅ Name is present
- ✅ Schedule times valid (HH:MM format)
- ✅ Start date before end date (if end date set)
- ✅ Frequency is valid: daily, weekly, as-needed

---

## Performance Tips

- ✅ Use indexes for queries with multiple fields
- ✅ Limit query results: `limit(25)` by default
- ✅ Paginate: Use `startAfter(lastDoc)` for next page
- ✅ Cache frequently accessed data
- ✅ Batch writes when creating multiple docs
- ✅ Use transactions for related operations
- ✅ Archive old data periodically (90+ days)

---

## Cloud Functions Triggers

| Trigger | Function | Action |
|---|---|---|
| healthRecord created | createTimelineOnHealthRecord | Create timeline event |
| healthRecord created | createAlertOnHighRisk | Create alert if riskScore > 64 |
| symptom created | createTimelineOnSymptom | Create timeline event |
| symptom created | createAlertOnConcerningSyntoms | Create alert if concerning combo |
| labResult created | createTimelineOnLabResult | Create timeline event |
| medicationLog created | createMedicationReminders | Create alert if missed |
| User auth deleted | deleteUserOnAuthDelete | Delete all user data |

---

## Getting Help

| Issue | Resource |
|---|---|
| Schema structure | [FIRESTORE_SCHEMA.md](./FIRESTORE_SCHEMA.md) |
| Implementation steps | [FIRESTORE_IMPLEMENTATION.md](./FIRESTORE_IMPLEMENTATION.md) |
| Validation rules | `firestoreValidation.js` source code |
| CRUD operations | `firestoreCRUD.js` source code |
| Type definitions | `firestoreSchema.js` constants |

---

**Last Updated:** April 28, 2026  
**Status:** Production Ready ✅  
**Version:** 1.0.0
