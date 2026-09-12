import React, { useState, useEffect, useRef} from "react";
import axios from "axios";
import ReportCard from "./OverallReport";

const StudentList = () => {
  const [selectedClassSection, setSelectedClassSection] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchName, setSearchName] = useState("");
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [classSectionOptions, setClassSectionOptions] = useState([]);
  const [feeDetails, setFeeDetails] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const schoolCode = localStorage.getItem("schoolCode");

  const dropdownRef = useRef(null);
  useEffect(() => {
  function handleClickOutside(event) {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowDropdown(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);



  // Load class-section options
  useEffect(() => {
    const classes = ["Nursery", "LKG", "UKG", ...Array.from({ length: 10 }, (_, i) => i + 1)];
    const sections = ["A", "B", "C", "D"];
    const allOptions = [];

    classes.forEach((cls) =>
      sections.forEach((sec) => allOptions.push(`${cls}-${sec}`))
    );

    setClassSectionOptions(allOptions);
  }, []);

  // Fetch students of selected class
  useEffect(() => {
    if (!selectedClassSection) {
      setStudents([]);
      setSelectedStudent(null);
      return;
    }

    setFeeDetails(null);

    const [cls, sec] = selectedClassSection.split("-");
    setLoading(true);

    axios
      .get(
        `https://cleezoclass.com:4000/api/studentsName/${cls}?schoolCode=${schoolCode}&section=${sec}`
      )
      .then((res) => setStudents(res.data.students || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedClassSection]);

  // Global search API
  useEffect(() => {
    if (!searchName) {
      setFilteredStudents([]);
      return;
    }

    setLoading(true);
    axios
      .get(
        `https://cleezoclass.com:4000/api/studentsByName?schoolCode=${schoolCode}&name=${searchName}`
      )
      .then((res) => setFilteredStudents(res.data.students || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [searchName]);

  // Select student + load fee info
 const handleStudentSelect = async (student) => {
  setSelectedStudent(student);
  setShowPopup(false);

  let currentClassSection = selectedClassSection;

  if (!currentClassSection) {
    currentClassSection = `${student.class_name}-${student.section}`;
    setSelectedClassSection(currentClassSection);
  }

  const [cls, sec] = currentClassSection.split("-");

  try {
    const schoolCode = localStorage.getItem("schoolCode");

    const classFeesPromise = axios.get(
      `https://cleezoclass.com:4000/api/feeDetailsByClassSection`,
      { params: { className: cls, section: sec, schoolCode } }
    );

    const studentFeesPromise = axios.post(
      `https://cleezoclass.com:4000/api/studentFees`,
      { studentId: student.id, schoolCode }
    );

    const [classRes, studentRes] = await Promise.allSettled([classFeesPromise, studentFeesPromise]);

    // Default fee object with zeros
    const defaultFees = {
      CompleteFee: 0,
      Admission_paid: 0,
      Paid_Amount: 0,
      books_paid: 0,
      uniform_paid: 0,
      bus_paid: 0,
      exam_paid: 0,
      others_paid: 0,
      Discount: 0,
      Installment1_Amount: 0,
      Installment1_Paid: 0,
      Installment1_Deadline_Date: "",
      Installment2_Amount: 0,
      Installment2_Paid: 0,
      Installment2_Deadline_Date: "",
      Installment3_Amount: 0,
      Installment3_Paid: 0,
      Installment3_Deadline_Date: "",
      Installment4_Amount: 0,
      Installment4_Paid: 0,
      Installment4_Deadline_Date: "",
      Installment5_Amount: 0,
      Installment5_Paid: 0,
      Installment5_Deadline_Date: "",
    };

    const classFeeData =
      classRes.status === "fulfilled" ? classRes.value.data.feeDetail || {} : {};
    const studentFeeData =
      studentRes.status === "fulfilled" ? studentRes.value.data.feeDetails || {} : {};

    const mergedFees = {
      ...defaultFees,           // start with zeros
      ...studentFeeData,         // overwrite with actual student-paid data if exists
      CompleteFee: classFeeData.CompleteFee || 0,
      Installment1_Deadline_Date: classFeeData.Installment1_Deadline_Date || "",
      Installment2_Deadline_Date: classFeeData.Installment2_Deadline_Date || "",
      Installment3_Deadline_Date: classFeeData.Installment3_Deadline_Date || "",
      Installment4_Deadline_Date: classFeeData.Installment4_Deadline_Date || "",
      Installment5_Deadline_Date: classFeeData.Installment5_Deadline_Date || "",
    };

    setFeeDetails(mergedFees);
    setShowPopup(true);
    setShowDropdown(false);
    setSearchName("");

  } catch (err) {
    console.error("Error fetching fee details:", err);
    // fallback: still show popup with zeros
    setFeeDetails({
      ...defaultFees,
      CompleteFee: 0,
    });
    setShowPopup(true);
  }
};


  return (
    <div style={{ padding: "0", maxWidth: "800px", margin: "auto" , background: "#fff" }}>

      {/* Class & Student */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "0" }}>
        
        {/* CLASS - SECTION DROPDOWN */}
        <select
          value={selectedClassSection}
onChange={(e) => {
  setSelectedClassSection(e.target.value);
  setShowDropdown(true); // <-- AUTO-OPEN STUDENT DROPDOWN
  setSearchName("");     // optional: clear previous search
}}
          style={{ flex: 1, padding: "8px" }}
        >
          <option value="">Select Class & Section</option>
          {classSectionOptions.map((opt) => {
            const [cls, sec] = opt.split("-");
            return (
              <option key={opt} value={opt}>
                {`Class ${cls} | Section ${sec}`}
              </option>
            );
          })}
        </select>

        {/* STUDENT SEARCHABLE DROPDOWN */}
        <div style={{ flex: 1, position: "relative" }}>
         <input
  type="text"
  placeholder="Search or select student"
  value={searchName || (selectedStudent ? selectedStudent.name : "")}
  onChange={(e) => {
    setSearchName(e.target.value);
    setSelectedStudent(null);   // <-- IMPORTANT FIX
  }}
  style={{ width: "100%", padding: "8px" }}
  onFocus={() => setShowDropdown(true)}
/>


          {/* DROPDOWN LIST */}
{showDropdown && (
  <ul
    ref={dropdownRef}   // <-- ADD THIS
    style={{
      position: "absolute",
      width: "100%",
      background: "#fff",
      border: "1px solid #ccc",
      maxHeight: "520px",
      overflowY: "auto",
      padding: 0,
      margin: 0,
      listStyle: "none",
      zIndex: 1000,
overflowY: "auto",

    }}
  >
    {/* Class-based students when not searching */}
    {!searchName &&
      students.map((s) => (
        <li
          key={s.id}
          style={{
            padding: "8px",
            cursor: "pointer",
            borderBottom: "1px solid #eee",
          }}
          onClick={() => handleStudentSelect(s)}
        >
          {s.name}
        </li>
      ))}

    {/* Global search results */}
    {searchName &&
      filteredStudents.map((s) => (
        <li
          key={s.id}
          style={{
            padding: "8px",
            cursor: "pointer",
            borderBottom: "1px solid #eee",
          }}
          onClick={() => handleStudentSelect(s)}
        >
          {s.name} ({s.class_name}-{s.section})
        </li>
      ))}
  </ul>
)}

        </div>
      </div>

      {/* Popup */}
   {showPopup && selectedStudent && feeDetails && (
<div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    }}
    onClick={() => setShowPopup(false)}
  >
    <div
      style={{
          background: "#fff",
    padding: "20px",
    borderRadius: "8px",
    width: "45vw",  // 45% of the viewport width
    height: "100vh", // Full viewport height
    overflowX: "auto",
    overflowY: "auto",
  

      }}
      onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
    >
  {/* Close button at top-right */}
  <button
    onClick={() => setShowPopup(false)}
    className="actionBtnStyle"
    style={{
      position: "absolute",
      top: "0",
      right: "0",
      padding: "8px 12px",
      border: "none",
      color: "#f44336",
      borderRadius: "4px",
      cursor: "pointer",
      backgroundColor:'transparent'
    }}
  >
    <i className="fa fa-times" style={{ marginRight: 6 }}></i>
  </button>

  {/* RENDER ReportCard component, passing dynamic data */}
  <ReportCard 
    studentData={selectedStudent} 
    feeData={feeDetails} 
  />
</div>

  </div>
)}

    </div>
  );
};

export default StudentList;