import { getVulnerabilityScore } from '../config/wardVulnerability';

/**
 * Compute priority score for a complaint.
 *
 * Formula:
 *   priority_score =
 *     (urgency_score * 0.5) +
 *     (repeat_count_in_ward_and_category * 10 * 0.3) +
 *     (vulnerability_weight_for_ward * 0.2)
 *
 * @param {Object} complaint — the complaint to score
 * @param {Object[]} allComplaints — full list (to compute repeat_count)
 * @returns {{ score: number, breakdown: Object }} score (0–100+) and breakdown
 */
export function computePriorityScore(complaint, allComplaints) {
  const urgencyScore = complaint.urgency_score ?? 0;

  // Count OTHER complaints in same ward + category that are new or assigned
  const repeatCount = allComplaints.filter(
    (c) =>
      c.id !== complaint.id &&
      c.ward === complaint.ward &&
      c.category === complaint.category &&
      (c.status === 'new' || c.status === 'assigned')
  ).length;

  const vulnerabilityWeight = getVulnerabilityScore(complaint.ward);

  const urgencyComponent = urgencyScore * 0.5;
  const repeatComponent = repeatCount * 10 * 0.3;
  const vulnerabilityComponent = vulnerabilityWeight * 0.2;

  const score = urgencyComponent + repeatComponent + vulnerabilityComponent;

  return {
    score: Math.round(score * 10) / 10,
    breakdown: {
      urgencyScore,
      urgencyComponent: Math.round(urgencyComponent * 10) / 10,
      repeatCount,
      repeatComponent: Math.round(repeatComponent * 10) / 10,
      vulnerabilityWeight,
      vulnerabilityComponent: Math.round(vulnerabilityComponent * 10) / 10,
    },
  };
}

/**
 * Get priority tier label and colors for a score.
 * @param {number} score
 * @returns {{ tier: string, color: string, bgColor: string, textColor: string }}
 */
export function getPriorityTier(score) {
  if (score >= 65) {
    return {
      tier: 'High',
      color: '#EF4444',
      bgColor: 'bg-red-900/30',
      borderColor: 'border-red-500/50',
      textColor: 'text-red-400',
      markerColor: '#EF4444',
    };
  } else if (score >= 35) {
    return {
      tier: 'Medium',
      color: '#F59E0B',
      bgColor: 'bg-amber-900/30',
      borderColor: 'border-amber-500/50',
      textColor: 'text-amber-400',
      markerColor: '#F59E0B',
    };
  } else {
    return {
      tier: 'Low',
      color: '#22C55E',
      bgColor: 'bg-green-900/30',
      borderColor: 'border-green-500/50',
      textColor: 'text-green-400',
      markerColor: '#22C55E',
    };
  }
}

/**
 * Enrich all complaints with computed priority scores.
 * @param {Object[]} complaints
 * @returns {Object[]}
 */
export function enrichWithPriority(complaints) {
  return complaints.map((complaint) => {
    const { score, breakdown } = computePriorityScore(complaint, complaints);
    return {
      ...complaint,
      priority_score: score,
      priority_breakdown: breakdown,
      priority_tier: getPriorityTier(score),
    };
  });
}
