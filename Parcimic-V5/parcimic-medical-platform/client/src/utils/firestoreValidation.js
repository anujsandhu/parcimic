/**
 * Firestore Data Validation
 * 
 * Validates data before writing to Firestore to ensure:
 * - Required fields present
 * - Data types correct
 * - Values within acceptable ranges
 * - Business logic constraints met
 */

import { ENUMS, VITAL_RANGES, RISK_RANGES } from './firestoreSchema';

// ─── Validation Result ────────────────────────────────────────────────────
class ValidationResult {
  constructor(valid = true, errors = []) {
    this.valid = valid;
    this.errors = errors;
    this.message = valid ? 'Valid' : errors.join(', ');
  }

  addError(error) {
    this.valid = false;
    this.errors.push(error);
    return this;
  }

  static valid() {
    return new ValidationResult(true);
  }

  static invalid(...errors) {
    return new ValidationResult(false, errors);
  }
}

// ─── Common Validators ────────────────────────────────────────────────────

/**
 * Validate string field
 */
export const validateString = (value, fieldName, { min = 1, max = 255, required = true } = {}) => {
  if (required && (!value || typeof value !== 'string' || value.trim().length === 0)) {
    return ValidationResult.invalid(`${fieldName} is required`);
  }
  if (value && typeof value !== 'string') {
    return ValidationResult.invalid(`${fieldName} must be a string`);
  }
  if (value && (value.length < min || value.length > max)) {
    return ValidationResult.invalid(`${fieldName} must be between ${min} and ${max} characters`);
  }
  return ValidationResult.valid();
};

/**
 * Validate number field
 */
export const validateNumber = (value, fieldName, { min, max, required = true, integer = false } = {}) => {
  if (required && (value === undefined || value === null)) {
    return ValidationResult.invalid(`${fieldName} is required`);
  }
  if (value !== undefined && value !== null && typeof value !== 'number') {
    return ValidationResult.invalid(`${fieldName} must be a number`);
  }
  if (value !== undefined && value !== null && integer && !Number.isInteger(value)) {
    return ValidationResult.invalid(`${fieldName} must be an integer`);
  }
  if (value !== undefined && value !== null && (min !== undefined && value < min)) {
    return ValidationResult.invalid(`${fieldName} must be at least ${min}`);
  }
  if (value !== undefined && value !== null && (max !== undefined && value > max)) {
    return ValidationResult.invalid(`${fieldName} must be at most ${max}`);
  }
  return ValidationResult.valid();
};

/**
 * Validate boolean field
 */
export const validateBoolean = (value, fieldName, { required = true } = {}) => {
  if (required && typeof value !== 'boolean') {
    return ValidationResult.invalid(`${fieldName} is required and must be boolean`);
  }
  if (value !== undefined && value !== null && typeof value !== 'boolean') {
    return ValidationResult.invalid(`${fieldName} must be boolean`);
  }
  return ValidationResult.valid();
};

/**
 * Validate enum field
 */
export const validateEnum = (value, fieldName, allowedValues, { required = true } = {}) => {
  if (required && (!value || !allowedValues.includes(value))) {
    return ValidationResult.invalid(
      `${fieldName} is required and must be one of: ${allowedValues.join(', ')}`
    );
  }
  if (value && !allowedValues.includes(value)) {
    return ValidationResult.invalid(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`
    );
  }
  return ValidationResult.valid();
};

/**
 * Validate array field
 */
export const validateArray = (value, fieldName, { minItems = 1, maxItems, required = true } = {}) => {
  if (required && (!Array.isArray(value) || value.length === 0)) {
    return ValidationResult.invalid(`${fieldName} is required and must be non-empty array`);
  }
  if (value && !Array.isArray(value)) {
    return ValidationResult.invalid(`${fieldName} must be an array`);
  }
  if (value && value.length < minItems) {
    return ValidationResult.invalid(`${fieldName} must have at least ${minItems} items`);
  }
  if (value && maxItems !== undefined && value.length > maxItems) {
    return ValidationResult.invalid(`${fieldName} must have at most ${maxItems} items`);
  }
  return ValidationResult.valid();
};

/**
 * Validate ISO date string (YYYY-MM-DD)
 */
export const validateISODate = (value, fieldName, { required = true } = {}) => {
  if (required && !value) {
    return ValidationResult.invalid(`${fieldName} is required`);
  }
  if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return ValidationResult.invalid(`${fieldName} must be ISO date format (YYYY-MM-DD)`);
  }
  if (value) {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return ValidationResult.invalid(`${fieldName} is not a valid date`);
    }
  }
  return ValidationResult.valid();
};

/**
 * Validate time string (HH:MM in 24-hour format)
 */
export const validateTime = (value, fieldName, { required = true } = {}) => {
  if (required && !value) {
    return ValidationResult.invalid(`${fieldName} is required`);
  }
  if (value && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
    return ValidationResult.invalid(`${fieldName} must be time format (HH:MM)`);
  }
  return ValidationResult.valid();
};

/**
 * Validate email
 */
export const validateEmail = (value, fieldName = 'email', { required = true } = {}) => {
  if (required && !value) {
    return ValidationResult.invalid(`${fieldName} is required`);
  }
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return ValidationResult.invalid(`${fieldName} is not a valid email`);
  }
  return ValidationResult.valid();
};

/**
 * Validate phone number (basic)
 */
export const validatePhone = (value, fieldName = 'phone', { required = false } = {}) => {
  if (required && !value) {
    return ValidationResult.invalid(`${fieldName} is required`);
  }
  if (value && !/^[\d\s\-\+\(\)]{7,}$/.test(value)) {
    return ValidationResult.invalid(`${fieldName} is not a valid phone number`);
  }
  return ValidationResult.valid();
};

// ─── Collection-Specific Validators ───────────────────────────────────────

/**
 * Validate Profile document
 */
export const validateProfile = (data) => {
  const errors = [];

  // Required fields
  const userIdCheck = validateString(data.userId, 'userId', { min: 1 });
  if (!userIdCheck.valid) errors.push(...userIdCheck.errors);

  const nameCheck = validateString(data.fullName, 'fullName', { min: 2, max: 255 });
  if (!nameCheck.valid) errors.push(...nameCheck.errors);

  // Optional fields with validation
  if (data.phone) {
    const phoneCheck = validatePhone(data.phone);
    if (!phoneCheck.valid) errors.push(...phoneCheck.errors);
  }

  if (data.dateOfBirth) {
    const dobCheck = validateISODate(data.dateOfBirth, 'dateOfBirth', { required: false });
    if (!dobCheck.valid) errors.push(...dobCheck.errors);
  }

  if (data.gender) {
    const genderCheck = validateEnum(
      data.gender,
      'gender',
      Object.values(ENUMS.GENDER),
      { required: false }
    );
    if (!genderCheck.valid) errors.push(...genderCheck.errors);
  }

  if (data.emergencyContact) {
    const ecNameCheck = validateString(data.emergencyContact.name, 'emergencyContact.name');
    if (!ecNameCheck.valid) errors.push(...ecNameCheck.errors);

    const ecPhoneCheck = validatePhone(data.emergencyContact.phone, 'emergencyContact.phone');
    if (!ecPhoneCheck.valid) errors.push(...ecPhoneCheck.errors);
  }

  return errors.length === 0 ? ValidationResult.valid() : ValidationResult.invalid(...errors);
};

/**
 * Validate HealthRecord document
 */
export const validateHealthRecord = (data) => {
  const errors = [];

  // Required fields
  const userIdCheck = validateString(data.userId, 'userId');
  if (!userIdCheck.valid) errors.push(...userIdCheck.errors);

  const modeCheck = validateEnum(data.mode, 'mode', Object.values(ENUMS.HEALTH_MODE));
  if (!modeCheck.valid) errors.push(...modeCheck.errors);

  const riskLevelCheck = validateEnum(data.riskLevel, 'riskLevel', Object.values(ENUMS.RISK_LEVEL));
  if (!riskLevelCheck.valid) errors.push(...riskLevelCheck.errors);

  const explanationCheck = validateString(data.explanation, 'explanation', { max: 1000 });
  if (!explanationCheck.valid) errors.push(...explanationCheck.errors);

  // Validation based on mode
  if (data.mode === ENUMS.HEALTH_MODE.VITALS || data.mode === ENUMS.HEALTH_MODE.HYBRID) {
    // Must have sufficient vitals
    const vitalCount = [
      data.inputData?.heartRate,
      data.inputData?.temperature,
      data.inputData?.respiratoryRate,
      data.inputData?.oxygenSaturation,
      data.inputData?.bloodPressureSys,
      data.inputData?.bloodPressureDia,
    ].filter(v => v !== null && v !== undefined).length;

    if (vitalCount < 4) {
      errors.push('Vitals mode requires at least 4 vital signs');
    }

    // Validate vital ranges
    if (data.inputData?.heartRate !== undefined) {
      const range = VITAL_RANGES.heartRate;
      if (data.inputData.heartRate < range.min || data.inputData.heartRate > range.min + 200) {
        errors.push(`heartRate must be between ${range.min} and ${range.min + 200} bpm`);
      }
    }
  }

  if (data.mode === ENUMS.HEALTH_MODE.SYMPTOMS || data.mode === ENUMS.HEALTH_MODE.HYBRID) {
    // Must have sufficient symptoms
    const symptomsCheck = validateArray(data.symptoms, 'symptoms', { minItems: 2 });
    if (!symptomsCheck.valid) errors.push(...symptomsCheck.errors);
  }

  // Risk score if present
  if (data.riskScore !== undefined && data.riskScore !== null) {
    const scoreCheck = validateNumber(data.riskScore, 'riskScore', { min: 0, max: 100 });
    if (!scoreCheck.valid) errors.push(...scoreCheck.errors);
  }

  // Reject if only age provided
  if (data.mode === ENUMS.HEALTH_MODE.VITALS && Object.keys(data.inputData || {}).length < 2) {
    errors.push('Cannot create health record with only age data');
  }

  return errors.length === 0 ? ValidationResult.valid() : ValidationResult.invalid(...errors);
};

/**
 * Validate Symptom document
 */
export const validateSymptom = (data) => {
  const errors = [];

  const userIdCheck = validateString(data.userId, 'userId');
  if (!userIdCheck.valid) errors.push(...userIdCheck.errors);

  // At least one symptom should be true
  const hasAnySymptom = [
    data.fever,
    data.cough,
    data.fatigue,
    data.breathingDifficulty,
    data.confusion,
  ].some(s => s === true);

  if (!hasAnySymptom) {
    errors.push('At least one symptom must be marked as true');
  }

  return errors.length === 0 ? ValidationResult.valid() : ValidationResult.invalid(...errors);
};

/**
 * Validate Medication document
 */
export const validateMedication = (data) => {
  const errors = [];

  const userIdCheck = validateString(data.userId, 'userId');
  if (!userIdCheck.valid) errors.push(...userIdCheck.errors);

  const nameCheck = validateString(data.name, 'name');
  if (!nameCheck.valid) errors.push(...nameCheck.errors);

  const dosageCheck = validateString(data.dosage, 'dosage');
  if (!dosageCheck.valid) errors.push(...dosageCheck.errors);

  if (data.schedule) {
    const timesCheck = validateArray(data.schedule.times, 'schedule.times', { minItems: 1 });
    if (!timesCheck.valid) errors.push(...timesCheck.errors);

    // Validate each time
    if (Array.isArray(data.schedule.times)) {
      data.schedule.times.forEach((time, idx) => {
        const timeCheck = validateTime(time, `schedule.times[${idx}]`);
        if (!timeCheck.valid) errors.push(...timeCheck.errors);
      });
    }

    const freqCheck = validateEnum(
      data.schedule.frequency,
      'schedule.frequency',
      Object.values(ENUMS.FREQUENCY)
    );
    if (!freqCheck.valid) errors.push(...freqCheck.errors);
  }

  const startDateCheck = validateISODate(data.startDate, 'startDate');
  if (!startDateCheck.valid) errors.push(...startDateCheck.errors);

  if (data.endDate) {
    const endDateCheck = validateISODate(data.endDate, 'endDate', { required: false });
    if (!endDateCheck.valid) errors.push(...endDateCheck.errors);

    // End date must be after start date
    if (data.startDate && data.endDate && data.endDate <= data.startDate) {
      errors.push('endDate must be after startDate');
    }
  }

  return errors.length === 0 ? ValidationResult.valid() : ValidationResult.invalid(...errors);
};

/**
 * Validate MedicationLog document
 */
export const validateMedicationLog = (data) => {
  const errors = [];

  const userIdCheck = validateString(data.userId, 'userId');
  if (!userIdCheck.valid) errors.push(...userIdCheck.errors);

  const medIdCheck = validateString(data.medId, 'medId');
  if (!medIdCheck.valid) errors.push(...medIdCheck.errors);

  const timeCheck = validateTime(data.scheduledTime, 'scheduledTime');
  if (!timeCheck.valid) errors.push(...timeCheck.errors);

  const statusCheck = validateEnum(
    data.status,
    'status',
    Object.values(ENUMS.MED_LOG_STATUS)
  );
  if (!statusCheck.valid) errors.push(...statusCheck.errors);

  return errors.length === 0 ? ValidationResult.valid() : ValidationResult.invalid(...errors);
};

/**
 * Validate Alert document
 */
export const validateAlert = (data) => {
  const errors = [];

  const userIdCheck = validateString(data.userId, 'userId');
  if (!userIdCheck.valid) errors.push(...userIdCheck.errors);

  const typeCheck = validateEnum(data.type, 'type', Object.values(ENUMS.ALERT_TYPE));
  if (!typeCheck.valid) errors.push(...typeCheck.errors);

  const severityCheck = validateEnum(data.severity, 'severity', Object.values(ENUMS.ALERT_SEVERITY));
  if (!severityCheck.valid) errors.push(...severityCheck.errors);

  const messageCheck = validateString(data.message, 'message', { min: 5, max: 500 });
  if (!messageCheck.valid) errors.push(...messageCheck.errors);

  const readCheck = validateBoolean(data.read, 'read');
  if (!readCheck.valid) errors.push(...readCheck.errors);

  return errors.length === 0 ? ValidationResult.valid() : ValidationResult.invalid(...errors);
};

/**
 * Validate Location document
 */
export const validateLocation = (data) => {
  const errors = [];

  const userIdCheck = validateString(data.userId, 'userId');
  if (!userIdCheck.valid) errors.push(...userIdCheck.errors);

  const latCheck = validateNumber(data.lat, 'lat', { min: -90, max: 90 });
  if (!latCheck.valid) errors.push(...latCheck.errors);

  const lngCheck = validateNumber(data.lng, 'lng', { min: -180, max: 180 });
  if (!lngCheck.valid) errors.push(...lngCheck.errors);

  const sourceCheck = validateEnum(data.source, 'source', Object.values(ENUMS.LOCATION_SOURCE));
  if (!sourceCheck.valid) errors.push(...sourceCheck.errors);

  return errors.length === 0 ? ValidationResult.valid() : ValidationResult.invalid(...errors);
};

// ─── Master Validator ────────────────────────────────────────────────────

/**
 * Validate any collection document based on type
 */
export const validateDocument = (collectionName, data) => {
  const validators = {
    profiles: validateProfile,
    healthRecords: validateHealthRecord,
    symptoms: validateSymptom,
    medications: validateMedication,
    medicationLogs: validateMedicationLog,
    alerts: validateAlert,
    locations: validateLocation,
  };

  const validator = validators[collectionName];
  if (!validator) {
    return ValidationResult.invalid(`No validator for collection: ${collectionName}`);
  }

  return validator(data);
};

export { ValidationResult };
