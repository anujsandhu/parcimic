/**
 * Firebase Cloud Functions for Parcimic
 * 
 * Deploy: firebase deploy --only functions
 * 
 * Handles:
 * - Account deletion (GDPR compliance)
 * - Auth triggers (create user profile)
 * - Timeline creation
 * - Alert generation
 * - Scheduled cleanup tasks
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// ─── Constants ───────────────────────────────────────────────────────────
const COLLECTIONS = {
  USERS: 'users',
  PROFILES: 'profiles',
  FAMILY_MEMBERS: 'familyMembers',
  HEALTH_RECORDS: 'healthRecords',
  SYMPTOMS: 'symptoms',
  LAB_RESULTS: 'labResults',
  MEDICATIONS: 'medications',
  MEDICATION_LOGS: 'medicationLogs',
  ALERTS: 'alerts',
  TIMELINE: 'timeline',
  LOCATIONS: 'locations',
};

const BATCH_SIZE = 500; // Firestore batch write limit

// ─── Auth Triggers ──────────────────────────────────────────────────────

/**
 * Create user profile on account creation
 */
exports.createUserOnAuth = functions.auth.user().onCreate(async (user) => {
  try {
    const { uid, email, provider } = user;
    const providerType = email && email.includes('google') ? 'google' : 'email';

    // Create user document
    await db.collection(COLLECTIONS.USERS).doc(uid).set({
      email: user.email,
      provider: providerType,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create empty profile (user must fill in details)
    await db.collection(COLLECTIONS.PROFILES).doc(uid).set({
      userId: uid,
      fullName: user.displayName || 'New User',
      phone: null,
      dateOfBirth: null,
      gender: null,
      bloodGroup: null,
      address: null,
      emergencyContact: null,
      location: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✓ Created user profile for ${uid}`);
  } catch (error) {
    console.error(`✗ Error creating user profile for ${user.uid}:`, error);
  }
});

/**
 * Delete user data on account deletion (GDPR compliance)
 */
exports.deleteUserOnAuthDelete = functions.auth.user().onDelete(async (user) => {
  try {
    const userId = user.uid;
    console.log(`Starting deletion of all data for user ${userId}...`);

    // Delete from all collections
    const collectionsList = Object.values(COLLECTIONS).filter(c => c !== COLLECTIONS.USERS);

    for (const collectionName of collectionsList) {
      await deleteUserCollectionData(collectionName, userId);
    }

    // Delete user document
    await db.collection(COLLECTIONS.USERS).doc(userId).delete();

    console.log(`✓ Successfully deleted all data for user ${userId}`);
  } catch (error) {
    console.error(`✗ Error deleting user data for ${user.uid}:`, error);
  }
});

// ─── Firestore Triggers ──────────────────────────────────────────────────

/**
 * Create timeline event when health record is created
 */
exports.createTimelineOnHealthRecord = functions.firestore
  .document(`${COLLECTIONS.HEALTH_RECORDS}/{recordId}`)
  .onCreate(async (snap, context) => {
    try {
      const { recordId } = context.params;
      const healthRecord = snap.data();

      const timelineSummary =
        healthRecord.riskLevel === 'high'
          ? `High risk detected (score ${healthRecord.riskScore})`
          : `Health check recorded (score ${healthRecord.riskScore})`;

      await db.collection(COLLECTIONS.TIMELINE).add({
        userId: healthRecord.userId,
        memberId: healthRecord.memberId || null,
        type: 'risk',
        refId: recordId,
        summary: timelineSummary,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✓ Created timeline event for health record ${recordId}`);
    } catch (error) {
      console.error('✗ Error creating timeline event:', error);
    }
  });

/**
 * Create alert when high-risk health record is created
 */
exports.createAlertOnHighRisk = functions.firestore
  .document(`${COLLECTIONS.HEALTH_RECORDS}/{recordId}`)
  .onCreate(async (snap, context) => {
    try {
      const { recordId } = context.params;
      const healthRecord = snap.data();

      // Only create alert for high risk
      if (healthRecord.riskLevel !== 'high') {
        return;
      }

      const alertMessage =
        healthRecord.riskScore > 75
          ? `🚨 Critical risk detected (${healthRecord.riskScore}). Seek immediate medical attention.`
          : `⚠️ High risk detected (${healthRecord.riskScore}). Please schedule a medical consultation.`;

      await db.collection(COLLECTIONS.ALERTS).add({
        userId: healthRecord.userId,
        memberId: healthRecord.memberId || null,
        type: 'risk',
        severity: healthRecord.riskScore > 75 ? 'high' : 'medium',
        message: alertMessage,
        read: false,
        relatedRecordId: recordId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✓ Created high-risk alert for health record ${recordId}`);
    } catch (error) {
      console.error('✗ Error creating alert:', error);
    }
  });

/**
 * Create timeline event when symptom is recorded
 */
exports.createTimelineOnSymptom = functions.firestore
  .document(`${COLLECTIONS.SYMPTOMS}/{entryId}`)
  .onCreate(async (snap, context) => {
    try {
      const { entryId } = context.params;
      const symptom = snap.data();

      const symptoms = ['fever', 'cough', 'fatigue', 'breathing_difficulty', 'confusion']
        .filter(s => symptom[s] === true)
        .join(', ');

      await db.collection(COLLECTIONS.TIMELINE).add({
        userId: symptom.userId,
        memberId: symptom.memberId || null,
        type: 'symptom',
        refId: entryId,
        summary: `Symptom check-in: ${symptoms}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✓ Created timeline event for symptom entry ${entryId}`);
    } catch (error) {
      console.error('✗ Error creating symptom timeline:', error);
    }
  });

/**
 * Create symptom alert when concerning symptoms detected
 */
exports.createAlertOnConcerningSyntoms = functions.firestore
  .document(`${COLLECTIONS.SYMPTOMS}/{entryId}`)
  .onCreate(async (snap, context) => {
    try {
      const { entryId } = context.params;
      const symptom = snap.data();

      // Check for concerning symptom combinations
      if (symptom.fever && symptom.breathingDifficulty) {
        await db.collection(COLLECTIONS.ALERTS).add({
          userId: symptom.userId,
          memberId: symptom.memberId || null,
          type: 'symptom',
          severity: 'high',
          message: '🔴 Fever with breathing difficulty detected. Seek medical attention immediately.',
          read: false,
          relatedRecordId: entryId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✓ Created concerning symptom alert for entry ${entryId}`);
      }

      // Check for fever only
      if (symptom.fever) {
        await db.collection(COLLECTIONS.ALERTS).add({
          userId: symptom.userId,
          memberId: symptom.memberId || null,
          type: 'symptom',
          severity: 'medium',
          message: '🟡 Fever detected. Monitor your temperature and stay hydrated.',
          read: false,
          relatedRecordId: entryId,
          createAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✓ Created fever alert for entry ${entryId}`);
      }
    } catch (error) {
      console.error('✗ Error creating symptom alert:', error);
    }
  });

/**
 * Create timeline event when lab result is added
 */
exports.createTimelineOnLabResult = functions.firestore
  .document(`${COLLECTIONS.LAB_RESULTS}/{labId}`)
  .onCreate(async (snap, context) => {
    try {
      const { labId } = context.params;
      const lab = snap.data();

      await db.collection(COLLECTIONS.TIMELINE).add({
        userId: lab.userId,
        memberId: lab.memberId || null,
        type: 'lab',
        refId: labId,
        summary: `Lab result: ${lab.testName}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✓ Created timeline event for lab result ${labId}`);
    } catch (error) {
      console.error('✗ Error creating lab timeline:', error);
    }
  });

/**
 * Create medication reminder alerts
 */
exports.createMedicationReminders = functions.firestore
  .document(`${COLLECTIONS.MEDICATION_LOGS}/{logId}`)
  .onCreate(async (snap, context) => {
    try {
      const log = snap.data();

      if (log.status === 'missed') {
        await db.collection(COLLECTIONS.ALERTS).add({
          userId: log.userId,
          memberId: log.memberId || null,
          type: 'medication',
          severity: 'low',
          message: `💊 Missed medication at ${log.scheduledTime}. Please take it as soon as possible.`,
          read: false,
          relatedRecordId: log.medId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`✓ Created missed medication alert`);
      }
    } catch (error) {
      console.error('✗ Error creating medication reminder:', error);
    }
  });

// ─── Scheduled Tasks ──────────────────────────────────────────────────────

/**
 * Delete old alerts (older than 90 days)
 * Schedule: every day at 2 AM UTC
 */
exports.cleanupOldAlerts = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const cutoffTime = admin.firestore.Timestamp.fromDate(ninetyDaysAgo);

      const query = db.collection(COLLECTIONS.ALERTS)
        .where('createdAt', '<', cutoffTime);

      const docs = await query.get();
      let deletedCount = 0;

      const batch = db.batch();
      docs.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCount++;
        if (deletedCount % BATCH_SIZE === 0) {
          batch.commit();
          return db.batch();
        }
      });

      if (deletedCount % BATCH_SIZE !== 0) {
        await batch.commit();
      }

      console.log(`✓ Deleted ${deletedCount} old alerts`);
      return { deletedCount };
    } catch (error) {
      console.error('✗ Error cleaning up old alerts:', error);
    }
  });

/**
 * Archive old timeline events (older than 6 months)
 * Schedule: every week on Sunday at 3 AM UTC
 */
exports.archiveOldTimeline = functions.pubsub
  .schedule('0 3 * * 0')
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const cutoffTime = admin.firestore.Timestamp.fromDate(sixMonthsAgo);

      const query = db.collection(COLLECTIONS.TIMELINE)
        .where('createdAt', '<', cutoffTime);

      const docs = await query.get();
      let processedCount = 0;

      console.log(`✓ Identified ${docs.size} old timeline events for archival`);
      // Actual archival to Cloud Storage could be implemented here
      return { processedCount: docs.size };
    } catch (error) {
      console.error('✗ Error archiving timeline:', error);
    }
  });

// ─── HTTP Callable Functions ──────────────────────────────────────────────

/**
 * Manual user data deletion endpoint
 * Called with: { uid: "user_id" }
 */
exports.manualDeleteUserData = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    // Prevent users from deleting other users' data
    const { uid } = data;
    if (uid !== context.auth.uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Cannot delete another user\'s data'
      );
    }

    console.log(`Manual deletion requested for user ${uid}`);

    // Delete from all collections
    const collectionsList = Object.values(COLLECTIONS).filter(c => c !== COLLECTIONS.USERS);
    for (const collectionName of collectionsList) {
      await deleteUserCollectionData(collectionName, uid);
    }

    // Delete user document
    await db.collection(COLLECTIONS.USERS).doc(uid).delete();

    return {
      success: true,
      message: `Successfully deleted all data for user ${uid}`,
    };
  } catch (error) {
    console.error('✗ Error in manualDeleteUserData:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Get user statistics
 * Returns: { healthRecords, symptoms, medications, alerts }
 */
exports.getUserStatistics = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    const uid = context.auth.uid;

    const stats = await Promise.all([
      countDocuments(COLLECTIONS.HEALTH_RECORDS, uid),
      countDocuments(COLLECTIONS.SYMPTOMS, uid),
      countDocuments(COLLECTIONS.MEDICATIONS, uid),
      countDocuments(COLLECTIONS.ALERTS, uid),
    ]);

    return {
      healthRecords: stats[0],
      symptoms: stats[1],
      medications: stats[2],
      alerts: stats[3],
    };
  } catch (error) {
    console.error('✗ Error in getUserStatistics:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ─── Helper Functions ───────────────────────────────────────────────────

/**
 * Delete all documents in a collection for a user
 */
async function deleteUserCollectionData(collectionName, userId) {
  const query = db.collection(collectionName).where('userId', '==', userId);
  const docs = await query.get();

  let deletedCount = 0;
  let batch = db.batch();

  docs.forEach((doc) => {
    batch.delete(doc.ref);
    deletedCount++;

    if (deletedCount % BATCH_SIZE === 0) {
      batch.commit();
      batch = db.batch();
    }
  });

  if (deletedCount % BATCH_SIZE !== 0) {
    await batch.commit();
  }

  console.log(`✓ Deleted ${deletedCount} documents from ${collectionName}`);
  return deletedCount;
}

/**
 * Count documents for a user in a collection
 */
async function countDocuments(collectionName, userId) {
  const query = db.collection(collectionName).where('userId', '==', userId);
  const docs = await query.get();
  return docs.size;
}

module.exports = {
  // Auth triggers
  createUserOnAuth: exports.createUserOnAuth,
  deleteUserOnAuthDelete: exports.deleteUserOnAuthDelete,

  // Firestore triggers
  createTimelineOnHealthRecord: exports.createTimelineOnHealthRecord,
  createAlertOnHighRisk: exports.createAlertOnHighRisk,
  createTimelineOnSymptom: exports.createTimelineOnSymptom,
  createAlertOnConcerningSyntoms: exports.createAlertOnConcerningSyntoms,
  createTimelineOnLabResult: exports.createTimelineOnLabResult,
  createMedicationReminders: exports.createMedicationReminders,

  // Scheduled tasks
  cleanupOldAlerts: exports.cleanupOldAlerts,
  archiveOldTimeline: exports.archiveOldTimeline,

  // HTTP functions
  manualDeleteUserData: exports.manualDeleteUserData,
  getUserStatistics: exports.getUserStatistics,
};
