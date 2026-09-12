import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import './Accountant_parties.css';

const AccountantParties = () => {
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const font = "'Century Gothic', 'AppleGothic', sans-serif";
    const [modal, setModal] = useState({
        isVisible: false,
        message: '',
        type: 'alert',
        onConfirm: () => setModal({ ...modal, isVisible: false }),
        onCancel: () => setModal({ ...modal, isVisible: false }),
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div className="parties-outer-container">
            <CustomModal
                isVisible={modal.isVisible}
                message={modal.message}
                type={modal.type}
                onConfirm={modal.onConfirm}
                onCancel={modal.onCancel}
            />
            <div className="parties-container">
                <div className="parties-main-grid">
                    <CustomCard title="Parties - Income" isMobile={isMobile}>
                        <PartiesIncome isMobile={isMobile} font={font} setModal={setModal} />
                    </CustomCard>
                    <CustomCard title="New Branch" isMobile={isMobile}>
                        <NewBranch isMobile={isMobile} font={font} />
                    </CustomCard>
                </div>
                <Reports isMobile={isMobile} font={font} />
            </div>
        </div>
    );
};

// --- Sub-components ---
const CustomModal = ({ isVisible, message, type, onConfirm, onCancel }) => {
    if (!isVisible) return null;
    return (
        <div className="parties-modal-overlay">
            <div className="parties-modal-box">
                <h3 style={{ color: type === 'confirm' ? '#945f4aff' : (message && message.includes('ERROR') ? '#CC0000' : '#38761D') }}>Notification</h3>
                <p>{message}</p>
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: type === 'confirm' ? 'space-around' : 'center', gap: '10px' }}>
                    {type === 'confirm' && <button onClick={onCancel} className="parties-btn-outline">Cancel</button>}
                    <button onClick={onConfirm} className="parties-btn-solid">{type === 'confirm' ? 'Proceed' : 'OK'}</button>
                </div>
            </div>
        </div>
    );
};

const CustomCard = ({ title, children, isMobile }) => {
    return (
        <div className="parties-card">
            <div className="parties-card-header">
                <span className="parties-card-header-icon" />
                {title}
            </div>
            {children}
        </div>
    );
};

const StatusBox = ({ title, value, isMobile, font, setModal, modalKey }) => {
    return (
        <div className="parties-status-box">
            <span className="parties-status-label">{title}</span>
            <span className="parties-status-value">{value}</span>
            {setModal && modalKey && <button className="parties-btn-outline" onClick={() => setModal(modalKey)}>VIEW LIST</button>}
        </div>
    );
};
const DeletedUsersModal = ({ deletedUsers, onClose, isMobile }) => {
  const modalStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  };

  const boxStyle = {
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "20px",
    width: isMobile ? "90%" : "600px",
    maxHeight: "80vh",
    overflowY: "auto",
  };

  const closeBtnStyle = {
    float: "right",
    backgroundColor: "#CC0000",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "6px 12px",
    cursor: "pointer",
  };

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={boxStyle} onClick={(e) => e.stopPropagation()}>
        <button style={closeBtnStyle} onClick={onClose}>
          Close
        </button>
        <h3>Deleted Students List</h3>
        {deletedUsers.length === 0 ? (
          <p>No deleted users found.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
            <thead>
              <tr style={{ backgroundColor: "#eee" }}>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Full Name</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Class</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Section</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Father Name</th>
              </tr>
            </thead>
            <tbody>
              {deletedUsers.map((user) => (
                <tr key={user.id}>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{user.name}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{user.class_name}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{user.section}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{user.father_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const StudentsModal = ({ students, onClose, isMobile }) => {
  const modalStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  };

  const boxStyle = {
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "20px",
    width: isMobile ? "90%" : "700px",
    maxHeight: "80vh",
    overflowY: "auto",
  };

  const closeBtnStyle = {
    float: "right",
    backgroundColor: "#CC0000",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "6px 12px",
    cursor: "pointer",
  };

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={boxStyle} onClick={(e) => e.stopPropagation()}>
        <button style={closeBtnStyle} onClick={onClose}>
          Close
        </button>
        <h3>All Students</h3>
        {students.length === 0 ? (
          <p>No students found.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
            <thead>
              <tr style={{ backgroundColor: "#eee" }}>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}> Name</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Class</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Section</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Father Name</th>
                 <th style={{ border: "1px solid #ccc", padding: "8px" }}> Phone no</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Address</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{student.name}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{student.class_name}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{student.section}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{student.father_name}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{student.phone_no}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{student.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
const PartiesIncome = ({ isMobile, font }) => {
  const schoolCode = localStorage.getItem("schoolCode") || "NOVA";

  const [modal, setModal] = useState(null);
    const [students, setStudents] = useState([]);
    const [deletedUsers, setDeletedUsers] = useState([]);

useEffect(() => {
  const fetchDeletedUsers = async () => {
    try {
      const res = await axios.get("https://cleezoclass.com:4000/api/deleted-students", {
        params: { schoolCode },
      });
      setDeletedUsers(res.data);
    } catch (error) {
      console.error("Error fetching deleted users:", error);
    }
  };
  fetchDeletedUsers();
}, [schoolCode]);


useEffect(() => {
  const fetchStudents = async () => {
    try {
      const res = await axios.get("https://cleezoclass.com:4000/students-details", {
        params: { schoolCode },
      });
      setStudents(res.data.students || []);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };
  fetchStudents();
}, [schoolCode]);


    return (
        <div className="parties-form-container">
            <div className="parties-form-row">
                <div className="parties-form-group">
                    <label className="parties-form-label">CLASS</label>
                    <select className="parties-form-select">
                        <option>Select Class</option>
                    </select>
                </div>
                <div className="parties-form-group">
                    <label className="parties-form-label">SECTION</label>
                    <select className="parties-form-select">
                        <option>Select Section</option>
                    </select>
                </div>
                <div className="parties-form-group">
                    <label className="parties-form-label">FATHER NAME</label>
                    <input type="text" className="parties-form-input" placeholder="Father Name" />
                </div>
                <div className="parties-form-group">
                    <label className="parties-form-label">FULL NAME</label>
                    <input type="text" className="parties-form-input" placeholder="Full Name" />
                </div>
                <div className="parties-form-group">
                    <label className="parties-form-label">CITY</label>
                    <input type="text" className="parties-form-input" placeholder="Address" />
                </div>
            </div>
            <div className="parties-form-actions">
                <button className="btn-solid">ADD</button>
                <button className="btn-solid" onClick={() => setModal("partyIncomeList")}>VIEW LIST</button>
            </div>
            <div className="parties-status-container">
                <StatusBox title="TOTAL STRENGTH" value={students.length} isMobile={isMobile} font={font} setModal={setModal} modalKey="studentsList" />
                <StatusBox title="TOTAL DROPOUTS" value={deletedUsers.length} isMobile={isMobile} font={font} setModal={setModal} modalKey="deletedUsersList" />
            </div>
                 {modal === "deletedUsersList" && (
        <DeletedUsersModal deletedUsers={deletedUsers} onClose={() => setModal(null)} isMobile={isMobile} />
      )}

      {modal === "studentsList" && (
        <StudentsModal students={students} onClose={() => setModal(null)} isMobile={isMobile} />
      )}
        </div>
    );
};

const NewBranch = ({ isMobile, font }) => {
    return (
        <div className="parties-form-container">
            <div className="parties-form-row">
                <div className="parties-form-group">
                    <label className="parties-form-label">SELECT BRANCH</label>
                    <select className="parties-form-select">
                        <option>SELECT BR.</option>
                    </select>
                </div>
                <div className="parties-form-group">
                    <label className="parties-form-label">INCOME TYPE</label>
                    <select className="parties-form-select">
                        <option>INCOME TYPE</option>
                    </select>
                </div>
                <div className="parties-form-group">
                    <label className="parties-form-label">STRENGTH</label>
                    <input type="text" className="parties-form-input" placeholder="STRENGTH" />
                </div>
                <div className="parties-form-group">
                    <label className="parties-form-label">EXPENSE TYPE</label>
                    <select className="parties-form-select">
                        <option>EXPENSE TYPE</option>
                    </select>
                </div>
                <div className="parties-form-group">
                    <label className="parties-form-label">UPLOAD DATA</label>
                    <input type="text" className="parties-form-input" placeholder="Address" />
                </div>
            </div>
            <div className="parties-form-actions">
                <button className="parties-btn-solid">ADD</button>
                <button className="parties-btn-outline">VIEW DATA</button>
            </div>
        </div>
    );
};

const Reports = ({ isMobile, font }) => {
    return (
        <div className="parties-reports-container">
            <div className="parties-report-item">
                <span style={{ fontWeight: 'bold', color: '#CC0000' }}>COMPLAINT NO: 1067, RE-ADD H.JANANT KUMAR, Rejected for </span>
                <span style={{ fontWeight: 'normal' }}>COMPLAIN RE-ADD REJECTION.</span>
            </div>
        </div>
    );
};

export default AccountantParties;