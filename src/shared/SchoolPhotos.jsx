import React, { useEffect, useState } from "react";
import "./SchoolPhotos.css";

const API_BASE = "https://cleezoclass.com:4000";

export default function SchoolPhotos() {
  const [files, setFiles] = useState([]);
  const [uploaded, setUploaded] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const schoolCode = localStorage.getItem("schoolCode");

  const fetchPhotos = async () => {
    if (!schoolCode) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/school-photos?schoolCode=${encodeURIComponent(schoolCode)}`
      );
      const data = await res.json();
      if (res.ok) {
        setUploaded(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Fetch school photos failed", err);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [schoolCode]);

  const onChangeFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length < 1 || selected.length > 20) {
      setError("Please select 1 to 20 images.");
      setFiles([]);
      return;
    }
    setError("");
    setFiles(selected);
  };

  const handleUpload = async () => {
    if (!schoolCode) {
      setError("schoolCode not found");
      return;
    }
    if (!files.length) {
      setError("Select 1 to 20 images first");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("schoolCode", schoolCode);
    files.forEach((f) => formData.append("photos", f));

    try {
      const res = await fetch(`${API_BASE}/api/school-photos`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");

      setFiles([]);
      await fetchPhotos();
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="school-photos-page">
      <div className="school-photos-card">
        <h2>School Photos</h2>
        <p className="sub">Upload 1–20 images</p>

        <div className="controls">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onChangeFiles}
          />
          <button onClick={handleUpload} disabled={loading}>
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {files.length > 0 && (
          <div className="preview-grid">
            {files.map((file) => (
              <div className="preview" key={file.name + file.size}>
                <img src={URL.createObjectURL(file)} alt={file.name} />
                <span title={file.name}>{file.name}</span>
              </div>
            ))}
          </div>
        )}

        <div className="uploaded-section">
          <h3>Uploaded Photos</h3>
          {uploaded.length === 0 ? (
            <div className="empty">No photos uploaded yet.</div>
          ) : (
            <div className="uploaded-grid">
              {uploaded.map((item) => (
                <div className="uploaded" key={item.id}>
                  <img
                    src={`${API_BASE}${item.file_path}`}
                    alt={item.file_name}
                  />
                  <span title={item.file_name}>{item.file_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
