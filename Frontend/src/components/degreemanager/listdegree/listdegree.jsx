import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Context } from '../../login/context';
import styles from './listdegree.module.css';
import CryptoJS from 'crypto-js';

// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const ListDegree = () => {
  const navigate = useNavigate();
  const { user } = useContext(Context);
  const [searchParams, setSearchParams] = useSearchParams();
  const [degrees, setDegrees] = useState([]);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const debouncedSearchTerm = useDebounce(searchInput, 500);
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');
  const [filterIssuer, setFilterIssuer] = useState(searchParams.get('issuerId') || '');
  const [filterDegreeType, setFilterDegreeType] = useState(searchParams.get('degreeTypeId') || '');
  const [filterIssueYear, setFilterIssueYear] = useState(searchParams.get('issueYear') || '');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sort') || 'desc');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteSerialNumber, setDeleteSerialNumber] = useState('');
  const [deleteInput, setDeleteInput] = useState('');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [issuers, setIssuers] = useState([]);
  const [degreeTypes, setDegreeTypes] = useState([]);
  const [issueYears, setIssueYears] = useState([]);
  const limit = 10;

  // Hàm để lấy accessToken từ localStorage hoặc sessionStorage
  const getAccessToken = () => {
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!userData) return null;
    try {
      const user = JSON.parse(CryptoJS.AES.decrypt(userData, process.env.REACT_APP_STORAGE_SECRET).toString(CryptoJS.enc.Utf8));
      return user?.accessToken || null;
    } catch {
      return null;
    }
  };

  // Check authentication and role
  useEffect(() => {
    if (!user || !user.auth || !['admin', 'manager'].includes(user.role)) {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch issuers for filter dropdown (both admin and manager)
  const fetchIssuers = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/issuers/list`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      if (response.data.errCode === 0) {
        setIssuers(response.data.data.issuers || []);
      } else {
        setError('Không thể tải danh sách tổ chức.');
      }
    } catch (err) {
      console.error('Error fetching issuers:', err);
      setError('Lỗi khi tải danh sách tổ chức. Vui lòng thử lại.');
    }
  }, []);

  // Fetch degree types based on issuer
  const fetchDegreeTypes = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const params = {};
      if (filterIssuer) {
        params.issuerId = filterIssuer;
      } else {
        setDegreeTypes([]);
        return;
      }
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/degree-types/by-issuer`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        params,
        withCredentials: true,
      });
      if (response.data.errCode === 0) {
        setDegreeTypes(response.data.data || []);
      } else {
        setError('Không thể tải danh sách loại văn bằng.');
        setDegreeTypes([]);
      }
    } catch (err) {
      console.error('Error fetching degree types:', err);
      setError('Lỗi khi tải danh sách loại văn bằng. Vui lòng thử lại.');
      setDegreeTypes([]);
    }
  }, [filterIssuer]);

  // Fetch distinct issue years
  const fetchIssueYears = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const params = {};
      if (filterIssuer) {
        params.issuerId = filterIssuer;
      }
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/degrees/years`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        params,
        withCredentials: true,
      });
      if (response.data.errCode === 0) {
        setIssueYears(response.data.data.years || []);
      } else {
        setError('Không thể tải danh sách năm cấp.');
        setIssueYears([]);
      }
    } catch (err) {
      console.error('Error fetching issue years:', err);
      setError('Lỗi khi tải danh sách năm cấp. Vui lòng thử lại.');
      setIssueYears([]);
    }
  }, [filterIssuer]);

  // Fetch degrees with pagination, filtering, and sorting
  const fetchDegrees = useCallback(async () => {
    setLoading(true);
    setError('');
    const token = getAccessToken();
    if (!token) {
      setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      navigate('/login');
      setLoading(false);
      return;
    }

    try {
      const params = { page: currentPage, limit, sort: sortOrder };
      if (debouncedSearchTerm) params.search = debouncedSearchTerm;
      if (filterStatus) params.status = filterStatus;
      if (filterIssuer) params.issuerId = filterIssuer;
      if (filterDegreeType) params.degreeTypeId = filterDegreeType;
      if (filterIssueYear) params.issueYear = filterIssueYear;

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/degrees/list`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        params,
        withCredentials: true,
      });

      if (response.data.errCode === 0) {
        setDegrees(response.data.data.degrees || []);
        setTotalPages(response.data.data.totalPages || 1);
      } else {
        setError(response.data.message || 'Không thể tải danh sách văn bằng.');
      }
    } catch (err) {
      console.error('Error fetching degrees:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Phiên đăng nhập hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Lỗi khi tải danh sách văn bằng. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, currentPage, debouncedSearchTerm, filterStatus, filterIssuer, filterDegreeType, filterIssueYear, sortOrder]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchIssuers();
    fetchDegreeTypes();
    fetchIssueYears();
    fetchDegrees();
  }, [fetchIssuers, fetchDegreeTypes, fetchIssueYears, fetchDegrees]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set('search', value);
    else newParams.delete('search');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Handle search button click
  const handleSearchClick = () => {
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (searchInput) newParams.set('search', searchInput);
    else newParams.delete('search');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Handle status filter
  const handleStatusFilterChange = (e) => {
    const value = e.target.value;
    setFilterStatus(value);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set('status', value);
    else newParams.delete('status');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Handle issuer filter (both admin and manager)
  const handleIssuerFilterChange = (e) => {
    const value = e.target.value;
    setFilterIssuer(value);
    setFilterDegreeType(''); // Reset degree type when issuer changes
    setFilterIssueYear(''); // Reset issue year when issuer changes
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set('issuerId', value);
    else newParams.delete('issuerId');
    newParams.delete('degreeTypeId');
    newParams.delete('issueYear');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Handle degree type filter
  const handleDegreeTypeFilterChange = (e) => {
    const value = e.target.value;
    setFilterDegreeType(value);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set('degreeTypeId', value);
    else newParams.delete('degreeTypeId');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Handle issue year filter
  const handleIssueYearFilterChange = (e) => {
    const value = e.target.value;
    setFilterIssueYear(value);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set('issueYear', value);
    else newParams.delete('issueYear');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Handle sort order change
  const handleSortChange = (e) => {
    const value = e.target.value;
    setSortOrder(value);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', value);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Handle export to Excel
  const handleExportExcel = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    const token = getAccessToken();
    if (!token) {
      setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      navigate('/login');
      setLoading(false);
      return;
    }

    try {
      const params = {};
      if (debouncedSearchTerm) params.search = debouncedSearchTerm;
      if (filterStatus) params.status = filterStatus;
      if (filterIssuer) params.issuerId = filterIssuer;
      if (filterDegreeType) params.degreeTypeId = filterDegreeType;
      if (filterIssueYear) params.issueYear = filterIssueYear;
      params.sort = sortOrder;

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/degrees/export-excel`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        params,
        withCredentials: true,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `degrees_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess('Xuất file Excel thành công!');
    } catch (err) {
      console.error('Error exporting Excel:', err);
      setError('Lỗi khi xuất file Excel. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Handle add new, update, delete, upload to Mega
  const handleAddNew = () => navigate('/adddegree');
  const handleUpdate = (id) => navigate(`/updatedegree/${id}`);
  const handleDeleteClick = (id) => {
    const degree = degrees.find((d) => d._id === id);
    setDeleteId(id);
    setDeleteSerialNumber(degree ? degree.serialNumber : 'Unknown');
    setShowDeleteModal(true);
    setDeleteInput('');
    setError('');
    setSuccess('');
  };
  const handleDeleteConfirm = async () => {
    if (deleteInput !== `XÁC NHẬN XÓA ${deleteSerialNumber}`) {
      setError(`Vui lòng nhập đúng "XÁC NHẬN XÓA ${deleteSerialNumber}" để tiếp tục.`);
      return;
    }
    setLoading(true);
    const token = getAccessToken();
    if (!token) {
      setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      navigate('/login');
      setLoading(false);
      setShowDeleteModal(false);
      return;
    }
    try {
      const response = await axios.delete(`${process.env.REACT_APP_API_URL}/api/v1/degree/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      if (response.data.errCode === 0) {
        setDegrees(degrees.filter((d) => d._id !== deleteId));
        setSuccess('Xóa văn bằng thành công!');
        setShowDeleteModal(false);
        setError('');
        if (degrees.length === 1 && currentPage > 1) handlePageChange(currentPage - 1);
      } else {
        setError(response.data.message || 'Không thể xóa văn bằng.');
      }
    } catch (err) {
      console.error('Error deleting degree:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Phiên đăng nhập hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
        navigate('/login');
        setShowDeleteModal(false);
      } else {
        setError(err.response?.data?.message || 'Lỗi khi xóa văn bằng.');
      }
    } finally {
      setLoading(false);
    }
  };
  const handleUploadToMega = async (degreeId, fileAttachment) => {
    setLoading(true);
    setError('');
    setSuccess('');
    const token = getAccessToken();
    if (!token) {
      setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      navigate('/login');
      setLoading(false);
      return;
    }
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/v1/degree/${degreeId}/upload-to-mega`,
        { fileAttachment },
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );
      if (response.data.errCode === 0) {
        setSuccess('Tải lên Mega.nz thành công!');
        setDegrees(
          degrees.map((d) =>
            d._id === degreeId ? { ...d, cloudFile: response.data.data.cloudFile } : d
          )
        );
      } else {
        setError(response.data.message || 'Không thể tải lên Mega.nz.');
      }
    } catch (err) {
      console.error('Error uploading to Mega:', err);
      setError(err.response?.data?.message || 'Lỗi khi tải lên Mega.nz. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };
  const handleReUploadToMega = async (degreeId, fileAttachment) => {
    setLoading(true);
    setError('');
    setSuccess('');
    const token = getAccessToken();
    if (!token) {
      setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      navigate('/login');
      setLoading(false);
      return;
    }
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/v1/degree/${degreeId}/reupload-file`,
        { fileAttachment },
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );
      if (response.data.errCode === 0) {
        setSuccess('Tải lại lên Mega.nz thành công!');
        setDegrees(
          degrees.map((d) =>
            d._id === degreeId ? { ...d, cloudFile: response.data.data.cloudFile, fileAttachment: response.data.data.fileAttachment } : d
          )
        );
      } else {
        setError(response.data.message || 'Không thể tải lại lên Mega.nz.');
      }
    } catch (err) {
      console.error('Error re-uploading to Mega:', err);
      setError(err.response?.data?.message || 'Lỗi khi tải lại lên Mega.nz. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };
  const handleCloseModal = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
    setDeleteSerialNumber('');
    setDeleteInput('');
    setError('');
  };
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      const newParams = new URLSearchParams(searchParams);
      newParams.set('page', page);
      setSearchParams(newParams);
    }
  };
  const buildPageUrl = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page);
    return `${params.toString()}`;
  };
  const renderPagination = () => {
    const pages = [];
    pages.push(1);
    if (currentPage > 4) pages.push('...');
    const startPage = Math.max(2, currentPage - 2);
    const endPage = Math.min(totalPages - 1, currentPage + 2);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    if (currentPage < totalPages - 3) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.container}>
        <div className={styles.borderBox}>
          <h4 className={styles.pageTitle}>Danh sách văn bằng</h4>

          {success && !showDeleteModal && <div className={styles.alertSuccess}>{success}</div>}
          {error && !showDeleteModal && <div className={styles.alertDanger}>{error}</div>}
          {loading && (
            <div className={styles.fullScreenLoading}>
              <div className={styles.loadingContent}>
                <div className={styles.spinner}></div>
                <p className={styles.loadingText}>Đang tải...</p>
              </div>
            </div>
          )}

          <div className={styles.filterGroup}>
            <div className={styles.searchGroup}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Tìm kiếm theo tên, số hiệu, số vào sổ..."
                value={searchInput}
                onChange={handleSearchChange}
                aria-label="Tìm kiếm văn bằng"
                disabled={loading}
              />
              <button
                type="button"
                className={styles.btnSearch}
                onClick={handleSearchClick}
                disabled={loading}
                aria-label="Tìm kiếm"
              >
                Tìm kiếm
              </button>
            </div>
            <select
              className={styles.filterSelect}
              value={filterStatus}
              onChange={handleStatusFilterChange}
              aria-label="Lọc theo trạng thái"
              disabled={loading}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Pending">Chờ duyệt</option>
              <option value="Approved">Đã duyệt</option>
              <option value="Rejected">Đã từ chối</option>
            </select>
            <select
              className={styles.filterSelect}
              value={filterIssuer}
              onChange={handleIssuerFilterChange}
              aria-label="Lọc theo đơn vị cấp"
              disabled={loading}
            >
              <option value="">Tất cả đơn vị cấp</option>
              {issuers.map((issuer) => (
                <option key={issuer._id} value={issuer._id}>
                  {issuer.name}
                </option>
              ))}
            </select>
            <select
              className={styles.filterSelect}
              value={filterDegreeType}
              onChange={handleDegreeTypeFilterChange}
              aria-label="Lọc theo loại văn bằng"
              disabled={loading || (!filterIssuer && issuers.length > 0) || degreeTypes.length === 0}
            >
              <option value="">Tất cả loại văn bằng</option>
              {degreeTypes.map((type) => (
                <option key={type._id} value={type._id}>
                  {type.title}
                </option>
              ))}
            </select>
            <select
              className={styles.filterSelect}
              value={filterIssueYear}
              onChange={handleIssueYearFilterChange}
              aria-label="Lọc theo năm cấp"
              disabled={loading || issueYears.length === 0}
            >
              <option value="">Tất cả năm cấp</option>
              {issueYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              className={styles.filterSelect}
              value={sortOrder}
              onChange={handleSortChange}
              aria-label="Sắp xếp theo ngày cấp"
              disabled={loading}
            >
              <option value="desc">Mới nhất</option>
              <option value="asc">Cũ nhất</option>
            </select>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleAddNew}
              disabled={loading}
            >
              Thêm mới
            </button>
            <button
              type="button"
              className={styles.btnExport}
              onClick={handleExportExcel}
              disabled={loading}
            >
              Xuất Excel
            </button>
          </div>

          {degrees.length === 0 && !loading && (
            <div className="alert alert-info">Không tìm thấy văn bằng.</div>
          )}

          {degrees.length > 0 && (
            <div className="table-responsive">
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tên người nhận</th>
                    <th>Số hiệu</th>
                    <th>Số vào sổ</th>
                    <th>Ngày cấp</th>
                    <th>Trạng thái</th>
                    <th>Loại văn bằng</th>
                    <th>Đơn vị cấp</th>
                    <th>Tệp trên Cloud</th>
                    <th>Cập nhật</th>
                    <th>Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {degrees.map((degree) => (
                    <tr key={degree._id}>
                      <td>{degree.recipientName}</td>
                      <td>{degree.serialNumber}</td>
                      <td>{degree.registryNumber}</td>
                      <td>{new Date(degree.issueDate).toLocaleDateString('vi-VN')}</td>
                      <td>
                        {degree.status === 'Pending'
                          ? 'Chờ duyệt'
                          : degree.status === 'Approved'
                          ? 'Đã duyệt'
                          : 'Đã từ chối'}
                      </td>
                      <td>{degree.degreeType?.title || 'N/A'}</td>
                      <td>{degree.issuer?.name || 'N/A'}</td>
                      <td>
                        {degree.status !== 'Approved' || !degree.fileAttachment ? (
                          <span className={styles.notEligible}>
                            <i className="fas fa-upload" title="Chưa đủ điều kiện tải lên"></i>
                            Chưa đủ điều kiện
                          </span>
                        ) : degree.cloudFile ? (
                          <>
                            <span className={styles.uploadedIndicator}>
                              <i className="fas fa-check-circle"></i> Đã tải lên
                            </span>
                            <button
                              type="button"
                              className={styles.btnReUpload}
                              onClick={() => handleReUploadToMega(degree._id, degree.fileAttachment)}
                              disabled={loading}
                            >
                              Tải lại
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className={styles.btnUpload}
                            onClick={() => handleUploadToMega(degree._id, degree.fileAttachment)}
                            disabled={loading}
                          >
                            Tải lên Mega
                          </button>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.btnWarning}
                          onClick={() => handleUpdate(degree._id)}
                          disabled={loading}
                        >
                          Cập nhật
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.btnDanger}
                          onClick={() => handleDeleteClick(degree._id)}
                          disabled={loading}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className={styles.customPagination}>
              <Link
                to={`/listdegree?${buildPageUrl(currentPage - 1)}`}
                className={`${styles.customPaginationButton} ${styles.arrow} ${
                  currentPage === 1 ? styles.disabled : ''
                }`}
                onClick={(e) => {
                  if (currentPage === 1) e.preventDefault();
                  else handlePageChange(currentPage - 1);
                }}
              >
                &lt;
              </Link>
              {renderPagination().map((page, index) =>
                page === '...' ? (
                  <span
                    key={`ellipsis-${index}`}
                    className={styles.customPaginationButton}
                    style={{ cursor: 'default', border: 'none' }}
                  >
                    ...
                  </span>
                ) : (
                  <Link
                    key={page}
                    to={`/listdegree?${buildPageUrl(page)}`}
                    className={`${styles.customPaginationButton} ${
                      currentPage === page ? styles.active : ''
                    }`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Link>
                )
              )}
              <Link
                to={`/listdegree?${buildPageUrl(currentPage + 1)}`}
                className={`${styles.customPaginationButton} ${styles.arrow} ${
                  currentPage === totalPages ? styles.disabled : ''
                }`}
                onClick={(e) => {
                  if (currentPage === totalPages) e.preventDefault();
                  else handlePageChange(currentPage + 1);
                }}
              >
                &gt;
              </Link>
            </div>
          )}

          {showDeleteModal && deleteId && deleteSerialNumber && (
            <div className={styles.modal}>
              <div className={styles.modalDialog}>
                <div className={styles.modalContent}>
                  <div className={styles.modalHeader}>
                    <h5 className={styles.modalTitle}>Xác nhận xóa</h5>
                    <button
                      type="button"
                      className={styles.btnClose}
                      onClick={handleCloseModal}
                      aria-label="Đóng"
                      disabled={loading}
                    >
                      ×
                    </button>
                  </div>
                  <div className={styles.modalBody}>
                    <p>Bạn có chắc muốn xóa văn bằng này không?</p>
                    <p>
                      Vui lòng nhập <strong>XÁC NHẬN XÓA {deleteSerialNumber}</strong> để tiếp tục:
                    </p>
                    <input
                      type="text"
                      className={styles.modalInput}
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                      placeholder={`Nhập XÁC NHẬN XÓA ${deleteSerialNumber}`}
                      aria-label="Xác nhận xóa"
                      disabled={loading}
                    />
                    {error && <div className={styles.alertDanger}>{error}</div>}
                  </div>
                  <div className={styles.modalFooter}>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={handleCloseModal}
                      disabled={loading}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      className={styles.btnDanger}
                      onClick={handleDeleteConfirm}
                      disabled={loading}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListDegree;