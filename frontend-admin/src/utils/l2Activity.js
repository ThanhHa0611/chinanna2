export function getUnreadL2Activity(mentee, sectionKey) {
  return (mentee?.mentor_l2_activity || []).filter(
    (item) => item.section === sectionKey && item.l1_unread,
  );
}

export function mergeL2ActivityPayload(mentee, payload) {
  if (!mentee || !payload) return mentee;
  return {
    ...mentee,
    mentor_l2_activity: payload.mentor_l2_activity ?? mentee.mentor_l2_activity,
    mentor_l2_activity_l1_unread: payload.mentor_l2_activity_l1_unread ?? false,
    mentor_l2_activity_unread_count: payload.mentor_l2_activity_unread_count ?? 0,
  };
}
