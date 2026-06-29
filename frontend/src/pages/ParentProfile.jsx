import { useEffect, useState } from 'react';
import ApplyProgressSection from '../components/ApplyProgressSection';
import { APPLY_DOCUMENTS } from '../data/applyDocuments';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const MENTOR_STATUS_LABELS = {
  'chờ phản hồi': 'Chờ phản hồi',
  'đã duyệt': 'Đã duyệt',
  'cần chỉnh sửa': 'Cần chỉnh sửa',
};

function personalDeclarationHasForm(personalDeclaration) {
  return Boolean(
    personalDeclaration?.exists ||
      personalDeclaration?.has_online_link ||
      personalDeclaration?.has_local_file ||
      personalDeclaration?.url,
  );
}

function personalDeclarationOnlineUrl(personalDeclaration) {
  return (
    personalDeclaration?.google_doc_url ||
    (personalDeclaration?.url?.includes('docs.google.com') ? personalDeclaration.url : '')
  );
}

export default function ParentProfile() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('info');

  useEffect(() => {
    api
      .getParentChild()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const child = data?.child;
  const docMap = Object.fromEntries((data?.documents || []).map((item) => [item.doc_id, item]));

  const renderDocStatus = (docId) => {
    const record = docMap[docId];
    if (!record?.uploaded && docId !== 'personal-declaration') {
      return <span className="profile-doc-muted">—</span>;
    }
    if (docId === 'personal-declaration' && !personalDeclarationHasForm(child?.personal_declaration)) {
      return <span className="profile-doc-muted">—</span>;
    }
    const status = record?.mentor_status || 'chờ phản hồi';
    return (
      <div className="profile-doc-mentor-cell">
        <span className="profile-doc-mentor-badge profile-doc-mentor-waiting">
          {MENTOR_STATUS_LABELS[status] || status}
        </span>
        {record?.mentor_note && (
          <p className="profile-doc-mentor-note">{record.mentor_note}</p>
        )}
      </div>
    );
  };

  if (loading) {
    return <p className="loader">Đang tải hồ sơ con...</p>;
  }

  if (error) {
    return <p className="form-error panel-error">{error}</p>;
  }

  return (
    <div className="profile-page">
      <aside className="profile-sidebar">
        <h1>Phụ huynh</h1>
        <p className="profile-sidebar-note">
          Xem hồ sơ của {child?.full_name || user?.linked_mentee_name || 'mentee'}
        </p>
        <nav className="profile-nav">
          <button
            type="button"
            className={`profile-nav-item${activeSection === 'info' ? ' active' : ''}`}
            onClick={() => setActiveSection('info')}
          >
            <span className="profile-nav-num">1.</span>
            Thông tin con
          </button>
          <button
            type="button"
            className={`profile-nav-item${activeSection === 'documents' ? ' active' : ''}`}
            onClick={() => setActiveSection('documents')}
          >
            <span className="profile-nav-num">2.</span>
            Giấy tờ apply
          </button>
          <button
            type="button"
            className={`profile-nav-item${activeSection === 'apply-progress' ? ' active' : ''}`}
            onClick={() => setActiveSection('apply-progress')}
          >
            <span className="profile-nav-num">3.</span>
            Tiến độ apply
          </button>
        </nav>
      </aside>

      <div className="profile-panel">
        {activeSection === 'info' ? (
          <>
            <h2>Thông tin con</h2>
            <p className="profile-panel-desc">
              Bạn đang xem hồ sơ mentee liên kết với email phụ huynh {user?.email}.
            </p>
            <div className="profile-card">
              <div className="profile-readonly parent-info-grid">
                <div className="info-row">
                  <span className="info-label">Họ tên</span>
                  <span className="info-value">{child?.full_name || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email mentee</span>
                  <span className="info-value">{child?.email || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Số Zalo</span>
                  <span className="info-value">{child?.zalo_phone || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">App học bổng</span>
                  <span className="info-value">{child?.scholarship_system_label || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Hệ apply</span>
                  <span className="info-value">
                    {child?.apply_degree_level_label || '—'}
                  </span>
                </div>
                {child?.mentor === 'Thanh Hà' && (
                  <div className="info-row">
                    <span className="info-label">Kì 3/2027 — 1 kì tiếng?</span>
                    <span className="info-value">
                      {child?.term3_2027_language_semester_label || '—'}
                    </span>
                  </div>
                )}
                <div className="info-row">
                  <span className="info-label">Mentor</span>
                  <span className="info-value">
                    {child?.mentor ? `Mentor ${child.mentor}` : '—'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email clone apply</span>
                  <span className="info-value">{child?.apply_clone_email || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Pass clone</span>
                  <span className="info-value">{child?.apply_clone_password || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Ngày sinh</span>
                  <span className="info-value">{child?.date_of_birth || '—'}</span>
                </div>
              </div>
            </div>
          </>
        ) : activeSection === 'apply-progress' ? (
          <ApplyProgressSection
            readOnly
            initialRows={data?.apply_progress?.rows || []}
            initialProgressOptions={data?.apply_progress || null}
          />
        ) : (
          <>
            <h2>Giấy tờ apply</h2>
            <p className="profile-panel-desc">
              {data?.uploaded_count || 0} / {data?.total_count || APPLY_DOCUMENTS.length} giấy tờ đã có.
              Chế độ chỉ xem — phụ huynh không thể tải lên hoặc sửa file.
            </p>
            {(child?.preferred_schools_note || '').trim() && (
              <div className="profile-card profile-preferred-schools profile-preferred-schools-readonly">
                <h3>Trường ưa thích</h3>
                <p>{child.preferred_schools_note}</p>
              </div>
            )}
            <div className="profile-card">
              <div className="profile-doc-summary">
                <span>
                  {data?.uploaded_count || 0} / {data?.total_count || APPLY_DOCUMENTS.length} giấy tờ đã có
                </span>
              </div>
              <div className="profile-doc-header">
                <div className="profile-doc-info">
                  <span className="profile-doc-header-label">Giấy tờ</span>
                </div>
                <div className="profile-doc-columns">
                  <div className="profile-doc-col profile-doc-col-mentor">
                    <span className="profile-doc-header-label">Phản hồi mentor</span>
                  </div>
                  <div className="profile-doc-col profile-doc-col-upload">
                    <span className="profile-doc-header-label">File</span>
                  </div>
                </div>
              </div>
              <div className="profile-doc-list">
                {APPLY_DOCUMENTS.map((doc, index) => {
                  const record = docMap[doc.id];
                  const uploaded =
                    doc.id === 'personal-declaration'
                      ? personalDeclarationHasForm(child?.personal_declaration)
                      : Boolean(record?.uploaded);
                  const mentorApproved =
                    uploaded && (record?.mentor_status || 'chờ phản hồi') === 'đã duyệt';
                  return (
                    <div key={doc.id} className="profile-doc-item">
                      <div className="profile-doc-info">
                        {mentorApproved && (
                          <span
                            className="profile-doc-approved-tick"
                            title="Mentor đã duyệt"
                            aria-label="Mentor đã duyệt"
                          >
                            ✓
                          </span>
                        )}
                        <span className="profile-doc-num">{index + 1}.</span>
                        <span className="profile-doc-label">{doc.label}</span>
                      </div>
                      <div className="profile-doc-columns">
                        <div className="profile-doc-col profile-doc-col-mentor">
                          {renderDocStatus(doc.id)}
                        </div>
                        <div className="profile-doc-col profile-doc-col-upload">
                          {!uploaded ? (
                            <span className="profile-doc-muted">Chưa có</span>
                          ) : doc.id === 'personal-declaration' ? (
                            personalDeclarationOnlineUrl(child?.personal_declaration) ? (
                              <a
                                href={personalDeclarationOnlineUrl(child?.personal_declaration)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline btn-sm"
                              >
                                Xem form online
                              </a>
                            ) : (
                              <span className="profile-doc-muted">Chưa có link online</span>
                            )
                          ) : (
                            <button
                              type="button"
                              className="btn btn-outline btn-sm profile-doc-view-btn"
                              onClick={() => api.openParentChildDocumentFile(doc.id)}
                            >
                              Xem file
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
