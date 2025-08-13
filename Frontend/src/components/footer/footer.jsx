import React from 'react';
import styles from './footer.module.css'; // dùng CSS Module
import logo from '../../assets/logo/logoDHCT.png'; // Logo trường
import dt1 from '../../assets/footer/dt_Bosch.png';
import dt2 from '../../assets/footer/dt_DH_VL.jpg';
import dt3 from '../../assets/footer/dt_Bosch.png';
import dt4 from '../../assets/footer/dt_Liink.png';
const Footer = () => {
  return (
    <div className={`${styles.footer} text-white pt-3 mt-4`}>
      <div className="container-fluid text-center">
        <img src={logo} alt="Logo" width="80" className="mb-3 mx-auto d-block" />
        <h6 className="fw-bold">Trường Đại học Cần Thơ (Can Tho University)</h6>

        <hr className="border-light mx-auto" style={{ width: '80%' }} />

        <div className="row py-3 gx-4 gy-4 justify-content-center">
          {/* Địa chỉ */}
          <div className="col-12 col-md-4 mx-auto text-start">
            <p className="mb-2"><i className="fas fa-home me-2"></i><strong>Địa chỉ:</strong> 01 Lý Tự Trọng, Quận Ninh Kiều, TP. CT</p>
            <p className="mb-2"><i className="fas fa-phone me-2"></i><strong>Điện thoại:</strong> +84 292 383 5581</p>
            <p className="mb-2"><i className="fas fa-fax me-2"></i><strong>Fax:</strong> +84 292 373 1071</p>
          </div>

          {/* Đối tác */}
          <div className="col-12 col-md-4 mx-auto text-start">
            <p className="mb-2"><i className="fas fa-envelope me-2"></i><strong>Email:</strong> dhct@ctu.edu.vn</p>
            <p className="mb-2"><i className="fas fa-bullhorn me-2"></i><strong>Đối tác tiêu biểu</strong></p>
            <div className="d-flex flex-wrap gap-2">
              <img src={dt1} alt="Đối tác 1" height="30" />
              <img src={dt2} alt="Đối tác 2" height="30" />
              <img src={dt3} alt="Đối tác 3" height="30" />
              <img src={dt4} alt="Đối tác 4" height="30" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
