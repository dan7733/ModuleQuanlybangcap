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

  const handleNavClick = (menu) => {
    console.log('Nav clicked:', menu, 'Current isDiplomaMenuOpen:', isDiplomaMenuOpen, 'Current isUserMenuOpen:', isUserMenuOpen, 'Current isIssuerMenuOpen:', isIssuerMenuOpen);
    if (menu === 'diploma') {
      setIsDiplomaMenuOpen((prev) => !prev);
      setIsUserMenuOpen(false);
      setIsIssuerMenuOpen(false);
    } else if (menu === 'user') {
      setIsUserMenuOpen((prev) => !prev);
      setIsDiplomaMenuOpen(false);
      setIsIssuerMenuOpen(false);
    } else if (menu === 'issuer') {
      setIsIssuerMenuOpen((prev) => !prev);
      setIsDiplomaMenuOpen(false);
      setIsUserMenuOpen(false);
    }
  };

  const handleSubClick = (path) => {
    console.log('Submenu clicked:', path);
    navigate(path);
    setIsDiplomaMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsIssuerMenuOpen(false);
  };

  const isAuthorizedForDiploma = user?.auth && ['admin', 'certifier'].includes(user?.role);
  const isAuthorizedForUser = user?.auth && user?.role === 'admin';
  const isAuthorizedForIssuer = user?.auth && user?.role === 'admin';

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
    </>
  );
};

export default Header;