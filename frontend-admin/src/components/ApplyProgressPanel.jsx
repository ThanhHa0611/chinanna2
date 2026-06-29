import { useEffect, useMemo, useState } from 'react';
import {
  APPLY_PROGRESS_COLUMNS,
  APPLY_PROGRESS_ROW_MAX,
  APPLY_PROGRESS_ROW_MIN,
  emptyApplyProgressRows,
  getColumnSelectOptions,
  getProgressOptionsForAdmin,
  getProgressToneClass,
  isSelectColumn,
  isThanhHaTeam,
  normalizeApplyProgressRows,
  pickApplyProgressFields,
} from '../data/applyProgress';
import { isLevel1MentorAccount } from '../utils/mentorDisplay';
import { api } from '../services/api';
import { formatDateTime } from '../utils/formatDateTime';

function renderCellInput(column, row, progressOptions, onChange, useProgressTone) {
  if (isSelectColumn(column)) {
    const toneClass =
      column.key === 'progress' && (useProgressTone || row.progress?.trim() === 'Trượt hb')
        ? getProgressToneClass(row.progress, useProgressTone)
        : '';
    return (
      <select
        className={`apply-progress-select${toneClass ? ` ${toneClass}` : ''}`}
        value={row[column.key] || ''}
        onChange={(e) => onChange(row.row_num, column.key, e.target.value)}
      >
        <option value="">—</option>
        {getColumnSelectOptions(column, progressOptions).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type="text"
      className="apply-progress-input"
      value={row[column.key] || ''}
      onChange={(e) => onChange(row.row_num, column.key, e.target.value)}
      placeholder="—"
    />
  );
}

export default function ApplyProgressPanel({
  menteeId,
  initialProgress,
  admin,
  onUpdated,
}) {
  const [rowCount, setRowCount] = useState(initialProgress?.row_count || emptyApplyProgressRows().length);
  const [rows, setRows] = useState(emptyApplyProgressRows(rowCount));
  const [metaRows, setMetaRows] = useState([]);
  const [activity, setActivity] = useState([]);
  const [saving, setSaving] = useState(false);
  const [rowChanging, setRowChanging] = useState(false);
  const [reviewingRow, setReviewingRow] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const progressOptions = useMemo(
    () => initialProgress?.progress_options || getProgressOptionsForAdmin(admin),
    [initialProgress?.progress_options, admin],
  );
  const useProgressTone = isThanhHaTeam(admin);

  useEffect(() => {
    const count = initialProgress?.row_count;
    const normalized = normalizeApplyProgressRows(initialProgress?.rows || [], count);
    setRowCount(normalized.length);
    setMetaRows(normalized);
    setRows(normalized.map((row) => pickApplyProgressFields(row)));
    setActivity(initialProgress?.activity || []);
  }, [initialProgress]);

  const handleCellChange = (rowNum, key, value) => {
    setRows((prev) =>
      prev.map((row) => (row.row_num === rowNum ? { ...row, [key]: value } : row)),
    );
  };

  const refreshFromPayload = (payload) => {
    const normalized = normalizeApplyProgressRows(payload.rows || [], payload.row_count);
    setRowCount(normalized.length);
    setMetaRows(normalized);
    setRows(normalized.map((row) => pickApplyProgressFields(row)));
    setActivity(payload.activity || []);
    onUpdated?.(payload);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const payload = await api.updateMenteeApplyProgress(menteeId, {
        rows: rows.map((row) => pickApplyProgressFields(row)),
      });
      refreshFromPayload(payload);
      setMessage('Đã lưu tiến độ apply.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleModifyRows = async (action) => {
    setRowChanging(true);
    setMessage('');
    setError('');
    try {
      const payload = await api.modifyMenteeApplyProgressRows(menteeId, action);
      refreshFromPayload(payload);
      setMessage(action === 'add' ? 'Đã thêm nguyện vọng.' : 'Đã bớt nguyện vọng.');
    } catch (err) {
      setError(err.message);
    } finally {
      setRowChanging(false);
    }
  };

  const handleReview = async (rowNum, action) => {
    setReviewingRow(rowNum);
    setMessage('');
    setError('');
    try {
      const payload = await api.reviewMenteeApplyProgress(menteeId, {
        row_num: rowNum,
        action,
        rejection_note: action === 'reject' ? 'Mentor chưa duyệt chỉnh sửa này.' : '',
      });
      refreshFromPayload(payload);
      setMessage(action === 'approve' ? 'Đã duyệt chỉnh sửa.' : 'Đã từ chối chỉnh sửa.');
    } catch (err) {
      setError(err.message);
    } finally {
      setReviewingRow(0);
    }
  };

  const pendingCount = metaRows.filter((row) => row.has_pending).length;
  const unprocessedActivity = activity.filter((item) => !item.processed);
  const processedActivity = activity.filter((item) => item.processed);
  const isLevel1 = isLevel1MentorAccount(admin);
  const showL2Alert = Boolean(initialProgress?.l2_unread) && !isLevel1;

  return (
    <div className="apply-progress-panel">
      {(pendingCount > 0 || showL2Alert) && (
        <p className="apply-progress-pending-banner">
          {pendingCount > 0 && `${pendingCount} dòng có chỉnh sửa từ mentee chờ duyệt.`}
          {pendingCount > 0 && showL2Alert && ' '}
          {showL2Alert && 'Mentor cấp 1 vừa cập nhật tiến độ apply.'}
        </p>
      )}
      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-success">{message}</p>}

      <div className="apply-progress-row-toolbar">
        <span className="muted">{rowCount} nguyện vọng</span>
        <div className="apply-progress-row-toolbar-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={rowChanging || rowCount >= APPLY_PROGRESS_ROW_MAX}
            onClick={() => handleModifyRows('add')}
          >
            + Thêm nguyện vọng
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={rowChanging || rowCount <= APPLY_PROGRESS_ROW_MIN}
            onClick={() => handleModifyRows('remove')}
          >
            − Bớt nguyện vọng
          </button>
        </div>
      </div>

      {useProgressTone && (
        <div className="apply-progress-tone-legend">
          <span className="apply-progress-tone-chip apply-progress-tone-red">Chờ submit / Cần sửa</span>
          <span className="apply-progress-tone-chip apply-progress-tone-dark-red">Được học bổng</span>
          <span className="apply-progress-tone-chip apply-progress-tone-yellow">Chờ UP hồ sơ</span>
          <span className="apply-progress-tone-chip apply-progress-tone-orange">Up xong thiếu TL</span>
          <span className="apply-progress-tone-chip apply-progress-tone-green">Đã submit</span>
          <span className="apply-progress-tone-chip apply-progress-tone-purple">Nominate</span>
          <span className="apply-progress-tone-chip apply-progress-tone-black">Trượt hb</span>
        </div>
      )}

      <div className="apply-progress-queue-section">
        <h4 className="apply-progress-queue-title">Chưa xử lí</h4>
        {unprocessedActivity.length === 0 && pendingCount === 0 ? (
          <p className="muted">Không có yêu cầu chờ xử lí.</p>
        ) : (
          <ul className="apply-progress-queue-list">
            {unprocessedActivity.map((item) => (
              <li
                key={item.id}
                className={`apply-progress-queue-item${item.mentor_unread ? ' apply-progress-queue-item-unread' : ''}`}
              >
                <strong>{item.summary}</strong>
                <span className="muted"> · {formatDateTime(item.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="apply-progress-table-wrap">
        <table className="apply-progress-table">
          <thead>
            <tr>
              <th className="apply-progress-col-num">#</th>
              {APPLY_PROGRESS_COLUMNS.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
              <th className="apply-progress-col-actions">Duyệt mentee</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const meta = metaRows.find((item) => item.row_num === row.row_num) || row;
              const pending = meta.pending || {};
              const hasPending = meta.has_pending;
              return (
                <tr
                  key={row.row_num}
                  className={hasPending ? 'apply-progress-row-pending' : ''}
                >
                  <td className="apply-progress-col-num">{row.row_num}</td>
                  {APPLY_PROGRESS_COLUMNS.map((column) => {
                    const progressTone =
                      column.key === 'progress' &&
                      (useProgressTone || row.progress?.trim() === 'Trượt hb')
                        ? getProgressToneClass(row.progress, useProgressTone)
                        : '';
                    return (
                      <td key={column.key} className={progressTone || undefined}>
                        {renderCellInput(
                          column,
                          row,
                          progressOptions,
                          handleCellChange,
                          useProgressTone,
                        )}
                        {hasPending && pending[column.key] && pending[column.key] !== row[column.key] && (
                          <span className="apply-progress-pending-value" title="Mentee đề xuất">
                            Mentee: {pending[column.key]}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="apply-progress-col-actions">
                    {hasPending ? (
                      <div className="apply-progress-review-actions">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={reviewingRow === row.row_num}
                          onClick={() => handleReview(row.row_num, 'approve')}
                        >
                          Duyệt
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          disabled={reviewingRow === row.row_num}
                          onClick={() => handleReview(row.row_num, 'reject')}
                        >
                          Từ chối
                        </button>
                      </div>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="apply-progress-actions">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? 'Đang lưu...' : 'Lưu tiến độ apply'}
        </button>
      </div>

      <div className="apply-progress-queue-section">
        <h4 className="apply-progress-queue-title">Đã xử lí</h4>
        {processedActivity.length === 0 ? (
          <p className="muted">Chưa có mục đã xử lí.</p>
        ) : (
          <ul className="apply-progress-queue-list">
            {processedActivity.slice(0, 20).map((item) => (
              <li key={item.id} className="apply-progress-queue-item">
                <strong>{item.summary}</strong>
                {item.processed_by_name && (
                  <span className="muted"> · {item.processed_by_name}</span>
                )}
                <span className="muted"> · {formatDateTime(item.processed_at || item.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
