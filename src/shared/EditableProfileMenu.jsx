import React, { useEffect, useRef, useState } from "react";
import { FaEdit, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const normalizeUserPhoto = (rawPhoto) => {
  if (!rawPhoto) return "";

  let photo = rawPhoto;

  if (typeof photo === "object" && photo?.type === "Buffer" && Array.isArray(photo?.data)) {
    try {
      photo = new TextDecoder().decode(new Uint8Array(photo.data));
    } catch {
      return "";
    }
  }

  if (typeof photo !== "string") return "";
  photo = photo.trim();
  if (!photo) return "";

  if (photo.startsWith("data:image")) return photo;
  if (photo.startsWith("http")) return photo;

  if (photo.startsWith("0x")) {
    try {
      const hex = photo.slice(2);
      let decoded = "";
      for (let i = 0; i < hex.length; i += 2) {
        decoded += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
      }
      photo = decoded.trim();
    } catch {
      return "";
    }
  }

  if (photo.startsWith("/public/uploads/")) {
    photo = photo.replace("/public", "");
  }
  if (photo.startsWith("uploads/")) {
    photo = `/${photo}`;
  }
  if (photo.startsWith("/uploads/")) {
    return `https://cleezoclass.com:4000${photo}`;
  }

  if (/^[A-Za-z0-9+/=]+$/.test(photo) && photo.length > 100) {
    return `data:image/jpeg;base64,${photo}`;
  }

  return "";
};

const EditableProfileMenu = ({ logoutLabel = "Logout", showHrSwitch = false, hrSwitchLabel = "Switch to HR", hrSwitchTo = "/HrDashboard" }) => {
  const [schoolName, setSchoolName] = useState("Institute");
  const [instituteAddress, setInstituteAddress] = useState("");
  const [schoolLogo, setSchoolLogo] = useState("/default-logo.png");
  const [userInfo, setUserInfo] = useState(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    gender: "",
    phone_no: "",
    email: "",
  });
  const [profileSaveStatus, setProfileSaveStatus] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const userDropdownRef = useRef(null);
  const navigate = useNavigate();

  const schoolCode = String(localStorage.getItem("schoolCode") || "").trim();
  const username = String(localStorage.getItem("username") || "").trim();

  useEffect(() => {
    if (!schoolCode) return;

    let cancelled = false;
    fetch(`https://cleezoclass.com:4000/api/institute?dbName=${encodeURIComponent(schoolCode)}`)
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (cancelled) return;
        setSchoolLogo(data?.logo || "/default-logo.png");
        setSchoolName(
          data?.institute_name || data?.schoolName || data?.name || schoolCode || "Institute"
        );
        setInstituteAddress(data?.address || data?.schoolAddress || data?.instituteAddress || "");
      })
      .catch(() => {
        if (cancelled) return;
        setSchoolLogo("/default-logo.png");
        setSchoolName(schoolCode || "Institute");
        setInstituteAddress("");
      });

    return () => {
      cancelled = true;
    };
  }, [schoolCode]);

  useEffect(() => {
    if (!username || !schoolCode) return;

    let cancelled = false;
    fetch(
      `https://cleezoclass.com:4000/api/api/user-info/${encodeURIComponent(username)}?schoolCode=${encodeURIComponent(schoolCode)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setUserInfo({
          ...data,
          photo: normalizeUserPhoto(data?.photo),
        });
      })
      .catch(() => {
        if (cancelled) return;
        setUserInfo(null);
      });

    return () => {
      cancelled = true;
    };
  }, [schoolCode, username]);

  useEffect(() => {
    if (!profileEditOpen || !userInfo) return;

    setProfileForm({
      gender: userInfo.gender || "",
      phone_no: userInfo.phone_no || "",
      email: userInfo.email || "",
    });
    setProfileSaveStatus("");
  }, [profileEditOpen, userInfo]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("schoolCode");
    localStorage.removeItem("userRole");
    localStorage.removeItem("name");
    sessionStorage.clear();
    window.location.replace(import.meta.env.BASE_URL || "/");
  };

  const refreshUserInfo = async () => {
    if (!username || !schoolCode) return;

    try {
      const { data } = await axios.get(
        `https://cleezoclass.com:4000/api/api/user-info/${encodeURIComponent(username)}?schoolCode=${encodeURIComponent(schoolCode)}`
      );
      setUserInfo({
        ...data,
        photo: normalizeUserPhoto(data?.photo),
      });
    } catch (error) {
      console.error("Failed to refresh user info", error);
    }
  };

  const openProfileEditor = () => {
    setProfileEditOpen(true);
    setProfileSaveStatus("");
  };

  const closeProfileEditor = () => {
    setProfileEditOpen(false);
    setProfileSaveStatus("");
  };

  const handleSaveProfile = async () => {
    if (!schoolCode || !userInfo?.id) {
      setProfileSaveStatus("Missing user or school information.");
      return;
    }

    setProfileSaving(true);
    setProfileSaveStatus("");

    try {
      const formData = new FormData();
      formData.append("schoolCode", schoolCode);
      formData.append("gender", profileForm.gender.trim());
      formData.append("phone_no", profileForm.phone_no.trim());
      formData.append("email", profileForm.email.trim());

      const { data } = await axios.put(
        `https://cleezoclass.com:4000/api/profile/users/${userInfo.id}?schoolCode=${encodeURIComponent(schoolCode)}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setProfileSaveStatus(data?.message || "Profile updated successfully.");
      await refreshUserInfo();
      setProfileEditOpen(false);
    } catch (error) {
      setProfileSaveStatus(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to update profile details."
      );
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div ref={userDropdownRef} className="header-profile-wrap">
      <button
        className="header-profile-trigger"
        type="button"
        onClick={() => setUserDropdownOpen((prev) => !prev)}
      >
        <FaUser className="header-profile-trigger-icon" />
      </button>

      {userDropdownOpen && userInfo && (
        <div className="header-profile-dropdown">
          <div className="header-profile-card header-profile-card-editable">
            <button
              type="button"
              className="header-profile-edit-btn"
              onClick={profileEditOpen ? closeProfileEditor : openProfileEditor}
              aria-label="Edit profile"
              title="Edit profile"
            >
              <FaEdit />
            </button>
            <div className="header-profile-avatar">
              {userInfo?.photo ? (
                <img src={userInfo.photo} alt="Profile" className="header-profile-avatar-image" />
              ) : (
                <FaUser className="header-profile-avatar-fallback" />
              )}
            </div>
            <div className="header-profile-name">{userInfo.name}</div>
          </div>

          <hr className="header-profile-divider" />
          <div className="header-profile-info">
            <div><strong>Designation:</strong> {userInfo.designation}</div>

            {profileEditOpen ? (
              <div className="header-profile-form">
                <label className="header-profile-label">
                  <strong>Gender:</strong>
                  <input
                    type="text"
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, gender: e.target.value }))}
                    placeholder="Enter gender"
                    className="header-profile-input"
                  />
                </label>
                <label className="header-profile-label">
                  <strong>Phone:</strong>
                  <input
                    type="text"
                    value={profileForm.phone_no}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, phone_no: e.target.value }))}
                    placeholder="Enter phone number"
                    className="header-profile-input"
                  />
                </label>
                <label className="header-profile-label">
                  <strong>Email:</strong>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email"
                    className="header-profile-input"
                  />
                </label>
              </div>
            ) : (
              <>
                <div className="header-profile-field">
                  <strong>Gender:</strong>
                  <span>{userInfo.gender}</span>
                </div>
                <div className="header-profile-field">
                  <strong>Phone:</strong>
                  <span>{userInfo.phone_no}</span>
                </div>
                <div className="header-profile-email"><strong>Email:</strong> {userInfo.email}</div>
              </>
            )}

            <div><strong>School Name:</strong> {schoolName}</div>
            <div><strong>School Address:</strong> {instituteAddress || "-"}</div>
          </div>

          {profileEditOpen && (
            <>
              {profileSaveStatus && (
                <div
                  className={`header-profile-status ${
                    profileSaveStatus.toLowerCase().includes("failed") ||
                    profileSaveStatus.toLowerCase().includes("missing")
                      ? "header-profile-status-error"
                      : "header-profile-status-success"
                  }`}
                >
                  {profileSaveStatus}
                </div>
              )}
              <div className="header-profile-actions">
                <button
                  type="button"
                  onClick={closeProfileEditor}
                  className="header-profile-logout header-profile-cancel"
                  disabled={profileSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="header-profile-logout header-profile-save"
                  disabled={profileSaving}
                >
                  {profileSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </>
          )}

          {showHrSwitch && (
            <button type="button" className="header-profile-logout" onClick={() => navigate(hrSwitchTo)}>
              {hrSwitchLabel}
            </button>
          )}

          <button type="button" onClick={handleLogout} className="header-profile-logout">
            {logoutLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default EditableProfileMenu;
