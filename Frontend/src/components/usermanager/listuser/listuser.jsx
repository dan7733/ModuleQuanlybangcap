import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Context } from '../../login/context';
import styles from './listuser.module.css';
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

const ListUser = () => {
  const navigate = useNavigate();
  const { user } = useContext(Context);
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const debouncedSearchTerm = useDebounce(searchInput, 500);
  const [filterRole, setFilterRole] = useState(searchParams.get('role') || '');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sort') || 'desc');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleteInput, setDeleteInput] = useState('');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [uniqueRoles, setUniqueRoles] = useState([]);
  const limit = 10;

  // Get access token
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

  // Fetch users with pagination, filtering, and sorting
  const fetchUsers = useCallback(async () => {
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
      if (filterRole) params.role = filterRole;

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params,
        withCredentials: true,
      });

      if (response.data.errCode === 0) {
        setUsers(response.data.data.users);
        setTotalPages(response.data.data.totalPages || 1);
        // Fetch unique roles for dropdown
        const allUsersResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          params: { page: 1, limit: 1000 },
          withCredentials: true,
        });
        if (allUsersResponse.data.errCode === 0) {
          const roles = [...new Set(allUsersResponse.data.data.users.map((u) => u.role))];
          setUniqueRoles(roles);
        }
      } else {
        setError('Không thể tải danh sách người dùng.');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Phiên đăng nhập hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
        navigate('/login');
      } else {
        setError('Lỗi khi tải danh sách người dùng. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, currentPage, debouncedSearchTerm, filterRole, sortOrder]);

  // Trigger API call when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  // Handle role filter
  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilterRole(value);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('role', value);
    } else {
      newParams.delete('role');
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

  // Navigate to add user page
  const handleAddNew = () => {
    navigate('/adduser');
  };

  // Navigate to update user page
  const handleUpdate = (id) => {
    navigate(`/updateuser/${id}`);
  };

  // Handle delete click
  const handleDeleteClick = (id) => {
    const user = users.find((u) => u._id === id);
    setDeleteId(id);
    setDeleteEmail(user ? user.email : 'Unknown');
    setShowDeleteModal(true);
    setDeleteInput('');
    setError('');
    setSuccess('');
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (deleteInput !== `XÁC NHẬN XÓA ${deleteEmail}`) {
      setError(`Vui lòng nhập đúng "XÁC NHẬN XÓA ${deleteEmail}" để tiếp tục.`);
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
      const response = await axios.delete(`${process.env.REACT_APP_API_URL}/api/v1/user/${deleteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });

      if (response.data.errCode === 0) {
        setUsers(users.filter((u) => u._id !== deleteId));
        setSuccess('Xóa người dùng thành công!');
        setShowDeleteModal(false);
        setError('');
        if (users.length === 1 && currentPage > 1) {
          handlePageChange(currentPage - 1);
        }
      } else {
        setError(response.data.message || 'Không thể xóa người dùng.');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Phiên đăng nhập hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
        navigate('/login');
        setShowDeleteModal(false);
      } else {
        setError(err.response?.data?.message || 'Lỗi khi xóa người dùng.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Close delete modal
  const handleCloseModal = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
    setDeleteEmail('');
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
          <h4 className={styles.pageTitle}>Danh sách người dùng</h4>

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
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchInput}
                onChange={handleSearchChange}
                aria-label="Tìm kiếm người dùng"
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
              value={filterRole}
              onChange={handleFilterChange}
              aria-label="Lọc theo vai trò"
            >
              <option value="">Tất cả vai trò</option>
              {uniqueRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
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

          {users.length === 0 && !loading && (
            <div className="alert alert-info">Không tìm thấy người dùng.</div>
          )}

          {users.length > 0 && (
            <div className="table-responsive">
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Họ và tên</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Ngày tạo</th>
                    <th>Cập nhật</th>
                    <th>Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>{user.fullname}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <button
                          type="button"
                          className={styles.btnWarning}
                          onClick={() => handleUpdate(user._id)}
                          disabled={loading}
                        >
                          Cập nhật
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.btnDanger}
                          onClick={() => handleDeleteClick(user._id)}
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
                to={`/listuser?${buildPageUrl(currentPage - 1)}`}
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
                    to={`/listuser?${buildPageUrl(page)}`}
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
                to={`/listuser?${buildPageUrl(currentPage + 1)}`}
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

          {showDeleteModal && deleteId && deleteEmail && (
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
                    <p>Bạn có chắc muốn xóa người dùng này không?</p>
                    <p>
                      Vui lòng nhập <strong>XÁC NHẬN XÓA {deleteEmail}</strong> để tiếp tục:
                    </p>
                    <input
                      type="text"
                      className={styles.modalInput}
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                      placeholder={`Nhập XÁC NHẬN XÓA ${deleteEmail}`}
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

export default ListUser;