import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DeviceModeSwitcher from '../components/DeviceModeSwitcher';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatLevel1MentorLine } from '../utils/mentorDisplay';

export default function Account() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setSaving(true);
    try {
      const result = await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setMessage(result.message || 'Đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <h2>Tài khoản</h2>
        <p>Thông tin đăng nhập và đổi mật khẩu mentor</p>
      </div>

      <div className="panel-card account-info-card">
        <h3>Thông tin tài khoản</h3>
        <div className="account-info-grid">
          <div>
            <span className="info-label">Email</span>
            <strong>{admin?.email || '—'}</strong>
          </div>
          <div>
            <span className="info-label">Tên hiển thị</span>
            <strong>{admin?.full_name || '—'}</strong>
          </div>
          <div>
            <span className="info-label">Team</span>
            <strong>
              {admin?.mentor_name ? formatLevel1MentorLine(admin.mentor_name) : '—'}
            </strong>
          </div>
        </div>
      </div>

      <div className="panel-card account-password-card">
        <h3>Đổi mật khẩu</h3>
        <form onSubmit={handleSubmit} className="auth-form account-password-form">
          <label>
            Mật khẩu hiện tại
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <label>
            Mật khẩu mới
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>
          <label>
            Xác nhận mật khẩu mới
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          {message && <p className="form-success">{message}</p>}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Đang đổi...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>

      <div className="panel-card account-device-card">
        <DeviceModeSwitcher />
        <button
          type="button"
          className="btn btn-outline btn-sm account-logout-btn"
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
        >
          Đăng xuất
        </button>
      </div>
    </>
  );
}
