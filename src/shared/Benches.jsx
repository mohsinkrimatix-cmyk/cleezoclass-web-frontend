import React, { useEffect, useState } from 'react';
import { Toaster, toast } from "react-hot-toast";

import axios from "axios";

function Benches({ roomNumber, benchCount, seatingType }) {
  const [currentBenchCount, setCurrentBenchCount] = useState(benchCount);
  const [isEditing, setIsEditing] = useState(false);
  const [columnsPerRow, setColumnsPerRow] = useState(2); // New state for columns
  const seatsPerBench = parseInt(seatingType);

  // Update local state when benchCount prop changes
  useEffect(() => {
    setCurrentBenchCount(benchCount);
  }, [benchCount]);

  const handleAddBench = () => {
    setCurrentBenchCount(prevCount => prevCount + 1);
  };

  const handleMinusBench = () => {
    if (currentBenchCount > 1) {
      setCurrentBenchCount(prevCount => prevCount - 1);
    }
  };
  
  
  
//   const handleEditToggle = () => {
//     setIsEditing(prev => !prev);
//   };
const handleEditToggle = async () => {
  const schoolCode= localStorage.getItem("schoolCode")
  if (isEditing) {
    try {
      await axios.put(`http://localhost:3020/rooms/${roomNumber}`, {
        benches: currentBenchCount,
        schoolCode: schoolCode, // <-- add this
      });
      toast.success(`Room ${roomNumber} updated with ${currentBenchCount} benches!`);
    } catch (error) {
      console.error("Failed to update benches:", error);
      toast.error("Failed to update benches.");
    }
  }
  setIsEditing(prev => !prev);
};



  const benches = Array.from({ length: currentBenchCount }, (_, i) => i + 1);
  const seatWidthPercentage = (100 / seatsPerBench) - 5; 

  return (
    
    <div style={{ marginBottom: "15px" }}>
      <h4 style={{ color: "#555", fontSize: "1rem" }}>Room {roomNumber}</h4>
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: `repeat(${columnsPerRow}, 1fr)`, // Dynamic columns
        gap: "10px", 
        padding: "10px", 
        border: "1px solid #eee", 
        borderRadius: "8px" 
      }}>
        {benches.map(bench => (
          <div 
            key={bench} 
            style={{
              display: "flex",
              justifyContent: "space-between",
              height: "40px",
              backgroundColor: "#ddd",
              padding: "5px",
              borderRadius: "4px"
            }}
          >
            {Array.from({ length: seatsPerBench }, (_, seatIndex) => (
              <div
                key={seatIndex}
                style={{
                  width: `${seatWidthPercentage}%`, 
                  height: "20px", 
                  marginTop: "10px", 
                  backgroundColor: "yellow",
                  borderRadius: "4px"
                }}
              ></div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ marginTop: "10px", display: "flex", justifyContent: "center", gap: "10px" }}>
       
        <select 
            value={columnsPerRow} 
            onChange={e => setColumnsPerRow(parseInt(e.target.value))} 
            style={{ padding: "5px 10px", marginRight: "10px" }}
          >
            <option value="1">1 Column</option>
            <option value="2">2 Columns</option>
            <option value="3">3 Columns</option>
            <option value="4">4 Columns</option>
          </select>
        <button onClick={handleEditToggle} style={{ padding: "5px 10px", cursor: "pointer" }}>
          {isEditing ? 'Done' : 'Edit'}
        </button>
        {isEditing && (
          <>
            <button onClick={handleAddBench} style={{ padding: "5px 10px", fontSize: "1.2rem", cursor: "pointer" }}>+</button>
            <button onClick={handleMinusBench} disabled={currentBenchCount <= 1} style={{ padding: "5px 10px", fontSize: "1.2rem", cursor: "pointer" }}>-</button>
          </>
        )}
      </div>
    </div>
  );
}

export default Benches;

