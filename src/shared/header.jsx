import React, { useEffect, useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaUser } from "react-icons/fa";
import { FaCompass } from "react-icons/fa";   
import { GuideContext } from "../components/Guide/GuideProvider";
import axios from "axios";
import "./FrontDesk.css";
  

const Header = () => {
  const { startGuide } = useContext(GuideContext);
  const [schoolName, setSchoolName] = useState("Loading...");
  const [branches, setBranches] = useState([]);
  const [currentDbName, setCurrentDbName] = useState(localStorage.getItem("schoolCode") || "");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [logo, setLogo] = useState("/default-logo.png");
  const [userInfo, setUserInfo] = useState(null);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [instituteAuthorizedPerson, setInstituteAuthorizedPerson] = useState(null);
  const [profileForm, setProfileForm] = useState({
    gender: "",
    phone_no: "",
    email: "",
  });
  const [profileSaveStatus, setProfileSaveStatus] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  const schoolCode = localStorage.getItem("schoolCode");
  const userRole = localStorage.getItem("userRole");
  const prefix = currentDbName.split("_")[0];

  const userDropdownRef = useRef();
  const branchDropdownRef = useRef();
const [instituteAddress, setInstituteAddress] = useState("");

const normalizeInstituteLogo = (rawLogo) => {
  if (!rawLogo) return "";

  let logo = rawLogo;

  if (typeof logo === "object" && logo?.type === "Buffer" && Array.isArray(logo?.data)) {
    try {
      logo = new Uint8Array(logo.data);
    } catch {
      return "";
    }
  }

  if (logo instanceof Uint8Array) {
    const binary = Array.from(logo, (byte) => String.fromCharCode(byte)).join("");
    return `data:image/png;base64,${btoa(binary)}`;
  }

  if (typeof logo !== "string") return "";
  logo = logo.trim();
  if (!logo) return "";
  if (logo.startsWith("data:image")) return logo;
  if (logo.startsWith("http")) return logo;

  if (logo.startsWith("0x")) {
    try {
      const hex = logo.slice(2);
      let binary = "";
      for (let i = 0; i < hex.length; i += 2) {
        binary += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
      }
      return `data:image/png;base64,${btoa(binary)}`;
    } catch {
      return "";
    }
  }

  if (logo.startsWith("uploads/")) {
    return `https://cleezoclass.com:4000/${logo}`;
  }
  if (logo.startsWith("/uploads/")) {
    return `https://cleezoclass.com:4000${logo}`;
  }

  if (/^[A-Za-z0-9+/=]+$/.test(logo) && logo.length > 100) {
    return `data:image/png;base64,${logo}`;
  }

  return "";
};

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

useEffect(() => {
  if (!currentDbName) {
    console.log("[Header] No currentDbName found in localStorage");
    return;
  }

  console.log("[Header] Fetching institute info for dbName:", currentDbName);

  fetch(`https://cleezoclass.com:4000/api/institute?dbName=${currentDbName}`)
    .then(res => {
      console.log("[Header] Institute response status:", res.status);
      return res.json();
    })
    .then(data => {
      console.log("[Header] Institute data received:", data);

      setSchoolName(String(data.institute_name || "Unknown School").trim());
      localStorage.setItem("schoolName", String(data.institute_name || "Unknown School").trim());
      console.log("[Header] School name set:", String(data.institute_name || "Unknown School").trim());

      const normalizedLogo = normalizeInstituteLogo(data.logo);
      setLogo(normalizedLogo || "/default-logo.png");
      localStorage.setItem("schoolLogo", normalizedLogo || "/default-logo.png");
      console.log("[Header] Raw logo value:", data.logo);
      console.log("[Header] Normalized logo value:", normalizedLogo || "/default-logo.png");

      setInstituteAddress(data.address || "Address not available");
      localStorage.setItem("schoolAddress", String(data.address || "Address not available"));
      console.log("[Header] Address set:", data.address || "Address not available");

      const authorizedPerson = String(data.institute_authorized_person || "").trim();
      console.log("[Header] institute_authorized_person resolved as:", authorizedPerson || "(empty)");
      setInstituteAuthorizedPerson(authorizedPerson);
    })
    .catch(err => {
      console.error("[Header] Error fetching institute info:", err);

      setSchoolName("Unknown School");
      setLogo("/default-logo.png");
      setInstituteAddress("Address not available");
      setInstituteAuthorizedPerson("");
      localStorage.setItem("schoolName", "Unknown School");
      localStorage.setItem("schoolLogo", "/default-logo.png");
      localStorage.setItem("schoolAddress", "Address not available");
    });
}, [currentDbName]);


  // Fetch branches for superadmin
  useEffect(() => {
    if (!prefix || userRole !== "superadmin" || instituteAuthorizedPerson === null) return;

    const params = new URLSearchParams({ prefix });
    if (instituteAuthorizedPerson) {
      params.set("institute_authorized_person", instituteAuthorizedPerson);
    }

    console.log("[Header] Fetching branches with params:", params.toString());
    fetch(`https://cleezoclass.com:4000/api/branches?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        console.log("[Header] Branches API response:", data);
        const branchList = Array.isArray(data)
          ? data
          : Array.isArray(data?.branches)
            ? data.branches
            : [];
        console.log("[Header] Raw branch count:", branchList.length);

        const filteredBranches = instituteAuthorizedPerson
          ? branchList.filter(branch => {
              const branchAuthorizedPerson = String(
                branch?.institute_authorized_person || branch?.authorized_person || ""
              ).trim();
              const expectedAuthorizedPerson = String(instituteAuthorizedPerson).trim();
              console.log("[Header] Branch filter check:", {
                dbName: branch?.dbName,
                institute_name: branch?.institute_name,
                branchAuthorizedPerson,
                expected: expectedAuthorizedPerson,
              });
              return branchAuthorizedPerson === expectedAuthorizedPerson;
            })
          : branchList;

        console.log("[Header] Filtered branch count:", filteredBranches.length);
        setBranches(filteredBranches);
      })
      .catch(err => console.error("[Header] Error fetching branches:", err));
  }, [prefix, userRole, instituteAuthorizedPerson]);

  // Fetch user info
  useEffect(() => {
    if (!username || !schoolCode) return;
    fetch(`https://cleezoclass.com:4000/api/api/user-info/${username}?schoolCode=${schoolCode}`)
      .then(res => res.json())
      .then(data => {
        setUserInfo({
          ...data,
          photo: normalizeUserPhoto(data?.photo),
        });
      })
      .catch(err => console.error(err));
  }, [username, schoolCode]);

  useEffect(() => {
    if (!profileEditOpen || !userInfo) return;
    setProfileForm({
      gender: userInfo.gender || "",
      phone_no: userInfo.phone_no || "",
      email: userInfo.email || "",
    });
    setProfileSaveStatus("");
  }, [profileEditOpen, userInfo]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchBranch = (dbName) => {
    localStorage.setItem("schoolCode", dbName);
    setCurrentDbName(dbName);
    setDropdownOpen(false);
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("schoolCode");
    localStorage.removeItem("userRole");
    localStorage.removeItem("name");
    sessionStorage.clear();
    // Hard replace prevents reopening protected dashboard via forward history.
    window.location.replace(import.meta.env.BASE_URL || "/");
  };

  const refreshUserInfo = async () => {
    if (!username || !schoolCode) return;

    try {
      const { data } = await axios.get(
        `https://cleezoclass.com:4000/api/api/user-info/${username}?schoolCode=${encodeURIComponent(schoolCode)}`
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

  const styles = {
    headerContainer: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 20px",
      backgroundColor: "#fff",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    },
    logo: { width: 90, height: 90, borderRadius: 5, objectFit: "cover" },
    schoolName: { fontWeight: "bold", fontSize: 18 },
    branchContainer: { display: "flex", gap: 10, alignItems: "center", position: "relative" },
    dropdownButton: { padding: "5px 10px", cursor: "pointer", backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: 3 },
    dropdownMenu: { position: "absolute", top: 35, left: 0, backgroundColor: "#fff", border: "1px solid #ccc", display: "flex", flexDirection: "column", minWidth: 200, zIndex: 1000, boxShadow: "0 2px 5px rgba(0,0,0,0.2)" },
    dropdownItem: (active) => ({ display: "flex", alignItems: "center", gap: 10, padding: "5px 10px", backgroundColor: active ? "#ddd" : "#fff", cursor: "pointer", border: "none", textAlign: "left" }),
    dropdownLogo: { width: 25, height: 25, borderRadius: 3, objectFit: "cover" },
    userIcon: { width: 40, height: 40, borderRadius: "50%", cursor: "pointer", objectFit: "cover" },
    userDropdown: { position: "absolute", top: 45, right: 0, backgroundColor: "#fff", border: "1px solid #ccc", padding: 10, minWidth: 220, boxShadow: "0 2px 5px rgba(0,0,0,0.2)", borderRadius: 5, zIndex: 1000 },
    userName: { fontWeight: "bold" },
    logoutButton: { padding: "5px 12px", cursor: "pointer", backgroundColor: "#f44336", color: "#fff", border: "none", borderRadius: 3, marginTop: 10 }
  };

return (
    <div style={styles.headerContainer}>
      <img src={logo} alt="Logo" style={styles.logo} />
      <div style={styles.schoolName}>{schoolName}</div>

      <div style={styles.branchContainer}>
        {userRole === "superadmin" && (
          <div ref={branchDropdownRef} style={{ position: "relative" }}>
            <button style={styles.dropdownButton} onClick={() => setDropdownOpen(!dropdownOpen)}>
              Switch Branch ▾
            </button>
            {dropdownOpen && (
              <div style={styles.dropdownMenu}>
                {branches.map(branch => (
                  <button
                    key={branch.dbName}
                    onClick={() => switchBranch(branch.dbName)}
                    style={styles.dropdownItem(branch.dbName === currentDbName)}
                  >
                    {branch.logo && <img src={branch.logo} alt="Logo" style={styles.dropdownLogo} />}
                    {branch.institute_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
         <button
  onClick={() => {
  const currentPath = window.location.pathname;

  if (currentPath.includes("AccountantDashboard")) {
    startGuide("accountant_income");
  } 
  else if (currentPath.includes("AdminDashboard")) {
    startGuide("admin_academics_teacher");
  } 
  else if (currentPath.includes("HRDashboard")) {
    startGuide("admin_hr");
  }
  else if (currentPath.includes("FrontDeskDashboard")) {
  startGuide("frontdesk_admission_manual");
}
  else {
    startGuide("income"); // Chief default
  }
}}
  style={{
    padding: "7px 14px",
    cursor: "pointer",
    background: "linear-gradient(135deg, #0f5fa4, #2f85d6)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.22)",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "14px",
    letterSpacing: "0.2px",
    boxShadow: "0 8px 18px rgba(12, 74, 129, 0.28)",
    display: "inline-flex",
    alignItems: "center",
    gap: "7px"
  }}
>
  <FaCompass style={{ fontSize: 14 }} />
  Guide
</button>

        <div ref={userDropdownRef} className="header-profile-wrap">
          <div
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="header-profile-trigger"
          >
            <FaUser className="header-profile-trigger-icon" />
          </div>

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
                    <img
                      src={userInfo.photo}
                      alt="Profile"
                      className="header-profile-avatar-image"
                    />
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

                <div><strong>school Name:</strong> {schoolName}</div>
                <div><strong>school Address:</strong> {instituteAddress}</div>
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
              <button onClick={handleLogout} className="header-profile-logout">Logout</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;