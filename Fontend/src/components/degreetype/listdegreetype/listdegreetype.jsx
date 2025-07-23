import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Context } from '../../login/context';
import styles from './listdegreetype.module.css';

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

const ListDegreetype = () => {
  const navigate = useNavigate();
  const { user } = useContext(Context);
  const [searchParams, setSearchParams] = useSearchParams();
  const [degreeTypes, setDegreeTypes] = useState([]);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const debouncedSearchTerm = useDebounce(searchInput, 500);
  const [filterLevel, setFilterLevel] = useState(searchParams.get('level') || '');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sort') || 'desc');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteTitle, setDeleteTitle] = useState('');
  const [deleteInput, setDeleteInput] = useState('');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [uniqueLevels, setUniqueLevels] = useState([]);
  const limit = 10;

  // Get access token
  const getAccessToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    return user.accessToken || null;
  };

  // Check authentication and role
  useEffect(() => {
    if (!user || !user.auth || !['admin', 'certifier'].includes(user.role)) {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch degree types
  const fetchDegreeTypes = useCallback(async () => {
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
      if (filterLevel) params.level = filterLevel;

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/degree-types/issuer`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params,
        withCredentials: true,
      });

      if (response.data.errCode === 0) {
        setDegreeTypes(response.data.data.degreeTypes);
        setTotalPages(response.data.data.totalPages || 1);
        const allLevelsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/degree-types/issuer`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          params: { page: 1, limit: 1000 },
          withCredentials: true,
        });
        if (allLevelsResponse.data.errCode === 0) {
          const levels = [...new Set(allLevelsResponse.data.data.degreeTypes.map((dt) => dt.level))];
          setUniqueLevels(levels);
        }
      } else {
        setError('Không thể tải danh sách loại bằng cấp.');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Phiên đăng nhập hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
        navigate('/login');
      } else {
        setError('Lỗi khi tải danh sách loại bằng cấp. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, currentPage, debouncedSearchTerm, filterLevel, sortOrder]);

  useEffect(() => {
    fetchDegreeTypes();
  }, [fetchDegreeTypes]);

  // Handle search, filter, sort, and navigation
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

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilterLevel(value);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('level', value);
    } else {
      newParams.delete('level');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    setSortOrder(value);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', value);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleAddNew = () => {
    navigate('/adddegreetype');
  };

  const handleUpdate = (id) => {
    navigate(`/updatedegreetype/${id}`);
  };

  const handleDeleteClick = (id) => {
    const degreeType = degreeTypes.find((dt) => dt._id === id);
    setDeleteId(id);
    setDeleteTitle(degreeType ? degreeType.title : 'Unknown');
    setShowDeleteModal(true);
    setDeleteInput('');
    setError('');
    setSuccess('');
  };

  const handleDeleteConfirm = async () => {
    if (deleteInput !== `XÁC NHẬN XÓA ${deleteTitle}`) {
      setError(`Vui lòng nhập đúng "XÁC NHẬN XÓA ${deleteTitle}" để tiếp tục.`);
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
      const response = await axios.delete(`${process.env.REACT_APP_API_URL}/api/v1/degree-type/${deleteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });

      if (response.data.errCode === 0) {
        setDegreeTypes(degreeTypes.filter((dt) => dt._id !== deleteId));
        setSuccess('Xóa loại bằng cấp thành công!');
        setShowDeleteModal(false);
        setError('');
        if (degreeTypes.length === 1 && currentPage > 1) {
          handlePageChange(currentPage - 1);
        }
      } else {
        setError(response.data.message || 'Không thể xóa loại bằng cấp.');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Phiên đăng nhập hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
        navigate('/login');
        setShowDeleteModal(false);
      } else {
        setError(err.response?.data?.message || 'Lỗi khi xóa loại bằng cấp.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
    setDeleteTitle('');
    setDeleteInput('');
    setError('');
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      searchParams.set('page', page);
      setSearchParams(searchParams);
    }
  };

  const buildPageUrl = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page);
    return `?${params.toString()}`;
  };

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
          <h4 className={styles.pageTitle}>Danh sách loại bằng cấp</h4>

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
                placeholder="Tìm kiếm theo tiêu đề hoặc chuyên ngành..."
                value={searchInput}
                onChange={handleSearchChange}
                aria-label="Tìm kiếm loại bằng cấp"
              />
              <button
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
              value={filterLevel}
              onChange={handleFilterChange}
              aria-label="Lọc theo cấp độ"
            >
              <option value="">Tất cả cấp độ</option>
              {uniqueLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
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
              className={styles.btnPrimary}
              onClick={handleAddNew}
              disabled={loading}
            >
              Thêm mới
            </button>
          </div>

          {degreeTypes.length === 0 && !loading && (
            <div className="alert alert-info">Không tìm thấy loại bằng cấp nào.</div>
          )}

          {degreeTypes.length > 0 && (
            <div className="table-responsive">
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Cấp độ</th>
                    <th>Chuyên ngành</th>
                    <th>Ngày tạo</th>
                    <th>Cập nhật</th>
                    <th>Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {degreeTypes.map((degreeType) => (
                    <tr key={degreeType._id}>
                      <td>{degreeType.title}</td>
                      <td>{degreeType.level}</td>
                      <td>{degreeType.major}</td>
                      <td>{new Date(degreeType.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <button
                          className={styles.btnWarning}
                          onClick={() => handleUpdate(degreeType._id)}
                          disabled={loading}
                        >
                          Cập nhật
                        </button>
                      </td>
                      <td>
                        <button
                          className={styles.btnDanger}
                          onClick={() => handleDeleteClick(degreeType._id)}
                          disabled={loading || user.role !== 'admin'}
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
                to={buildPageUrl(currentPage - 1)}
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
                    to={buildPageUrl(page)}
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
                to={buildPageUrl(currentPage + 1)}
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

          {showDeleteModal && deleteId && deleteTitle && (
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
                    <p>Bạn có chắc muốn xóa loại bằng cấp này không?</p>
                    <p>
                      Vui lòng nhập <strong>XÁC NHẬN XÓA {deleteTitle}</strong> để tiếp tục:
                    </p>
                    <input
                      type="text"
                      className={styles.modalInput}
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                      placeholder={`Nhập XÁC NHẬN XÓA ${deleteTitle}`}
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

export default ListDegreetype;