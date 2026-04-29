// healthScoreService.js
// Convert risk scores to user-friendly health scores with labels and guidance

import axios from 'axios';

/**
 * Convert risk score to health score (0-100 friendly scale)
 * @param {number} riskScore - Risk score from prediction (0-100)
 * @returns {Promise<Object>} { healthScore, label, color, friendlyText }
 */
export async function calculateHealthScore(riskScore) {
  try {
    const response = await axios.post('/api/health-score', { score: riskScore });
    return response.data;
  } catch (err) {
    console.error('[healthScoreService] calculation failed:', err);
    // Fallback calculation
    return calculateHealthScoreLocal(riskScore);
  }
}

/**
 * Local fallback calculation (no server call)
 * @param {number} riskScore - Risk score (0-100)
 * @returns {Object} { healthScore, label, color, friendlyText }
 */
export function calculateHealthScoreLocal(riskScore) {
  // Invert: high risk = low health
  let healthScore = Math.max(0, 100 - riskScore);

  let label, color;
  if (healthScore >= 70) {
    label = 'Good';
    color = 'green';
  } else if (healthScore >= 40) {
    label = 'Moderate';
    color = 'yellow';
  } else {
    label = 'High Risk';
    color = 'red';
  }

  let friendlyText;
  if (healthScore >= 80) friendlyText = "You're doing great! Keep it up.";
  else if (healthScore >= 70) friendlyText = "You're doing fine. Keep monitoring.";
  else if (healthScore >= 50) friendlyText = "Keep monitoring. It's a good idea to track your health closely.";
  else if (healthScore >= 35) friendlyText = "Your health needs attention. Consider a check-up soon.";
  else friendlyText = "Take action now. This needs medical attention.";

  return { healthScore, label, color, friendlyText };
}

/**
 * Get color classes for Tailwind
 * @param {string} color - Color name (green, yellow, red)
 * @returns {Object} { bg, text, border, accent }
 */
export function getColorClasses(color) {
  const colors = {
    green: {
      bg: 'bg-green-50',
      text: 'text-green-900',
      border: 'border-green-200',
      accent: 'bg-green-100',
      badge: 'bg-green-100 text-green-800',
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-900',
      border: 'border-yellow-200',
      accent: 'bg-yellow-100',
      badge: 'bg-yellow-100 text-yellow-800',
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-900',
      border: 'border-red-200',
      accent: 'bg-red-100',
      badge: 'bg-red-100 text-red-800',
    },
  };

  return colors[color] || colors.yellow;
}

/**
 * Get icon emoji for health score
 * @param {string} label - Health label (Good, Moderate, High Risk)
 * @returns {string} Emoji
 */
export function getHealthIcon(label) {
  const icons = {
    Good: '✅',
    Moderate: '⚠️',
    'High Risk': '🚨',
  };
  return icons[label] || '❓';
}

/**
 * Generate trend indicator (improving, stable, worsening)
 * @param {Array} recentScores - Last 3 scores in order [oldest, recent, latest]
 * @returns {Object} { trend, arrow, message }
 */
export function calculateTrend(recentScores) {
  if (!recentScores || recentScores.length < 2) {
    return { trend: 'stable', arrow: '→', message: 'No trend data yet' };
  }

  const latest = recentScores[recentScores.length - 1];
  const previous = recentScores[recentScores.length - 2];

  const change = latest - previous;

  if (change < -5) {
    return { trend: 'improving', arrow: '↑', message: 'Health improving!' };
  } else if (change > 5) {
    return { trend: 'worsening', arrow: '↓', message: 'Health declining' };
  } else {
    return { trend: 'stable', arrow: '→', message: 'Status stable' };
  }
}

/**
 * Get risk category from score
 * @param {number} score - Risk score
 * @returns {string} Category: 'low', 'moderate', or 'high'
 */
export function getRiskCategory(score) {
  if (score >= 65) return 'high';
  if (score >= 35) return 'moderate';
  return 'low';
}
