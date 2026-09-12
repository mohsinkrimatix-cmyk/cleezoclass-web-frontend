import React, { useState } from "react";
import "./AddPeopleModal.css"; // External CSS file

interface Student {
  student_name: string;
  gender: "Male" | "Female" | "Other";
  enrollment_no: string;
  student_roll_no: string;
  class: string;
  section: string;
  father_name: string;
  father_no: string;
  mother_name: string;
  mother_no: string;
  email: string;
  student_address: string;
  student_address_location: string;
  school_pickup_time: string;
  school_drop_time: string;
  home_pickup_time: string;
  home_drop_time: string;
}

interface Staff {
  staff_name: string;
  staff_designation: string;
  staff_gender: "Male" | "Female" | "Other";
  staff_enrollment_no: string;
  staff_roll_no: string;
  staff_phone_no: string;
  staff_email_id: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddPeopleModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"student" | "staff">("student");

  const [student, setStudent] = useState<Student>({
    student_name: "",
    gender: "Male",
    enrollment_no: "",
    student_roll_no: "",
    class: "",
    section: "",
    father_name: "",
    father_no: "",
    mother_name: "",
    mother_no: "",
    email: "",
    student_address: "",
    student_address_location: "",
    school_pickup_time: "",
    school_drop_time: "",
    home_pickup_time: "",
    home_drop_time: "",
  });

  const [staff, setStaff] = useState<Staff>({
    staff_name: "",
    staff_designation: "",
    staff_gender: "Male",
    staff_enrollment_no: "",
    staff_roll_no: "",
    staff_phone_no: "",
    staff_email_id: "",
  });

  const handleStudentChange = (field: keyof Student, value: string) => {
    setStudent({ ...student, [field]: value });
  };

  const handleStaffChange = (field: keyof Staff, value: string) => {
    setStaff({ ...staff, [field]: value });
  };

  if (!isOpen) return null;

  return (
    <div className="sgo-people-modal-overlay">
      <div className="sgo-people-modal-container">
        <div className="sgo-people-modal-header">
          <h3>ADD PEOPLE</h3>
          <button className="sgo-people-close-x" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="sgo-people-tabs">
          <button
            className={activeTab === "student" ? "sgo-people-active" : ""}
            onClick={() => setActiveTab("student")}
          >
            Student
          </button>
          <button
            className={activeTab === "staff" ? "sgo-people-active" : ""}
            onClick={() => setActiveTab("staff")}
          >
            Staff
          </button>
        </div>
        <div className="sgo-people-modal-body">
          {activeTab === "student" ? (
            <div className="sgo-people-form-grid">
              <div className="sgo-people-form-group">
                <label>Student Name</label>
                <input
                  type="text"
                  value={student.student_name}
                  onChange={(e) => handleStudentChange("student_name", e.target.value)}
                />
              </div>
              <div className="sgo-people-form-group">
                <label>Gender</label>
                <select
                  value={student.gender}
                  onChange={(e) =>
                    handleStudentChange("gender", e.target.value as "Male" | "Female" | "Other")
                  }
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="sgo-people-form-group">
                <label>Enrollment No</label>
                <input
                  type="text"
                  value={student.enrollment_no}
                  onChange={(e) => handleStudentChange("enrollment_no", e.target.value)}
                />
              </div>
              <div className="sgo-people-form-group">
                <label>Roll No</label>
                <input
                  type="text"
                  value={student.student_roll_no}
                  onChange={(e) => handleStudentChange("student_roll_no", e.target.value)}
                />
              </div>
              <div className="sgo-people-form-group">
                <label>Class</label>
                <input
                  type="text"
                  value={student.class}
                  onChange={(e) => handleStudentChange("class", e.target.value)}
                />
              </div>
              <div className="sgo-people-form-group">
                <label>Section</label>
                <input
                  type="text"
                  value={student.section}
                  onChange={(e) => handleStudentChange("section", e.target.value)}
                />
              </div>
              <div className="sgo-people-form-group">
                <label>Father Name</label>
                <input
                  type="text"
                  value={student.father_name}
                  onChange={(e) => handleStudentChange("father_name", e.target.value)}
                />
              </div>
              <div className="sgo-people-form-group">
                <label>Father Phone</label>
                <input
                  type="text"
                  value={student.father_no}
                  onChange={(e) => handleStudentChange("father_no", e.target.value)}
                />
              </div>
              <div className="sgo-people-form-group">
                <label>Mother Name</label>
                <input
                  type="text"
                  value={student.mother_name}
                  onChange={(e) => handleStudentChange("mother_name", e.target.value)}
                />
              </div>
              <div className="sgo-people-form-group">
                <label>Mother Phone</label>
                <input
                  type="text"
                  value={student.mother_no}
                  onChange={(e) => handleStudentChange("mother_no", e.target.value)}
                />
              </div>
              <div className="sgo-people-form-group">
                <label>Email</label>
                <input
                  type="text"
                  value={student.email}
                  onChange={(e) => handleStudentChange("email", e.target.value)}
                />
              </div>
              <div className="sgo-people-form-group">
                <label>Address</label>
                <textarea
                  value={student.student_address}
                  onChange={(e) => handleStudentChange("student_address", e.target.value)}
                />
              </div>
              <div className="sgo-people-form-group">
                <label>Address Location</label>
                <input
                  type="text"
                  value={student.student_address_location}
                  onChange={(e) => handleStudentChange("student_address_location", e.target.value)}
                />
              </div>
              <div className="sgo-people-form-group">
                <label>School Pickup Time</label>
                <input
                  type="time"
                  value={student.school_pickup_time}
                  onChange={(e) => handleStudentChange("school_pickup_time", e.target.value)}
                />
              </div>
              <div className="sgo-people-form-group">
                <label>School Drop Time</label>
                <input
                  type="time"
                  value={student.school_drop_time}
                  onChange={(e) => handleStudentChange("school_drop_time", e.target.value)}
                />
              </div>
              <div className="sgo-people-form-group">
                <label>Home Pickup Time</label>
                <input
                  type="time"
                  value={student.home_pickup_time}
                  onChange={(e) => handleStudentChange("home_pickup_time", e.target.value)}
                />
              </div>
              <div className="sgo-people-form-group">
                <label>Home Drop Time</label>
                <input
                  type="time"
                  value={student.home_drop_time}
                  onChange={(e) => handleStudentChange("home_drop_time", e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="sgo-people-form-grid">
              <div className="sgo-people-form-group">
                <label>Staff Name</label>
                <input
                  type="text"
                  value={staff.staff_name}
                  onChange={(e) => handleStaffChange("staff_name", e.target.value)}
                />
              </div>
              <div className="sgo-people-form-group">
                <label>Designation</label>
                <input
                  type="text"
                  value={staff.staff_designation}
                  onChange={(e) => handleStaffChange("staff_designation", e.target.value)}
                />
              </div>
              <div className="sgo-people-form-group">
                <label>Gender</label>
                <select
                  value={staff.staff_gender}
                  onChange={(e) =>
                    handleStaffChange("staff_gender", e.target.value as "Male" | "Female" | "Other")
                  }
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="sgo-people-form-group">
                <label>Enrollment No</label>
                <input
                  type="text"
                  value={staff.staff_enrollment_no}
                  onChange={(e) => handleStaffChange("staff_enrollment_no", e.target.value)}
                />
              </div>
              <div className="sgo-people-form-group">
                <label>Roll No</label>
                <input
                  type="text"
                  value={staff.staff_roll_no}
                  onChange={(e) => handleStaffChange("staff_roll_no", e.target.value)}
                />
              </div>
              <div className="sgo-people-form-group">
                <label>Phone No</label>
                <input
                  type="text"
                  value={staff.staff_phone_no}
                  onChange={(e) => handleStaffChange("staff_phone_no", e.target.value)}
                />
              </div>
              <div className="sgo-people-form-group">
                <label>Email</label>
                <input
                  type="text"
                  value={staff.staff_email_id}
                  onChange={(e) => handleStaffChange("staff_email_id", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
        <div className="sgo-people-modal-footer">
          <button
            className="sgo-people-save-btn"
            onClick={() => {
              if (activeTab === "student") console.log(student);
              else console.log(staff);
              onClose();
            }}
          >
            Save
          </button>
          <button className="sgo-people-cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPeopleModal;
