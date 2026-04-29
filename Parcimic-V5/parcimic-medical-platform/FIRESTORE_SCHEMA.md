# Parcimic Firestore Data Model & Security Architecture

## Overview

This document defines the secure, scalable Firestore database structure for Parcimic — a personal health assistant platform supporting:
- User profiles & authentication
- Family member health tracking
- Health records (vitals, labs, symptoms)
- Medications & adherence tracking
- Smart alerts & unified timeline
- Strict per-user access control

**Key Principle:** Every document contains `userId` and security rules ensure users can only read/write their own data.

---

## Collections Overview

| Collection | Purpose | Key Fields | Relationship |
|---|---|---|---|
| `users` | Auth mirror | email, provider, createdAt | 1 per user |
| `profiles` | Primary user data | fullName, phone, DOB, location | 1 per user |
| `familyMembers` | Multi-profile | name, relation, age, conditions | N per user |
| `healthRecords` | Risk predictions | inputData, symptoms, riskScore, explanation | N per user/member |
| `symptoms` | Daily check-ins | fever, fatigue, cough, breathing, notes | N per user/member |
| `labResults` | Lab tests | testName, values, reportUrl | N per user/member |
| `medications` | Med plans | name, dosage, schedule, reminders | N per user/member |
| `medicationLogs` | Med adherence | medId, status, loggedAt | N per user/med |
| `alerts` | System alerts | type, message, severity, read status | N per user/member |
| `timeline` | Unified events | type, refId, summary | N per user/member |
| `locations` | Location history | lat, lng, source | N per user |

---

## Collection Schemas

### 1. users/{userId}

**Purpose:** Mirror of Firebase Auth user record  
**Owner:** Firebase Auth trigger (Cloud Function)  
**Read:** Self only  
**Write:** Cloud Function only

```javascript
{
  userId: string,          // Document ID = Firebase Auth UID
  email: string,           // From Auth
  provider: "google" | "email",
  createdAt: timestamp,    // Server timestamp
}
```

**Example:**
```javascript
{
  email: "user@example.com",
  provider: "google",
  createdAt: Timestamp(2024, 4, 15, 10, 30, 0)
}
```

---

### 2. profiles/{userId}

**Purpose:** Primary user profile information  
**Owner:** User (self)  
**Read:** Self only  
**Write:** Self only

```javascript
{
  userId: string,                    // Required: Document ID = Firebase Auth UID
  fullName: string,                  // Required
  phone: string | null,              // Optional
  dateOfBirth: string,               // ISO format: "1990-05-15"
  gender: "M" | "F" | "Other" | null,
  bloodGroup: string | null,         // "A+", "B-", "O+", "AB-", etc.
  address: string | null,
  emergencyContact: {
    name: string,
    phone: string
  } | null,
  location: {                        // Latest location snapshot
    lat: number,
    lng: number,
    city: string | null,
    updatedAt: timestamp
  } | null,
  createdAt: timestamp,              // Server timestamp
  updatedAt: timestamp               // Server timestamp
}
```

**Example:**
```javascript
{
  userId: "auth_uid_123",
  fullName: "Jane Doe",
  phone: "+1234567890",
  dateOfBirth: "1990-05-15",
  gender: "F",
  bloodGroup: "O+",
  address: "123 Main St, City",
  emergencyContact: {
    name: "John Doe",
    phone: "+0987654321"
  },
  location: {
    lat: 40.7128,
    lng: -74.0060,
    city: "New York",
    updatedAt: Timestamp(2024, 4, 28, 14, 22, 10)
  },
  createdAt: Timestamp(2024, 4, 15, 10, 30, 0),
  updatedAt: Timestamp(2024, 4, 28, 14, 22, 10)
}
```

---

### 3. familyMembers/{memberId}

**Purpose:** Track family members' health profiles  
**Owner:** User who created it  
**Read:** Self only  
**Write:** Self only

```javascript
{
  memberId: string,                  // Document ID
  userId: string,                    // Required: Owner ID
  name: string,                      // Required: Member's name
  relation: string,                  // "mother", "father", "spouse", "child", "sibling"
  age: number | null,
  gender: "M" | "F" | "Other" | null,
  conditions: string[],              // ["diabetes", "hypertension"]
  notes: string | null,              // Additional context
  createdAt: timestamp,              // Server timestamp
  updatedAt: timestamp               // Server timestamp
}
```

**Example:**
```javascript
{
  userId: "auth_uid_123",
  name: "Mary Doe",
  relation: "mother",
  age: 65,
  gender: "F",
  conditions: ["diabetes", "hypertension"],
  notes: "Takes Metformin daily",
  createdAt: Timestamp(2024, 4, 20, 9, 15, 0),
  updatedAt: Timestamp(2024, 4, 28, 10, 0, 0)
}
```

---

### 4. healthRecords/{recordId}

**Purpose:** Store risk assessments & health predictions  
**Owner:** User (immutable after creation)  
**Read:** Self only  
**Write:** Self only (create only, no update)

```javascript
{
  recordId: string,                   // Document ID
  userId: string,                     // Required: Owner ID
  memberId: string | null,            // null = self, else family member
  mode: "vitals" | "symptoms" | "hybrid",  // Required: Assessment mode
  
  inputData: {
    heartRate: number | null,         // bpm
    temperature: number | null,       // °C
    respiratoryRate: number | null,   // /min
    oxygenSaturation: number | null,  // %
    bloodPressureSys: number | null,  // mmHg
    bloodPressureDia: number | null,  // mmHg
    wbc: number | null,               // white blood cells
    lactate: number | null            // mmol/L
  },
  
  symptoms: string[],                 // ["fever", "fatigue", "cough"]
  riskScore: number | null,           // 0-100, null if symptom-only
  riskLevel: "low" | "medium" | "high" | "concern",
  explanation: string,                // AI recommendation (3-4 lines)
  createdAt: timestamp                // Server timestamp
}
```

**Validation:**
- **Vitals mode:** Requires ≥4 of: heartRate, temperature, respiratoryRate, oxygenSaturation, BP
- **Symptom mode:** Requires ≥2 symptoms
- **Hybrid mode:** Both vitals AND symptoms present

**Example:**
```javascript
{
  userId: "auth_uid_123",
  memberId: null,
  mode: "hybrid",
  inputData: {
    heartRate: 95,
    temperature: 38.5,
    respiratoryRate: 22,
    oxygenSaturation: 95,
    bloodPressureSys: 120,
    bloodPressureDia: 80,
    wbc: null,
    lactate: null
  },
  symptoms: ["fever", "fatigue"],
  riskScore: 52,
  riskLevel: "medium",
  explanation: "Elevated temperature and respiratory rate suggest possible infection. Monitor closely and stay hydrated.",
  createdAt: Timestamp(2024, 4, 28, 14, 30, 0)
}
```

---

### 5. symptoms/{entryId}

**Purpose:** Daily symptom check-in records  
**Owner:** User  
**Read:** Self only  
**Write:** Self only

```javascript
{
  entryId: string,                    // Document ID
  userId: string,                     // Required: Owner ID
  memberId: string | null,            // null = self, else family member
  
  // Boolean symptoms
  fever: boolean,                     // Has fever?
  cough: boolean,                     // Has cough?
  fatigue: boolean,                   // Experiencing fatigue?
  breathingDifficulty: boolean,       // Difficulty breathing?
  confusion: boolean,                 // Mental confusion?
  
  notes: string | null,               // Optional additional notes
  createdAt: timestamp                // Server timestamp
}
```

**Example:**
```javascript
{
  userId: "auth_uid_123",
  memberId: null,
  fever: true,
  cough: true,
  fatigue: true,
  breathingDifficulty: false,
  confusion: false,
  notes: "Feeling weak, runny nose",
  createdAt: Timestamp(2024, 4, 28, 8, 0, 0)
}
```

---

### 6. labResults/{labId}

**Purpose:** Store lab test results  
**Owner:** User  
**Read:** Self only  
**Write:** Self only

```javascript
{
  labId: string,                      // Document ID
  userId: string,                     // Required: Owner ID
  memberId: string | null,            // null = self
  testName: string,                   // "CBC", "Lipid Panel", "Lactate", "CRP"
  values: {
    [key: string]: string | number    // e.g., { "WBC": 7.5, "RBC": 4.8 }
  },
  reportUrl: string | null,           // Optional: Storage path/link to PDF
  takenAt: timestamp,                 // When test was performed
  createdAt: timestamp                // Server timestamp
}
```

**Example:**
```javascript
{
  userId: "auth_uid_123",
  memberId: null,
  testName: "CBC",
  values: {
    WBC: 7.5,
    RBC: 4.8,
    Platelets: 250,
    Hemoglobin: 14.2
  },
  reportUrl: "gs://bucket/labs/lab_abc123.pdf",
  takenAt: Timestamp(2024, 4, 25, 10, 0, 0),
  createdAt: Timestamp(2024, 4, 26, 14, 22, 0)
}
```

---

### 7. medications/{medId}

**Purpose:** User's medication plans  
**Owner:** User  
**Read:** Self only  
**Write:** Self only

```javascript
{
  medId: string,                      // Document ID
  userId: string,                     // Required: Owner ID
  memberId: string | null,            // null = self
  
  name: string,                       // "Aspirin", "Metformin"
  dosage: string,                     // "500mg", "1 tablet"
  
  schedule: {
    times: string[],                  // ["08:00", "20:00"] (24-hour format)
    frequency: "daily" | "weekly" | "as-needed"
  },
  
  startDate: string,                  // ISO: "2024-04-15"
  endDate: string | null,             // ISO: "2024-05-15", null = ongoing
  reminderEnabled: boolean,           // Push notifications?
  
  createdAt: timestamp,               // Server timestamp
  updatedAt: timestamp                // Server timestamp
}
```

**Example:**
```javascript
{
  userId: "auth_uid_123",
  memberId: null,
  name: "Aspirin",
  dosage: "500mg",
  schedule: {
    times: ["08:00", "14:00", "20:00"],
    frequency: "daily"
  },
  startDate: "2024-04-15",
  endDate: null,
  reminderEnabled: true,
  createdAt: Timestamp(2024, 4, 15, 10, 30, 0),
  updatedAt: Timestamp(2024, 4, 28, 14, 22, 10)
}
```

---

### 8. medicationLogs/{logId}

**Purpose:** Track medication adherence  
**Owner:** User  
**Read:** Self only  
**Write:** Self only

```javascript
{
  logId: string,                      // Document ID
  userId: string,                     // Required: Owner ID
  memberId: string | null,            // null = self
  medId: string,                      // Reference to medications/{medId}
  
  scheduledTime: string,              // "08:00" (24-hour format)
  status: "taken" | "missed" | "skipped",
  
  loggedAt: timestamp                 // Server timestamp
}
```

**Example:**
```javascript
{
  userId: "auth_uid_123",
  memberId: null,
  medId: "med_456",
  scheduledTime: "08:00",
  status: "taken",
  loggedAt: Timestamp(2024, 4, 28, 8, 15, 0)
}
```

---

### 9. alerts/{alertId}

**Purpose:** Centralized alert system  
**Owner:** User (backend writes, user reads)  
**Read:** Self only  
**Write:** Backend only (client can update read status)

```javascript
{
  alertId: string,                    // Document ID
  userId: string,                     // Required: Owner ID
  memberId: string | null,            // null = self
  
  type: "risk" | "symptom" | "medication",
  severity: "low" | "medium" | "high",
  message: string,                    // "High fever detected. Seek medical care."
  
  read: boolean,                      // User dismissed/read?
  relatedRecordId: string | null,     // Reference to source (healthRecord, etc.)
  
  createdAt: timestamp                // Server timestamp
}
```

**Alert Triggers (Backend Logic):**
- **Risk High:** riskScore > 64 → type="risk", severity="high"
- **Risk Moderate:** 35 ≤ riskScore ≤ 64 → type="risk", severity="medium"
- **Fever + High HR:** fever=true AND HR > 100 → type="symptom", severity="high"
- **Breathing Difficulty:** breathingDifficulty=true → type="symptom", severity="high"
- **Missed Medication:** No log entry at scheduled time → type="medication", severity="low"

**Example:**
```javascript
{
  userId: "auth_uid_123",
  memberId: null,
  type: "risk",
  severity: "high",
  message: "High risk detected (score 68). Elevated temperature, high heart rate, and fast breathing suggest possible infection. Seek immediate medical attention.",
  read: false,
  relatedRecordId: "healthRecord_789",
  createdAt: Timestamp(2024, 4, 28, 14, 30, 0)
}
```

---

### 10. timeline/{eventId}

**Purpose:** Unified event log combining all health events  
**Owner:** User  
**Read:** Self only  
**Write:** Backend only

```javascript
{
  eventId: string,                    // Document ID
  userId: string,                     // Required: Owner ID
  memberId: string | null,            // null = self
  
  type: "risk" | "symptom" | "lab" | "medication" | "alert",
  refId: string,                      // ID from source collection
  summary: string,                    // "High risk detected", "Symptom check-in recorded"
  
  createdAt: timestamp                // Server timestamp
}
```

**Timeline Generation (Backend):**
- When healthRecord created → timeline event, type="risk"
- When symptoms recorded → timeline event, type="symptom"
- When labResult created → timeline event, type="lab"
- When medication added → timeline event, type="medication"
- When alert created → timeline event, type="alert"

**Example:**
```javascript
{
  userId: "auth_uid_123",
  memberId: null,
  type: "risk",
  refId: "healthRecord_789",
  summary: "High risk detected (score 68)",
  createdAt: Timestamp(2024, 4, 28, 14, 30, 0)
}
```

---

### 11. locations/{locationId}

**Purpose:** Optional location history tracking  
**Owner:** User  
**Read:** Self only  
**Write:** Self only

```javascript
{
  locationId: string,                 // Document ID
  userId: string,                     // Required: Owner ID
  
  lat: number,                        // Latitude
  lng: number,                        // Longitude
  source: "gps" | "ip" | "manual",
  
  createdAt: timestamp                // Server timestamp
}
```

**Example:**
```javascript
{
  userId: "auth_uid_123",
  lat: 40.7128,
  lng: -74.0060,
  source: "gps",
  createdAt: Timestamp(2024, 4, 28, 14, 22, 10)
}
```

---

## Security Model

### Core Principles

1. **Authentication First:** All operations require `request.auth != null`
2. **Ownership:** Every document has `userId`. Users can only access their own.
3. **Immutability:** Health records are immutable after creation (audit trail)
4. **Server Timestamps:** `createdAt` and `updatedAt` set by server only
5. **UID Matching:** `request.auth.uid` must match `userId` in document

### Security Rules Summary

| Collection | Create | Read | Update | Delete |
|---|---|---|---|---|
| users | Cloud Fn | Self | Cloud Fn | Cloud Fn |
| profiles | Self | Self | Self | Self |
| familyMembers | Self | Self | Self | Self |
| healthRecords | Self | Self | ❌ None | Self |
| symptoms | Self | Self | Self* | Self |
| labResults | Self | Self | Self | Self |
| medications | Self | Self | Self | Self |
| medicationLogs | Self | Self | Self | Self |
| alerts | Backend | Self | Self* | Self |
| timeline | Backend | Self | ❌ None | Self |
| locations | Self | Self | ❌ None | Self |

*Update only: read status for alerts, notes for symptoms

### Validation Rules (Client + Server)

**Do NOT create healthRecord if:**
- Only age provided (no other data)
- Insufficient vitals (< 4 vital signs)
- Insufficient symptoms (< 2 symptoms)
- Wrong mode for data combination

**Vitals Mode requires:**
- heartRate, temperature, respiratoryRate, oxygenSaturation (≥4)

**Symptom Mode requires:**
- ≥2 of: fever, cough, fatigue, breathingDifficulty, confusion

**Hybrid Mode allowed when:**
- Both vitals AND symptoms present

---

## Access Control Summary

### User Can Access

✅ Own profile: `profiles/{authUid}`  
✅ Own family members: `familyMembers` where userId == authUid  
✅ Own health records: `healthRecords` where userId == authUid  
✅ Own symptoms: `symptoms` where userId == authUid  
✅ Own labs: `labResults` where userId == authUid  
✅ Own meds: `medications` where userId == authUid  
✅ Own med logs: `medicationLogs` where userId == authUid  
✅ Own alerts: `alerts` where userId == authUid  
✅ Own timeline: `timeline` where userId == authUid  
✅ Own locations: `locations` where userId == authUid

### User CANNOT Access

❌ Other users' data  
❌ Health records after creation (immutable, read-only)  
❌ System alerts creation (backend only)  
❌ Timeline manipulation (backend only)

### Backend Can Access

✅ All collections via service account  
✅ Create/update timeline events  
✅ Create system alerts  
✅ Delete user data (on request)  
✅ Write to users collection (auth trigger)

---

## Composite Indexes

The system requires these Firestore composite indexes. Deploy via:
```bash
firebase deploy --only firestore:indexes
```

### Required Indexes

| Collection | Fields | Purpose |
|---|---|---|
| healthRecords | (userId, createdAt↓) | Query user's health history |
| healthRecords | (userId, memberId, createdAt↓) | Query family member's history |
| symptoms | (userId, createdAt↓) | Query user's symptoms |
| symptoms | (userId, memberId, createdAt↓) | Query family member's symptoms |
| medications | (userId, createdAt↓) | Query user's meds |
| medications | (userId, memberId, createdAt↓) | Query family member's meds |
| medicationLogs | (userId, medId, loggedAt↓) | Query adherence |
| alerts | (userId, read, createdAt↓) | Query unread alerts |
| alerts | (userId, createdAt↓) | Query all alerts |
| labResults | (userId, createdAt↓) | Query user's labs |
| timeline | (userId, createdAt↓) | Query unified timeline |
| timeline | (userId, type, createdAt↓) | Query timeline by type |
| familyMembers | (userId, createdAt↓) | Query family members |
| locations | (userId, createdAt↓) | Query location history |

See [firestore.indexes.json](./firestore.indexes.json) for deployment config.

---

## CRUD Operations

### Best Practices

1. **Always include userId** in every document
2. **Use server timestamps** for createdAt/updatedAt
3. **Batch writes** for:
   - healthRecord + timeline event + alert
   - medication + medicationLog
4. **Transaction-safe** queries with orderBy + limit
5. **Offline support** via Firestore offline persistence

### Common Queries

**Get user's latest health records:**
```javascript
query(
  collection(db, 'healthRecords'),
  where('userId', '==', authUid),
  orderBy('createdAt', 'desc'),
  limit(10)
)
```

**Get today's symptom check-in:**
```javascript
query(
  collection(db, 'symptoms'),
  where('userId', '==', authUid),
  where('createdAt', '>=', todayStart),
  where('createdAt', '<', tomorrowStart),
  limit(1)
)
```

**Get unread alerts:**
```javascript
query(
  collection(db, 'alerts'),
  where('userId', '==', authUid),
  where('read', '==', false),
  orderBy('createdAt', 'desc')
)
```

**Get family member's health records:**
```javascript
query(
  collection(db, 'healthRecords'),
  where('userId', '==', authUid),
  where('memberId', '==', memberId),
  orderBy('createdAt', 'desc'),
  limit(5)
)
```

---

## Data Retention & Cleanup

### Auto-Cleanup Strategy

**On account deletion:**
1. Delete `/profiles/{userId}`
2. Delete all docs where `userId == userIdToDelete` (all collections)
3. Delete Firebase Auth user

**Cascade deletion** (if supported):
- healthRecords → timeline events (delete related)
- medications → medicationLogs (delete related)
- alerts → delete with healthRecord

**Recommended Cloud Function:**
```
deleteUserData(userId) →
  • Delete profiles/{userId}
  • Delete all healthRecords for userId
  • Delete all symptoms for userId
  • Delete all labResults for userId
  • Delete all medications for userId
  • Delete all medicationLogs for userId
  • Delete all alerts for userId
  • Delete all timeline for userId
  • Delete all locations for userId
  • Delete Firebase Auth user
```

---

## Offline Support

### Enable Offline Persistence

**Client (React):**
```javascript
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open
    } else if (err.code === 'unimplemented') {
        // Browser doesn't support
    }
  });
```

### Cached Data Strategy

Cache in localStorage:
- Last health record
- Current medications
- Emergency numbers
- User profile

Keep Firestore offline sync for:
- Symptom entries
- Medication logs
- New alerts

---

## Migration Guide

### From Old Schema (uid) → New Schema (userId)

Old collections used `uid` field. New schema uses `userId` for consistency.

**Migration steps:**
1. Create new collections with new schema
2. Batch migrate docs: `uid` → `userId`
3. Update all queries to use `userId`
4. Deploy new security rules
5. Archive old collections (don't delete immediately)

---

## Troubleshooting

**Error: "Missing or insufficient permissions"**
- ✅ Verify `userId` matches `request.auth.uid`
- ✅ Check user is signed in
- ✅ Verify security rules deployed

**Error: "Document doesn't exist / invalid query"**
- ✅ Check composite index created in Firestore
- ✅ Verify collection name spelling
- ✅ Ensure `orderBy` field has matching index

**Error: "Transaction aborted"**
- ✅ Retry with exponential backoff
- ✅ Reduce batch size
- ✅ Check document size limits (1 MB)

---

## Performance Tips

1. **Denormalize for reads** (e.g., user's latest score in profile)
2. **Paginate queries** with cursor (startAfter)
3. **Use collection groups** for cross-member queries
4. **Index aggressively** (Firestore auto-suggests)
5. **Batch writes** where possible (transaction)
6. **Delete old data** periodically (retention policy)

---

## Compliance & Privacy

- ✅ GDPR: Right to deletion implemented (deleteUserData function)
- ✅ HIPAA: Strict access control, encryption in transit
- ✅ Data Minimization: Only store necessary fields
- ✅ Audit Trail: Immutable health records with timestamps
- ✅ User Consent: Profile opt-ins for data collection

---

## Summary

This schema provides:
✅ **Secure** per-user access control  
✅ **Scalable** composite indexes for efficient queries  
✅ **Complete** health context (vitals, labs, symptoms, meds)  
✅ **Connected** via timeline & alerts  
✅ **Audit-Ready** with immutable records & timestamps  
✅ **Privacy-First** with strict ownership rules  
✅ **Production-Ready** with comprehensive validation

Deploy firestore.rules and firestore.indexes.json to Firebase to activate.
