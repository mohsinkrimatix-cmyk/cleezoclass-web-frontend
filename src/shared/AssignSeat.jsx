

import React, { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";

function AssignSeats() {
  const [rooms, setRooms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [roomNumber, setRoomNumber] = useState("");
  const [benchCount, setBenchCount] = useState("");
  const [seatA, setSeatA] = useState("");
  const [seatB, setSeatB] = useState("");
  const [seatC, setSeatC] = useState("");
  const [seatingType, setSeatingType] = useState("");
  const [patterns, setPatterns] = useState([]);
  const [selectedPattern, setSelectedPattern] = useState("");
  const [seatArrangement, setSeatArrangement] = useState([]);

  const [allStudents, setAllStudents] = useState([]);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [seatToUpdate, setSeatToUpdate] = useState(null);

  const schoolCode = localStorage.getItem("schoolCode");

  // useEffect(() => {
  //   axios.get(`http://localhost:3020/rooms${schoolCode ? `?schoolCode=${schoolCode}` : ''}`)
  //     .then(res => setRooms(res.data));

  //   axios.get(`http://localhost:3020/classes${schoolCode ? `?schoolCode=${schoolCode}` : ''}`)
  //     .then(res => setClasses(res.data));

  //   axios.get(`http://localhost:3020/students${schoolCode ? `?schoolCode=${schoolCode}` : ''}`)
  //     .then(res => setAllStudents(res.data));
  // }, []);  




  useEffect(() => {
  axios.get(`http://localhost:3020/rooms${schoolCode ? `?schoolCode=${schoolCode}` : ''}`)
    .then(res => setRooms(res.data))
    .catch(err => console.error("Error fetching rooms:", err.message));

  axios.get(`http://localhost:3020/classes${schoolCode ? `?schoolCode=${schoolCode}` : ''}`)
    .then(res => setClasses(res.data))
    .catch(err => console.error("Error fetching classes:", err.message));

  axios.get(`http://localhost:3020/students${schoolCode ? `?schoolCode=${schoolCode}` : ''}`)
    .then(res => setAllStudents(res.data))
    .catch(err => console.error("Error fetching students:", err.message));
}, []);


  useEffect(() => {
    if (roomNumber) {
      const room = rooms.find(r => r.room_number === parseInt(roomNumber));
      setBenchCount(room ? room.benches : "");
    }
  }, [roomNumber, rooms]);

  useEffect(() => {
    if (seatingType === "2") setPatterns(["A B", "B A", "A A"]);
    else if (seatingType === "3") setPatterns(["A B C", "A B A", "A C B", "B A B", "B C A", "C A B", "A A A"]);
    else setPatterns([]);
  }, [seatingType]);

  const assignSeats = async () => {
    if (!roomNumber || !selectedPattern || !seatA || !seatB || (seatingType === "3" && !seatC)) {
      if(!selectedPattern) console.log("Pattern not selected");
      else if (!seatingType) console.log("Seating type is not defined");
      else console.log("Selected pattern is not defined in data");
      return;
    }

    try {
      const resA = await axios.get(`http://localhost:3020/students?class=${seatA}${schoolCode ? `&schoolCode=${schoolCode}` : ''}`);
      const studentsA = resA.data; 

      const resB = await axios.get(`http://localhost:3020/students?class=${seatB}${schoolCode ? `&schoolCode=${schoolCode}` : ''}`);
      const studentsB = resB.data;

      let studentsC = [];
      if (seatingType === "3") {
        const resC = await axios.get(`http://localhost:3020/students?class=${seatC}${schoolCode ? `&schoolCode=${schoolCode}` : ''}`);
        studentsC = resC.data;
      }
      const patternArray = selectedPattern.split(" ");
      let indexA = 0, indexB = 0, indexC = 0;
      let newArrangement = [...seatArrangement];

      const hasEmptySeats = newArrangement.some(bench => bench.arrangement.includes(""));

      if (newArrangement.length === 0 || hasEmptySeats) {
        let isInitial = newArrangement.length === 0;
        if (isInitial) {
          for (let i = 1; i <= benchCount; i++) {
            let benchSeats = patternArray.map(p => {
              if (p === "A") return studentsA[indexA++]?.hall_ticket || "";
              if (p === "B") return studentsB[indexB++]?.hall_ticket || "";
              if (p === "C") return studentsC[indexC++]?.hall_ticket || "";
              return "";
            });
            newArrangement.push({ bench: i, arrangement: benchSeats });
          }
          toast.success("Seats assigned successfully!");
        } else {
          newArrangement.forEach(bench => {
            bench.arrangement.forEach((seat, seatIndex) => {
              if (seat === "") {
                const classToAssign = patternArray[seatIndex];
                let newHallTicket = "";
                if (classToAssign === "A" && indexA < studentsA.length) newHallTicket = studentsA[indexA++].hall_ticket;
                else if (classToAssign === "B" && indexB < studentsB.length) newHallTicket = studentsB[indexB++].hall_ticket;
                else if (classToAssign === "C" && indexC < studentsC.length) newHallTicket = studentsC[indexC++].hall_ticket;
                if (newHallTicket) bench.arrangement[seatIndex] = newHallTicket;
              }
            });
          });
          toast.success("Remaining seats have been filled!");
        }
      } else {
        newArrangement = [];
        for (let i = 1; i <= benchCount; i++) {
          let benchSeats = patternArray.map(p => {
            if (p === "A") return studentsA[indexA++]?.hall_ticket || "";
            if (p === "B") return studentsB[indexB++]?.hall_ticket || "";
            if (p === "C") return studentsC[indexC++]?.hall_ticket || "";
            return "";
          });
          newArrangement.push({ bench: i, arrangement: benchSeats });
        }
        toast.success("All seats were filled, a new arrangement has been assigned!");
      }

      setSeatArrangement(newArrangement);

     await axios.post(`http://localhost:3020/assign-seats`, {
  roomNumber,
  benchCount,
  seatA,
  seatB,
  seatC: seatingType === "3" ? seatC : null,
  seatingType,
  selectedPattern,
  schoolCode // include here
});

    } catch (err) {
      console.error(err);
      toast.error("Failed to assign seats");
    }
  };

  const handleSeatClick = (benchIndex, seatIndex) => {
    setSeatToUpdate({ benchIndex, seatIndex });
    setShowStudentModal(true);
  };

  const handleReassignStudent = (newHallTicket) => {
    const newArrangement = [...seatArrangement];
    const { benchIndex, seatIndex } = seatToUpdate;
    newArrangement[benchIndex].arrangement[seatIndex] = newHallTicket;
    setSeatArrangement(newArrangement);
    setShowStudentModal(false);    
  };

  return (
    <div style={{ padding: "20px", backgroundSize: "cover", minHeight: "50vh" }}>
      <Toaster position="top-center" reverseOrder={false} toastOptions={3000} />
      <h2 style={{ marginBottom: "20px", textAlign: "center" }}>Assign Seats</h2>
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        backgroundColor: "#f0f0f0",
        gap: "15px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        padding: "55px",
        borderRadius: "8px",
        justifyContent: "center"
      }}>
        {/* Room Number */}
        <input type="number" value={roomNumber} placeholder="Enter Room Number" onChange={e => setRoomNumber(e.target.value)} style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "16px" , width:"200px"}} />
        {/* Bench Count */}
        <input type="number" value={benchCount} placeholder="Number of Benches" onChange={e => setBenchCount(e.target.value)} style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "16px" , width:"200px"}} />
        <br></br>
        {/* Seat A */}
        <select value={seatA} onChange={e => setSeatA(e.target.value)} style={{ padding: "10px", borderRadius: "4px", fontSize: "16px" }}>
          <option value="">Select Seat A</option>
          {classes.map(c => <option key={c.class_number} value={c.class_number}>Class {c.class_number}</option>)}
        </select>
        {/* Seat B */}
        <select value={seatB} onChange={e => setSeatB(e.target.value)} style={{ padding: "10px", borderRadius: "4px", fontSize: "16px" }}>
          <option value="">Select Seat B</option>
          {classes.map(c => <option key={c.class_number} value={c.class_number}>Class {c.class_number}</option>)}
        </select>
        {/* Seat C */}
        {seatingType === "3" && (
          <select value={seatC} onChange={e => setSeatC(e.target.value)} style={{ padding: "10px", borderRadius: "4px", fontSize: "16px" }}>
            <option value="">Select Seat C</option>
            {classes.map(c => <option key={c.class_number} value={c.class_number}>Class {c.class_number}</option>)}
          </select>
        )}
        {/* Seating Type */}
        <select value={seatingType} onChange={e => setSeatingType(e.target.value)} style={{ padding: "10px", borderRadius: "4px", fontSize: "16px" }}>
          <option value="">Select</option>
          <option value="2">2</option>
          <option value="3">3</option>
        </select>
        {/* Pattern */}
        <select value={selectedPattern} onChange={e => setSelectedPattern(e.target.value)} style={{ padding: "10px", borderRadius: "4px", fontSize: "16px" }}>
          <option value="">Select Pattern</option>
          {patterns.map((p, i) => <option key={i} value={p}>{p}</option>)}
        </select>
        <button onClick={assignSeats} style={{ padding: "10px 20px", borderRadius: "5px", border: "none", background: "yellow", color: "black", cursor: "pointer", fontWeight: "bold", fontSize: "16px" }}>Assign</button>
      </div>

      {/* Seat Arrangement */}
      {seatArrangement.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          <h3 style={{ textAlign: "center", marginBottom: "20px" }}>Seating Arrangement</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
            {seatArrangement.map((bench, benchIndex) => (
              <div key={bench.bench} style={{ display: "flex", alignItems: "center", border: "2px solid #333", borderRadius: "8px", padding: "10px 20px", background: "#f8f8f8", width: "fit-content", minWidth: "250px" }}>
                <div style={{ display: "flex", gap: "12px" }}>
                  {bench.arrangement.map((s, seatIndex) => (
                    <div key={seatIndex} onClick={() => handleSeatClick(benchIndex, seatIndex)} style={{
                      border: "2px solid #007bff",
                      borderRadius: "6px",
                      padding: "12px 18px",
                      minWidth: "70px",
                      textAlign: "center",
                      background: s === "" ? "#eee" : "yellow",
                      fontWeight: "500",
                      fontSize: "14px",
                      boxShadow: "2px 2px 5px rgba(0,0,0,0.1)",
                      cursor: "pointer",
                      transition: "background-color 0.3s"
                    }}>{s}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Modal */}
      {showStudentModal && (
        <div style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          background: "white", padding: "20px", borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.2)", width: "350px", zIndex: 100
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
            <h4 style={{ margin: 0 }}>Select Student to Reassign</h4>
            <button onClick={() => setShowStudentModal(false)} style={{ background: "#dc3545", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", padding: "5px 10px", fontSize: "14px" }}>Close</button>
          </div>
          <div style={{ maxHeight: "calc(80vh - 80px)", overflowY: "auto" }}>
            <ul style={{ listStyleType: "none", padding: 0, marginTop: "10px" }}>
              {allStudents.map(student => (
                <li key={student.hall_ticket} onClick={() => handleReassignStudent(student.hall_ticket)} style={{ padding: "10px", borderBottom: "1px solid #eee", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "background-color 0.2s" }}>
                  <span>{student.name}</span>
                  <span>{student.hall_ticket}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

    </div>
  );
}

export default AssignSeats;

