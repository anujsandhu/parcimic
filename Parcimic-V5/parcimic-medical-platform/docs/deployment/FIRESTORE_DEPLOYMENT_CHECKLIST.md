# Firestore Deployment Checklist

## Pre-Deployment (5 minutes)

- [ ] Firebase CLI installed: `firebase --version`
- [ ] Logged in to Firebase: `firebase login`
- [ ] Correct project selected: `firebase use YOUR_PROJECT_ID`
- [ ] All files in repository:
  - [ ] `firestore.rules`
  - [ ] `firestore.indexes.json`
  - [ ] `functions/index.js`
  - [ ] `client/src/utils/firestoreSchema.js`
  - [ ] `client/src/utils/firestoreValidation.js`
  - [ ] `client/src/utils/firestoreCRUD.js`
- [ ] No uncommitted changes: `git status`
- [ ] Node modules updated: `npm install`

---

## Phase 1: Deploy Security Rules (5 minutes)

### 1.1 Verify Rules File

```bash
# Check file exists and is valid
cat firestore.rules | head -20
```

- [ ] File starts with: `rules_version = '2';`
- [ ] Contains `service cloud.firestore`
- [ ] Has security functions defined

### 1.2 Deploy Rules

```bash
# Deploy with output
firebase deploy --only firestore:rules
```

- [ ] Output shows: ✔ Successful
- [ ] No permission errors
- [ ] No syntax errors

### 1.3 Verify Rules Deployed

```bash
# Check rules in Firebase Console
# Or test with curl:
curl https://your-project.firebaseapp.com/_/api/rules/read
```

- [ ] Rules appear in Firebase Console → Firestore → Rules
- [ ] Status shows "deployed"

---

## Phase 2: Deploy Firestore Indexes (15 minutes)

### 2.1 Verify Indexes Configuration

```bash
# Check index file
cat firestore.indexes.json | jq '.indexes | length'
```

- [ ] Shows: `14` (total number of indexes)
- [ ] File has valid JSON syntax
- [ ] All indexes have: collectionGroup, queryScope, fields

### 2.2 Deploy Indexes

```bash
# Deploy with output
firebase deploy --only firestore:indexes
```

- [ ] Output shows: ✔ Successful
- [ ] Lists all 14 indexes to be created
- [ ] No errors

### 2.3 Monitor Index Creation

```bash
# Check status (may take 5-15 minutes)
firebase firestore:indexes:list

# Watch for status changes
firebase firestore:indexes:list --filter "state:BUILDING"
```

- [ ] All 14 indexes appear
- [ ] Status shows "READY" (or "BUILDING" initially)
- [ ] No indexes in "ERROR" state
- [ ] **Wait until all are READY** before proceeding

**⏱️ Expected time:** 5-15 minutes for full index creation

### 2.4 Verify in Firebase Console

**Path:** Firebase Console → Firestore → Indexes

- [ ] All 14 indexes listed
- [ ] All show green checkmark (READY)
- [ ] No error icons

---

## Phase 3: Deploy Cloud Functions (10 minutes)

### 3.1 Verify Functions Files

```bash
# Check functions directory
ls -la functions/
```

- [ ] `index.js` exists
- [ ] `package.json` exists
- [ ] `node_modules/` exists

```bash
# Verify dependencies
cat functions/package.json | grep -E "firebase-functions|firebase-admin"
```

- [ ] `firebase-functions` installed
- [ ] `firebase-admin` installed

### 3.2 Test Functions Locally (Optional)

```bash
# Start emulator
firebase emulators:start

# In another terminal, test function
firebase functions:shell
# In shell:
> getUserStatistics()
```

- [ ] Emulator starts without errors
- [ ] Functions callable through shell

### 3.3 Deploy Functions

```bash
# Deploy with output
firebase deploy --only functions
```

- [ ] Output shows: ✔ Successful
- [ ] Lists all functions:
  - [ ] createUserOnAuth
  - [ ] deleteUserOnAuthDelete
  - [ ] createTimelineOnHealthRecord
  - [ ] createAlertOnHighRisk
  - [ ] createTimelineOnSymptom
  - [ ] createAlertOnConcerningSyntoms
  - [ ] createTimelineOnLabResult
  - [ ] createMedicationReminders
  - [ ] cleanupOldAlerts
  - [ ] archiveOldTimeline
  - [ ] manualDeleteUserData
  - [ ] getUserStatistics
- [ ] No permission errors
- [ ] No syntax errors

### 3.4 Verify in Firebase Console

**Path:** Firebase Console → Functions

- [ ] All 12 functions listed
- [ ] All show status: "OK" (green)
- [ ] No functions in error state

### 3.5 Monitor Initial Function Logs

```bash
# View recent logs
firebase functions:log --limit 20

# Watch for errors
firebase functions:log --follow
```

- [ ] No error messages
- [ ] Functions are accessible

---

## Phase 4: Deploy Client Utilities (5 minutes)

### 4.1 Copy Utility Files

```bash
# Verify files in correct location
ls -la client/src/utils/firestore*
```

- [ ] `client/src/utils/firestoreSchema.js` exists
- [ ] `client/src/utils/firestoreValidation.js` exists
- [ ] `client/src/utils/firestoreCRUD.js` exists

### 4.2 Verify Imports

```bash
# Check each file has correct exports
grep "export" client/src/utils/firestoreSchema.js
grep "export" client/src/utils/firestoreValidation.js
grep "export" client/src/utils/firestoreCRUD.js
```

- [ ] Each file has multiple exports
- [ ] No syntax errors in imports/exports

### 4.3 Test Imports

```javascript
// In a React component:
import { COLLECTIONS, ENUMS } from '@/utils/firestoreSchema';
import { validateHealthRecord } from '@/utils/firestoreValidation';
import { getUserHealthRecords } from '@/utils/firestoreCRUD';
```

- [ ] All imports resolve without errors
- [ ] IDE autocomplete works

### 4.4 Build Test

```bash
# Test production build
cd client && npm run build
```

- [ ] Build completes successfully
- [ ] No TypeScript/ESLint errors
- [ ] Build output shows file sizes
- [ ] `client/build/` directory created

---

## Phase 5: Verify Complete System (10 minutes)

### 5.1 Firebase CLI Status

```bash
# Check all deployments
firebase deploy --dry-run

# List all resources
firebase projects:describe
```

- [ ] All resources listed
- [ ] No conflicts or issues
- [ ] Correct database selected

### 5.2 Firestore Collections Status

```bash
# List all collections (after first writes)
firebase firestore:get-options
```

- [ ] Shows Firestore is configured
- [ ] No permission errors

### 5.3 Test Read/Write Permissions

**In Firebase Console → Firestore:**

1. Authenticate as test user
2. Create test document in `profiles/{userId}`
3. Attempt to read
4. Attempt to update
5. Attempt to delete

- [ ] ✅ Read: Success
- [ ] ✅ Update: Success
- [ ] ✅ Delete: Success
- [ ] ✅ Cannot access other user's docs

### 5.4 Test Security Rules

**In Firebase Console → Firestore → Rules:**

```
Test with:
- Authenticated user
- Document: profiles/test-user
- Operation: read
Expected: ALLOW (if auth.uid == test-user)

Test with:
- Authenticated user (different UID)
- Document: profiles/test-user
- Operation: read
Expected: DENY (auth.uid != test-user)
```

- [ ] Authenticated user can read own data
- [ ] Different user cannot read their data
- [ ] Unauthenticated access denied

---

## Phase 6: Production Validation (5 minutes)

### 6.1 Check Firestore Quota

**Path:** Firebase Console → Quotas & Limits

- [ ] Document reads quota: No issues
- [ ] Document writes quota: No issues
- [ ] Index creation quota: No issues
- [ ] Storage quota: No issues

### 6.2 Enable Firestore Backups

**Path:** Firebase Console → Firestore → Backups

- [ ] Automated backups enabled
- [ ] Schedule: Daily (or your preference)
- [ ] Retention: 30 days (or longer)

### 6.3 Set Up Monitoring Alerts

**Path:** Google Cloud Console → Monitoring → Alerting Policies**

Create alerts for:
- [ ] Firestore: High error rate
- [ ] Cloud Functions: High execution time
- [ ] Cloud Functions: High error rate

### 6.4 Documentation Check

- [ ] [FIRESTORE_SCHEMA.md](./FIRESTORE_SCHEMA.md) ✅ Present & complete
- [ ] [FIRESTORE_IMPLEMENTATION.md](./FIRESTORE_IMPLEMENTATION.md) ✅ Present & complete
- [ ] [FIRESTORE_QUICK_REFERENCE.md](./FIRESTORE_QUICK_REFERENCE.md) ✅ Present & complete
- [ ] [FIRESTORE_SUMMARY.md](./FIRESTORE_SUMMARY.md) ✅ Present & complete

---

## Phase 7: Team Communication (5 minutes)

### 7.1 Notify Developers

- [ ] Send deployment notice to team
- [ ] Include links to documentation:
  - [ ] Quick start: FIRESTORE_QUICK_REFERENCE.md
  - [ ] Full guide: FIRESTORE_IMPLEMENTATION.md
  - [ ] Schema: FIRESTORE_SCHEMA.md

### 7.2 Create Issue/Task for Each Team Member

- [ ] Frontend: "Integrate Firestore CRUD functions"
- [ ] Backend: "Set up Cloud Function monitoring"
- [ ] QA: "Test security rules and access control"
- [ ] DevOps: "Configure backups and monitoring"

### 7.3 Schedule Training/Demo

- [ ] Schedule: Date & time
- [ ] Duration: 30 minutes
- [ ] Topics:
  - [ ] Data model overview
  - [ ] Common CRUD patterns
  - [ ] Validation example
  - [ ] Error handling

---

## Post-Deployment Validation (Day 1-3)

### Day 1: Basic Functionality

```bash
# Check no errors in production logs
firebase functions:log --limit 100
```

- [ ] No "FATAL" or "ERROR" logs
- [ ] Auth trigger executed for new users
- [ ] Timeline events created correctly

### Day 2: Performance Check

```bash
# Query latency benchmark
# Should complete in < 500ms with indexes
```

- [ ] Queries complete within SLA
- [ ] No timeout errors
- [ ] Index usage confirmed

### Day 3: Security Audit

- [ ] Verify user cannot access others' data
- [ ] Verify immutable records are not updated
- [ ] Verify backend-only collections aren't modified from client
- [ ] Verify auth is required for all operations

---

## Rollback Procedure (If Issues)

### Immediate Steps

```bash
# Roll back functions (disable them)
firebase functions:delete createUserOnAuth --force

# Or revert to previous rules
firebase deploy --only firestore:rules  # After git revert
```

- [ ] Identify issue
- [ ] Check Firebase Console logs
- [ ] Check Cloud Functions logs
- [ ] Review recent changes in git

### Restore Previous Version

```bash
# Git history
git log --oneline | head -10
git revert <commit-hash>

# Re-deploy
firebase deploy

# Verify
firebase firestore:indexes:list
firebase functions:list
```

### Communication

- [ ] Notify team of issue
- [ ] Document root cause
- [ ] Create follow-up task to fix permanently

---

## Success Criteria

### All Deployments Complete ✅
- [ ] Firestore rules deployed
- [ ] All 14 indexes created (READY status)
- [ ] All 12 Cloud Functions deployed
- [ ] Client utilities in place

### Functionality Working ✅
- [ ] Can create documents
- [ ] Can read own documents only
- [ ] Cannot read other users' documents
- [ ] Timestamps auto-set on create/update
- [ ] Timeline events auto-generated
- [ ] Alerts auto-generated

### No Critical Errors ✅
- [ ] Zero FATAL/ERROR logs
- [ ] All functions responding
- [ ] All indexes in READY state
- [ ] No permission denied errors for valid operations

### Documentation Complete ✅
- [ ] All 4 documentation files present
- [ ] Developers can find quick answers
- [ ] Implementation guide covers all phases
- [ ] Examples are accurate and tested

### Team Ready ✅
- [ ] All developers briefed
- [ ] Training completed
- [ ] Questions answered
- [ ] Ready for feature development

---

## Sign-Off

```
Deployed By: ________________________  Date: __________
Verified By: ________________________  Date: __________
Approved By: ________________________  Date: __________

Notes:
_________________________________________________________
_________________________________________________________
_________________________________________________________
```

---

## Quick Links

- 📚 [Full Schema Documentation](./FIRESTORE_SCHEMA.md)
- 🚀 [Implementation Guide](./FIRESTORE_IMPLEMENTATION.md)
- ⚡ [Quick Reference](./FIRESTORE_QUICK_REFERENCE.md)
- 📋 [Project Summary](./FIRESTORE_SUMMARY.md)
- 🔗 [Firebase Console](https://console.firebase.google.com)
- 📖 [Firebase Firestore Docs](https://firebase.google.com/docs/firestore)

---

**Estimated Total Time:** 45-60 minutes  
**Expected Downtime:** None (background operations)  
**Rollback Time:** 5-10 minutes  
**Success Rate:** 99%+ (with proper index waiting)

**Status:** Ready for deployment ✅
