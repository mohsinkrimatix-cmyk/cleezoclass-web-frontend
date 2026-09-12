import React, { useState } from "react";

const AddLead = () => {
  const [formData, setFormData] = useState({
    full_name: "",
    occupation: "",
    mobile_number: "",
    email_id: "",
    address: "",
    dob: "",
    lead_admission_for: "",
    entry_type: "manual",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("https://cleezoclass.com:4000/api/add-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Lead Saved Successfully\nREG NO: ${data.reg_no}\nTICKET NO: ${data.ticket_no}`);
        // Reset the form after submission
        setFormData({
          full_name: "",
          occupation: "",
          mobile_number: "",
          email_id: "",
          address: "",
          dob: "",
          lead_admission_for: "",
          entry_type: "manual",
        });
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      alert("Something went wrong: " + err.message);
    }
  };

  const containerStyle = {
    width: "30vw",
    margin: "0 auto",
    marginTop: "30px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    border: "1px solid #ccc",
    borderRadius: "10px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  };

  const rowStyle = {
    display: "flex",
    gap: "10px",
    marginBottom: "15px",
  };

  const inputStyle = {
    flex: 1,
    padding: "8px",
    fontSize: "14px",
    borderRadius: "5px",
    border: "1px solid #999",
  };

  const fullRowStyle = {
    display: "flex",
    flexDirection: "column",
    marginBottom: "15px",
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Add Lead</h2>

      <form onSubmit={handleSubmit}>
        {/* Row 1 */}
        <div style={rowStyle}>
          <input
            type="text"
            name="full_name"
            style={inputStyle}
            placeholder="Full Name"
            value={formData.full_name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="occupation"
            style={inputStyle}
            placeholder="Occupation"
            value={formData.occupation}
            onChange={handleChange}
          />
        </div>

        {/* Row 2 */}
        <div style={rowStyle}>
          <input
            type="text"
            name="mobile_number"
            style={inputStyle}
            placeholder="Mobile Number"
            value={formData.mobile_number}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email_id"
            style={inputStyle}
            placeholder="Email"
            value={formData.email_id}
            onChange={handleChange}
          />
        </div>

        {/* Row 3 (full row) */}
        <div style={fullRowStyle}>
          <textarea
            name="address"
            style={{ ...inputStyle, height: "70px" }}
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>

        {/* Row 4 */}
        <div style={rowStyle}>
          <input
            type="date"
            name="dob"
            style={inputStyle}
            value={formData.dob}
            onChange={handleChange}
          />
          <input
            type="text"
            name="lead_admission_for"
            style={inputStyle}
            placeholder="Lead Admission For"
            value={formData.lead_admission_for}
            onChange={handleChange}
          />
        </div>

        {/* Row 5 */}
        <div style={fullRowStyle}>
          <select
            name="entry_type"
            style={inputStyle}
            value={formData.entry_type}
            onChange={handleChange}
          >
            <option value="manual">Manual</option>
            <option value="automatic">Automatic</option>
          </select>
        </div>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            fontSize: "16px",
            backgroundColor: "#0d6efd",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Register
        </button>
      </form>
    </div>
  );
};

export default AddLead;
