import React, { useContext, useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import styles from './userlayout.module.css';
import { Context } from '../login/context';
import logo from '../../assets/logo/logoDHCT.png';

const UserLayout = () => {
  const { user, logoutContext } = useContext(Context);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarVisible(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarVisible(false);
    }
  };

  const handleLogout = async () => {
    await logoutContext();
    navigate('/login');
  };

  return (
    <div className="container-fluid p-0">
      <div className={styles.contentWrapper}>
        {isMobile && (
          <button
            className={`btn ${styles.sidebarToggle}`}
            onClick={toggleSidebar}
            aria-label="Toggle Sidebar"
          >
            <i className="fa-solid fa-bars"></i>
          </button>
        )}

        <div className={styles.layoutContainer}>
          <aside
            className={`bg-white ${styles.sidebarUser} ${sidebarVisible ? styles.show : ''}`}
          >
            <div className={styles.logoContainer}>
              <img src={logo} alt="Logo DHCT" className={styles.logo} />
            </div>
            <div className={styles.sidebarHeader}>
              <h4 className={styles.sidebarTitle}>Tài khoản</h4>
              <h4 className={styles.sidebarUsername}>
                {user?.fullname || 'Khách'}
              </h4>
            </div>
            <nav className={styles.sidebarNav}>
              <div className={styles.navSection}>
                <button
                  className={`btn ${styles.navCollapseButton}`}
                  data-bs-toggle="collapse"
                  data-bs-target="#accountCollapse"
                  aria-expanded="false"
                  aria-controls="accountCollapse"
                  type="button"
                >
                  <span>
                    <i className="fa-solid fa-user me-2"></i>Quản lý tài khoản
                  </span>
                  <i className="fa-solid fa-chevron-down small"></i>
                </button>
                <div className={`collapse ${styles.navCollapseContent}`} id="accountCollapse">
                  <Link
                    className={`nav-link ${styles.navLink}`}
                    to="/account"
                    onClick={closeSidebar}
                  >
                    Hồ sơ
                  </Link>
                  <Link
                    className={`nav-link ${styles.navLink}`}
                    to="/account/update"
                    onClick={closeSidebar}
                  >
                    Cập nhật thông tin
                  </Link>
                  <Link
                    className={`nav-link ${styles.navLink}`}
                    to="/account/change-password"
                    onClick={closeSidebar}
                  >
                    Đổi mật khẩu
                  </Link>
                  <Link
                    className={`nav-link ${styles.navLink}`}
                    to="/account/notification-settings"
                    onClick={closeSidebar}
                  >
                    Cài đặt thông báo
                  </Link>
                </div>
              </div>
              <div className={styles.navSection}>
                <button
                  className={`btn ${styles.navLink} text-danger`}
                  onClick={handleLogout}
                >
                  <i className="fa-solid fa-sign-out-alt me-2"></i>Đăng xuất
                </button>
              </div>
            </nav>
          </aside>

          <main
            className={`bg-white ${styles.mainContent} ${sidebarVisible && isMobile ? styles.hiddenMobile : ''}`}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default UserLayout;