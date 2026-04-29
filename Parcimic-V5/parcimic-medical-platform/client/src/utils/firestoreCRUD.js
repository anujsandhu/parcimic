/**
 * Firestore CRUD Operations
 * 
 * Helper functions for Create, Read, Update, Delete operations with:
 * - Automatic userId injection
 * - Server timestamp handling
 * - Batch operations
 * - Error handling
 * - Data validation
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  serverTimestamp,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS, LIMITS } from './firestoreSchema';
import { validateDocument, ValidationResult } from './firestoreValidation';

// ─── Error Handling ──────────────────────────────────────────────────────

class FirestoreError extends Error {
  constructor(code, message, originalError = null) {
    super(message);
    this.code = code;
    this.originalError = originalError;
  }

  static fromFirebase(error) {
    return new FirestoreError(error.code, error.message, error);
  }

  static validation(errors) {
    return new FirestoreError('validation-error', errors.join('; '));
  }
}

// ─── Generic CRUD Operations ───────────────────────────────────────────────

/**
 * Create a new document with auto-generated ID
 */
export const createDocument = async (collectionName, data, userId = null) => {
  try {
    // Inject userId if provided
    const docData = { ...data };
    if (userId) docData.userId = userId;

    // Add timestamps
    docData.createdAt = serverTimestamp();
    if (!docData.updatedAt) {
      docData.updatedAt = serverTimestamp();
    }

    // Validate
    const validation = validateDocument(collectionName, docData);
    if (!validation.valid) {
      throw FirestoreError.validation(validation.errors);
    }

    // Create with auto ID
    const colRef = collection(db, collectionName);
    const newDocRef = doc(colRef);
    await setDoc(newDocRef, docData);

    return {
      id: newDocRef.id,
      ...docData,
    };
  } catch (error) {
    if (error instanceof FirestoreError) throw error;
    throw FirestoreError.fromFirebase(error);
  }
};

/**
 * Create document with specific ID
 */
export const createDocumentWithId = async (collectionName, docId, data, userId = null) => {
  try {
    const docData = { ...data };
    if (userId) docData.userId = userId;

    docData.createdAt = serverTimestamp();
    if (!docData.updatedAt) {
      docData.updatedAt = serverTimestamp();
    }

    const validation = validateDocument(collectionName, docData);
    if (!validation.valid) {
      throw FirestoreError.validation(validation.errors);
    }

    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, docData);

    return {
      id: docId,
      ...docData,
    };
  } catch (error) {
    if (error instanceof FirestoreError) throw error;
    throw FirestoreError.fromFirebase(error);
  }
};

/**
 * Read single document
 */
export const getDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    };
  } catch (error) {
    throw FirestoreError.fromFirebase(error);
  }
};

/**
 * Read multiple documents with query filters
 */
export const queryDocuments = async (collectionName, conditions = [], orderByField = null, limitCount = LIMITS.QUERY_LIMIT_DEFAULT) => {
  try {
    const colRef = collection(db, collectionName);
    const queryConditions = [];

    // Add where conditions
    conditions.forEach(({ field, operator, value }) => {
      queryConditions.push(where(field, operator, value));
    });

    // Add order by
    if (orderByField) {
      const { field, direction = 'desc' } = orderByField;
      queryConditions.push(orderBy(field, direction));
    }

    // Add limit
    queryConditions.push(limit(limitCount));

    const q = query(colRef, ...queryConditions);
    const querySnap = await getDocs(q);

    return querySnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    throw FirestoreError.fromFirebase(error);
  }
};

/**
 * Read user's documents in a collection
 */
export const getUserDocuments = async (collectionName, userId, orderByField = null, limitCount = LIMITS.QUERY_LIMIT_DEFAULT) => {
  return queryDocuments(
    collectionName,
    [{ field: 'userId', operator: '==', value: userId }],
    orderByField || { field: 'createdAt', direction: 'desc' },
    limitCount
  );
};

/**
 * Read family member's documents
 */
export const getFamilyMemberDocuments = async (collectionName, userId, memberId, orderByField = null, limitCount = LIMITS.QUERY_LIMIT_DEFAULT) => {
  return queryDocuments(
    collectionName,
    [
      { field: 'userId', operator: '==', value: userId },
      { field: 'memberId', operator: '==', value: memberId },
    ],
    orderByField || { field: 'createdAt', direction: 'desc' },
    limitCount
  );
};

/**
 * Update document
 */
export const updateDocument = async (collectionName, docId, updates) => {
  try {
    const updates_with_timestamp = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, updates_with_timestamp);

    // Return updated doc
    return getDocument(collectionName, docId);
  } catch (error) {
    throw FirestoreError.fromFirebase(error);
  }
};

/**
 * Delete document
 */
export const deleteDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    throw FirestoreError.fromFirebase(error);
  }
};

// ─── Batch Operations ────────────────────────────────────────────────────

/**
 * Batch create documents
 */
export const batchCreateDocuments = async (collectionName, dataArray, userId = null) => {
  try {
    if (dataArray.length > LIMITS.MAX_BATCH_WRITES) {
      throw new FirestoreError(
        'batch-too-large',
        `Batch size ${dataArray.length} exceeds max ${LIMITS.MAX_BATCH_WRITES}`
      );
    }

    const batch = writeBatch(db);
    const createdDocs = [];

    dataArray.forEach((data) => {
      const docData = { ...data };
      if (userId) docData.userId = userId;

      docData.createdAt = serverTimestamp();
      if (!docData.updatedAt) {
        docData.updatedAt = serverTimestamp();
      }

      const docRef = doc(collection(db, collectionName));
      batch.set(docRef, docData);
      createdDocs.push({ id: docRef.id, ...docData });
    });

    await batch.commit();
    return createdDocs;
  } catch (error) {
    if (error instanceof FirestoreError) throw error;
    throw FirestoreError.fromFirebase(error);
  }
};

/**
 * Batch update documents
 */
export const batchUpdateDocuments = async (collectionName, updates) => {
  try {
    if (updates.length > LIMITS.MAX_BATCH_WRITES) {
      throw new FirestoreError(
        'batch-too-large',
        `Batch size ${updates.length} exceeds max ${LIMITS.MAX_BATCH_WRITES}`
      );
    }

    const batch = writeBatch(db);

    updates.forEach(({ docId, data }) => {
      const docRef = doc(db, collectionName, docId);
      batch.update(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
    return true;
  } catch (error) {
    throw FirestoreError.fromFirebase(error);
  }
};

/**
 * Batch delete documents
 */
export const batchDeleteDocuments = async (collectionName, docIds) => {
  try {
    if (docIds.length > LIMITS.MAX_BATCH_WRITES) {
      throw new FirestoreError(
        'batch-too-large',
        `Batch size ${docIds.length} exceeds max ${LIMITS.MAX_BATCH_WRITES}`
      );
    }

    const batch = writeBatch(db);

    docIds.forEach((docId) => {
      const docRef = doc(db, collectionName, docId);
      batch.delete(docRef);
    });

    await batch.commit();
    return true;
  } catch (error) {
    throw FirestoreError.fromFirebase(error);
  }
};

// ─── Transaction Operations ────────────────────────────────────────────────

/**
 * Execute a transaction
 */
export const executeTransaction = async (transactionFunc) => {
  try {
    const result = await runTransaction(db, transactionFunc);
    return result;
  } catch (error) {
    throw FirestoreError.fromFirebase(error);
  }
};

// ─── Collection-Specific Helpers ───────────────────────────────────────────

// Profile Operations
export const createProfile = (userId, profileData) =>
  createDocumentWithId(COLLECTIONS.PROFILES, userId, profileData, userId);

export const getProfile = (userId) =>
  getDocument(COLLECTIONS.PROFILES, userId);

export const updateProfile = (userId, updates) =>
  updateDocument(COLLECTIONS.PROFILES, userId, updates);

// Health Record Operations
export const createHealthRecord = (userId, recordData) =>
  createDocument(COLLECTIONS.HEALTH_RECORDS, recordData, userId);

export const getUserHealthRecords = (userId, limit = 50) =>
  getUserDocuments(COLLECTIONS.HEALTH_RECORDS, userId, { field: 'createdAt', direction: 'desc' }, limit);

export const getFamilyMemberHealthRecords = (userId, memberId, limit = 50) =>
  getFamilyMemberDocuments(COLLECTIONS.HEALTH_RECORDS, userId, memberId, { field: 'createdAt', direction: 'desc' }, limit);

// Symptom Operations
export const createSymptom = (userId, symptomData) =>
  createDocument(COLLECTIONS.SYMPTOMS, symptomData, userId);

export const getUserSymptoms = (userId, limit = 30) =>
  getUserDocuments(COLLECTIONS.SYMPTOMS, userId, { field: 'createdAt', direction: 'desc' }, limit);

export const getTodaySymptom = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    const results = await queryDocuments(
      COLLECTIONS.SYMPTOMS,
      [
        { field: 'userId', operator: '==', value: userId },
        { field: 'createdAt', operator: '>=', value: Timestamp.fromDate(today) },
        { field: 'createdAt', operator: '<', value: Timestamp.fromDate(tomorrow) },
      ],
      { field: 'createdAt', direction: 'desc' },
      1
    );
    return results[0] || null;
  } catch (error) {
    throw error;
  }
};

// Medication Operations
export const createMedication = (userId, medData) =>
  createDocument(COLLECTIONS.MEDICATIONS, medData, userId);

export const getUserMedications = (userId, limit = 20) =>
  getUserDocuments(COLLECTIONS.MEDICATIONS, userId, { field: 'createdAt', direction: 'desc' }, limit);

// Medication Log Operations
export const createMedicationLog = (userId, logData) =>
  createDocument(COLLECTIONS.MEDICATION_LOGS, logData, userId);

export const getMedicationAdherence = (userId, medId, days = 30) =>
  queryDocuments(
    COLLECTIONS.MEDICATION_LOGS,
    [
      { field: 'userId', operator: '==', value: userId },
      { field: 'medId', operator: '==', value: medId },
      { field: 'loggedAt', operator: '>=', value: Timestamp.fromDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000)) },
    ],
    { field: 'loggedAt', direction: 'desc' },
    1000
  );

// Alert Operations
export const getUserAlerts = (userId, unreadOnly = false, limit = 50) => {
  const conditions = [{ field: 'userId', operator: '==', value: userId }];
  if (unreadOnly) {
    conditions.push({ field: 'read', operator: '==', value: false });
  }
  return queryDocuments(
    COLLECTIONS.ALERTS,
    conditions,
    { field: 'createdAt', direction: 'desc' },
    limit
  );
};

export const markAlertAsRead = (alertId) =>
  updateDocument(COLLECTIONS.ALERTS, alertId, { read: true });

// Timeline Operations
export const getUserTimeline = (userId, limit = 100) =>
  getUserDocuments(COLLECTIONS.TIMELINE, userId, { field: 'createdAt', direction: 'desc' }, limit);

export const getTimelineByType = (userId, type, limit = 50) =>
  queryDocuments(
    COLLECTIONS.TIMELINE,
    [
      { field: 'userId', operator: '==', value: userId },
      { field: 'type', operator: '==', value: type },
    ],
    { field: 'createdAt', direction: 'desc' },
    limit
  );

// Lab Results Operations
export const createLabResult = (userId, labData) =>
  createDocument(COLLECTIONS.LAB_RESULTS, labData, userId);

export const getUserLabResults = (userId, limit = 20) =>
  getUserDocuments(COLLECTIONS.LAB_RESULTS, userId, { field: 'createdAt', direction: 'desc' }, limit);

// Family Member Operations
export const createFamilyMember = (userId, memberData) =>
  createDocument(COLLECTIONS.FAMILY_MEMBERS, memberData, userId);

export const getUserFamilyMembers = (userId, limit = 10) =>
  getUserDocuments(COLLECTIONS.FAMILY_MEMBERS, userId, { field: 'createdAt', direction: 'desc' }, limit);

// Location Operations
export const createLocation = (userId, locationData) =>
  createDocument(COLLECTIONS.LOCATIONS, locationData, userId);

export const getUserLocationHistory = (userId, limit = 100) =>
  getUserDocuments(COLLECTIONS.LOCATIONS, userId, { field: 'createdAt', direction: 'desc' }, limit);

// ─── Batch Timeline Creation ────────────────────────────────────────────────

/**
 * Create health record + timeline event + alerts in batch
 */
export const createHealthCheckWithTimeline = async (userId, healthRecordData, timelineData, alertsData = []) => {
  try {
    return await executeTransaction(async (transaction) => {
      // Create health record
      const healthRecordRef = doc(collection(db, COLLECTIONS.HEALTH_RECORDS));
      const healthRecordWithTs = {
        ...healthRecordData,
        userId,
        createdAt: serverTimestamp(),
      };
      transaction.set(healthRecordRef, healthRecordWithTs);

      // Create timeline event
      const timelineRef = doc(collection(db, COLLECTIONS.TIMELINE));
      const timelineWithTs = {
        ...timelineData,
        userId,
        refId: healthRecordRef.id,
        createdAt: serverTimestamp(),
      };
      transaction.set(timelineRef, timelineWithTs);

      // Create alerts if any
      alertsData.forEach((alertData) => {
        const alertRef = doc(collection(db, COLLECTIONS.ALERTS));
        const alertWithTs = {
          ...alertData,
          userId,
          createdAt: serverTimestamp(),
          read: false,
        };
        transaction.set(alertRef, alertWithTs);
      });

      return {
        healthRecordId: healthRecordRef.id,
        timelineId: timelineRef.id,
        alertIds: [], // Would need more complex logic to capture
      };
    });
  } catch (error) {
    throw error;
  }
};

// ─── Cleanup Operations ────────────────────────────────────────────────────

/**
 * Delete all user data
 * Note: This should typically be called by a Cloud Function
 */
export const deleteAllUserData = async (userId) => {
  try {
    const collections = Object.values(COLLECTIONS);
    
    for (const collectionName of collections) {
      if (collectionName === COLLECTIONS.USERS) continue; // Skip users, should be handled by Firebase Auth trigger
      
      const docs = await getUserDocuments(collectionName, userId, null, LIMITS.MAX_BATCH_WRITES);
      if (docs.length > 0) {
        await batchDeleteDocuments(collectionName, docs.map(d => d.id));
      }
    }
    
    return true;
  } catch (error) {
    throw error;
  }
};

export { FirestoreError, ValidationResult };
