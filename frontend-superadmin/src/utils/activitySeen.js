const KEY = 'superadmin-mentor-activity-seen-v1';

export function readSeenActivities() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveSeenActivity(adminId, lastActivityAt) {
  if (!adminId) return;
  try {
    const all = readSeenActivities();
    all[adminId] = lastActivityAt || new Date().toISOString();
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // ignore storage errors
  }
}

export function hasUnseenActivity(mentor) {
  if (!mentor?.last_activity_at || !mentor.activity_count) return false;
  const seenAt = readSeenActivities()[mentor.admin_id];
  if (!seenAt) return true;
  return mentor.last_activity_at > seenAt;
}

export function countUnseenMentors(teams) {
  let count = 0;
  for (const group of teams || []) {
    for (const mentor of group.mentors || []) {
      if (hasUnseenActivity(mentor)) count += 1;
    }
  }
  return count;
}
