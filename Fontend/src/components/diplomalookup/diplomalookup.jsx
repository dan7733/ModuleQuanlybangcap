import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './diplomalookup.module.css';
import qrImage from '../../assets/diplomalookup/qrnew.png';

const DiplomaLookup = () => {
  const [activeTab, setActiveTab] = useState('qr');

  return (
    <div className="container mt-4">
      <div className="row g-4 align-items-stretch">
        {/* Left Side - Form */}
        <div className="col-md-6 d-flex">
          <div className="card p-4 shadow-sm w-100 h-100">
            <form>
              <div className="mb-2">
                <label className="form-label">Tên văn bằng *</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fa-solid fa-layer-group"></i></span>
                  <select className="form-select" required>
                    <option selected disabled>Chọn văn bằng</option>
                    <option>Chứng chỉ tiếng Anh</option>
                  </select>
                </div>
              </div>
              <div className="mb-2">
                <label className="form-label">Họ và tên</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fa-solid fa-user"></i></span>
                  <input type="text" className="form-control" placeholder="Nhập họ và tên" />
                </div>
              </div>
              <div className="mb-2">
                <label className="form-label">Ngày sinh</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fa-solid fa-calendar-days"></i></span>
                  <input type="date" className="form-control" />
                </div>
              </div>
              <div className="mb-2">
                <label className="form-label">Số hiệu</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fa-solid fa-tags"></i></span>
                  <input type="text" className="form-control" placeholder="Nhập số hiệu" />
                </div>
              </div>
              <div className="mb-2">
                <label className="form-label">Mã định danh</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fa-solid fa-user-secret"></i></span>
                  <input type="text" className="form-control" placeholder="Nhập mã định danh" />
                </div>
              </div>
              <div className="mb-2">
                <label className="form-label">Số vào sổ</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fa-solid fa-user-secret"></i></span>
                  <input type="text" className="form-control" placeholder="Nhập số vào sổ" />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Mã bảo vệ</label>
                <div className="d-flex align-items-center gap-2 flex-nowrap overflow-auto">
                  <div className="input-group flex-shrink-1" style={{ minWidth: 0, maxWidth: 150 }}>
                    <span className="input-group-text"><i className="fa-solid fa-shield"></i></span>
                    <input type="text" className="form-control" placeholder="Nhập mã" id="captcha-input-1" />
                  </div>
                  <button type="button" id="refresh-captcha-1" className="input-group-text btn-outline d-flex align-items-center justify-content-center flex-shrink-0" style={{ height: 40, width: 40 }}>
                    <i className="fa-solid fa-rotate-right text-danger"></i>
                  </button>
                  <span className="px-3 py-2 border rounded bg-light fw-bold text-uppercase user-select-none flex-shrink-0" style={{ letterSpacing: '2px', fontFamily: 'monospace' }}>
                    DA8J
                  </span>
                </div>
              </div>
              <div className="d-flex justify-content-between gap-2 mt-3">
                <button className="btn btn-primary px-4"><i className="fa-solid fa-magnifying-glass me-1"></i> Tra cứu</button>
                <button className="btn btn-primary px-4"><i className="fa-solid fa-rotate me-1"></i> Hoàn tác</button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side - Tabs QR / Mã số VB */}
        <div className="col-md-6 d-flex">
          <div className="card p-4 shadow-sm w-100 h-100 d-flex flex-column justify-content-between">
            <div>
              <ul className={`nav ${styles.customTabs} justify-content-center mb-3`}>
                <li className="nav-item">
                  <button className={`nav-link ${activeTab === 'qr' ? 'active' : ''}`} onClick={() => setActiveTab('qr')}>
                    QUÉT MÃ QR
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link ${activeTab === 'code' ? 'active' : ''}`} onClick={() => setActiveTab('code')}>
                    MÃ SỐ VB
                  </button>
                </li>
              </ul>

              {activeTab === 'qr' ? (
                <>
                  <h6 className={`${styles.detailproductQm} mb-3 pb-2 border-bottom text-center`}>QUÉT MÃ VĂN BẰNG</h6>
                  <div className="qr-placeholder-container position-relative mb-4">
                    <img
                      src={qrImage}
                      alt="Minh họa QR"
                      className="img-fluid rounded shadow text-center mx-auto d-block"
                      style={{ maxHeight: '350px', objectFit: 'contain' }}
                    />
                  </div>
                  <div id="qr-reader" className="qr-reader-container mb-4" style={{ display: 'none' }}></div>
                  <div id="qr-result" className="mt-2 fw-bold text-success"></div>
                  <button className="btn btn-primary mt-3 w-100">
                    <i className="fa-solid fa-camera me-2"></i> Bấm để quét mã QR
                  </button>
                  <button className="btn btn-primary mt-3 w-100">
                    <i className="fa-solid fa-upload me-2"></i> Tải ảnh mã QR
                  </button>
                  <input type="file" accept="image/*" id="qr-upload-input" style={{ display: 'none' }} />
                </>
              ) : (
                <>
                  <h6 className={`${styles.detailproductQm} mb-3 pb-2 border-bottom text-center`}>
                    NHẬP MÃ SỐ VĂN BẰNG
                  </h6>
                  <div className="bg-light p-3 rounded">
                    <div className="mb-4">
                      <label className="form-label mb-3">Mã số văn bằng</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="fa-solid fa-a"></i></span>
                        <input type="text" className="form-control" placeholder="Nhập mã số văn bằng" />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label mb-3">Mã bảo vệ</label>
                      <div className="d-flex align-items-center gap-2 flex-nowrap overflow-auto">
                        <div className="input-group flex-shrink-1" style={{ minWidth: 0, maxWidth: 150 }}>
                          <span className="input-group-text"><i className="fa-solid fa-shield"></i></span>
                          <input type="text" className="form-control" placeholder="Nhập mã" id="captcha-input-2" />
                        </div>
                        <button type="button" id="refresh-captcha-2" className="input-group-text btn-outline d-flex align-items-center justify-content-center flex-shrink-0" style={{ height: 40, width: 40 }}>
                          <i className="fa-solid fa-rotate-right text-danger"></i>
                        </button>
                        <span className="px-3 py-2 border rounded bg-light fw-bold text-uppercase user-select-none flex-shrink-0" style={{ letterSpacing: '2px', fontFamily: 'monospace' }}></span>
                      </div>
                    </div>
                    <div className="d-flex justify-content-between gap-2 mt-3 mt-4">
                      <button className="btn btn-primary px-3"><i className="fa-solid fa-magnifying-glass"></i> Tra cứu</button>
                      <button className="btn btn-primary px-3"><i className="fa-solid fa-rotate"></i> Hoàn tác</button>
                    </div>
                    <div className="mt-3 text-center">
                      <small className="text-muted">Gợi ý: Mã số văn bằng có dạng như: <strong>VB123456</strong></small>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Result Table */}
        <div className="col-12">
          <div className="card mt-4 shadow-sm p-4">
            <h5 className="fw-bold mb-3 text-center">Kết quả tra cứu</h5>
            <div className="table-responsive">
              <table className="table table-bordered text-center align-middle mb-0">
                <thead className="table-secondary">
                  <tr>
                    <th>#</th>
                    <th>Tên văn bằng</th>
                    <th>Họ và tên</th>
                    <th>Ngày sinh</th>
                    <th>Số hiệu</th>
                    <th>Số vào sổ</th>
                    <th>Chi tiết</th>
                  </tr>
                </thead>
                {/* <tbody>
                  <tr>
                    <td>1</td>
                    <td>Chứng chỉ tiếng Anh trình độ A</td>
                    <td>Phạm Quốc Huy</td>
                    <td>21-10-2003</td>
                    <td>A1234567</td>
                    <td>161-10265.A68</td>
                    <td><Link to="#" className="btn btn-sm btn-outline-secondary"><i className="fa-solid fa-pen-to-square"></i></Link></td>
                  </tr>
                </tbody> */}
              </table>
            </div>
            <div className="d-flex justify-content-center justify-content-md-end flex-nowrap align-items-center gap-3 overflow-auto mt-3 pb-2">
              <nav className="flex-shrink-0">
                <ul className="pagination mb-0 flex-nowrap

">
                  <li className="page-item disabled"><Link className="page-link" to="#"><i className="fa-solid fa-angles-left"></i></Link></li>
                  <li className="page-item disabled"><Link className="page-link" to="#"><i className="fa-solid fa-chevron-left"></i></Link></li>
                  <li className="page-item active"><Link className="page-link" to="#">1</Link></li>
                  <li className="page-item"><Link className="page-link" to="#">2</Link></li>
                  <li className="page-item disabled"><Link className="page-link" to="#"><i className="fa-solid fa-chevron-right"></i></Link></li>
                  <li className="page-item disabled"><Link className="page-link" to="#"><i className="fa-solid fa-angles-right"></i></Link></li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiplomaLookup;