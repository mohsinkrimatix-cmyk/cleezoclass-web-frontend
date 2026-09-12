import React, { useState } from "react";
import SetRooms from "./SetRooms"; 
import AssignSeats from "./AssignSeat"; 

function TwoButtons() {
  const [showModal, setShowModal] = useState(false);
  const [activeComponent, setActiveComponent] = useState(null);

  const openModal = (component) => {
    setActiveComponent(component);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setActiveComponent(null);
  };

  const buttonStyle = {
    marginLeft: "10px",
    padding: "10px 20px",
    fontSize: "16px",
    borderRadius: "8px",
    background: "rgb(128, 128, 128)",
    color: "white",
    cursor: "pointer",
    border: "none",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    transition: "transform 0.2s, box-shadow 0.2s",
    marginTop:'-50px',
    marginBottom:'-50px'
  };

  const hoverEffect = (e, hover) => {
    e.currentTarget.style.transform = hover ? "translateY(-2px)" : "translateY(0)";
    e.currentTarget.style.boxShadow = hover
      ? "0 8px 16px rgba(0,0,0,0.3)"
      : "0 4px 8px rgba(0,0,0,0.2)";
  };

  return (
    <>
   

      <div
        style={{
          display: "flex",
          justifyContent: "center",
         
          borderRadius: "10px",
          fontFamily: "Arial, Helvetica, sans-serif",
          alignItems: "center",
        }}
      >
        <button
          style={buttonStyle}
          onMouseEnter={(e) => hoverEffect(e, true)}
          onMouseLeave={(e) => hoverEffect(e, false)}
          onClick={() => openModal("setRooms")}
        >
          Set Rooms
        </button>

        <button
          style={buttonStyle}
          onMouseEnter={(e) => hoverEffect(e, true)}
          onMouseLeave={(e) => hoverEffect(e, false)}
          onClick={() => openModal("assignSeats")}
        >
          Assign Seats
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: "#fff",
           
              borderRadius: "12px",
              minWidth: "300px",
              maxWidth: "90%",
              overflowY: "auto",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                border: "none",
                background: "transparent",
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              &times;
            </button>

            {activeComponent === "setRooms" && <SetRooms />}
            {activeComponent === "assignSeats" && <AssignSeats />}
          </div>
        </div>
      )}
    </>
  );
}

export default TwoButtons;
