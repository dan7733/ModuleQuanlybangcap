import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Context } from '../../login/context';
import styles from './listissuer.module.css';
import CryptoJS from 'crypto-js';

// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const ListIssuer = () => {
  const navigate = useNavigate();
  const { user } = useContext(Context);
  const [searchParams, setSearchParams] = useSearchParams();
  const [issuers, setIssuers] = useState([]);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const debouncedSearchTerm = useDebounce(searchInput, 500);
  const [sortOrder, setSortOrder] = useState(searchParams.get('sort') || 'desc');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [deleteInput, setDeleteInput] = useState('');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
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
    if (!user || !user.auth || user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch issuers with pagination and sorting
  const fetchIssuers = useCallback(async () => {
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

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/issuers/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params,
        withCredentials: true,
      });

      if (response.data.errCode === 0) {
        setIssuers(response.data.data.issuers);
        setTotalPages(response.data.data.totalPages || 1);
      } else {
        setError('Không thể tải danh sách tổ chức.');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Phiên đăng nhập hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
        navigate('/login');
      } else {
        setError('Lỗi khi tải danh sách tổ chức. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, currentPage, debouncedSearchTerm, sortOrder]);

  // Trigger API call when dependencies change
  useEffect(() => {
    fetchIssuers();
  }, [fetchIssuers]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('search', value);
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Handle search button click
  const handleSearchClick = () => {
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (searchInput) {
      newParams.set('search', searchInput);
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Handle sort order
  const handleSortChange = (e) => {
    const value = e.target.value;
    setSortOrder(value);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', value);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Navigate to add issuer page
  const handleAddNew = () => {
    navigate('/addissuer');
  };

  // Handle edit click
  const handleEditClick = (id) => {
    navigate(`/updateissuer/${id}`);
  };

  // Handle delete click
  const handleDeleteClick = (id) => {
    const issuer = issuers.find((i) => i._id === id);
    setDeleteId(id);
    setDeleteName(issuer ? issuer.name : 'Unknown');
    setShowDeleteModal(true);
    setDeleteInput('');
    setError('');
    setSuccess('');
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (deleteInput !== `XÁC NHẬN XÓA ${deleteName}`) {
      setError(`Vui lòng nhập đúng "XÁC NHẬN XÓA ${deleteName}" để tiếp tục.`);
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
      const response = await axios.delete(`${process.env.REACT_APP_API_URL}/api/v1/issuer/${deleteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });

      if (response.data.errCode === 0) {
        setIssuers(issuers.filter((i) => i._id !== deleteId));
        setSuccess('Xóa tổ chức thành công!');
        setShowDeleteModal(false);
        setError('');
        if (issuers.length === 1 && currentPage > 1) {
          handlePageChange(currentPage - 1);
        }
      } else {
        setError(response.data.message || 'Không thể xóa tổ chức.');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Phiên đăng nhập hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
        navigate('/login');
        setShowDeleteModal(false);
      } else {
        setError(err.response?.data?.message || 'Lỗi khi xóa tổ chức.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Close delete modal
  const handleCloseModal = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
    setDeleteName('');
    setDeleteInput('');
    setError('');
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      searchParams.set('page', page);
      setSearchParams(searchParams);
    }
  };

  // Build URL for pagination
  const buildPageUrl = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page);
    return `${params.toString()}`;
  };

  // Render pagination
  const renderPagination = () => {
    const pages = [];
    pages.push(1);
    if (currentPage > 4) {
      pages.push('...');
    }
    const startPage = Math.max(2, currentPage - 2);
    const endPage = Math.min(totalPages - 1, currentPage + 2);
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 3) {
      pages.push('...');
    }
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.container}>
        <div className={styles.borderBox}>
          <h4 className={styles.pageTitle}>Danh sách tổ chức</h4>

          {success && !showDeleteModal && <div className={styles.alertSuccess}>{success}</div>}
          {error && !showDeleteModal && <div className={styles.alertDanger}>{error}</div>}
          {loading && (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
            </div>
          )}

          <div className={styles.filterGroup}>
            <div className={styles.searchGroup}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Tìm kiếm theo tên hoặc email liên hệ..."
                value={searchInput}
                onChange={handleSearchChange}
                aria-label="Tìm kiếm tổ chức"
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
              value={sortOrder}
              onChange={handleSortChange}
              aria-label="Sắp xếp theo ngày tạo"
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
          </div>

          {issuers.length === 0 && !loading && (
            <div className="alert alert-info">Không tìm thấy tổ chức.</div>
          )}

          {issuers.length > 0 && (
            <div className="table-responsive">
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tên tổ chức</th>
                    <th>Địa chỉ</th>
                    <th>Email liên hệ</th>
                    <th>Ngày tạo</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {issuers.map((issuer) => (
                    <tr key={issuer._id}>
                      <td>{issuer.name}</td>
                      <td>{issuer.address || 'N/A'}</td>
                      <td>{issuer.contactEmail || 'N/A'}</td>
                      <td>{new Date(issuer.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td className={styles.actionButtons}>
                        <button
                          type="button"
                          className={styles.btnWarning}
                          onClick={() => handleEditClick(issuer._id)}
                          disabled={loading}
                        >
                          Cập nhật
                        </button>
                        <button
                          type="button"
                          className={styles.btnDanger}
                          onClick={() => handleDeleteClick(issuer._id)}
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
                to={`/listissuer?${buildPageUrl(currentPage - 1)}`}
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

              {renderPagination().map((page, index) => (
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
                    to={`/listissuer?${buildPageUrl(page)}`}
                    className={`${styles.customPaginationButton} ${
                      currentPage === page ? styles.active : ''
                    }`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Link>
                )
              ))}

              <Link
                to={`/listissuer?${buildPageUrl(currentPage + 1)}`}
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

          {showDeleteModal && deleteId && deleteName && (
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
                    >
                      ×
                    </button>
                  </div>
                  <div className={styles.modalBody}>
                    <p>Bạn có chắc muốn xóa tổ chức này không?</p>
                    <p>
                      Vui lòng nhập <strong>XÁC NHẬN XÓA {deleteName}</strong> để tiếp tục:
                    </p>
                    <input
                      type="text"
                      className={styles.modalInput}
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                      placeholder={`Nhập XÁC NHẬN XÓA ${deleteName}`}
                      aria-label="Xác nhận xóa"
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

export default ListIssuer;