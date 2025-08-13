import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Context } from '../login/context';
import styles from './topbar.module.css';
import logo from '../../assets/logo/logoDHCT.png';
import DFavatar from '../../assets/avatar/avatar.png';

const Topbar = () => {
  const navigate = useNavigate();
  const { user, logoutContext } = useContext(Context);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState({ code: 'vi', name: 'Tiếng Việt', flag: 'https://flagcdn.com/w40/vn.png' });

  const languages = [
    { code: 'vi', name: 'Tiếng Việt', flag: 'https://flagcdn.com/w40/vn.png' },
    { code: 'en', name: 'English', flag: 'https://flagcdn.com/w40/gb.png' },
    { code: 'fr', name: 'Français', flag: 'https://flagcdn.com/w40/fr.png' },
    { code: 'es', name: 'Español', flag: 'https://flagcdn.com/w40/es.png' },
    { code: 'zh-CN', name: '中文 (简体)', flag: 'https://flagcdn.com/w40/cn.png' },
    { code: 'ja', name: '日本語', flag: 'https://flagcdn.com/w40/jp.png' },
    { code: 'ko', name: '한국어', flag: 'https://flagcdn.com/w40/kr.png' },
  ];

  const handleLogout = async () => {
    try {
      await logoutContext();
      setUserDropdownOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
    setLanguageDropdownOpen(false); // Đóng dropdown ngôn ngữ khi mở dropdown người dùng
  };

  const toggleLanguageDropdown = () => {
    setLanguageDropdownOpen(!languageDropdownOpen);
    setUserDropdownOpen(false); // Đóng dropdown người dùng khi mở dropdown ngôn ngữ
  };

  const changeLanguage = (lang) => {
    setSelectedLanguage(lang);
    setLanguageDropdownOpen(false);
  };

  // Xác định URL avatar
  const avatarUrl = user?.avatar
    ? `${process.env.REACT_APP_API_URL}/images/avatars/${user.avatar}`
    : DFavatar;

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
            <button className={`btn btn-light btn-sm d-flex align-items-center gap-1 ${styles.languageButton}`} onClick={toggleLanguageDropdown}>
              <img src={selectedLanguage.flag} alt={selectedLanguage.name} width="20" />
              {selectedLanguage.name} <i className="fa-solid fa-chevron-down"></i>
            </button>
            {languageDropdownOpen && (
              <div className={styles.languageDropdown}>
                {languages.map((lang) => (
                  <div
                    key={lang.code}
                    className={styles.languageItem}
                    onClick={() => changeLanguage(lang)}
                  >
                    <img src={lang.flag} alt={lang.name} width="20" /> {lang.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="detailproduct-login">
            {user?.auth ? (
              <div className="dropdown">
                <button className="btn btn-light btn-sm d-flex align-items-center gap-1" onClick={toggleUserDropdown}>
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className={styles.avatar}
                    style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                  />
                  Xin chào, {user.fullname || 'Người dùng'} <i className="fa-solid fa-chevron-down"></i>
                </button>
                {userDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    <Link to="/account" className={styles.dropdownItem} onClick={() => setUserDropdownOpen(false)}>
                      <i className="fa-solid fa-user"></i> Thông tin tài khoản
                    </Link>
                    <div className={styles.dropdownItem} onClick={handleLogout}>
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

      <div className={`d-flex d-md-none align-items-center ${styles.mobileHeaderTop}`}>
        <div className="d-flex align-items-center gap-3">
          <div className="dropdown">
            <button className={`btn btn-light btn-sm d-flex align-items-center gap-1 ${styles.languageButton}`} onClick={toggleLanguageDropdown}>
              <img src={selectedLanguage.flag} alt={selectedLanguage.name} width="20" />
              {selectedLanguage.name} <i className="fa-solid fa-chevron-down"></i>
            </button>
            {languageDropdownOpen && (
              <div className={styles.languageDropdown}>
                {languages.map((lang) => (
                  <div
                    key={lang.code}
                    className={styles.languageItem}
                    onClick={() => changeLanguage(lang)}
                  >
                    <img src={lang.flag} alt={lang.name} width="20" /> {lang.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="detailproduct-login-mobile">
            {user?.auth ? (
              <div className="dropdown">
                <button className="btn btn-light btn-sm d-flex align-items-center gap-1" onClick={toggleUserDropdown}>
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className={styles.avatar}
                    style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                  />
                  Xin chào, {user.fullname || 'Người dùng'} <i className="fa-solid fa-chevron-down"></i>
                </button>
                {userDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    <Link to={`/account/${user.username}`} className={styles.dropdownItem} onClick={() => setUserDropdownOpen(false)}>
                      <i className="fa-solid fa-user"></i> Thông tin tài khoản
                    </Link>
                    <div className={styles.dropdownItem} onClick={handleLogout}>
                      <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button className="btn btn-light btn-sm d-flex align-items-center gap-1" onClick={() => navigate('/login')}>
                <i className="fa-solid fa-user"></i> Đăng Nhập
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Topbar;