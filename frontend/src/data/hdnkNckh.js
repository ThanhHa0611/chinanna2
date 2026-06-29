export const HDNK_NCKH_PARTICIPATION_TYPES = ['cá nhân', 'nhóm ngoài', 'nhóm Trơn Tru'];
export const HDNK_NCKH_PROGRESS_OPTIONS = ['mới tạo nhóm', 'đang tiến hành', 'đã hoàn thành'];
export const HDNK_NCKH_AWARD_LEVELS = ['giải 1', 'giải 2', 'giải 3', 'khác'];

export function emptyHdnkNckhEntry() {
  return {
    entry_id: '',
    start_date: '',
    category: '',
    participation_type: '',
    zalo_group_name: '',
    progress: '',
    has_award: false,
    award_level: '',
  };
}

export function normalizeHdnkNckhEntries(entries) {
  return (entries || []).map((entry) => ({
    entry_id: entry?.entry_id || '',
    start_date: entry?.start_date || '',
    category: entry?.category || '',
    participation_type: entry?.participation_type || '',
    zalo_group_name: entry?.zalo_group_name || '',
    progress: entry?.progress || '',
    has_award: Boolean(entry?.has_award),
    award_level: entry?.award_level || '',
  }));
}
