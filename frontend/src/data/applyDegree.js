export const APPLY_DEGREE_LEVELS = [
  { value: '', label: 'Chọn hệ apply' },
  { value: 'undergrad', label: 'Hệ đại (本科)' },
  { value: 'master', label: 'Hệ thạc (硕士)' },
  { value: 'phd', label: 'Tiến sĩ (博士)' },
];

export const TERM3_2027_LANGUAGE_OPTIONS = [
  { value: '', label: 'Chọn câu trả lời' },
  { value: 'co', label: 'Có — dự định đi 1 kì tiếng' },
  { value: 'khong', label: 'Không' },
];

export function applyDegreeLevelLabel(value) {
  return APPLY_DEGREE_LEVELS.find((item) => item.value === (value || '').trim())?.label || '—';
}

export function term3LanguageSemesterLabel(value) {
  return TERM3_2027_LANGUAGE_OPTIONS.find((item) => item.value === (value || '').trim())?.label || '—';
}
