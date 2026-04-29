// pdfExport.js
// Generate and download PDF health reports

/**
 * Generate a simple PDF-like text report
 * In production, would use jsPDF + html2canvas
 * This is a simpler approach using text-based export
 * @param {Object} reportData - { score, riskLevel, vitals, symptoms, recommendation, medications, date }
 * @returns {string} Formatted report text
 */
export function generateReportText(reportData) {
  const {
    score = 0,
    riskLevel = 'unknown',
    vitals = {},
    symptoms = {},
    recommendation = '',
    medications = [],
    date = new Date().toLocaleDateString(),
    userName = 'User',
  } = reportData;

  const lines = [
    '═══════════════════════════════════════════════════════════',
    'PARCIMIC HEALTH REPORT',
    '═══════════════════════════════════════════════════════════',
    '',
    `Generated: ${date}`,
    `User: ${userName}`,
    '',
    '───────────────────────────────────────────────────────────',
    'HEALTH SUMMARY',
    '───────────────────────────────────────────────────────────',
    '',
    `Risk Score: ${score}/100`,
    `Risk Level: ${riskLevel.toUpperCase()}`,
    `Status: ${
      riskLevel === 'high'
        ? '🚨 Needs medical attention'
        : riskLevel === 'moderate'
        ? '⚠️  Monitor closely'
        : '✅ Doing well'
    }`,
    '',
    '───────────────────────────────────────────────────────────',
    'VITAL SIGNS',
    '───────────────────────────────────────────────────────────',
    '',
    `Heart Rate: ${vitals.heartRate || '—'} bpm`,
    `Temperature: ${vitals.temp || '—'}°C`,
    `Respiration Rate: ${vitals.respRate || '—'} /min`,
    `Blood Pressure: ${vitals.sysBP || '—'} mmHg`,
    `Oxygen Saturation: ${vitals.o2Sat || '—'}%`,
    '',
    '───────────────────────────────────────────────────────────',
    'REPORTED SYMPTOMS',
    '───────────────────────────────────────────────────────────',
    '',
    ...Object.entries(symptoms)
      .filter(([, v]) => v)
      .map(([k]) => `• ${k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1')}`)
      .concat(symptoms.notes ? [`• Notes: ${symptoms.notes}`] : []),
    symptoms.notes ? '' : '• No symptoms reported',
    '',
    ...(recommendation ? [
      '───────────────────────────────────────────────────────────',
      'PARCIMIC AI RECOMMENDATION',
      '───────────────────────────────────────────────────────────',
      '',
      recommendation,
      '',
    ] : []),
    '───────────────────────────────────────────────────────────',
    'CURRENT MEDICATIONS',
    '───────────────────────────────────────────────────────────',
    '',
    ...(medications.length > 0
      ? medications.map(
          (m) =>
            `• ${m.name} ${m.dosage}\n  Schedule: ${m.frequency} at ${m.time}\n  Status: ${m.status || 'tracking'}`
        )
      : ['No medications recorded']),
    '',
    '───────────────────────────────────────────────────────────',
    'NEXT STEPS',
    '───────────────────────────────────────────────────────────',
    '',
    riskLevel === 'high'
      ? '⚠️  PLEASE SEEK IMMEDIATE MEDICAL ATTENTION\n\n• Call 112 or your local emergency number\n• Go to the nearest hospital\n• Share this report with your doctor'
      : riskLevel === 'moderate'
      ? '• Schedule a doctor\'s appointment\n• Monitor your symptoms daily\n• Keep taking your medications as prescribed\n• Return to Parcimic for regular check-ins'
      : '• Continue daily monitoring\n• Maintain healthy lifestyle habits\n• Take medications as scheduled\n• Return for regular check-ups',
    '',
    '───────────────────────────────────────────────────────────',
    'IMPORTANT DISCLAIMER',
    '───────────────────────────────────────────────────────────',
    '',
    'This report is for informational purposes only and is not a',
    'substitute for professional medical advice. Always consult a',
    'qualified healthcare provider before making any health decisions.',
    '',
    'Parcimic is not responsible for any medical outcomes.',
    '',
    '═══════════════════════════════════════════════════════════',
    `Parcimic Health Assistant | ${new Date().getFullYear()}`,
    '═══════════════════════════════════════════════════════════',
  ];

  return lines.join('\n');
}

/**
 * Download report as text file
 * @param {Object} reportData - Report data object
 */
export function downloadReportTxt(reportData) {
  const text = generateReportText(reportData);
  const element = document.createElement('a');
  element.setAttribute(
    'href',
    `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`
  );
  element.setAttribute('download', `parcimic-report-${new Date().toISOString().split('T')[0]}.txt`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

/**
 * Copy report to clipboard
 * @param {Object} reportData - Report data object
 * @returns {Promise<boolean>}
 */
export async function copyReportToClipboard(reportData) {
  try {
    const text = generateReportText(reportData);
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('[pdfExport] copy to clipboard failed:', err);
    return false;
  }
}

/**
 * Format report data for HTML email
 * @param {Object} reportData - Report data object
 * @returns {string} HTML formatted report
 */
export function generateReportHTML(reportData) {
  const {
    score = 0,
    riskLevel = 'unknown',
    vitals = {},
    symptoms = {},
    recommendation = '',
    medications = [],
    date = new Date().toLocaleDateString(),
    userName = 'User',
  } = reportData;

  const riskColor = riskLevel === 'high' ? '#dc2626' : riskLevel === 'moderate' ? '#f59e0b' : '#16a34a';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
    .section { margin: 20px 0; padding: 15px; background: #f9fafb; border-left: 4px solid ${riskColor}; border-radius: 4px; }
    .section h2 { margin: 0 0 10px 0; font-size: 18px; }
    .risk-badge { display: inline-block; padding: 8px 12px; background: ${riskColor}; color: white; border-radius: 20px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
    td:first-child { font-weight: bold; width: 40%; }
    .alert { background: #fee2e2; border: 1px solid #fecaca; padding: 12px; border-radius: 4px; color: #991b1b; margin: 10px 0; }
    .footer { font-size: 12px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🏥 Parcimic Health Report</h1>
      <p style="margin: 5px 0 0 0;">${date}</p>
    </div>

    <div class="section">
      <h2>Health Status</h2>
      <table>
        <tr>
          <td>Risk Score</td>
          <td><strong>${score}/100</strong></td>
        </tr>
        <tr>
          <td>Risk Level</td>
          <td><span class="risk-badge">${riskLevel.toUpperCase()}</span></td>
        </tr>
      </table>
    </div>

    <div class="section">
      <h2>Vital Signs</h2>
      <table>
        <tr>
          <td>Heart Rate</td>
          <td>${vitals.heartRate || '—'} bpm</td>
        </tr>
        <tr>
          <td>Temperature</td>
          <td>${vitals.temp || '—'}°C</td>
        </tr>
        <tr>
          <td>Respiration Rate</td>
          <td>${vitals.respRate || '—'} /min</td>
        </tr>
        <tr>
          <td>Blood Pressure</td>
          <td>${vitals.sysBP || '—'} mmHg</td>
        </tr>
        <tr>
          <td>Oxygen Saturation</td>
          <td>${vitals.o2Sat || '—'}%</td>
        </tr>
      </table>
    </div>

    ${recommendation ? `
    <div class="section">
      <h2>AI Recommendation</h2>
      <p>${recommendation}</p>
    </div>
    ` : ''}

    ${riskLevel === 'high' ? `
    <div class="alert">
      <strong>⚠️ URGENT</strong><br>
      Please seek immediate medical attention. Call your local emergency number or go to the nearest hospital.
    </div>
    ` : ''}

    <div class="footer">
      <p><strong>Disclaimer:</strong> This report is for informational purposes only and is not a substitute for professional medical advice. Always consult a qualified healthcare provider.</p>
      <p>© 2024 Parcimic Health Assistant. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send report via email (requires backend implementation)
 * @param {Object} reportData - Report data
 * @param {string} recipientEmail - Email address
 * @returns {Promise<boolean>}
 */
export async function emailReport(reportData, recipientEmail) {
  try {
    const response = await fetch('/api/email-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportData, recipientEmail }),
    });

    return response.ok;
  } catch (err) {
    console.error('[pdfExport] email failed:', err);
    return false;
  }
}
