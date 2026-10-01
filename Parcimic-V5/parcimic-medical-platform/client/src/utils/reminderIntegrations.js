/**
 * Medication Reminder Integrations
 * Supports: Web Notifications, Apple Reminders (via .ics), Google Tasks (via Calendar), and downloadable reminders
 */

// Request notification permission
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return { granted: false, error: 'Notifications not supported' };
  }

  if (Notification.permission === 'granted') {
    return { granted: true };
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return { granted: permission === 'granted' };
  }

  return { granted: false, error: 'Notifications denied' };
}

// Schedule web notification
export function scheduleWebNotification(medication) {
  if (Notification.permission !== 'granted') return;

  const [hours, minutes] = medication.time.split(':');
  const now = new Date();
  const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);

  // If time has passed today, schedule for tomorrow
  if (scheduledTime < now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const timeUntilNotification = scheduledTime - now;

  setTimeout(() => {
    new Notification('💊 Medication Reminder', {
      body: `Time to take ${medication.name} (${medication.dosage})`,
      icon: '/assets/logos/parcimic-logo.png',
      badge: '/assets/logos/parcimic-logo.png',
      tag: `med-${medication.id}`,
      requireInteraction: true,
      vibrate: [200, 100, 200],
    });
  }, timeUntilNotification);

  return scheduledTime;
}

// Generate .ics file for Apple Reminders / Calendar
export function generateICSFile(medication) {
  const [hours, minutes] = medication.time.split(':');
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
  
  // Format date for ICS (YYYYMMDDTHHMMSS)
  const formatICSDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  // Calculate recurrence rule based on frequency
  const getRecurrenceRule = (frequency) => {
    switch (frequency) {
      case 'Once daily':
        return 'FREQ=DAILY;INTERVAL=1';
      case 'Twice daily':
        return 'FREQ=DAILY;INTERVAL=1;COUNT=2';
      case 'Three times daily':
        return 'FREQ=DAILY;INTERVAL=1;COUNT=3';
      case 'Every 4 hours':
        return 'FREQ=HOURLY;INTERVAL=4';
      case 'As needed':
        return ''; // No recurrence for as-needed
      default:
        return 'FREQ=DAILY;INTERVAL=1';
    }
  };

  const rrule = getRecurrenceRule(medication.frequency);
  const endDate = new Date(startDate.getTime() + 15 * 60000); // 15 minutes duration

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Parcimic//Medication Reminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Medication Reminders',
    'X-WR-TIMEZONE:UTC',
    'BEGIN:VTODO',
    `UID:med-${medication.id}-${Date.now()}@parcimic.app`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DUE:${formatICSDate(endDate)}`,
    `SUMMARY:💊 Take ${medication.name}`,
    `DESCRIPTION:Medication: ${medication.name}\\nDosage: ${medication.dosage}\\nFrequency: ${medication.frequency}\\n\\nReminder from Parcimic Health Assistant`,
    `PRIORITY:1`,
    `STATUS:NEEDS-ACTION`,
    rrule ? `RRULE:${rrule}` : '',
    'BEGIN:VALARM',
    'TRIGGER:-PT0M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Time to take ${medication.name} (${medication.dosage})`,
    'END:VALARM',
    'END:VTODO',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  return icsContent;
}

// Download .ics file
export function downloadICSFile(medication) {
  const icsContent = generateICSFile(medication);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${medication.name.replace(/\s+/g, '-')}-reminder.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Generate Google Calendar URL
export function generateGoogleCalendarURL(medication) {
  const [hours, minutes] = medication.time.split(':');
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
  const endDate = new Date(startDate.getTime() + 15 * 60000); // 15 minutes

  // Format: YYYYMMDDTHHmmss
  const formatGoogleDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `💊 Take ${medication.name}`,
    details: `Medication: ${medication.name}\nDosage: ${medication.dosage}\nFrequency: ${medication.frequency}\n\nReminder from Parcimic Health Assistant`,
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
    recur: medication.frequency === 'Once daily' ? 'RRULE:FREQ=DAILY' : '',
    reminder: '0', // Remind at event time
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Open Google Calendar with reminder
export function openGoogleCalendar(medication) {
  const url = generateGoogleCalendarURL(medication);
  window.open(url, '_blank', 'noopener,noreferrer');
}

// Generate Google Tasks URL (opens Google Tasks)
export function openGoogleTasks(medication) {
  // Google Tasks doesn't have a direct URL API, but we can open the tasks page
  // Users will need to manually create the task
  const taskText = encodeURIComponent(`Take ${medication.name} (${medication.dosage}) at ${medication.time}`);
  window.open('https://tasks.google.com/embed/', '_blank', 'noopener,noreferrer');
  
  // Copy task details to clipboard for easy pasting
  const taskDetails = `Take ${medication.name}\nDosage: ${medication.dosage}\nTime: ${medication.time}\nFrequency: ${medication.frequency}`;
  navigator.clipboard.writeText(taskDetails).catch(() => {});
  
  return taskDetails;
}

// Generate reminder text for manual setup
export function generateReminderText(medication) {
  return `💊 Medication Reminder

Medication: ${medication.name}
Dosage: ${medication.dosage}
Time: ${medication.time}
Frequency: ${medication.frequency}

Set a daily reminder at ${medication.time} to take this medication.`;
}

// Copy reminder text to clipboard
export function copyReminderToClipboard(medication) {
  const text = generateReminderText(medication);
  return navigator.clipboard.writeText(text);
}

// Check if running on iOS (for Apple Reminders)
export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// Check if running on macOS (for Apple Reminders)
export function isMacOS() {
  return /Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.userAgent);
}

// Check if Apple Reminders is available
export function isAppleDevice() {
  return isIOS() || isMacOS();
}

// Setup all reminders for a medication
export async function setupAllReminders(medication) {
  const results = {
    webNotification: false,
    icsDownloaded: false,
    googleCalendar: false,
  };

  // 1. Request web notification permission
  const notifResult = await requestNotificationPermission();
  if (notifResult.granted) {
    scheduleWebNotification(medication);
    results.webNotification = true;
  }

  // 2. Download ICS file for Apple Reminders
  try {
    downloadICSFile(medication);
    results.icsDownloaded = true;
  } catch (error) {
    console.error('Failed to download ICS:', error);
  }

  return results;
}

// Get reminder setup instructions based on device
export function getReminderInstructions() {
  if (isIOS()) {
    return {
      platform: 'iOS',
      steps: [
        'Tap "Add to Apple Reminders" to download the reminder file',
        'Open the downloaded .ics file',
        'Tap "Add" to import into Reminders app',
        'The reminder will repeat based on your medication frequency',
      ],
    };
  }

  if (isMacOS()) {
    return {
      platform: 'macOS',
      steps: [
        'Click "Add to Apple Reminders" to download the reminder file',
        'Open the downloaded .ics file',
        'It will automatically open in Reminders or Calendar app',
        'Click "OK" to add the reminder',
      ],
    };
  }

  return {
    platform: 'Web',
    steps: [
      'Click "Add to Google Calendar" to create a calendar event',
      'Or download the .ics file to import into any calendar app',
      'Enable browser notifications for instant reminders',
      'Set up reminders in your preferred calendar app',
    ],
  };
}
