import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaUser, FaTicketAlt } from "react-icons/fa";
import "./FrontDesk_TestAndCouncelling.css";
import "./Payment.css";
import "../STYLES/solidbutton.css";
import "./FrontDesk_Tickets.css";

interface Teacher {
  teacher_id: string | number;
  teacher_name: string;
  phone_no: string;
  subject?: string;
  designation?: string;
}

interface Student {
  id: string | number;
  name?: string;
  photo?: { data?: any };
}

interface Ticket {
  id: number;
  ticket_type: "teacher" | "student";
  teacher_id?: string | number | null;
  teacher_name?: string | null;
  student_id?: string | number | null;
  student_name?: string | null;
  class_name?: string | null;
  section?: string | null;
  title: string;
  description: string;
  status: "open" | "closed";
  created_at: string;
}

const API_BASE = "https://cleezoclass.com:4000/api/admin";

const bufferToPathString = (bufferData: any) => {
  if (!bufferData) return "";
  try {
    const bytes = new Uint8Array(bufferData);
    let pathString = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      pathString += String.fromCharCode(bytes[i]);
    }
    return pathString.trim().replace(/\u0000/g, "");
  } catch {
    return "";
  }
};

const getTeacherId = (teacher: Teacher & Record<string, any>, fallbackIndex?: number) =>
  teacher.teacher_id ??
  teacher.id ??
  teacher.user_id ??
  teacher.staff_id ??
  teacher.employee_id ??
  teacher.emp_id ??
  teacher.teacherId ??
  teacher.teacherID ??
  (typeof fallbackIndex === "number" ? `staff-${fallbackIndex}` : "staff");

const getTeacherName = (teacher: Teacher & Record<string, any>) =>
  teacher.teacher_name ?? teacher.name ?? teacher.full_name ?? teacher.staff_name ?? "Staff";

interface FrontDeskTicketsProps {
  showTable?: boolean;
}

const FrontDesk_Tickets: React.FC<FrontDeskTicketsProps> = () => {
  const [activeTab, setActiveTab] = useState<"staff" | "students">("staff");

  // --- Staff tab state ---
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // --- Students tab state ---
  const [classList, setClassList] = useState<any[]>([]);
  const [sectionMap, setSectionMap] = useState<any[]>([]);
  const [selectedClassSection, setSelectedClassSection] = useState<string>("");
  const [className, setClassName] = useState<string>("");
  const [section, setSection] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketTarget, setTicketTarget] = useState<{
    type: "teacher" | "student";
    teacher?: Teacher;
    student?: Student;
  } | null>(null);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketSuccess, setTicketSuccess] = useState("");
  const [ticketError, setTicketError] = useState("");

  const schoolCode = localStorage.getItem("schoolCode") || "";

  const fetchAllTeachers = async () => {
    if (!schoolCode) return;
    setLoadingTeachers(true);
    try {
      const res = await axios.post("https://cleezoclass.com:4000/api/users", {
        schoolCode,
        user_type: "teacher",
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setTeachers(
        data.map((teacher: any, index: number) => ({
          ...teacher,
          teacher_id: getTeacherId(teacher, index),
          teacher_name: getTeacherName(teacher),
        }))
      );
    } catch (err) {
      console.error("Error loading teachers", err);
      setTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  useEffect(() => {
    fetchAllTeachers();
  }, [schoolCode]);

  const fetchMetadata = async () => {
    if (!schoolCode) return;
    setDropdownLoading(true);
    try {
      const [classRes, sectionRes] = await Promise.all([
        axios.get(`${API_BASE}/classes?schoolCode=${schoolCode}`),
        axios.get(`${API_BASE}/sectionFilter?schoolCode=${schoolCode}`),
      ]);

      const classesFromAPI = Array.isArray(classRes.data)
        ? classRes.data
        : classRes.data?.classes || [];
      const sectionsFromAPI = Array.isArray(sectionRes.data)
        ? sectionRes.data
        : sectionRes.data?.sections || [];

      setClassList(classesFromAPI);
      setSectionMap(sectionsFromAPI);
    } catch (err) {
      console.error("Error loading class/section metadata", err);
      setClassList([]);
      setSectionMap([]);
    } finally {
      setDropdownLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, [schoolCode]);

  useEffect(() => {
    if (!selectedClassSection) {
      setClassName("");
      setSection("");
      return;
    }
    const [cls, sec] = selectedClassSection.split("_");
    setClassName(cls || "");
    setSection(sec || "");
  }, [selectedClassSection]);

  useEffect(() => {
    if (!className || !section || !schoolCode) {
      setStudents([]);
      return;
    }

    axios
      .get(
        `https://cleezoclass.com:4000/api/studentsNameAccountant/${className}?schoolCode=${schoolCode}&section=${section}`
      )
      .then((res) => {
        setStudents(res.data?.students || []);
      })
      .catch(() => {
        setStudents([]);
      });
  }, [className, section, schoolCode]);

  const fetchTickets = async () => {
    if (!schoolCode) return;
    setLoadingTickets(true);
    try {
      const params = new URLSearchParams();
      params.set("schoolCode", schoolCode);
      if (activeTab === "staff") params.set("type", "teacher");
      if (activeTab === "students") params.set("type", "student");
      if (className) params.set("className", className);
      if (section) params.set("section", section);
      const res = await axios.get(
        `https://cleezoclass.com:4000/api/tickets?${params.toString()}`
      );
      setTickets(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error loading tickets", err);
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [activeTab, className, section, schoolCode]);

  useEffect(() => {
    if (activeTab !== "students") {
      setTicketTarget(null);
    }
  }, [activeTab]);

  const filteredStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return students;
    return students.filter((student) =>
      student.name?.toLowerCase().includes(term) || String(student.id).includes(term)
    );
  }, [students, searchTerm]);

  const getClassLabel = (cls: any) => {
    if (cls == null) return "";
    if (typeof cls === "string" || typeof cls === "number") return String(cls);
    return (
      cls.class_name ||
      cls.className ||
      cls.class ||
      cls.name ||
      cls.label ||
      ""
    );
  };

  const derivedClasses = useMemo(() => {
    if (classList.length > 0) return classList;
    const classSet = new Set<string>();
    sectionMap.forEach((item: any) => {
      const classValue = item?.class_name || item?.class || item?.className;
      if (classValue != null) classSet.add(String(classValue));
    });
    return Array.from(classSet);
  }, [classList, sectionMap]);

  const teacherRows: Teacher[][] = [];
  for (let i = 0; i < teachers.length; i += 8) {
    teacherRows.push(teachers.slice(i, i + 8));
  }

  const openTicketModal = (payload: {
    type: "teacher" | "student";
    teacher?: Teacher;
    student?: Student;
  }) => {
    setTicketTarget(payload);
    setTicketTitle("");
    setTicketDescription("");
    setTicketSuccess("");
    setTicketError("");
    setShowTicketModal(true);
  };

  const closeTicketModal = () => {
    setShowTicketModal(false);
    setTicketTarget(null);
  };

  const handleCreateTicket = async () => {
    if (!ticketTarget || !ticketTitle.trim() || !ticketDescription.trim()) return;
    try {
      const payload = {
        schoolCode,
        ticket_type: ticketTarget.type,
        teacher_id: ticketTarget.teacher?.teacher_id || null,
        teacher_name: ticketTarget.teacher?.teacher_name || ticketTarget.teacher?.name || null,
        student_id: ticketTarget.student?.id || null,
        student_name: ticketTarget.student?.name || null,
        class_name: className || null,
        section: section || null,
        title: ticketTitle.trim(),
        description: ticketDescription.trim(),
      };
      await axios.post("https://cleezoclass.com:4000/api/tickets", payload);
      setTicketSuccess("Ticket created successfully.");
      setTicketError("");
      setTimeout(() => {
        closeTicketModal();
      }, 900);
      fetchTickets();
    } catch (err) {
      console.error("Error creating ticket", err);
      setTicketError("Failed to create ticket. Please try again.");
      setTicketSuccess("");
    }
  };

  return (
    <div className="tickets-container">
      <div className="tickets-header-and-tabs">
        <div className="tickets-left">
          <div className="tickets-header">Tickets</div>
          <div className="tickets-tabs">
            <button
              className={`tickets-tab ${activeTab === "staff" ? "active" : ""}`}
              onClick={() => setActiveTab("staff")}
            >
              Staff
            </button>
            <button
              className={`tickets-tab ${activeTab === "students" ? "active" : ""}`}
              onClick={() => setActiveTab("students")}
            >
              Students
            </button>
          </div>
        </div>
      </div>

      {activeTab === "students" && (
        <div className="tickets-student-filter-row">
          <select
            value={selectedClassSection}
            onChange={(e) => setSelectedClassSection(e.target.value)}
            disabled={dropdownLoading}
            className="collect-filter tickets-class-dropdown-select"
          >
            <option value="">Select Class &amp; Section</option>

            {derivedClasses.map((cls) => {
              const classLabel = getClassLabel(cls);
              if (!classLabel) return null;
              const sectionsForClass = sectionMap
                .filter((item) => {
                  const classValue = item.class_name || item.class || item.className;
                  return String(classValue) === String(classLabel);
                })
                .map((item) => item.section || item.section_name || item.sectionName);

              return sectionsForClass.length > 0
                ? sectionsForClass.map((sec) => (
                    <option key={`${classLabel}_${sec}`} value={`${classLabel}_${sec}`}>
                      {classLabel} - {sec}
                    </option>
                  ))
                : null;
            })}
          </select>
        </div>
      )}

      <div className="tickets-content">
        {activeTab === "staff" && (
          <div className="tc-staffAssignSection tickets-staff-panel-shell">
            {loadingTeachers && <p>Loading teachers...</p>}

            {!loadingTeachers && (
              <div className="tc-teacherGrid tickets-staff-grid-shell">
                {teacherRows.map((row, idx) => (
                  <div key={idx} className="tc-teacherRow">
                    {row.map((teacher, teacherIndex) => {
                      const teacherId = getTeacherId(teacher, idx * 8 + teacherIndex);
                      const teacherName = getTeacherName(teacher);

                      return (
                      <div
                        key={teacherId}
                        className="tc-teacherCard tickets-clickable"
                        onClick={() => openTicketModal({ type: "teacher", teacher })}
                      >
                        <div className="tc-teacherAvatar">
                          <FaUser size={28} color="#404040" />
                        </div>
                        <div className="tc-teacherName">{teacherName}</div>
                      </div>
                    );})}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "students" && (
          <div className="tickets-student-panel-shell tickets-student-panel">
            <div className="tickets-student-grid-shell tickets-student-grid">
              {filteredStudents.length === 0 ? (
                <div className="payment-no-students">
                  {className ? "No students found" : "Please select a class and section"}
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="tc-teacherCard tickets-student-card tickets-clickable"
                    onClick={() => openTicketModal({ type: "student", student })}
                  >
                    {student.photo?.data ? (
                      <img
                        src={`https://cleezoclass.com:4000${bufferToPathString(
                          student.photo.data
                        )}`}
                        alt={student.name}
                        className="tickets-student-photo"
                      />
                    ) : (
                      <div className="tc-teacherAvatar tickets-student-photo-placeholder">
                        <FaUser size={20} color="#404040" />
                      </div>
                    )}
                    <div className="tc-teacherName tickets-student-name">{student.name}</div>
                    <span className="tickets-student-id">ID: {student.id}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>


      {showTicketModal && ticketTarget && (
        <div className="tickets-modal-overlay" onClick={closeTicketModal}>
          <div className="tickets-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tickets-modal-title">Raise Ticket</div>
            <div className="tickets-modal-subtitle">
              {ticketTarget.type === "teacher"
                ? `Teacher: ${ticketTarget.teacher?.teacher_name || "-"}`
                : `Student: ${ticketTarget.student?.name || "-"}${
                    className ? ` | ${className}-${section}` : ""
                  }`}
            </div>
            <input
              className="tickets-modal-input"
              placeholder="Title"
              value={ticketTitle}
              onChange={(e) => setTicketTitle(e.target.value)}
            />
            <textarea
              className="tickets-modal-textarea"
              placeholder="Description"
              value={ticketDescription}
              onChange={(e) => setTicketDescription(e.target.value)}
            />
            <div className="tickets-modal-actions">
              <button className="tickets-btn ghost" onClick={closeTicketModal}>
                Cancel
              </button>
              <button
                className="tickets-btn"
                onClick={handleCreateTicket}
                disabled={!ticketTitle.trim() || !ticketDescription.trim()}
              >
                Create Ticket
              </button>
            </div>
            {ticketSuccess && (
              <div className="tickets-success">{ticketSuccess}</div>
            )}
            {ticketError && <div className="tickets-error">{ticketError}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default FrontDesk_Tickets;