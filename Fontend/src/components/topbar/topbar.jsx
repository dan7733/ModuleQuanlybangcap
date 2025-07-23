import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Context } from '../login/context';
import styles from './topbar.module.css';
import logo from '../../assets/logo/logoDHCT.png';

const Topbar = () => {
  const navigate = useNavigate();
  const { user, logoutContext } = useContext(Context);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutContext();
      setUserDropdownOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };

  return (
    <>
      <div className={`py-2 px-3 d-flex justify-content-between align-items-center ${styles.header}`}>
        <div className="d-flex align-items-center">
          <img src={logo} alt="Logo" style={{ width: '55px', height: '55px' }} />
          <div className={styles.title}>
            <strong>TRƯỜNG ĐẠI HỌC CẦN THƠ</strong>
            <h6>Hệ thống tra cứu văn bằng chứng chỉ</h6>
          </div>
        </div>

        <div className="detailproduct-header d-none d-md-flex align-items-center gap-3">
          <div className="dropdown">
            <button className="btn btn-light btn-sm d-flex align-items-center gap-1" data-bs-toggle="dropdown">
              <img src="https://flagcdn.com/w40/vn.png" alt="VN" width="20" /> Tiếng Việt <i className="fa-solid fa-chevron-down"></i>
            </button>
            <ul className="dropdown-menu">
              <li><button className="dropdown-item">English</button></li>
              <li><button className="dropdown-item">Tiếng Việt</button></li>
            </ul>
          </div>

          <div className="detailproduct-login">
            {user?.auth ? (
              <div className="dropdown">
                <button
                  className="btn btn-light btn-sm d-flex align-items-center gap-1"
                  onClick={toggleDropdown}
                >
                  Xin chào, {user.fullname || 'Người dùng'} <i className="fa-solid fa-chevron-down"></i>
                </button>
                {userDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    <Link
                      to="/account"
                      className={styles.dropdownItem}
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <i className="fa-solid fa-user"></i> Thông tin tài khoản
                    </Link>
                    <div
                      className={styles.dropdownItem}
                      onClick={handleLogout}
                    >
                      <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn btn-light btn-sm">
                <i className="fa-solid fa-user"></i> Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className={`d-flex d-md-none align-items-center justify-content-center gap-2 ${styles.mobileHeaderTop}`}>
        <div className="dropdown-mobile">
          <button className="btn btn-light btn-sm d-flex align-items-center gap-1" data-bs-toggle="dropdown">
            <img src="https://flagcdn.com/w40/vn.png" alt="VN" width="20" /> Tiếng Việt <i className="fa-solid fa-chevron-down"></i>
          </button>
          <ul className="dropdown-menu">
            <li><button className="dropdown-item">English</button></li>
            <li><button className="dropdown-item">Tiếng Việt</button></li>
          </ul>
        </div>

        <div className="detailproduct-login-mobile">
          {user?.auth ? (
            <div className="dropdown">
              <button
                className="btn btn-light btn-sm d-flex align-items-center gap-1"
                onClick={toggleDropdown}
              >
                Xin chào, {user.fullname || 'Người dùng'} <i className="fa-solid fa-chevron-down"></i>
              </button>
              {userDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  <Link
                    to={`/account/${user.username}`}
                    className={styles.dropdownItem}
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <i className="fa-solid fa-user"></i> Thông tin tài khoản
                  </Link>
                  <div
                    className={styles.dropdownItem}
                    onClick={handleLogout}
                  >
                    <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              className="btn btn-light btn-sm d-flex align-items-center gap-1"
              onClick={() => navigate('/login')}
            >
              <i className="fa-solid fa-user"></i> Đăng Nhập
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default Topbar;