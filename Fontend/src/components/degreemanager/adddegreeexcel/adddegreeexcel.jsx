import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Context } from "../../login/context";
import styles from "./adddegreeexcel.module.css";

const AddDegreeExcel = () => {
  const navigate = useNavigate();
  const { user } = useContext(Context);
  const fileInputRef = useRef(null);
  const imageDirInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedImageDir, setSelectedImageDir] = useState([]);
  const [issuers, setIssuers] = useState([]);
  const [degreeTypes, setDegreeTypes] = useState([]);
  const [selectedIssuer, setSelectedIssuer] = useState("");
  const [selectedDegreeType, setSelectedDegreeType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [errorDetails, setErrorDetails] = useState([]);

  const getAccessToken = () => {
    const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
    return user.accessToken || null;
  };

  useEffect(() => {
    if (!user || !user.auth || !["admin", "manager"].includes(user.role)) {
      navigate("/");
    } else {
      const fetchIssuers = async () => {
        try {
          const token = getAccessToken();
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/issuers`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.data.errCode === 0) setIssuers(response.data.data);
          else setError("Không thể tải danh sách đơn vị cấp.");
        } catch (err) {
          setError("Lỗi kết nối khi tải danh sách đơn vị cấp.");
        }
      };
      fetchIssuers();
    }
  }, [user, navigate]);

  useEffect(() => {
    if (selectedIssuer) {
      const fetchDegreeTypes = async () => {
        try {
          const token = getAccessToken();
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/v1/degree-types/by-issuer?issuerId=${selectedIssuer}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response.data.errCode === 0) setDegreeTypes(response.data.data);
          else {
            setError("Không thể tải danh sách loại văn bằng.");
            setDegreeTypes([]);
          }
        } catch (err) {
          setError("Lỗi kết nối khi tải danh sách loại văn bằng.");
          setDegreeTypes([]);
        }
      };
      fetchDegreeTypes();
    } else {
      setDegreeTypes([]);
      setSelectedDegreeType("");
    }
  }, [selectedIssuer]);

  const handleFileClick = () => fileInputRef.current.click();
  const handleImageDirClick = () => imageDirInputRef.current.click();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      if (!allowedTypes.includes(file.type)) {
        setError("Chỉ chấp nhận tệp Excel (.xlsx hoặc .xls).");
        event.target.value = "";
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError("");
      setErrorDetails([]);
    }
  };

  const handleImageDirChange = (event) => {
    const files = Array.from(event.target.files).filter(file => file.type.startsWith("image/"));
    if (files.length > 0) {
      setSelectedImageDir(files);
      setError("");
    } else {
      setError("Thư mục không chứa ảnh hợp lệ.");
      setSelectedImageDir([]);
    }
  };

  const handleImport = async () => {
    if (!selectedIssuer || !selectedDegreeType) {
      setError("Vui lòng chọn đơn vị cấp và loại văn bằng.");
      return;
    }
    if (!selectedFile) {
      setError("Vui lòng chọn tệp Excel.");
      return;
    }
    if (selectedImageDir.length > 0 && !selectedFile) {
      setError("Vui lòng chọn tệp Excel khi tải lên thư mục ảnh.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setErrorDetails([]);

    try {
      const token = getAccessToken();
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("issuerId", selectedIssuer);
      formData.append("degreeTypeId", selectedDegreeType);
      if (selectedImageDir.length > 0) {
        selectedImageDir.forEach((file) => {
          formData.append("images", file);
        });
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/v1/degree/import-excel`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.errCode === 0) {
        setSuccess(`Thành công! Đã nhập ${response.data.data.successCount} văn bằng.`);
        if (response.data.data.errors && response.data.data.errors.length > 0) {
          setErrorDetails(response.data.data.errors);
          setError("Một số dòng dữ liệu gặp lỗi, kiểm tra chi tiết bên dưới.");
        }
        setSelectedFile(null);
        setSelectedImageDir([]);
        fileInputRef.current.value = "";
        imageDirInputRef.current.value = "";
        setSelectedDegreeType("");
        setSelectedIssuer("");
      } else {
        setError("Lỗi khi nhập văn bằng từ tệp Excel. Vui lòng kiểm tra lại.");
        if (response.data.data?.errors) setErrorDetails(response.data.data.errors);
      }
    } catch (err) {
      setError("Lỗi kết nối khi gửi tệp Excel hoặc thư mục ảnh. Vui lòng thử lại.");
      if (err.response?.status === 401) navigate("/"); // Fixed syntax error
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateUrl = `${process.env.REACT_APP_API_URL}/templates/degree_import_template.xlsx`;
    const link = document.createElement("a");
    link.href = templateUrl;
    link.download = "degree_import_template.xlsx";
    link.click();
  };

  return (
    <div className={styles.container}>
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loader}></div>
          <p className={styles.loadingText}>Đang xử lý, vui lòng đợi...</p>
        </div>
      )}

      <div className={styles.card}>
        <h1 className={styles.title}>
          <i className="fas fa-file-excel"></i> Nhập Văn Bằng Qua Excel
        </h1>

        <div className={styles.buttonGroup}>
          <button
            type="button"
            className={styles.button}
            onClick={() => navigate("/diploma-manager")}
            disabled={loading}
          >
            <i className="fas fa-arrow-left"></i> Quay Lại
          </button>
          <button
            type="button"
            className={styles.button}
            onClick={handleDownloadTemplate}
            disabled={loading}
          >
            <i className="fas fa-download"></i> Tải Mẫu Excel
          </button>
        </div>

        {error && <div className={styles.alertDanger}>{error}</div>}
        {success && <div className={styles.alertSuccess}>{success}</div>}
        {errorDetails.length > 0 && (
          <div className={styles.alertWarning}>
            <strong>Lỗi dữ liệu:</strong>
            <ul>
              {errorDetails.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Chọn Đơn Vị và Loại Văn Bằng</h3>
          <div className={styles.formGroup}>
            <label className={styles.label}>Đơn vị cấp</label>
            <select
              className={styles.select}
              value={selectedIssuer}
              onChange={(e) => setSelectedIssuer(e.target.value)}
              disabled={loading}
            >
              <option value="">Chọn đơn vị cấp</option>
              {issuers.length > 0 ? (
                issuers.map((issuer) => (
                  <option key={issuer._id} value={issuer._id}>
                    {issuer.name}
                  </option>
                ))
              ) : (
                <option disabled>Không có đơn vị cấp</option>
              )}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Loại văn bằng</label>
            <select
              className={styles.select}
              value={selectedDegreeType}
              onChange={(e) => setSelectedDegreeType(e.target.value)}
              disabled={!selectedIssuer || loading}
            >
              <option value="">Chọn loại văn bằng</option>
              {degreeTypes.length > 0 ? (
                degreeTypes.map((type) => (
                  <option key={type._id} value={type._id}>
                    {type.title}
                  </option>
                ))
              ) : (
                <option disabled>Không có loại văn bằng</option>
              )}
            </select>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Tải Tệp Excel</h3>
          <div className={styles.buttonGroup}>
            <input
              type="file"
              accept=".xlsx, .xls"
              ref={fileInputRef}
              className={styles.hiddenInput}
              onChange={handleFileChange}
              disabled={loading}
            />
            <button
              type="button"
              className={styles.button}
              onClick={handleFileClick}
              disabled={loading}
            >
              <i className="fas fa-file-excel"></i> Chọn Tệp Excel
            </button>
            <button
              type="button"
              className={styles.buttonPrimary}
              onClick={handleImport}
              disabled={!selectedFile || !selectedIssuer || !selectedDegreeType || loading}
            >
              <i className="fas fa-upload text-white"></i> Nhập Dữ Liệu
            </button>
          </div>
          {selectedFile && (
            <div className={styles.preview}>
              <p>
                Tệp đã chọn: <span className={styles.fileName}>{selectedFile.name}</span>
              </p>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Tải Thư Mục Ảnh</h3>
          <div className={styles.buttonGroup}>
            <input
              type="file"
              ref={imageDirInputRef}
              className={styles.hiddenInput}
              onChange={handleImageDirChange}
              webkitdirectory="true"
              directory="true"
              multiple
              accept="image/*"
              disabled={loading}
            />
            <button
              type="button"
              className={styles.button}
              onClick={handleImageDirClick}
              disabled={loading}
            >
              <i className="fas fa-folder"></i> Chọn Thư Mục Ảnh
            </button>
          </div>
          {selectedImageDir.length > 0 && (
            <div className={styles.fileList}>
              <p>Đã chọn {selectedImageDir.length} ảnh:</p>
              <ul>
                {selectedImageDir.slice(0, 5).map((file, index) => (
                  <li key={index}>{file.webkitRelativePath || file.name}</li>
                ))}
                {selectedImageDir.length > 5 && <li>...</li>}
              </ul>
            </div>
          )}
          <div className={styles.alertInfo}>
            <strong>Lưu ý:</strong> Tên file ảnh phải khớp với <code>serialNumber</code> hoặc <code>registryNumber</code> trong tệp Excel (ví dụ: "ABC123.jpg" cho <code>serialNumber</code> là "ABC123"). Điều này giúp hệ thống tự động ghép ảnh với dữ liệu.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDegreeExcel;