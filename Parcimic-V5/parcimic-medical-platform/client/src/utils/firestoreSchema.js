/**
 * Firestore Schema Constants & Type Definitions
 * 
 * Provides TypeScript-like definitions, constants, and enums for all Firestore collections.
 * Use these throughout the app to maintain consistency and enable IDE autocomplete.
 */

// ─── Collection Names ─────────────────────────────────────────────────────
export const COLLECTIONS = {
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

// ─── Field Constants ──────────────────────────────────────────────────────
export const FIELDS = {
  USER_ID: 'userId',
  MEMBER_ID: 'memberId',
  EMAIL: 'email',
  PROVIDER: 'provider',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  READ: 'read',
};

// ─── Enums ───────────────────────────────────────────────────────────────
export const ENUMS = {
  PROVIDER: {
    GOOGLE: 'google',
    EMAIL: 'email',
  },
  
  HEALTH_MODE: {
    VITALS: 'vitals',
    SYMPTOMS: 'symptoms',
    HYBRID: 'hybrid',
  },
  
  RISK_LEVEL: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CONCERN: 'concern',
  },
  
  FREQUENCY: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    AS_NEEDED: 'as-needed',
  },
  
  ALERT_TYPE: {
    RISK: 'risk',
    SYMPTOM: 'symptom',
    MEDICATION: 'medication',
  },
  
  ALERT_SEVERITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
  },
  
  MED_LOG_STATUS: {
    TAKEN: 'taken',
    MISSED: 'missed',
    SKIPPED: 'skipped',
  },
  
  TIMELINE_TYPE: {
    RISK: 'risk',
    SYMPTOM: 'symptom',
    LAB: 'lab',
    MEDICATION: 'medication',
    ALERT: 'alert',
  },
  
  LOCATION_SOURCE: {
    GPS: 'gps',
    IP: 'ip',
    MANUAL: 'manual',
  },
  
  GENDER: {
    MALE: 'M',
    FEMALE: 'F',
    OTHER: 'Other',
  },
  
  RELATION: {
    MOTHER: 'mother',
    FATHER: 'father',
    SPOUSE: 'spouse',
    CHILD: 'child',
    SIBLING: 'sibling',
    GRANDPARENT: 'grandparent',
    FRIEND: 'friend',
    OTHER: 'other',
  },
};

// ─── Type Definitions ────────────────────────────────────────────────────

/**
 * @typedef {Object} User
 * @property {string} email
 * @property {string} provider - 'google' | 'email'
 * @property {Timestamp} createdAt
 */

/**
 * @typedef {Object} Profile
 * @property {string} userId
 * @property {string} fullName
 * @property {string} [phone]
 * @property {string} [dateOfBirth] - ISO format
 * @property {string} [gender] - 'M' | 'F' | 'Other'
 * @property {string} [bloodGroup] - 'A+', 'B-', 'O+', 'AB-'
 * @property {string} [address]
 * @property {Object} [emergencyContact]
 * @property {string} emergencyContact.name
 * @property {string} emergencyContact.phone
 * @property {Object} [location]
 * @property {number} location.lat
 * @property {number} location.lng
 * @property {string} [location.city]
 * @property {Timestamp} location.updatedAt
 * @property {Timestamp} createdAt
 * @property {Timestamp} updatedAt
 */

/**
 * @typedef {Object} FamilyMember
 * @property {string} userId - Owner ID
 * @property {string} name
 * @property {string} relation
 * @property {number} [age]
 * @property {string} [gender]
 * @property {string[]} [conditions]
 * @property {string} [notes]
 * @property {Timestamp} createdAt
 * @property {Timestamp} updatedAt
 */

/**
 * @typedef {Object} HealthRecord
 * @property {string} userId
 * @property {string} [memberId]
 * @property {string} mode - 'vitals' | 'symptoms' | 'hybrid'
 * @property {Object} inputData
 * @property {number} [inputData.heartRate]
 * @property {number} [inputData.temperature]
 * @property {number} [inputData.respiratoryRate]
 * @property {number} [inputData.oxygenSaturation]
 * @property {number} [inputData.bloodPressureSys]
 * @property {number} [inputData.bloodPressureDia]
 * @property {number} [inputData.wbc]
 * @property {number} [inputData.lactate]
 * @property {string[]} symptoms
 * @property {number} [riskScore] - 0-100
 * @property {string} riskLevel - 'low' | 'medium' | 'high' | 'concern'
 * @property {string} explanation - AI recommendation
 * @property {Timestamp} createdAt
 */

/**
 * @typedef {Object} Symptom
 * @property {string} userId
 * @property {string} [memberId]
 * @property {boolean} fever
 * @property {boolean} cough
 * @property {boolean} fatigue
 * @property {boolean} breathingDifficulty
 * @property {boolean} confusion
 * @property {string} [notes]
 * @property {Timestamp} createdAt
 */

/**
 * @typedef {Object} LabResult
 * @property {string} userId
 * @property {string} [memberId]
 * @property {string} testName
 * @property {Object} values - key-value pairs
 * @property {string} [reportUrl]
 * @property {Timestamp} takenAt
 * @property {Timestamp} createdAt
 */

/**
 * @typedef {Object} Medication
 * @property {string} userId
 * @property {string} [memberId]
 * @property {string} name
 * @property {string} dosage
 * @property {Object} schedule
 * @property {string[]} schedule.times - ['08:00', '20:00']
 * @property {string} schedule.frequency - 'daily' | 'weekly' | 'as-needed'
 * @property {string} startDate - ISO format
 * @property {string} [endDate] - ISO format
 * @property {boolean} reminderEnabled
 * @property {Timestamp} createdAt
 * @property {Timestamp} updatedAt
 */

/**
 * @typedef {Object} MedicationLog
 * @property {string} userId
 * @property {string} [memberId]
 * @property {string} medId
 * @property {string} scheduledTime - '08:00'
 * @property {string} status - 'taken' | 'missed' | 'skipped'
 * @property {Timestamp} loggedAt
 */

/**
 * @typedef {Object} Alert
 * @property {string} userId
 * @property {string} [memberId]
 * @property {string} type - 'risk' | 'symptom' | 'medication'
 * @property {string} severity - 'low' | 'medium' | 'high'
 * @property {string} message
 * @property {boolean} read
 * @property {string} [relatedRecordId]
 * @property {Timestamp} createdAt
 */

/**
 * @typedef {Object} TimelineEvent
 * @property {string} userId
 * @property {string} [memberId]
 * @property {string} type - 'risk' | 'symptom' | 'lab' | 'medication' | 'alert'
 * @property {string} refId - Reference to source doc
 * @property {string} summary
 * @property {Timestamp} createdAt
 */

/**
 * @typedef {Object} Location
 * @property {string} userId
 * @property {number} lat
 * @property {number} lng
 * @property {string} source - 'gps' | 'ip' | 'manual'
 * @property {Timestamp} createdAt
 */

// ─── Default Values ──────────────────────────────────────────────────────
export const DEFAULTS = {
  PROFILE: {
    gender: null,
    bloodGroup: null,
    phone: null,
    address: null,
    emergencyContact: null,
    location: null,
  },
  
  SYMPTOM: {
    fever: false,
    cough: false,
    fatigue: false,
    breathingDifficulty: false,
    confusion: false,
    notes: null,
  },
  
  MEDICATION: {
    reminderEnabled: true,
    endDate: null,
  },
};

// ─── Risk Score Ranges ───────────────────────────────────────────────────
export const RISK_RANGES = {
  LOW: { min: 0, max: 34 },
  MEDIUM: { min: 35, max: 64 },
  HIGH: { min: 65, max: 100 },
};

// ─── Vital Signs Ranges (Normal) ───────────────────────────────────────
export const VITAL_RANGES = {
  heartRate: { min: 60, max: 100, unit: 'bpm' },
  temperature: { min: 36.5, max: 37.5, unit: '°C' },
  respiratoryRate: { min: 12, max: 20, unit: '/min' },
  oxygenSaturation: { min: 95, max: 100, unit: '%' },
  bloodPressureSys: { min: 100, max: 140, unit: 'mmHg' },
  bloodPressureDia: { min: 60, max: 90, unit: 'mmHg' },
};

// ─── Collection Indexing Info ────────────────────────────────────────────
export const INDEXES = {
  HEALTH_RECORDS: [
    { fields: ['userId', 'createdAt'] },
    { fields: ['userId', 'memberId', 'createdAt'] },
  ],
  SYMPTOMS: [
    { fields: ['userId', 'createdAt'] },
    { fields: ['userId', 'memberId', 'createdAt'] },
  ],
  MEDICATIONS: [
    { fields: ['userId', 'createdAt'] },
    { fields: ['userId', 'memberId', 'createdAt'] },
  ],
  ALERTS: [
    { fields: ['userId', 'read', 'createdAt'] },
    { fields: ['userId', 'createdAt'] },
  ],
  MEDICATION_LOGS: [
    { fields: ['userId', 'medId', 'loggedAt'] },
  ],
  TIMELINE: [
    { fields: ['userId', 'createdAt'] },
    { fields: ['userId', 'type', 'createdAt'] },
  ],
};

// ─── Document Size Limits ────────────────────────────────────────────────
export const LIMITS = {
  MAX_DOC_SIZE_KB: 1024, // 1 MB
  MAX_BATCH_WRITES: 500,
  MAX_TRANSACTION_WRITES: 25,
  QUERY_LIMIT_DEFAULT: 25,
  QUERY_LIMIT_MAX: 1000,
};

// ─── Time Periods ───────────────────────────────────────────────────────
export const TIME_PERIODS = {
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
  ONE_MONTH: 30 * 24 * 60 * 60 * 1000,
  ONE_YEAR: 365 * 24 * 60 * 60 * 1000,
};

// ─── Export all for convenience ──────────────────────────────────────────
export default {
  COLLECTIONS,
  FIELDS,
  ENUMS,
  DEFAULTS,
  RISK_RANGES,
  VITAL_RANGES,
  INDEXES,
  LIMITS,
  TIME_PERIODS,
};
