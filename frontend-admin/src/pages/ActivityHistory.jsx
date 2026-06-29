import { useEffect, useState } from 'react';

import { Navigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import { getActivities, getActivityAdmins } from '../services/api';

import { formatDateTime } from '../utils/formatDateTime';

import { formatLevel1MentorLine } from '../utils/mentorDisplay';



export default function ActivityHistory() {

  const { admin } = useAuth();

  const [adminList, setAdminList] = useState([]);

  const [activities, setActivities] = useState([]);

  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const [loading, setLoading] = useState(true);

  const [loadingActivities, setLoadingActivities] = useState(false);

  const [error, setError] = useState('');



  useEffect(() => {

    if (!admin?.is_super_admin) return;



    getActivityAdmins()
      .then(setAdminList)

      .catch((err) => setError(err.message))

      .finally(() => setLoading(false));

  }, [admin]);



  const openAdminHistory = async (item) => {

    setSelectedAdmin(item);

    setLoadingActivities(true);

    setError('');

    try {

      const data = await getActivities(item.admin_id);

      setActivities(data);

    } catch (err) {

      setError(err.message);

      setActivities([]);

    } finally {

      setLoadingActivities(false);

    }

  };



  const backToList = () => {

    setSelectedAdmin(null);

    setActivities([]);

    setError('');

  };



  if (!admin?.is_super_admin) {

    return <Navigate to="/" replace />;

  }



  return (

    <>

      <div className="page-head">

        <h2>Lịch sử hoạt động</h2>

        <p>
          {selectedAdmin
            ? `Hoạt động của ${selectedAdmin.display_name}`
            : admin?.mentor_name
              ? `Chọn mentor trong nhánh ${formatLevel1MentorLine(admin.mentor_name)}`
              : 'Chọn admin để xem lịch sử thao tác'}
        </p>

      </div>



      {error && <p className="form-error panel-error">{error}</p>}



      {selectedAdmin ? (

        <>

          <button type="button" className="btn btn-outline btn-sm activity-back" onClick={backToList}>

            ← Quay lại danh sách admin

          </button>



          {loadingActivities ? (

            <p className="loader">Đang tải...</p>

          ) : activities.length === 0 ? (

            <div className="panel-card">

              <p className="muted">Admin này chưa có hoạt động nào.</p>

            </div>

          ) : (

            <div className="panel-card activity-group">

              <h3>{selectedAdmin.display_name}</h3>

              {selectedAdmin.email && <p className="muted activity-admin-meta">{selectedAdmin.email}</p>}

              <div className="activity-list">

                {activities.map((item) => (

                  <div key={item.id} className="activity-item">

                    <div className="activity-item-head">

                      <span className="activity-action">{item.action}</span>

                      <time>{formatDateTime(item.created_at)}</time>

                    </div>

                    <p>{item.description}</p>

                  </div>

                ))}

              </div>

            </div>

          )}

        </>

      ) : loading ? (

        <p className="loader">Đang tải...</p>

      ) : adminList.length === 0 ? (

        <div className="panel-card">

          <p className="muted">Chưa có hoạt động nào được ghi nhận.</p>

        </div>

      ) : (

        <div className="admin-activity-grid">

          {adminList.map((item) => (

            <button

              key={item.admin_id}

              type="button"

              className="admin-activity-card"

              onClick={() => openAdminHistory(item)}

            >

              <strong>{item.display_name}</strong>

              {item.mentor_name && (

                <span className="admin-activity-mentor">

                  {formatLevel1MentorLine(item.mentor_name)}

                </span>

              )}

              {item.email && item.email !== item.display_name && (

                <span className="muted admin-activity-email">{item.email}</span>

              )}

              <span className="admin-activity-count">

                {item.activity_count} hoạt động

                {item.last_activity_at ? ` · ${formatDateTime(item.last_activity_at)}` : ''}

              </span>

            </button>

          ))}

        </div>

      )}

    </>

  );

}


