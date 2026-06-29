export const APPLY_PROGRESS_ROW_DEFAULT = 8;
export const APPLY_PROGRESS_ROW_MIN = 1;
export const APPLY_PROGRESS_ROW_MAX = 20;

export const SCHOLARSHIP_TYPE_OPTIONS = [
  'CSC',
  'CIS',
  'SGS',
  'Học bổng tỉnh/thành phố',
  'Học bổng trường',
  'Học bổng viện',
  'Tự phí',
];

export const PROGRESS_BASE_OPTIONS = [
  'Chờ submit',
  'Đã submit',
  'Cần sửa',
  'Chờ phỏng vấn',
  'Đã phỏng vấn',
  'Nominate',
  'Được học bổng',
  'Trượt hb',
];

export const PROGRESS_L1_ONLY = 'Chờ UP hồ sơ';
export const PROGRESS_L2_ONLY = 'Đã up xong còn thiếu tài liệu';

export const APPLY_PROGRESS_COLUMNS = [
  { key: 'school_name', label: 'Tên trường' },
  { key: 'apply_major', label: 'Ngành apply' },
  { key: 'link', label: 'Link' },
  { key: 'scholarship_type', label: 'Loại hb', type: 'select', options: SCHOLARSHIP_TYPE_OPTIONS },
  { key: 'allowance', label: 'Trợ cấp' },
  { key: 'registration_fee', label: 'Phí báo danh' },
  { key: 'progress', label: 'Tiến độ', type: 'select', options: PROGRESS_BASE_OPTIONS },
  { key: 'note', label: 'Note' },
];

export function isSelectColumn(column) {
  return column.type === 'select';
}

export function getProgressToneClass(progress) {
  if ((progress || '').trim() === 'Trượt hb') {
    return 'apply-progress-tone-black';
  }
  return '';
}

export function emptyApplyProgressRow(rowNum) {
  return {
    row_num: rowNum,
    school_name: '',
    apply_major: '',
    link: '',
    scholarship_type: '',
    allowance: '',
    registration_fee: '',
    progress: '',
    note: '',
  };
}

export function emptyApplyProgressRows(rowCount = APPLY_PROGRESS_ROW_DEFAULT) {
  const count = Math.max(APPLY_PROGRESS_ROW_MIN, Math.min(APPLY_PROGRESS_ROW_MAX, rowCount));
  return Array.from({ length: count }, (_, index) => emptyApplyProgressRow(index + 1));
}

export function pickApplyProgressFields(row) {
  const result = { row_num: row?.row_num || 0 };
  for (const column of APPLY_PROGRESS_COLUMNS) {
    result[column.key] = row?.[column.key] || '';
  }
  return result;
}

export function getMenteeEditableRow(row) {
  if (row?.pending_status === 'chờ duyệt' && row?.pending) {
    return { ...pickApplyProgressFields(row.pending), row_num: row.row_num };
  }
  return pickApplyProgressFields(row);
}

export function normalizeApplyProgressRows(rows, rowCount = APPLY_PROGRESS_ROW_DEFAULT) {
  const source = rows || [];
  const effectiveCount =
    rowCount ||
    source.reduce((max, row) => Math.max(max, row?.row_num || 0), 0) ||
    APPLY_PROGRESS_ROW_DEFAULT;

  return emptyApplyProgressRows(effectiveCount).map((row) => {
    const match = source.find((item) => item.row_num === row.row_num) || {};
    return {
      ...pickApplyProgressFields(match),
      row_num: row.row_num,
      pending_status: match.pending_status || '',
      pending: match.pending || null,
      rejection_note: match.rejection_note || '',
      has_pending: Boolean(match.has_pending),
    };
  });
}

export function getColumnSelectOptions(column, progressOptions) {
  if (column.key === 'progress') {
    return progressOptions?.length ? progressOptions : column.options || PROGRESS_BASE_OPTIONS;
  }
  return column.options || [];
}
