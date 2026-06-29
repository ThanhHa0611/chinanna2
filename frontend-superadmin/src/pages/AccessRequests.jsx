import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { matchesNameSearch } from '../utils/searchByName';
import { formatDateTime } from '../utils/formatDateTime';
import { formatLevel1MentorLine } from '../utils/mentorDisplay';

export default function AccessRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const accessSearchFields = ['full_name', 'username', 'email', 'zalo_phone'];

  const filteredRequests = useMemo(
    () => requests.filter((item) => matchesNameSearch(item, searchQuery, accessSearchFields)),
    [requests, searchQuery],
  );

  const loadData = () => {
    setLoading(true);
    setError('');
    api
      .getAccessRequests()
      .then(setRequests)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReview = async (item, status) => {
    const rowKey = `${item.request_type}-${item.id}`;
    setProcessingId(rowKey);
    setMessage('');
    setError('');
    try {
      const result = await api.reviewAccessRequest(item.id, {
        status,
        request_type: item.request_type,
      });
      setMessage(result.message);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      <div className="page-head">
        <h2>Cấp quyền</h2>
        <p>Duyệt yêu cầu đăng ký mentee và mentor toàn hệ thống</p>
      </div>

      {message && <p className="form-success panel-error">{message}</p>}
      {error && <p className="form-error panel-error">{error}</p>}

      {!loading && requests.length > 0 && (
        <div className="page-search">
          <label className="page-search-label" htmlFor="access-search">
            Tìm kiếm
            <input
              id="access-search"
              type="search"
              className="page-search-input"
              placeholder="Theo tên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
        </div>
      )}

      {loading ? (
        <p className="loader">Đang tải...</p>
      ) : (
        <div className="panel-card">
          {filteredRequests.length === 0 ? (
            <p className="muted">
              {requests.length === 0 ? 'Không có yêu cầu đang chờ.' : 'Không tìm thấy kết quả phù hợp.'}
            </p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Quyền xin</th>
                    <th>Email</th>
                    <th>Tên đăng nhập</th>
                    <th>Số Zalo</th>
                    <th>Team</th>
                    <th>Họ tên / Vị trí</th>
                    <th>Yêu cầu lúc</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => {
                    const rowKey = `${req.request_type}-${req.id}`;
                    const roleClass =
                      req.request_type === 'mentee' ? 'role-badge-mentee' : 'role-badge-mentor';
                    return (
                      <tr key={rowKey}>
                        <td>
                          <span className={`role-badge ${roleClass}`}>{req.role_label}</span>
                        </td>
                        <td>{req.email}</td>
                        <td>{req.username}</td>
                        <td>{req.request_type === 'mentee' ? req.zalo_phone || '—' : '—'}</td>
                        <td>{formatLevel1MentorLine(req.team) || req.team || '—'}</td>
                        <td>
                          {req.request_type === 'mentee'
                            ? req.registration_location_label || '—'
                            : req.full_name || '—'}
                        </td>
                        <td>{formatDateTime(req.requested_at)}</td>
                        <td className="action-cell">
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={processingId === rowKey}
                            onClick={() => handleReview(req, 'approved')}
                          >
                            Duyệt
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            disabled={processingId === rowKey}
                            onClick={() => handleReview(req, 'rejected')}
                          >
                            Từ chối
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
