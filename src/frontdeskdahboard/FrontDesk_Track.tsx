import React, { useEffect, useState } from "react";
import "./LeadsTable.css";

interface Lead {
  id: number;
  full_name: string;
  lead_name?: string | null;
  occupation?: string;
  mobile_number: string;
  email_id?: string;
  address?: string;
  dob?: string;
  blood_group?: string;
  lead_admission_for?: string;
  entry_type: "manual" | "automatic";
  reg_no?: string;
  ticket_no?: string;
  date?: string;
  lead_time?: string;
  assigned_teacher_name?: string;
  test_status?: string;
  branch?: string;
  refer_by?: string;
  test_date?: string;
  counselling_date?: string;
  counselling_time?: string;
}

// Format date as DD-MM-YYYY (IST)
const formatDate = (dateString?: string): string => {
  if (!dateString) return "Pending";
  try {
    const date = new Date(dateString);
    // Adjust for IST (UTC+05:30)
    const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
    const day = String(istDate.getDate()).padStart(2, "0");
    const month = String(istDate.getMonth() + 1).padStart(2, "0");
    const year = istDate.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Invalid Date";
  }
};

// Format time as HH:mm (IST)
const formatTime = (timeString?: string): string => {
  if (!timeString) return "-";
  try {
    const date = new Date(timeString);
    // Adjust for IST (UTC+05:30)
    const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
    const hours = String(istDate.getHours()).padStart(2, "0");
    const minutes = String(istDate.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch (e) {
    console.error("Error formatting time:", e);
    return "-";
  }
};

type LeadsTableVariant = "default" | "campaigning" | "dashboard";

type LeadsTableProps = {
  variant?: LeadsTableVariant;
  onRowClick?: (lead: Lead) => void;
  embedded?: boolean;
};

const LeadsTable: React.FC<LeadsTableProps> = ({ variant = "default", onRowClick, embedded = false }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    test_date: "",
    counselling_date: "",
    refer_by: "",
  });

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) {
      setError("School code not found");
      setLoading(false);
      return;
    }
    fetch(`https://cleezoclass.com:4000/api/api/leads?schoolCode=${schoolCode}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch leads");
        return res.json();
      })
      .then((data: Lead[]) => {
        setLeads(data);
        setFilteredLeads(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch Error:", err);
        setError("Unable to load leads");
        setLoading(false);
      });
  }, []);

  const hasLeadName = (lead: Lead) => String(lead.lead_name ?? "").trim().length > 0;

  useEffect(() => {
    let base = leads;
    if (variant === "campaigning") {
      base = leads.filter((lead) => hasLeadName(lead));
    } else if (variant === "dashboard") {
      base = leads.filter((lead) => !hasLeadName(lead));
    }

    if (variant === "default") {
      const filtered = base.filter((lead) => {
        return (
          (filters.test_date === "" ||
            (lead.test_date && formatDate(lead.test_date).includes(filters.test_date))) &&
          (filters.counselling_date === "" ||
            (lead.counselling_date && formatDate(lead.counselling_date).includes(filters.counselling_date))) &&
          (filters.refer_by === "" ||
            lead.refer_by?.toLowerCase().includes(filters.refer_by.toLowerCase()))
        );
      });
      setFilteredLeads(filtered);
    } else {
      setFilteredLeads(base);
    }
  }, [filters, leads, variant]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  if (loading) return <p>Loading leads...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const showFilters = variant === "default";
  const enableHorizontalScroll = embedded && variant === "campaigning";
  const containerStyle: React.CSSProperties | undefined = embedded
    ? {
        margin: 0,
        height: "100%",
        maxHeight: "100%",
        minHeight: 0,
        overflowY: "auto",
        overflowX: enableHorizontalScroll ? "auto" : "hidden",
      }
    : undefined;

  return (
    <div
      className={`leads-table-container leads-table-container--${variant}${
        embedded ? " leads-table-container--embedded" : ""
      }`}
      style={containerStyle}
    >
{showFilters && (<div className="filter-section">
  <label>
    Test Date:
    <input
      type="text"
      name="test_date"
      value={filters.test_date}
      onChange={handleFilterChange}
      placeholder="Filter by test date "
    />
  </label>
  <label>
    Counselling Date:
    <input
      type="text"
      name="counselling_date"
      value={filters.counselling_date}
      onChange={handleFilterChange}
      placeholder="Filter by counselling "
    />
  </label>
  <label>
    Refer By:
    <input
      type="text"
      name="refer_by"
      value={filters.refer_by}
      onChange={handleFilterChange}
      placeholder="Filter by refer by"
    />
  </label>
   <label className="leads-count">
    Refered <strong>{filteredLeads.length}</strong> leads
  </label>
</div>)}


      {variant === "campaigning" ? (
        <table
          className={`leads-table${enableHorizontalScroll ? " leads-table--wide" : ""}`}
        >
          <thead>
            <tr>
              <th>ID</th>
              <th>Full Name</th>
              <th>Mobile</th>
              <th>Email</th>
              <th>Admission For</th>
              <th> Assign Teacher</th>
              <th>Status</th>
              <th>Test Date</th>
              <th>Counselling Date</th>
              <th>Counselling Time</th>
              <th>Refer By</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: "center" }}>
                  No leads found
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className={selectedLeadId === lead.id ? "leads-table-row-selected" : ""}
                  onClick={() => {
                    setSelectedLeadId(lead.id);
                    onRowClick && onRowClick(lead);
                  }}
                  style={{ cursor: onRowClick ? "pointer" : "default" }}
                >
                  <td>{lead.id}</td>
                  <td>{lead.full_name}</td>
                  <td>{lead.mobile_number}</td>
                  <td>{lead.email_id || "-"}</td>
                  <td>{lead.lead_admission_for || "-"}</td>
                  <td>{lead.assigned_teacher_name || "-"}</td>
                  <td>{lead.test_status || "Pending"}</td>
                  <td>{formatDate(lead.test_date)}</td>
                  <td>{formatDate(lead.counselling_date)}</td>
                  <td>{formatTime(lead.counselling_time)}</td>
                  <td>{lead.refer_by ? `Refer ${lead.refer_by}` : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      ) : (
        <table className="leads-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Full Name</th>
              <th>Mobile</th>
              <th>Email</th>
              <th>Admission For</th>
              <th> Assign Teacher</th>
              <th>Status</th>
              <th>Test Date</th>
              <th>Counselling Date</th>
              <th>Counselling Time</th>
              <th>Refer By</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: "center" }}>
                  No leads found
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className={selectedLeadId === lead.id ? "leads-table-row-selected" : ""}
                  onClick={() => {
                    setSelectedLeadId(lead.id);
                    onRowClick && onRowClick(lead);
                  }}
                  style={{ cursor: onRowClick ? "pointer" : "default" }}
                >
                  <td>{lead.id}</td>
                  <td>{lead.full_name}</td>
                  <td>{lead.mobile_number}</td>
                  <td>{lead.email_id || "-"}</td>
                  <td>{lead.lead_admission_for || "-"}</td>
                  <td>{lead.assigned_teacher_name || "-"}</td>
                  <td>{lead.test_status || "Pending"}</td>
                  <td>{formatDate(lead.test_date)}</td>
                  <td>{formatDate(lead.counselling_date)}</td>
                  <td>{formatTime(lead.counselling_time)}</td>
                  <td>{lead.refer_by ? `Refer ${lead.refer_by}` : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LeadsTable;