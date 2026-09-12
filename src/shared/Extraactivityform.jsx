

import React, { useState } from "react";

const Extraactivityform = ({ setCustomActivities, embedded = false }) => {
  const predefinedOptions = [
    { activity: "Robotics", day: "Friday", period: 2 },
    { activity: "Mass P.E.T (Yoga)", day: "Monday", period: 4 },
    { activity: "Mass P.E.T (Outing)", day: "Wednesday", period: 2 },
    { activity: "Dance Club", day: "Tuesday", period: 3 },
    { activity: "Music Class", day: "Thursday", period: 4 },
    { activity: "Coding Club", day: "Saturday", period: 5 }
  ];

  const [selectedOption, setSelectedOption] = useState(predefinedOptions[0]);
  const [customInput, setCustomInput] = useState("");
  const [activityList, setActivityList] = useState([]);
  const [selectedClass, setSelectedClass] = useState("1");
  const [selectedSection, setSelectedSection] = useState("A");

  // ✅ Capitalize helper → "monday" -> "Monday"
  const capitalize = (str) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // ✅ Reusable parsing logic
  const parseActivityInput = (input) => {
    const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
    let lowerInput = input.toLowerCase();

    const patterns = [
      /(.*) on (\w+),?\s*Period\s*(\d+)/i,
      /(\w+)\s*Period\s*(\d+)\s*(.*)/i,
      /Period\s*(\d+)\s*on\s*(\w+)\s*(.*)/i,
      /(.*)\s*(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*Period\s*(\d+)/i
    ];

    let parsed = null;
    for (let pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        if (pattern === patterns[0]) parsed = { activity: match[1].trim(), day: capitalize(match[2]), period: parseInt(match[3]) };
        if (pattern === patterns[1]) parsed = { day: capitalize(match[1]), period: parseInt(match[2]), activity: match[3].trim() };
        if (pattern === patterns[2]) parsed = { period: parseInt(match[1]), day: capitalize(match[2]), activity: match[3].trim() };
        if (pattern === patterns[3]) parsed = { activity: match[1].trim(), day: capitalize(match[2]), period: parseInt(match[3]) };
        break;
      }
    }

    if (!parsed) {
      let foundDay = days.find(d => lowerInput.includes(d.toLowerCase()));
      let foundPeriod = input.match(/period\s*(\d+)/i);
      let foundSubject = input
        .replace(/period\s*\d+/i, "")
        .replace(new RegExp(foundDay, "i"), "")
        .replace(/on/i, "")
        .trim();

      if (foundDay && foundPeriod) {
        parsed = {
          activity: foundSubject || "Custom Activity",
          day: foundDay,
          period: parseInt(foundPeriod[1])
        };
      }
    }
    return parsed;
  };

  // ✅ Add predefined activity with class & section
  const addPredefinedActivity = () => {
    if (!selectedClass || !selectedSection) {
      alert("⚠️ Please select class and section before adding activity");
      return;
    }
    const newActivity = { ...selectedOption, className: selectedClass, section: selectedSection };
    const newList = [...activityList, newActivity];
    setActivityList(newList);
    setCustomActivities(newList);
  };

  // ✅ Add custom activity with parser
  const addCustomActivity = () => {
    if (!customInput.trim()) return;
    if (!selectedClass || !selectedSection) {
      alert("⚠️ Please select class and section before adding activity");
      return;
    }

    const parsed = parseActivityInput(customInput.trim());
    if (parsed) {
      const newActivity = { ...parsed, className: selectedClass, section: selectedSection };
      const newList = [...activityList, newActivity];
      setActivityList(newList);
      setCustomActivities(newList);
      setCustomInput("");
    } else {
      alert("❌ Try: 'Dance on Monday, Period 3'");
    }
  };

  return (
    <div
      style={{
        padding: "10px",
        border: embedded ? "none" : "1px solid #ccc",
        borderRadius: embedded ? "0" : "8px",
        width: embedded ? "100%" : "90%",
        maxWidth: embedded ? "none" : "380px",
        background: embedded ? "transparent" : "#f9f9f9",
        boxShadow: "none"
      }}
    >
      <h3 style={{ marginBottom: "15px", color: "#333", textAlign: "center" }}>
        Let's add AI Touch
      </h3>

      {/* ✅ Responsive Styles */}
      <style>
        {`
          .form-row {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            gap: 10px;
            flex-wrap: wrap;
          }
          .form-row input,
          .form-row select {
            flex: 1;
            min-width: 160px;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #ccc;
          }
            .form-row select {
  background-color: transparent;
  border: 1px solid #ccc; /* optional - keep border visible */
  outline: none;
}
          .form-row button {
            padding: 8px 12px;
            border-radius: 16px;
            border: none;
            cursor: pointer;
            flex-shrink: 0;
          }
          @media (max-width: 768px) {
            .form-row {
              flex-direction: column;
              align-items: stretch;
            }
            .form-row input,
            .form-row select,
            .form-row button {
              width: 100%;
            }
          }
        `}
      </style>

      {/* ✅ Class + Section Dropdowns */}
      <div className="form-row">
       {/* ✅ Now includes Nursery, LKG, UKG */}
<select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
  <option value="Nursery">Nursery</option>
  <option value="LKG">LKG</option>
  <option value="UKG">UKG</option>
  {[...Array(10)].map((_, i) => (
    <option key={i} value={String(i + 1)}>{`Class ${i + 1}`}</option>
  ))}
</select>

        <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
          <option>A</option>
          <option>B</option>
          <option>C</option>
        </select>
      </div>

      {/* ✅ Predefined Activity Dropdown */}
      <div className="form-row">
        <select value={JSON.stringify(selectedOption)} onChange={(e) => setSelectedOption(JSON.parse(e.target.value))}>
          {predefinedOptions.map((opt, idx) => (
            <option key={idx} value={JSON.stringify(opt)}>
              {`${opt.activity} on ${opt.day}, Period ${opt.period}`}
            </option>
          ))}
        </select>
        <button  className="btn-solid" onClick={addPredefinedActivity} >
          Add
        </button>
      </div>

      {/* ✅ Custom Activity Input */}
      <div className="form-row">
        <input
          type="text"
          placeholder="e.g., Dance on Monday, Period 3"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
        />
        <button onClick={addCustomActivity} className="btn-solid">
          Add
        </button>
      </div>
      <div
  style={{
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    padding: "10px 14px",
    marginBottom: "15px",
    fontSize: "13px",
    color: "#334155",
    lineHeight: "1.6"
  }}
>
  <strong style={{ display: "block", marginBottom: "6px", color: "#1e293b" }}>
    Example formats you can use:
  </strong>
  <ul style={{ margin: 0, paddingLeft: "18px" }}>
    <li>Dance on Monday, Period 3</li>
    
  </ul>
</div>

      {/* ✅ Preview List */}
      <div style={{ background: "#fff", padding: "10px", borderRadius: "6px", border: "1px solid #e5e7eb" }}>
        <h4 style={{ marginBottom: "10px", color: "#333" }}>Selected Activities:</h4>
        <ul style={{ paddingLeft: "20px" }}>
          {activityList.map((act, idx) => (
            <li key={idx} style={{ marginBottom: "6px", color: "#555" }}>
              {`${act.activity} on ${act.day}, Period ${act.period} → Class ${act.className} ${act.section}`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Extraactivityform;

