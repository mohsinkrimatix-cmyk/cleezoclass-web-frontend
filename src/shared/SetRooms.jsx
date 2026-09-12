

import React, { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";

import Benches from "./Benches";
import axios from "axios";

function Setrooms() {
  const [roomsUpTo, setRoomsUpTo] = useState("");
  const [benchesPerRoom, setBenchesPerRoom] = useState("");
  const [classesUpTo, setClassesUpTo] = useState("");
  const [roomsList, setRoomsList] = useState([]);
  const [isRoomsSet, setIsRoomsSet] = useState(false);
  const [seatingType, setSeatingType] = useState("3");





  const schoolCode = localStorage.getItem("schoolCode");

useEffect(() => {
  // Initial fetch to populate roomsList
  axios.get(`https://cleezoclass.com:4000/rooms?schoolCode=${schoolCode}`)
    .then(res => setRoomsList(res.data))
    .catch(err => console.error(err));
}, []);

const handleSetRooms = async () => {
  try {
    console.log(roomsUpTo, benchesPerRoom, classesUpTo)
    if (!roomsUpTo || !benchesPerRoom || !classesUpTo) {
      toast.error("Please fill in all fields.");
      return;
    }
    await axios.post("https://cleezoclass.com:4000/rooms", {
      roomsUpTo: parseInt(roomsUpTo),
      benches: parseInt(benchesPerRoom),
      schoolCode
    });
    await axios.post("https://cleezoclass.com:4000/classes", {
      classesUpTo: parseInt(classesUpTo),
      schoolCode
    });
    toast.success("Rooms & Classes saved!");
  } catch (error) {
    toast.error("Failed to save rooms and classes.");
    console.error(error);
  }
};



const handleShowRooms = async () => {
  try {
    const roomsRes = await axios.get(`https://cleezoclass.com:4000/rooms?schoolCode=${schoolCode}`);
    setRoomsList(roomsRes.data);
    setIsRoomsSet(true);
  } catch (error) {
    toast.error("Failed to load rooms.");
    console.error(error);
  }
};


  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    margin: "6px 0",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "1rem",
    boxSizing: "border-box"
  };

  const buttonStyle = (bg) => ({
    background: bg,
    color: "black",
    padding: "10px 16px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginTop: "6px",
    width: "100%",
    fontSize: "1rem",
    
  });

  const selectStyle = {
    ...inputStyle,
    cursor: "pointer",
    width: "auto"
  };

  const cardStyle = {
    maxWidth: "450px",
    margin: "20px auto",
    padding: "16px",
    background: "#f8f9fa",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.08)"
  };
  
  return (
    <div>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
        }}
      />
      
      <div style={cardStyle}>
        <h2 style={{ color: "#333", fontSize: "1.4rem", marginBottom: "10px", borderBottom: "2px solid #ddd", paddingBottom: "4px" }}>Set Rooms & Classes</h2>
        <input
          type="number"
          placeholder="Rooms up to"
          value={roomsUpTo}
          onChange={e => setRoomsUpTo(e.target.value)}
          style={inputStyle}
        />
        <input
          type="number"
          placeholder="Benches per room"
          value={benchesPerRoom}
          onChange={e => setBenchesPerRoom(e.target.value)}
          style={inputStyle}
        />
        <input
          type="number"
          placeholder="Classes up to"
          value={classesUpTo}
          onChange={e => setClassesUpTo(e.target.value)}
          style={inputStyle}
        />
        <button onClick={handleSetRooms} style={buttonStyle("lightblue")}>Save</button>
      </div>

      <div style={{ ...cardStyle, marginTop: "20px" }}>
        <h3 style={{ color: "#333", fontSize: "1.2rem", marginBottom: "10px", borderBottom: "2px solid #ddd", paddingBottom: "4px" }}>View</h3>
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <select
            value={seatingType}
            onChange={e => setSeatingType(e.target.value)}
            style={{ ...selectStyle, flex: 1 }}
          >
            <option value="3">3 Seating</option>
            <option value="2">2 Seating</option>
          </select>
          <button onClick={handleShowRooms} style={{...buttonStyle("lightblue"), marginTop: "6px",marginBottom:"6px" , flex: 1}}>Show</button>
        </div>
      </div>

      {isRoomsSet && (
        <div style={{ marginTop: "20px",marginLeft:"1px",position:"center" }}>
          <h3 style={{ color: "#333", fontSize: "1.2rem", marginBottom: "10px", borderBottom: "2px solid #ddd", paddingBottom: "4px",paddingLeft:"35px" }}>Rooms Layout Preview</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", justifyContent: "center" }}>
            {roomsList.map(room => (
              <div key={room.room_number} style={{ flexBasis: "calc(20% - 16px)", boxSizing: "border-box" }}>
                <Benches
                  roomNumber={room.room_number}
                  benchCount={room.benches}
                  seatingType={seatingType}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Setrooms;