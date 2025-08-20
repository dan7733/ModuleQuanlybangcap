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
  const [isDegreeMenuOpen, setIsDegreeMenuOpen] = useState(false);
  const [isVerificationMenuOpen, setIsVerificationMenuOpen] = useState(false); // Thêm state cho menu duyệt

  // Xử lý khi nhấp vào các mục điều hướng
  const handleNavClick = (menu) => {
    console.log('Nav clicked:', menu);
    if (menu === 'diploma') {
      setIsDiplomaMenuOpen((prev) => !prev);
      setIsUserMenuOpen(false);
      setIsIssuerMenuOpen(false);
      setIsDegreeMenuOpen(false);
      setIsVerificationMenuOpen(false);
    } else if (menu === 'user') {
      setIsUserMenuOpen((prev) => !prev);
      setIsDiplomaMenuOpen(false);
      setIsIssuerMenuOpen(false);
      setIsDegreeMenuOpen(false);
      setIsVerificationMenuOpen(false);
    } else if (menu === 'issuer') {
      setIsIssuerMenuOpen((prev) => !prev);
      setIsDiplomaMenuOpen(false);
      setIsUserMenuOpen(false);
      setIsDegreeMenuOpen(false);
      setIsVerificationMenuOpen(false);
    } else if (menu === 'degree') {
      setIsDegreeMenuOpen((prev) => !prev);
      setIsDiplomaMenuOpen(false);
      setIsUserMenuOpen(false);
      setIsIssuerMenuOpen(false);
      setIsVerificationMenuOpen(false);
    } else if (menu === 'verification') {
      setIsVerificationMenuOpen((prev) => !prev);
      setIsDiplomaMenuOpen(false);
      setIsUserMenuOpen(false);
      setIsIssuerMenuOpen(false);
      setIsDegreeMenuOpen(false);
    }
  };

  // Xử lý khi nhấp vào mục submenu
  const handleSubClick = (path) => {
    console.log('Submenu clicked:', path);
    navigate(path);
    setIsDiplomaMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsIssuerMenuOpen(false);
    setIsDegreeMenuOpen(false);
    setIsVerificationMenuOpen(false);
  };

  // Kiểm tra quyền truy cập cho các menu
  const isAuthorizedForDiploma = user?.auth && ['admin', 'certifier'].includes(user?.role); // Quyền cho Quản lý loại bằng
  const isAuthorizedForUser = user?.auth && user?.role === 'admin'; // Quyền cho Quản lý người dùng
  const isAuthorizedForIssuer = user?.auth && user?.role === 'admin'; // Quyền cho Quản lý đơn vị
  const isAuthorizedForDegree = user?.auth && ['admin', 'manager'].includes(user?.role); // Quyền cho Quản lý văn bằng
  const isAuthorizedForLogs = user?.auth && user?.role === 'admin'; // Quyền cho Quản lý log
  const isAuthorizedForVerification = user?.auth && ['admin', 'certifier'].includes(user?.role); // Quyền cho Quản lý duyệt

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
              {/* Hiển thị menu Quản lý loại bằng nếu có quyền admin hoặc certifier */}
              {isAuthorizedForDiploma && (
                <button
                  className={`${styles.navLink} btn btn-link`}
                  onClick={() => handleNavClick('diploma')}
                >
                  QUẢN LÝ LOẠI BẰNG
                </button>
              )}
              {/* Hiển thị menu Quản lý người dùng nếu có quyền admin */}
              {isAuthorizedForUser && (
                <button
                  className={`${styles.navLink} btn btn-link`}
                  onClick={() => handleNavClick('user')}
                >
                  QUẢN LÝ NGƯỜI DÙNG
                </button>
              )}
              {/* Hiển thị menu Quản lý đơn vị nếu có quyền admin */}
              {isAuthorizedForIssuer && (
                <button
                  className={`${styles.navLink} btn btn-link`}
                  onClick={() => handleNavClick('issuer')}
                >
                  QUẢN LÝ ĐƠN VỊ
                </button>
              )}
              {/* Hiển thị menu Quản lý văn bằng nếu có quyền admin hoặc manager */}
              {isAuthorizedForDegree && (
                <button
                  className={`${styles.navLink} btn btn-link`}
                  onClick={() => handleNavClick('degree')}
                >
                  QUẢN LÝ VĂN BẰNG
                </button>
              )}
              {/* Hiển thị menu Quản lý log nếu có quyền admin */}
              {isAuthorizedForLogs && (
                <button
                  className={`${styles.navLink} btn btn-link`}
                  onClick={() => handleSubClick('/admin/logs')}
                >
                  QUẢN LÝ LOG
                </button>
              )}
              {/* Hiển thị menu Quản lý duyệt nếu có quyền admin hoặc certifier */}
              {isAuthorizedForVerification && (
                <button
                  className={`${styles.navLink} btn btn-link`}
                  onClick={() => handleNavClick('verification')}
                >
                  QUẢN LÝ DUYỆT
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Submenu cho Quản lý loại bằng */}
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

      {/* Submenu cho Quản lý người dùng */}
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

      {/* Submenu cho Quản lý đơn vị */}
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

      {/* Submenu cho Quản lý văn bằng */}
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

      {/* Submenu cho Quản lý duyệt */}
      {isAuthorizedForVerification && isVerificationMenuOpen && (
        <div className={`${styles.Subtab} d-flex text-white text-center border-top`}>
          <div
            className="flex-fill py-2"
            style={{ cursor: 'pointer' }}
            onClick={() => handleSubClick('/listverificationdegree')}
          >
            Danh sách duyệt
          </div>
        </div>
      )}
    </>
  );
};

export default Header;