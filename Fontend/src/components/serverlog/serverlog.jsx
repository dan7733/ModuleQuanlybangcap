import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Context } from '../login/context'; // Adjust path as needed
import styles from './serverlog.module.css';

const ServerLog = () => {
  const navigate = useNavigate();
  const { user } = useContext(Context);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [logContent, setLogContent] = useState([]);
  const [filteredLogContent, setFilteredLogContent] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState(''); // Start time for range
  const [endTime, setEndTime] = useState(''); // End time for range
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logType, setLogType] = useState('all'); // 'all', 'error', 'application'
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  // Hàm lấy accessToken
  const getAccessToken = () => {
    const userData = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    return userData.accessToken || null;
  };

  // Kiểm tra xác thực và vai trò
  useEffect(() => {
    if (!user || !user.auth || user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const fetchLogFiles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = getAccessToken();
      if (!token) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
        return;
      }
      const response = await axios.get(`${API_URL}/api/v1/logs/files`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles(response.data.data || []);
      if (response.data.data.length === 0) {
        setError('Không tìm thấy file log nào.');
      }
    } catch (error) {
      console.error('Error fetching log files:', error);
      setError(`Lỗi khi tải danh sách log: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      if (error.response?.status === 404) {
        setError('Endpoint /api/v1/logs/files không tồn tại. Vui lòng kiểm tra cấu hình server.');
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        setError('Phiên đăng nhập hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, API_URL]);

  const fetchLogContent = async (file) => {
    setLoading(true);
    setError('');
    setSearchQuery('');
    setStartTime('');
    setEndTime('');
    try {
      const token = getAccessToken();
      if (!token) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
        return;
      }
      const response = await axios.get(`${API_URL}/api/v1/logs/${file}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const content = response.data.data || [];
      setLogContent(content);
      setFilteredLogContent(content);
      setSelectedFile(file);
    } catch (error) {
      console.error('Error fetching log content:', error);
      setError(`Lỗi khi tải nội dung log: ${error.response?.data?.message || error.message}`);
      setLogContent([]);
      setFilteredLogContent([]);
    } finally {
      setLoading(false);
    }
  };

  // Load danh sách file khi component mount
  useEffect(() => {
    fetchLogFiles();
  }, [fetchLogFiles]);

  // Handle file selection
  const handleFileSelect = (file) => {
    setSelectedFile(file);
    if (file) {
      fetchLogContent(file);
    } else {
      setLogContent([]);
      setFilteredLogContent([]);
      setSearchQuery('');
      setStartTime('');
      setEndTime('');
      setError('');
    }
  };

  // Handle search query
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    applyFilters(query, startTime, endTime);
  };

  // Handle date filter
  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    setSelectedFile('');
    setLogContent([]);
    setFilteredLogContent([]);
    setSearchQuery('');
    setStartTime('');
    setEndTime('');
    setError('');
  };

  // Handle time range filter
  const handleStartTimeChange = (e) => {
    const time = e.target.value;
    setStartTime(time);
    applyFilters(searchQuery, time, endTime);
  };

  const handleEndTimeChange = (e) => {
    const time = e.target.value;
    setEndTime(time);
    applyFilters(searchQuery, startTime, time);
  };

  // Apply search and time range filters
  const applyFilters = (query, start, end) => {
    let filtered = logContent;
    if (start && end) {
      // Extract HH:mm:ss from log lines and compare
      filtered = filtered.filter((line) => {
        const timeMatch = line.match(/^\d{4}-\d{2}-\d{2} (\d{2}:\d{2}:\d{2})/);
        if (!timeMatch) return false;
        const logTime = timeMatch[1];
        // Convert times to seconds for comparison
        const logSeconds = timeToSeconds(logTime);
        const startSeconds = timeToSeconds(start + ':00');
        const endSeconds = timeToSeconds(end + ':59');
        return logSeconds >= startSeconds && logSeconds <= endSeconds;
      });
    } else if (start) {
      filtered = filtered.filter((line) => {
        const timeMatch = line.match(/^\d{4}-\d{2}-\d{2} (\d{2}:\d{2}:\d{2})/);
        if (!timeMatch) return false;
        const logTime = timeMatch[1];
        const startSeconds = timeToSeconds(start + ':00');
        return timeToSeconds(logTime) >= startSeconds;
      });
    } else if (end) {
      filtered = filtered.filter((line) => {
        const timeMatch = line.match(/^\d{4}-\d{2}-\d{2} (\d{2}:\d{2}:\d{2})/);
        if (!timeMatch) return false;
        const logTime = timeMatch[1];
        const endSeconds = timeToSeconds(end + ':59');
        return timeToSeconds(logTime) <= endSeconds;
      });
    }
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter((line) => line.toLowerCase().includes(lowerQuery));
    }
    setFilteredLogContent(filtered);
  };

  // Helper to convert HH:mm:ss to seconds
  const timeToSeconds = (time) => {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  };

  // Group files by date
  const groupFilesByDate = () => {
    const grouped = {};
    files
      .filter((file) => {
        if (logType === 'all') return true;
        return file.startsWith(`${logType}-`);
      })
      .filter((file) => {
        if (!selectedDate) return true;
        return file.includes(selectedDate);
      })
      .forEach((file) => {
        const dateMatch = file.match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch) {
          const date = dateMatch[0];
          if (!grouped[date]) {
            grouped[date] = { error: null, application: null };
          }
          if (file.startsWith('error-')) {
            grouped[date].error = file;
          } else if (file.startsWith('application-')) {
            grouped[date].application = file;
          }
        }
      });
    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
  };

  // Handle log type filter
  const handleLogTypeChange = (type) => {
    setLogType(type);
    setSelectedFile('');
    setLogContent([]);
    setFilteredLogContent([]);
    setSearchQuery('');
    setStartTime('');
    setEndTime('');
    setError('');
  };

  // Format date for display
  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.borderBox}>
          <h4 className={styles.title}>Xem Log Hệ Thống</h4>

          {error && (
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-circle me-2"></i>{error}
            </div>
          )}
          {loading && (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className={styles.label}>Lọc theo loại log</label>
            <div className={styles.filterGroup}>
              <button
                className={`${styles.filterBtn} ${logType === 'all' ? styles.active : ''}`}
                onClick={() => handleLogTypeChange('all')}
                disabled={loading}
              >
                Tất cả
              </button>
              <button
                className={`${styles.filterBtn} ${logType === 'error' ? styles.active : ''}`}
                onClick={() => handleLogTypeChange('error')}
                disabled={loading}
              >
                Error
              </button>
              <button
                className={`${styles.filterBtn} ${logType === 'application' ? styles.active : ''}`}
                onClick={() => handleLogTypeChange('application')}
                disabled={loading}
              >
                Application
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className={styles.label}>Chọn ngày log</label>
            <input
              type="date"
              className={styles.dateInput}
              value={selectedDate}
              onChange={handleDateChange}
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            {groupFilesByDate().length > 0 ? (
              <div className={styles.logGrid}>
                {groupFilesByDate().map(([date, logs]) => (
                  <div key={date} className={styles.logCard}>
                    <h6 className={styles.cardTitle}>{formatDate(date)}</h6>
                    <div className={styles.buttonGroup}>
                      {logs.error && (
                        <button
                          className={`${styles.logBtn} ${
                            selectedFile === logs.error ? styles.active : ''
                          }`}
                          onClick={() => handleFileSelect(logs.error)}
                          disabled={loading}
                        >
                          Error
                        </button>
                      )}
                      {logs.application && (
                        <button
                          className={`${styles.logBtn} ${
                            selectedFile === logs.application ? styles.active : ''
                          }`}
                          onClick={() => handleFileSelect(logs.application)}
                          disabled={loading}
                        >
                          Application
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">Không có log nào cho ngày hoặc loại đã chọn.</p>
            )}
          </div>

          {selectedFile && (
            <div className="mb-4">
              <label className={styles.label}>Lọc theo khoảng thời gian</label>
              <div className={styles.timeRangeWrapper}>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={startTime}
                  onChange={handleStartTimeChange}
                  placeholder="Từ giờ"
                  disabled={loading}
                />
                <span className={styles.timeSeparator}>–</span>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={endTime}
                  onChange={handleEndTimeChange}
                  placeholder="Đến giờ"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {selectedFile && (
            <div className="mb-4">
              <label className={styles.label}>Tìm kiếm trong log</label>
              <div className={styles.searchWrapper}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Nhập từ khóa (VD: INFO, Token)"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  disabled={loading}
                />
                <i className="fas fa-search"></i>
              </div>
            </div>
          )}

          <div className={styles.logContent}>
            {filteredLogContent.length > 0 ? (
              filteredLogContent.map((line, index) => (
                <p key={index} className={styles.logLine}>
                  {line}
                </p>
              ))
            ) : (
              !loading && (
                <p className="text-muted">
                  {searchQuery || startTime || endTime
                    ? 'Không tìm thấy kết quả phù hợp.'
                    : 'Chưa chọn file hoặc không có nội dung.'}
                </p>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerLog;