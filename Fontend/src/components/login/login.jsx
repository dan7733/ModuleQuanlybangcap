import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Context } from './context';
import styles from './login.module.css';
import logo from '../../assets/logo/logoDHCT.png';
import bgImage from '../../assets/background/TruongDHCT.png';
import { login, account } from './userService';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const { loginContext } = useContext(Context);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validate input
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    if (!password.trim()) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    }
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Call login API
    try {
      const loginResponse = await login(email, password);
      if (loginResponse.data.errCode !== 0) {
        setErrorMessage(loginResponse.data.message);
        return;
      }

      const userData = {
        accessToken: loginResponse.data.accessToken,
      };

      loginContext(userData, remember);

      // Thêm độ trễ để đảm bảo storage được cập nhật
      await new Promise((resolve) => setTimeout(resolve, 100));

      const userResponse = await account();
      if (!userResponse.data || userResponse.data.errCode !== 0) {
        throw new Error(userResponse.data.message || 'Invalid account data');
      }

      loginContext(
        {
          ...userData,
          email: userResponse.data.data.user,
          fullname: userResponse.data.data.fullname,
          avatar: userResponse.data.data.avatar,
        },
        remember
      );

      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage(
        err.message.includes('No access token available')
          ? 'Phiên đăng nhập không hợp lệ. Vui lòng thử lại!'
          : 'Đăng nhập không thành công. Vui lòng thử lại!'
      );
    }
  };

  return (
    <div className={`container-fluid ${styles.loginContainer}`}>
      <div className="row g-0 min-vh-100">
        {/* Bên trái: ảnh nền */}
        <div
          className={`col-md-8 ${styles.leftImage}`}
          style={{ backgroundImage: `url(${bgImage})` }}
        ></div>

        {/* Bên phải: form */}
        <div className="col-md-4 d-flex align-items-center justify-content-center">
          <div className="w-100 px-3 text-center">
            <img src={logo} alt="Logo" className={styles.logo} />
            <h4 className="fw-bold mb-1">ĐẠI HỌC CẦN THƠ</h4>
            <h6 className="mb-4">CAN THO UNIVERSITY</h6>

            <div className={`${styles.loginBox} mx-auto`}>
              <h6 className="fw-bold mb-3">ĐĂNG NHẬP</h6>
              {errorMessage && (
                <div className="alert alert-danger" role="alert">
                  {errorMessage}
                </div>
              )}
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3 text-start">
                  <input
                    type="email"
                    className={`form-control ${styles.input} ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {errors.email && (
                    <div className="text-danger small mt-1">{errors.email}</div>
                  )}
                </div>

                <div className="mb-3 text-start">
                  <input
                    type="password"
                    className={`form-control ${styles.input} ${errors.password ? 'is-invalid' : ''}`}
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {errors.password && (
                    <div className="text-danger small mt-1">{errors.password}</div>
                  )}
                </div>

                <div className="mb-3 form-check text-start">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="rememberMe"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="rememberMe">
                    Ghi nhớ đăng nhập
                  </label>
                </div>

                <button type="submit" className={`btn ${styles.btnLogin} w-100 mb-2`}>
                  Xác nhận
                </button>

                <hr />
                <div className="small">
                  Đăng nhập bằng: <i className="bi bi-google"></i>
                  <br />
                  <Link to="/forgot-password" className={styles.link}>
                    Quên mật khẩu?
                  </Link>
                </div>
              </form>
            </div>

            <div className="text-center mt-4">
              <small>
                All Rights Reserved. Developed by{' '}
                <Link to="/cusc" className={styles.link}>
                  Cusc
                </Link>
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;