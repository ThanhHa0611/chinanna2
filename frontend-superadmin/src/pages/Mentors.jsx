import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatDateTime } from '../utils/formatDateTime';
import { formatLevel1MentorLine } from '../utils/mentorDisplay';
import {
  hasUnseenActivity,
  saveSeenActivity,
} from '../utils/activitySeen';

export default function Mentors({ onAlertsChange }) {
  const [teams, setTeams] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [error, setError] = useState('');

  const loadMentors = () =>
    api
      .getMentors()
      .then((data) => {
        setTeams(data.teams || []);
        if (onAlertsChange) {
          let count = 0;
          for (const group of data.teams || []) {
            for (const mentor of group.mentors || []) {
              if (hasUnseenActivity(mentor)) count += 1;
            }
          }
          onAlertsChange(count);
        }
      })
      .catch((err) => setError(err.message));

  useEffect(() => {
    loadMentors().finally(() => setLoadingList(false));
    const timer = setInterval(() => {
      loadMentors().catch(() => null);
    }, 45000);
    return () => clearInterval(timer);
  }, [onAlertsChange]);

  const openMentor = async (mentor) => {
    setSelectedMentor(mentor);
    setLoadingActivities(true);
    setError('');
    try {
      const data = await api.getMentorActivities(mentor.admin_id);
      setActivities(data.items || []);
      saveSeenActivity(mentor.admin_id, mentor.last_activity_at);
      await loadMentors();
    } catch (err) {
      setError(err.message);
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  const backToList = () => {
    setSelectedMentor(null);
    setActivities([]);
  };

  return (
    <>
      <div className="page-head">
        <h2>Mentor</h2>
        <p>
          {selectedMentor
            ? `Lịch sử hoạt động — ${selectedMentor.label}`
            : 'Chọn mentor theo team để xem động thái và lịch sử'}
        </p>
      </div>

      {error && <p className="form-error panel-error">{error}</p>}

      {selectedMentor ? (
        <>
          <button type="button" className="btn btn-outline btn-sm back-btn" onClick={backToList}>
            ← Quay lại danh sách mentor
          </button>

          <div className="panel-card">
            <div className="detail-head">
              <div>
                <h3>{selectedMentor.label}</h3>
                <p className="muted">{selectedMentor.email}</p>
              </div>
              <span className="badge">
                {selectedMentor.activity_count} hoạt động
                {selectedMentor.last_activity_at
                  ? ` · ${formatDateTime(selectedMentor.last_activity_at)}`
                  : ''}
              </span>
            </div>

            {loadingActivities ? (
              <p className="loader">Đang tải hoạt động...</p>
            ) : activities.length === 0 ? (
              <p className="muted">Chưa có hoạt động nào.</p>
            ) : (
              <div className="activity-list">
                {activities.map((item) => (
                  <div
                    key={item.id}
                    className={`activity-item${item.source === 'team' ? ' activity-item-team' : ''}`}
                  >
                    <div className="activity-item-head">
                      <span className="activity-action">{item.action}</span>
                      <time>{formatDateTime(item.created_at)}</time>
                    </div>
                    <p>{item.description}</p>
                    {item.source === 'team' && (
                      <span className="activity-tag">Hoạt động team</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : loadingList ? (
        <p className="loader">Đang tải...</p>
      ) : teams.length === 0 ? (
        <div className="panel-card">
          <p className="muted">Chưa có mentor nào.</p>
        </div>
      ) : (
        <div className="team-sections">
          {teams.map((group) => (
            <section key={group.team} className="panel-card team-section">
              <h3 className="team-title">
                {group.team === 'Chung'
                  ? 'Chung'
                  : formatLevel1MentorLine(group.team) || group.team_label}
              </h3>
              <div className="mentor-grid">
                {group.mentors.map((mentor) => (
                  <button
                    key={mentor.admin_id}
                    type="button"
                    className={`mentor-card${hasUnseenActivity(mentor) ? ' mentor-card-unread' : ''}`}
                    onClick={() => openMentor(mentor)}
                  >
                    <span className="mentor-card-name">
                      {mentor.label}
                      {hasUnseenActivity(mentor) && (
                        <span className="notify-dot" title="Có hoạt động mới" />
                      )}
                    </span>
                    {mentor.email && mentor.email !== mentor.display_name && (
                      <span className="muted mentor-card-email">{mentor.email}</span>
                    )}
                    <span className="mentor-card-meta">
                      {mentor.activity_count} hoạt động
                      {mentor.last_activity_at
                        ? ` · ${formatDateTime(mentor.last_activity_at)}`
                        : ''}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
