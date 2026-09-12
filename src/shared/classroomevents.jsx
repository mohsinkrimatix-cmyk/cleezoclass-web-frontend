import React, { useState } from "react";
import TeacherEvents from './Operations_classRoom_events_TeacherEvents';
import TwoButtons from './SeatingArrangmentClasswise';

const ClassroomEvents = () => {
  const [open, setOpen] = useState(true); // Open by default

  // Control which components appear in each popup column
  const [activePopupColumn2, setActivePopupColumn2] = useState("events");
  const [activePopupColumn3, setActivePopupColumn3] = useState("exam");

  return (
    <div
      className="grid-section fc-idle-time"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        margin: 0,
        gap: 0,
        flex: 1,
        minWidth: "300px",
        textAlign: "center",
        background: "#f9f9f9",
        padding: "20px",
      }}
    >
      {/* Section Header */}
      <div className="section-header">
        <h3
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            fontFamily: "Century Gothic, sans-serif",
            textAlign: "center",
          }}
        >
          Classroom & Events
        </h3>
      </div>

      {/* Full popup */}
      {open && (
        <div
          style={{
            width: "100%",
            maxWidth: "1600px",
            marginTop: "20px",
            background: "#fff",
            padding: "30px",
            borderRadius: "12px",
            boxShadow: "0px 8px 25px rgba(0,0,0,0.3)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {/* Column 1 (empty for now, you can add more content later) */}
     
          {/* Column 2 */}
          <div
            style={{
              background: "#f9fafb",
              padding: "20px",
              borderRadius: "10px",
              textAlign: "center",
              boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            {activePopupColumn2 === "events" && (
              <TeacherEvents
                onLocalNavigate={(next) => setActivePopupColumn2(next)}
              />
            )}
            {activePopupColumn2 === "eventDetails" && <TeacherEvents />}
          </div>

          {/* Column 3 */}
          <div
            style={{
              background: "#f9fafb",
              padding: "20px",
              borderRadius: "10px",
              textAlign: "center",
              boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            {activePopupColumn3 === "exam" && (
              <TwoButtons
                onLocalNavigate={(next) => setActivePopupColumn3(next)}
              />
            )}
            {activePopupColumn3 === "examDetails" && <TwoButtons />}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomEvents;
