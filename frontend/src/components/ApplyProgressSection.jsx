import { useEffect, useState } from 'react';
import {
  APPLY_PROGRESS_COLUMNS,
  emptyApplyProgressRows,
  getColumnSelectOptions,
  getMenteeEditableRow,
  getProgressToneClass,
  isSelectColumn,
  normalizeApplyProgressRows,
  pickApplyProgressFields,
} from '../data/applyProgress';
import { api } from '../services/api';

function rowStatusLabel(row) {
  if (row.pending_status === 'chờ duyệt') return 'Chờ mentor duyệt';
  if (row.pending_status === 'từ chối') return 'Mentor chưa duyệt chỉnh sửa';
  return '';
}

function renderCellValue(column, value) {
  return value?.trim() ? value : '—';
}

export default function ApplyProgressSection({ readOnly = false, initialRows = null, initialProgressOptions = null }) {
  const [rows, setRows] = useState(emptyApplyProgressRows());
  const [metaRows, setMetaRows] = useState([]);
  const [progressOptions, setProgressOptions] = useState(
    initialProgressOptions?.progress_options || [],
  );
  const [loading, setLoading] = useState(!readOnly);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (readOnly) {
      const normalized = normalizeApplyProgressRows(initialRows || [], initialProgressOptions?.row_count);
      setRows(normalized.map((row) => pickApplyProgressFields(row)));
      setMetaRows(normalized);
      if (initialProgressOptions?.progress_options) {
        setProgressOptions(initialProgressOptions.progress_options);
      }
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    api
      .getApplyProgress()
      .then((data) => {
        if (cancelled) return;
        const normalized = normalizeApplyProgressRows(data.rows || [], data.row_count);
        setMetaRows(normalized);
        setRows(normalized.map((row) => getMenteeEditableRow(row)));
        setProgressOptions(data.progress_options || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [readOnly, initialRows, initialProgressOptions]);

  const handleCellChange = (rowNum, key, value) => {
    setRows((prev) =>
      prev.map((row) => (row.row_num === rowNum ? { ...row, [key]: value } : row)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const data = await api.updateApplyProgress({
        rows: rows.map((row) => pickApplyProgressFields(row)),
      });
      const normalized = normalizeApplyProgressRows(data.rows || [], data.row_count);
      setMetaRows(normalized);
      setRows(normalized.map((row) => getMenteeEditableRow(row)));
      setProgressOptions(data.progress_options || progressOptions);
      setMessage('Đã gửi chỉnh sửa. Mentor sẽ duyệt trước khi cập nhật chính thức.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="profile-note">Đang tải tiến độ apply...</p>;
  }

  return (
    <>
      <h2>Tiến độ apply</h2>
      <p className="profile-panel-desc">
        {readOnly
          ? 'Bảng tiến độ apply do mentor cập nhật. Phụ huynh chỉ xem.'
          : 'Mentor cập nhật tiến độ chính thức. Bạn có thể chỉnh sửa nhưng cần được mentor duyệt.'}
      </p>

      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-success">{message}</p>}

      <div className="profile-card apply-progress-card">
        <div className="apply-progress-table-wrap">
          <table className="apply-progress-table">
            <thead>
              <tr>
                <th className="apply-progress-col-num">#</th>
                {APPLY_PROGRESS_COLUMNS.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                {!readOnly && <th className="apply-progress-col-status">Trạng thái</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const meta = metaRows.find((item) => item.row_num === row.row_num) || row;
                const status = rowStatusLabel(meta);
                return (
                  <tr
                    key={row.row_num}
                    className={
                      meta.pending_status === 'chờ duyệt'
                        ? 'apply-progress-row-pending'
                        : meta.pending_status === 'từ chối'
                          ? 'apply-progress-row-rejected'
                          : ''
                    }
                  >
                    <td className="apply-progress-col-num">{row.row_num}</td>
                    {APPLY_PROGRESS_COLUMNS.map((column) => {
                      const progressTone =
                        column.key === 'progress'
                          ? getProgressToneClass(readOnly ? meta[column.key] : row[column.key])
                          : '';
                      return (
                      <td key={column.key} className={progressTone || undefined}>
                        {readOnly ? (
                          <span className={`apply-progress-readonly-cell${progressTone ? ` ${progressTone}` : ''}`}>
                            {renderCellValue(column, meta[column.key])}
                          </span>
                        ) : isSelectColumn(column) ? (
                          <select
                            className={`apply-progress-select${progressTone ? ` ${progressTone}` : ''}`}
                            value={row[column.key] || ''}
                            onChange={(e) =>
                              handleCellChange(row.row_num, column.key, e.target.value)
                            }
                          >
                            <option value="">—</option>
                            {getColumnSelectOptions(column, progressOptions).map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            className="apply-progress-input"
                            value={row[column.key] || ''}
                            onChange={(e) =>
                              handleCellChange(row.row_num, column.key, e.target.value)
                            }
                            placeholder="—"
                          />
                        )}
                      </td>
                      );
                    })}
                    {!readOnly && (
                      <td className="apply-progress-col-status">
                        {status && (
                          <span
                            className={`apply-progress-status apply-progress-status-${meta.pending_status === 'chờ duyệt' ? 'waiting' : 'rejected'}`}
                          >
                            {status}
                          </span>
                        )}
                        {meta.rejection_note && (
                          <p className="apply-progress-rejection-note">{meta.rejection_note}</p>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!readOnly && (
          <div className="apply-progress-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? 'Đang gửi...' : 'Gửi chỉnh sửa cho mentor duyệt'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
