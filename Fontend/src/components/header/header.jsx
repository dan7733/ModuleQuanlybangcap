import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Context } from '../login/context';
import styles from './header.module.css';

const Header = () => {
  const navigate = useNavigate();
  const { user } = useContext(Context);
  const [isDiplomaMenuOpen, setIsDiplomaMenuOpen] = useState(false);

  const handleNavClick = (menu) => {
    console.log('Nav clicked:', menu, 'Current isDiplomaMenuOpen:', isDiplomaMenuOpen);
    if (menu === 'lookup') {
      setIsDiplomaMenuOpen(false);
      navigate('/');
    } else if (menu === 'guide') {
      setIsDiplomaMenuOpen(false);
      navigate('/reset-password');
    } else if (menu === 'diploma') {
      setIsDiplomaMenuOpen((prev) => !prev);
    }
  };

  const handleSubClick = (path) => {
    console.log('Submenu clicked:', path);
    navigate(path);
    setIsDiplomaMenuOpen(true);
  };

  const isAuthorized = user?.auth && ['admin', 'certifier'].includes(user?.role);

  return (
    <>
      <nav className={`navbar navbar-expand-md px-3 py-2 ${styles.navBar}`}>
        <div className="container-fluid">
          <span className="navbar-brand text-white d-md-none">Menu</span>
          <button
            className="navbar-toggler bg-light"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className={`collapse navbar-collapse ${styles.collapse}`} id="mainNavbar">
            <div className="navbar-nav">
              <button
                className={`${styles.navLink} btn btn-link`}
                onClick={() => handleNavClick('lookup')}
              >
                TRA CỨU
              </button>
              <button
                className={`${styles.navLink} btn btn-link`}
                onClick={() => handleNavClick('guide')}
              >
                HƯỚNG DẪN SỬ DỤNG
              </button>
              {isAuthorized && (
                <button
                  className={`${styles.navLink} btn btn-link`}
                  onClick={() => handleNavClick('diploma')}
                >
                  QUẢN LÝ LOẠI BẰNG
                </button>
              )}
              <button
                className={`${styles.navLink} btn btn-link`}
                onClick={() => navigate('/request-approval')}
              >
                QUẢN LÝ PHÊ DUYỆT
              </button>
              <button
                className={`${styles.navLink} btn btn-link`}
                onClick={() => navigate('/statistics')}
              >
                DANH SÁCH
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isAuthorized && isDiplomaMenuOpen && (
        <div className={`${styles.Subtab} d-flex text-white text-center border-top`}>
          <div
            className="flex-fill py-2 border-end"
            style={{ cursor: 'pointer' }}
            onClick={() => handleSubClick('/adddegreetype')}
          >
            Tạo văn bằng
          </div>
          <div
            className="flex-fill py-2"
            style={{ cursor: 'pointer' }}
            onClick={() => handleSubClick('/listdegreetype')}
          >
            Danh sách
          </div>
        </div>
      )}
    </>
  );
};

export default Header;