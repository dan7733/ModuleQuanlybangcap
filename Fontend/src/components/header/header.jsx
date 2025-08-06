import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Context } from '../login/context';
import styles from './header.module.css';

const Header = () => {
  const navigate = useNavigate();
  const { user } = useContext(Context);
  const [isDiplomaMenuOpen, setIsDiplomaMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isIssuerMenuOpen, setIsIssuerMenuOpen] = useState(false);
  const [isDegreeMenuOpen, setIsDegreeMenuOpen] = useState(false); // New state for degree menu

  const handleNavClick = (menu) => {
    console.log('Nav clicked:', menu);
    if (menu === 'diploma') {
      setIsDiplomaMenuOpen((prev) => !prev);
      setIsUserMenuOpen(false);
      setIsIssuerMenuOpen(false);
      setIsDegreeMenuOpen(false);
    } else if (menu === 'user') {
      setIsUserMenuOpen((prev) => !prev);
      setIsDiplomaMenuOpen(false);
      setIsIssuerMenuOpen(false);
      setIsDegreeMenuOpen(false);
    } else if (menu === 'issuer') {
      setIsIssuerMenuOpen((prev) => !prev);
      setIsDiplomaMenuOpen(false);
      setIsUserMenuOpen(false);
      setIsDegreeMenuOpen(false);
    } else if (menu === 'degree') {
      setIsDegreeMenuOpen((prev) => !prev);
      setIsDiplomaMenuOpen(false);
      setIsUserMenuOpen(false);
      setIsIssuerMenuOpen(false);
    }
  };

  const handleSubClick = (path) => {
    console.log('Submenu clicked:', path);
    navigate(path);
    setIsDiplomaMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsIssuerMenuOpen(false);
    setIsDegreeMenuOpen(false);
  };

  const isAuthorizedForDiploma = user?.auth && ['admin', 'certifier'].includes(user?.role);
  const isAuthorizedForUser = user?.auth && user?.role === 'admin';
  const isAuthorizedForIssuer = user?.auth && user?.role === 'admin';
  const isAuthorizedForDegree = user?.auth && ['admin', 'manager'].includes(user?.role); // For degree management
  const isAuthorizedForLogs = user?.auth && user?.role === 'admin'; // For server logs

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
              <Link
                className={`${styles.navLink} btn btn-link`}
                to="/"
              >
                TRA CỨU
              </Link>
              <Link
                className={`${styles.navLink} btn btn-link`}
                to="/reset-password"
              >
                HƯỚNG DẪN SỬ DỤNG
              </Link>
              {isAuthorizedForDiploma && (
                <button
                  className={`${styles.navLink} btn btn-link`}
                  onClick={() => handleNavClick('diploma')}
                >
                  QUẢN LÝ LOẠI BẰNG
                </button>
              )}
              {isAuthorizedForUser && (
                <button
                  className={`${styles.navLink} btn btn-link`}
                  onClick={() => handleNavClick('user')}
                >
                  QUẢN LÝ NGƯỜI DÙNG
                </button>
              )}
              {isAuthorizedForIssuer && (
                <button
                  className={`${styles.navLink} btn btn-link`}
                  onClick={() => handleNavClick('issuer')}
                >
                  QUẢN LÝ ĐƠN VỊ
                </button>
              )}
              {isAuthorizedForDegree && (
                <button
                  className={`${styles.navLink} btn btn-link`}
                  onClick={() => handleNavClick('degree')}
                >
                  QUẢN LÝ VĂN BẰNG
                </button>
              )}
              {isAuthorizedForLogs && (
                <Link
                  className={`${styles.navLink} btn btn-link`}
                  to="/admin/logs"
                >
                  QUẢN LÝ LOG
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {isAuthorizedForDiploma && isDiplomaMenuOpen && (
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

      {isAuthorizedForUser && isUserMenuOpen && (
        <div className={`${styles.Subtab} d-flex text-white text-center border-top`}>
          <div
            className="flex-fill py-2 border-end"
            style={{ cursor: 'pointer' }}
            onClick={() => handleSubClick('/adduser')}
          >
            Tạo người dùng
          </div>
          <div
            className="flex-fill py-2"
            style={{ cursor: 'pointer' }}
            onClick={() => handleSubClick('/listuser')}
          >
            Danh sách người dùng
          </div>
        </div>
      )}

      {isAuthorizedForIssuer && isIssuerMenuOpen && (
        <div className={`${styles.Subtab} d-flex text-white text-center border-top`}>
          <div
            className="flex-fill py-2 border-end"
            style={{ cursor: 'pointer' }}
            onClick={() => handleSubClick('/addissuer')}
          >
            Tạo đơn vị
          </div>
          <div
            className="flex-fill py-2"
            style={{ cursor: 'pointer' }}
            onClick={() => handleSubClick('/listissuer')}
          >
            Danh sách đơn vị
          </div>
        </div>
      )}

      {isAuthorizedForDegree && isDegreeMenuOpen && (
        <div className={`${styles.Subtab} d-flex text-white text-center border-top`}>
          <div
            className="flex-fill py-2 border-end"
            style={{ cursor: 'pointer' }}
            onClick={() => handleSubClick('/adddegree')}
          >
            Tạo văn bằng
          </div>
          <div
            className="flex-fill py-2 border-end"
            style={{ cursor: 'pointer' }}
            onClick={() => handleSubClick('/adddegreeimage')}
          >
            Tải lên hình ảnh
          </div>
          <div
            className="flex-fill py-2 border-end"
            style={{ cursor: 'pointer' }}
            onClick={() => handleSubClick('/adddegreeexcel')}
          >
            Tải lên Excel
          </div>
          <div
            className="flex-fill py-2"
            style={{ cursor: 'pointer' }}
            onClick={() => handleSubClick('/listdegree')}
          >
            Danh sách văn bằng
          </div>
        </div>
      )}
    </>
  );
};

export default Header;