import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import '../STYLES/tabhower.css'
import axios from 'axios';

// Define placeholders for the shared components and helpers
const API_BASE = 'https://cleezoclass.com:4000/api/admin';
const API_BASE_URL = "https://cleezoclass.com:4000";

// Helper function to get school code from local storage
const getSchoolCode = () => {
    const storedCode = localStorage.getItem('schoolCode');
    return storedCode || 'TAGSOLNOVALLP';
};

// Placeholder for CustomModal (kept from original for alerts)
const CustomModal = ({ isVisible, message, type, onConfirm, onCancel }) => {
    if (!isVisible) return null;
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, }}>
            <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)', maxWidth: '400px', width: '90%', textAlign: 'center', }}>
                <h3 style={{color: type === 'confirm' ? '#945f4aff' : (message && message.includes('ERROR') ? '#CC0000' : '#38761D')}}>Notification</h3>
                <p>{message}</p>
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: type === 'confirm' ? 'space-around' : 'center', gap: '10px', }}>
                    {type === 'confirm' && (<button onClick={onCancel} style={{ padding: '10px 20px', border: 'none', borderRadius: '6px', backgroundColor: '#ccc', color: '#333', cursor: 'pointer', }}>Cancel</button>)}
                    <button onClick={onConfirm} style={{ padding: '10px 20px', border: 'none', borderRadius: '6px', backgroundColor: type === 'confirm' ? '#945f4aff' : '#38761D', color: 'white', cursor: 'pointer', }}>{type === 'confirm' ? 'Proceed' : 'OK'}</button>
                </div>
            </div>
        </div>
    );
};

// Placeholder for CustomCard
const CustomCard = ({ title, children, isMobile }) => {
    const cardStyle = {
        backgroundColor: "#fff",
        borderRadius: "16px",
        border: "1px solid #ddd",
        padding: "15px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        height: '100%',
        overflowY: 'auto',
    };
    const headerStyle = {
        fontSize: '12px',
        fontWeight: "600",
        marginBottom: "10px",
        color: "#333",
        paddingBottom: "5px",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
    };
    const radioStyle = {
        marginRight: '8px',
        color: '#945f4aff',
    };

    return (
        <div style={cardStyle}>
            <div style={headerStyle}>
                <input type="radio" style={radioStyle} id={`radio-${title.replace(/\s/g, '-')}`} name="section-radio-exp" defaultChecked />
                <label htmlFor={`radio-${title.replace(/\s/g, '-')}`}>
                    {title}
                </label>
            </div>
            {children}
        </div>
    );
};


const StatusBox = ({ title, value, isMobile, font, setModal, modalKey }) => {
  const dataStyle = {
    textAlign: "center",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    backgroundColor: "#f9f9f9",
  };
  const valueStyle = {
    fontSize: isMobile ? "18px" : "22px",
    fontWeight: "bold",
    color: "#945f4aff",
    display: "block",
    margin: "5px 0",
  };
  const labelStyle = {
    fontSize: isMobile ? "12px" : "14px",
    color: "#6b7983ff",
    display: "block",
  };
  const btnStyle = {
    backgroundColor: "#6b7983ff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "4px 8px",
    cursor: "pointer",
    fontSize: isMobile ? "10px" : "12px",
    fontWeight: "500",
    fontFamily: font,
    margin: "5px",
  };

  return (
    <div style={dataStyle}>
      <span style={labelStyle}>{title}</span>
      <span style={valueStyle}>{value}</span>
      {setModal && modalKey && (
        <button style={btnStyle} onClick={() => setModal(modalKey)}>
          VIEW LIST
        </button>
      )}
    </div>
  );
};

// -----------------------------
// DeletedUsersModal Component
// -----------------------------
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

// -----------------------------
// StudentsModal Component
// -----------------------------
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

// -----------------------------
// PartiesIncome Component
// -----------------------------
const PartiesIncome = ({ isMobile, font }) => {
  const schoolCode = localStorage.getItem("schoolCode") || "NOVA";

  const [modal, setModal] = useState(null);
  const [students, setStudents] = useState([]);
  const [deletedUsers, setDeletedUsers] = useState([]);

  // Fetch all students
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


  // Fetch deleted users
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

  const btnStyle = (color) => ({
    backgroundColor: color,
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: isMobile ? "12px" : "14px",
    fontWeight: "600",
    fontFamily: font,
    margin: "5px 5px 5px 0",
  });
  const labelStyle = {
    fontSize: isMobile ? "12px" : "14px",
    color: "#6b7983ff",
    display: "block",
  };
    const inputStyle = {
        padding: "4px 8px",
        borderRadius: "4px",
        border: "1px solid #ddd",
        width: '100%',
        marginBottom: '10px',
        fontSize: isMobile ? '12px' : '14px',
    };
  return (
    <div style={{ paddingBottom: "10px" }}>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "20px", width: "100%" }}>


        <div style={{ flex: 1 }}>
          {/* PARTIES + INCOME */}
          <div
            style={{
              borderBottom: "1px dashed #ccc",
              marginBottom: "15px",
              paddingBottom: "15px",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "10px",
                fontSize: isMobile ? "14px" : "16px",
                color: "#6b7983ff",
              }}
            >
              PARTIES + INCOME
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: "10px",
              }}
            >
              <div>
                <label style={labelStyle}>CLASS</label>
                <select style={inputStyle}>
                  <option>Select Class</option>
                </select>

                <label style={labelStyle}>FATHER NAME</label>
                <input type="text" style={inputStyle} placeholder="Father Name" />
              </div>

              <div>
                <label style={labelStyle}>SECTION</label>
                <select style={inputStyle}>
                  <option>Select Section</option>
                </select>

                <label style={labelStyle}>FULL NAME</label>
                <input type="text" style={inputStyle} placeholder="Full Name" />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "10px",
              }}
            >
              <div style={{ flex: 1, marginRight: "10px" }}>
                <label style={labelStyle}>CITY</label>
                <select style={inputStyle}>
                  <option>Select City</option>
                </select>
              </div>

              <button style={{ ...btnStyle("#38761D"), alignSelf: "flex-end" }}>
                ADD
              </button>

              <button
                style={{ ...btnStyle("#6b7983ff"), alignSelf: "flex-end" }}
                onClick={() => setModal("partyIncomeList")}
              >
                VIEW LIST
              </button>
            </div>
          </div>

          {/* PARTIES - INCOME - DROPOUTS */}
          <div>
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "10px",
                fontSize: isMobile ? "14px" : "16px",
                color: "#945f4aff",
              }}
            >
              PARTIES - INCOME - DROPOUTS
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: "10px",
              }}
            >
              <div>
                <label style={labelStyle}>CLASS</label>
                <select style={inputStyle}>
                  <option>Select Class</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>SECTION</label>
                <select style={inputStyle}>
                  <option>Select Section</option>
                </select>
              </div>
            </div>

            <label style={labelStyle}>FULL NAME</label>
            <input type="text" style={inputStyle} placeholder="Full Name" />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                gap: "10px",
                marginTop: "10px",
              }}
            >
              <button style={btnStyle("#CC0000")}>DELETE</button>
              <button style={btnStyle("#945f4aff")}>EDIT</button>
              <button
                style={btnStyle("#6b7983ff")}
                onClick={() => setModal("deletedUsersList")}
              >
                VIEW LIST
              </button>
            </div>
          </div>
        </div>
        {/* RIGHT COLUMN */}
        <div
          style={{
            width: isMobile ? "100%" : "250px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "10px",
          }}
        >
          <StatusBox
            title="TOTAL STRENGTH"
            value={students.length}
            isMobile={isMobile}
            font={font}
            setModal={setModal}
            modalKey="studentsList"
          />

          <StatusBox
            title="TOTAL DROPOUTS"
            value={deletedUsers.length}
            isMobile={isMobile}
            font={font}
            setModal={setModal}
            modalKey="deletedUsersList"
          />
        </div>
      </div>

      {/* MODALS */}
      {modal === "deletedUsersList" && (
        <DeletedUsersModal deletedUsers={deletedUsers} onClose={() => setModal(null)} isMobile={isMobile} />
      )}

      {modal === "studentsList" && (
        <StudentsModal students={students} onClose={() => setModal(null)} isMobile={isMobile} />
      )}
    </div>
  );
};


// ----------------------------------------------------------------------
// --- NewBranch Component (with relocated Status) ---
// ----------------------------------------------------------------------
const NewBranch = ({ isMobile, font }) => {
    const inputStyle = {
        padding: "4px 8px",
        borderRadius: "4px",
        border: "1px solid #ddd",
        width: '100%',
        marginBottom: '10px',
        fontSize: isMobile ? '12px' : '14px',
    };
    const labelStyle = {
        fontSize: isMobile ? '10px' : '12px',
        fontWeight: 'bold',
        marginBottom: '2px',
        display: 'block',
        textAlign: 'left',
    };
    const btnStyle = (color) => ({
        backgroundColor: color,
        color: "white",
        border: "none",
        borderRadius: "4px",
        padding: "6px 10px",
        cursor: "pointer",
        fontSize: isMobile ? "12px" : "14px",
        fontWeight: '600',
        fontFamily: font,
        margin: '5px 5px 5px 0',
        transition: 'background-color 0.2s',
    });

    return (
        <div style={{ paddingBottom: '10px' }}>
   <div
  style={{
    display: isMobile ? "block" : "flex",
    gap: "20px",
    width: "100%",
  }}
>

  {/* LEFT COLUMN */}
  <div style={{ flex: 1 }}>

    {/* NEW BRANCH */}
    <div
      style={{
        marginBottom: "15px",
        paddingBottom: "15px",
        borderBottom: "1px dashed #ccc",
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          marginBottom: "10px",
          fontSize: isMobile ? "14px" : "16px",
          color: "#6b7983ff",
        }}
      >
        NEW BRANCH
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
        }}
      >
        <div>
          <label style={labelStyle}>SELECT BRANCH</label>
          <select style={inputStyle}>
            <option>SELECT BR.</option>
          </select>

          <label style={labelStyle}>INCOME TYPE</label>
          <select style={inputStyle}>
            <option>INCOME TYPE</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>STRENGTH</label>
          <input type="text" style={inputStyle} placeholder="STRENGTH" />

          <label style={labelStyle}>EXPENSE TYPE</label>
          <select style={inputStyle}>
            <option>EXPENSE TYPE</option>
          </select>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          gap: "10px",
          marginTop: "10px",
        }}
      >
        <button style={btnStyle("#38761D")}>ADD</button>
        <button style={btnStyle("#6b7983ff")}>VIEW DATA</button>
      </div>
    </div>

    {/* COMPLAINT / REPORT */}
    <div>
      <div
        style={{
          fontWeight: "bold",
          marginBottom: "10px",
          fontSize: isMobile ? "14px" : "16px",
          color: "#945f4aff",
        }}
      >
        COMPLAINT / REPORT
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
        }}
      >
        <div>
          <label style={labelStyle}>CLASS</label>
          <select style={inputStyle}><option>CLASS</option></select>

          <label style={labelStyle}>COMPLAIN RE-ADD</label>
          <select style={inputStyle}><option>COMPLAIN RE-ADD</option></select>
        </div>

        <div>
          <label style={labelStyle}>NAME</label>
          <select style={inputStyle}><option>NAME</option></select>

          <label style={labelStyle}>COMPLAIN</label>
          <select style={inputStyle}><option>COMPLAIN</option></select>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          gap: "10px",
          marginTop: "10px",
        }}
      >
        <button style={btnStyle("#38761D")}>ADD</button>
      </div>
    </div>
  </div>

  {/* RIGHT COLUMN — STATUS BOXES */}
  <div
    style={{
      width: isMobile ? "100%" : "260px",
      display: "flex",
      flexDirection: "column",
      alignItems: isMobile ? "flex-start" : "flex-end",
      gap: "10px",
      marginTop: isMobile ? "20px" : 0,
    }}
  >
    <StatusBox
      title="TOTAL BRANCH"
      value="1"
      isMobile={isMobile}
      font={font}
    />
    <StatusBox
      title="TOTAL COMPLAINTS"
      value="6"
      isMobile={isMobile}
      font={font}
    />
  </div>

</div>

        </div>
    );
};


// ----------------------------------------------------------------------
// --- Reports (Bottom Section) ---
// ----------------------------------------------------------------------
const Reports = ({ isMobile, font }) => {
    const btnStyle = {
        backgroundColor: "#6b7983ff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        padding: "6px 10px",
        cursor: "pointer",
        fontSize: isMobile ? "12px" : "14px",
        fontWeight: '600',
        fontFamily: font,
        margin: '5px 5px 5px 0',
    };
    const listStyle = {
        fontSize: isMobile ? '12px' : '14px',
        textAlign: 'left',
        marginBottom: '10px',
    };

    return (
        <div style={{ padding: '15px 10px', borderTop: '1px dashed #ccc', marginTop: '15px' }}>

            {/* Report/Complain Request List */}
            <div style={listStyle}>
                <span style={{ fontWeight: 'bold', color: '#CC0000' }}>COMPLAINT NO: 1067, RE-ADD H.JANANT KUMAR, Rejected for </span>
                <span style={{ fontWeight: 'normal' }}>COMPLAIN RE-ADD REJECTION.</span>
            </div>

         
-
        </div>
    );
};


// ----------------------------------------------------------------------
// --- Main Component: AccountantParties ---
// ----------------------------------------------------------------------
const AccountantParties = () => {
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const font = "'Century Gothic', 'AppleGothic', sans-serif";

    // --- MODAL STATE FOR ALERTS/CONFIRMATIONS ---
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

    // --- STYLES (Adjusted for vertical stacking) ---
    const outerContainer = {
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100%",
        boxSizing: "border-box",

    };
    const container = {
        fontFamily: font,
        backgroundColor: "transparent",
        borderRadius: "16px",
        boxSizing: "border-box",
        width: "100%",
        minWidth: "300px",

    };

    // Main grid now forces a single column for vertical stacking
    const mainGrid = {
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "20px",
        padding: "10px",
        alignItems: 'stretch',
    };


    return (
        <div style={outerContainer}>
            {/* Standard Alert/Confirm Modal */}
            <CustomModal
                isVisible={modal.isVisible}
                message={modal.message}
                type={modal.type}
                onConfirm={modal.onConfirm}
                onCancel={modal.onCancel}
            />

            <div style={container}>
           
                {/* --- MAIN DASHBOARD SECTION (PARTIES, BRANCH) --- */}
                <div style={mainGrid}>
                    {/* 1. PARTIES - INCOME + DROPOUTS */}
                    <CustomCard title="PARTIES - INCOME & DROPOUTS" isMobile={isMobile}>
                        <PartiesIncome isMobile={isMobile} font={font} setModal={setModal} />
                    </CustomCard>

                    {/* 2. NEW BRANCH / COMPLAINT */}
                    <CustomCard title="NEW BRANCH & COMPLAINT" isMobile={isMobile}>
                        <NewBranch isMobile={isMobile} font={font} />
                    </CustomCard>
                </div>

                {/* --- BOTTOM REPORTS SECTION --- */}
                <Reports isMobile={isMobile} font={font} />

            </div>
        </div>
    );
};

export default AccountantParties;