/**
 * Utility functions for VisionDrive
 */

export function formatDate(dateString) {
  if (!dateString) return '–';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatTimeOnly(dateString) {
  if (!dateString) return '–';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(d);
  } catch {
    return dateString;
  }
}

export function calculateDuration(startTime, endTime) {
  if (!startTime) return '–';
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  if (isNaN(start) || isNaN(end)) return '–';

  const diffSec = Math.max(0, Math.floor((end - start) / 1000));
  const hrs = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

export function formatDurationSeconds(seconds) {
  if (seconds == null || isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getRiskLevelClass(level) {
  if (!level) return 'neutral';
  const upper = String(level).toUpperCase();
  if (upper === 'HIGH' || upper === 'CRITICAL') return 'high';
  if (upper === 'MODERATE' || upper === 'MEDIUM') return 'moderate';
  if (upper === 'LOW') return 'low';
  return 'neutral';
}

export function getSeverityClass(severity) {
  if (!severity) return 'neutral';
  const lower = String(severity).toLowerCase();
  if (lower === 'critical') return 'high';
  if (lower === 'high') return 'high';
  if (lower === 'medium' || lower === 'moderate') return 'moderate';
  if (lower === 'low') return 'low';
  return 'neutral';
}

export function getAlertIconName(type) {
  switch (type) {
    case 'HIGH_RISK':
      return 'AlertTriangle';
    case 'PHONE_DETECTED':
      return 'Smartphone';
    case 'DROWSINESS':
      return 'Moon';
    case 'DISTRACTION':
      return 'EyeOff';
    default:
      return 'Bell';
  }
}

export function getAlertFriendlyName(type) {
  switch (type) {
    case 'HIGH_RISK':
      return 'Critical Risk Detected';
    case 'PHONE_DETECTED':
      return 'Mobile Phone Distraction';
    case 'DROWSINESS':
      return 'Driver Drowsiness Alert';
    case 'DISTRACTION':
      return 'Prolonged Inattention';
    default:
      return type || 'Safety Notification';
  }
}
