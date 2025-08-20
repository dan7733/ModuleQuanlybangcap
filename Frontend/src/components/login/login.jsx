import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Context } from './context';
import styles from './login.module.css';
import logo from '../../assets/logo/logoDHCT.png';
import bgImage from '../../assets/background/TruongDHCT.png';
import { login, account, loginWithGoogleAPI } from './userService';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loginContext, refreshAccessToken } = useContext(Context);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleGoogleLogin = useCallback(
    async (response) => {
      console.log('Google response:', response, { timestamp: new Date().toISOString() });
      try {
        setIsSubmitting(true);
        const { credential } = response;
        if (!credential || typeof credential !== 'string' || credential.split('.').length !== 3) {
          throw new Error('Invalid JWT format');
        }

        const payload = JSON.parse(decodeURIComponent(escape(atob(credential.split('.')[1]))));
        console.log('Decoded payload:', payload, { timestamp: new Date().toISOString() });

        const googleId = payload.sub;
        const email = payload.email;
        const fullname = payload.name;

        const googleResponse = await loginWithGoogleAPI(googleId, email, fullname);
        console.log('Google API response:', googleResponse.data, { timestamp: new Date().toISOString() });
        if (googleResponse.data.errCode !== 0) {
          setErrorMessage(googleResponse.data.message);
          return;
        }

        const userData = {
          accessToken: googleResponse.data.accessToken,
          email: googleResponse.data.userDetails.email,
          fullname: googleResponse.data.userDetails.fullname,
          avatar: googleResponse.data.userDetails.avatar,
        };

        await loginContext(userData, true);
        await refreshAccessToken();

        const userResponse = await account();
        console.log('Account API response:', userResponse.data, { timestamp: new Date().toISOString() });
        if (!userResponse.data || userResponse.data.errCode !== 0) {
          throw new Error(userResponse.data.message || 'Invalid account data');
        }

        await loginContext(
          {
            ...userData,
            email: userResponse.data.data.user,
            fullname: userResponse.data.data.fullname,
            avatar: userResponse.data.data.avatar,
            role: userResponse.data.data.role,
          },
          true
        );
        navigate('/');
      } catch (err) {
        console.error('Google login error:', err, { timestamp: new Date().toISOString() });
        setErrorMessage('Đăng nhập Google không thành công. Vui lòng thử lại!');
      } finally {
        setIsSubmitting(false);
      }
    },
    [loginContext, refreshAccessToken, navigate]
  );

  useEffect(() => {
    if (window.google) {
      console.log('Google API loaded successfully', { timestamp: new Date().toISOString() });
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin,
      });
      const buttonDiv = document.getElementById('googleSignInButton');
      if (buttonDiv) {
        console.log('Rendering Google button', { timestamp: new Date().toISOString() });
        window.google.accounts.id.renderButton(buttonDiv, {
          theme: 'outline',
          size: 'large',
        });
      } else {
        console.error('Google button div not found', { timestamp: new Date().toISOString() });
      }
    } else {
      console.error('Google API not loaded', { timestamp: new Date().toISOString() });
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => {
        console.log('Google API script loaded dynamically', { timestamp: new Date().toISOString() });
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          callback: handleGoogleLogin,
        });
        const buttonDiv = document.getElementById('googleSignInButton');
        if (buttonDiv) {
          window.google.accounts.id.renderButton(buttonDiv, {
            theme: 'outline',
            size: 'large',
          });
        }
      };
      document.body.appendChild(script);
    }
  }, [handleGoogleLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

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
      setIsSubmitting(false);
      return;
    }

    try {
      const loginResponse = await login(email, password);

      if (!loginResponse || !loginResponse.data || typeof loginResponse.data.errCode !== 'number') {
        console.error('Invalid login response:', loginResponse, { timestamp: new Date().toISOString() });
        setErrorMessage('Phản hồi từ server không hợp lệ. Vui lòng thử lại!');
        return;
      }

      if (loginResponse.data.errCode !== 0) {
        console.log('Login failed:', loginResponse.data, { timestamp: new Date().toISOString() });
        const errorMessages = {
          1: 'Tài khoản hoặc mật khẩu không đúng',
          2: 'Tài khoản đã bị khóa hoặc không hoạt động',
        };
        setErrorMessage(errorMessages[loginResponse.data.errCode] || 'Đăng nhập không thành công. Vui lòng thử lại!');
        return;
      }

      const userData = {
        accessToken: loginResponse.data.accessToken,
        email: email,
      };

      await loginContext(userData, remember);
      await refreshAccessToken();

      const userResponse = await account();
      if (!userResponse.data || userResponse.data.errCode !== 0) {
        throw new Error('Không lấy được thông tin tài khoản');
      }

      await loginContext(
        {
          ...userData,
          email: userResponse.data.data.user,
          fullname: userResponse.data.data.fullname,
          avatar: userResponse.data.data.avatar,
          role: userResponse.data.data.role,
        },
        remember
      );

      navigate('/');
    } catch (err) {
      console.error('Login error:', {
        message: err.message,
        response: err.response ? err.response.data : null,
        status: err.response ? err.response.status : null,
        timestamp: new Date().toISOString(),
      });

      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        const errorMessages = {
          1: 'Tài khoản hoặc mật khẩu không đúng',
          2: 'Tài khoản đã bị khóa hoặc không hoạt động',
        };
        const errCode = err.response.data?.errCode;
        setErrorMessage(errorMessages[errCode] || 'Đăng nhập không thành công. Vui lòng thử lại!');
      } else {
        setErrorMessage('Đăng nhập không thành công. Vui lòng thử lại!');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${styles.loginContainer}`}>
      <div className='row g-0 min-vh-100'>
        <div
          className={`col-md-8 ${styles.leftImage}`}
          style={{ backgroundImage: `url(${bgImage})` }}
        ></div>
        <div className='col-md-4 d-flex align-items-center justify-content-center'>
          <div className='w-100 px-3 text-center'>
            <img src={logo} alt='Logo' className={styles.logo} />
            <h4 className='fw-bold mb-1'>ĐẠI HỌC CẦN THƠ</h4>
            <h6 className='mb-4'>CAN THO UNIVERSITY</h6>
            <div className={`${styles.loginBox} mx-auto`}>
              <h6 className='fw-bold mb-3'>ĐĂNG NHẬP</h6>
              {errorMessage && (
                <div className='alert alert-danger' role='alert'>
                  {errorMessage}
                </div>
              )}
              <form onSubmit={handleSubmit} noValidate>
                <div className='mb-3 text-start'>
                  <input
                    type='email'
                    className={`form-control ${styles.input} ${errors.email ? 'is-invalid' : ''}`}
                    placeholder='Email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                  {errors.email && <div className='text-danger small mt-1'>{errors.email}</div>}
                </div>
                <div className='mb-3 text-start'>
                  <input
                    type='password'
                    className={`form-control ${styles.input} ${errors.password ? 'is-invalid' : ''}`}
                    placeholder='Mật khẩu'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                  {errors.password && <div className='text-danger small mt-1'>{errors.password}</div>}
                </div>
                <div className='mb-3 form-check text-start'>
                  <input
                    type='checkbox'
                    className='form-check-input'
                    id='rememberMe'
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <label className='form-check-label' htmlFor='rememberMe'>
                    Ghi nhớ đăng nhập
                  </label>
                </div>
                <button
                  type='submit'
                  className={`btn ${styles.btnLogin} w-100 mb-2`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    'Xác nhận'
                  )}
                </button>
                <hr />
                <div id='googleSignInButton' className='mb-2'></div>
                <div className='small'>
                  <Link to='/forgot-password' className={styles.link}>
                    Quên mật khẩu?
                  </Link>
                </div>
              </form>
            </div>
            <div className='text-center mt-4'>
              <small>
                All Rights Reserved. Developed by{' '}
                <Link to='/cusc' className={styles.link}>
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