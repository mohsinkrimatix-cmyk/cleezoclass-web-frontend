
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";

export default function TeacherEvents() {
  const navigate = useNavigate();

  // Dummy events data
  const [events, setEvents] = useState([

    
  ]);

  const [search, setSearch] = useState("");
  const [filterTime, setFilterTime] = useState("All");
  const [filterType, setFilterType] = useState("All");

  const [showEventsPopup, setShowEventsPopup] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [hasOpened, setHasOpened] = useState(false);
  const [popupShown, setPopupShown] = useState(false); // new flag
  const [userInteracted, setUserInteracted] = useState(false);

  // ADDED: control Add-Event popup visibility
  const [showAddEventPopup, setShowAddEventPopup] = useState(false);
  const [teacherEvents, setTeacherEvents]= useState([])

  const today = new Date();



const [eventData, setEventData] = useState({
    name: "",
    type: "",
    date: "",
    imageUrl: "",
    description: ""
  });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData((prev) => ({ ...prev, [name]: value }));
  };




  useEffect(()=>{
const fetchTeacherEventsData=async ()=>{
  const schoolCode = localStorage.getItem("schoolCode")
  try{
const res = await fetch("https://cleezoclass.com:4000/api/teachers/getEventsData", {
  method:"POST", 
  headers:{"Content-type":"application/json"},
  body:JSON.stringify({schoolCode})
})
if(!res.ok){
  throw new Error(res.statusText)
}else{
  const data = await res.json() 
  console.log(data.data)
  setEvents(data.data)
  setTeacherEvents(data.data)
  
}
  }catch(err){
    console.log(err.message)

  }
}
fetchTeacherEventsData()
  },[])

  // handle submit
  const handleSubmit = async () => {
    const schoolCode = localStorage.getItem("schoolCode");
    try {
      const res = await fetch("https://cleezoclass.com:4000/api/teachers/saveEvents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...eventData, schoolCode }),
      });

      const data = await res.json();
      console.log("Event saved:", data);
      alert("Event saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save event");
    }
  };








  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(search.toLowerCase());
    const eventDate = new Date(event.date);



 



    let matchesTime = true;
    if (filterTime === "Past") matchesTime = eventDate < today;
    if (filterTime === "Future") matchesTime = eventDate > today;

    let matchesType = filterType === "All" || event.type === filterType;

    return matchesSearch && matchesTime && matchesType;
  });

const handleEventPopUp = () => {
  setShowEventsPopup(false);
  setSelectedEvent(null);
  setUserInteracted(false); // ✅ prevent reopening
};
useEffect(() => {
  if (userInteracted && filteredEvents.length > 0) {
    setShowEventsPopup(true);
  } else {
    setShowEventsPopup(false); // hide if no results
  }
}, [filteredEvents, userInteracted]);

// Handle filter changes
const handleFilterTimeChange = (e) => {
  setFilterTime(e.target.value);
  setUserInteracted(true);
};

const handleFilterTypeChange = (e) => {
  setFilterType(e.target.value);
  setUserInteracted(true);
};

const handleSearchChange = (e) => {
  setSearch(e.target.value);
  setUserInteracted(true);
};

    const scrollRef = useRef(null);
useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const scrollAmount = scrollContainer.offsetWidth; // move by one full view (3 cards width)
    const interval = setInterval(() => {
      if (
        scrollContainer.scrollLeft + scrollContainer.offsetWidth >=
        scrollContainer.scrollWidth
      ) {
        // Reset to start when reaching the end
        scrollContainer.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollContainer.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }, 2000); // scroll every 3s

    return () => clearInterval(interval);
  }, [filteredEvents]);


  
  return (
    <>
      <h5
        style={{
          display: "flex",
          justifyContent: "center",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        Teacher Event Management
      </h5>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          gap: "20px",
          backgroundColor: "#fff",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
          border: "1px solid #ccc",
          paddingTop: "40px",
          paddingLeft:"0px",
          paddingRight:"0px",
          borderRadius: "10px",
          paddingBottom:"40px",
          fontFamily: "Arial, Helvetica, sans-serif",
          height:"28vh"
        }}
      > 

        {/* ADDED: Base-screen subheading + plus button row */}
      <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center", // center by default
    position: "relative",
    padding: "0 10%",
    marginTop: "-10px",
    marginBottom: "10px",
  }}
>
  {/* Heading always centered */}
  <h5
    style={{
      textAlign: "center",
      fontWeight: "700",
      marginBottom: "10px",
      flexGrow: 1,
    }}
  >
    Select Events
  </h5>

  {/* Button absolute to the right */}
  <button
    onClick={() => setShowAddEventPopup(true)}
    title="Add Event"
    style={{
      position: "absolute",
      right: "10%", // same as padding
      background: "rgb(128, 128, 128)",
      border: "none",
      color: "white",
      borderRadius: "999px",
      width: "38px",
      height: "38px",
      fontSize: "22px",
      cursor: "pointer",
      boxShadow: "0 6px 14px rgba(0,0,0,0.18)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "0 10px 18px rgba(0,0,0,0.22)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 6px 14px rgba(0,0,0,0.18)";
    }}
  >
    +
  </button>
</div>


        {/* Filters */}
        <div style={{ padding: "30px 10%", textAlign: "center" }}>
          <div style={{ marginBottom: "25px" }}>
            <select
              value={filterTime}
           onChange={handleFilterTimeChange}
              style={{
                padding: "10px",
                marginRight: "15px",
                borderRadius: "6px",
                border: "1px solid #aaa",
                fontSize: "15px",
              }}
            >
              <option value="All">All Events</option>
              <option value="Past">Past Events</option>
              <option value="Future">Future Events</option>
            </select>

            <select
              value={filterType}
            onChange={handleFilterTypeChange}
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #aaa",
                fontSize: "15px",
              }}
            >
              <option value="All">All Types</option>
              <option value="Sports">Sports</option>
              <option value="Cultural">Cultural</option>
              <option value="Academic">Academic</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Popup */}
      {showEventsPopup && !selectedEvent && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            // width:"px",
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            animation: "fadeIn 0.4s ease",
          }}
          onClick={() => setShowEventsPopup(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              maxWidth: "900px",
              width: "95%",
              padding: "25px",
              textAlign: "center",
              position: "relative",
              animation: "slideUp 0.4s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: "20px" }}> Available Events</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "20px",
              }}
            >
           
  <div
      ref={scrollRef}
      style={{
        display: "flex",
        overflowX: "auto", // ✅ manual scroll
        whiteSpace: "nowrap",
        width: "100%",
        padding: "10px 0",
        scrollbarWidth: "none", // hide scrollbar in Firefox
        msOverflowStyle: "none", // hide scrollbar in IE
      }}
    >
      <div
        style={{
          display: "inline-flex",
          gap: "20px",
        }}
      >
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            onClick={() => {
              setSelectedEvent(event);
              setShowEventsPopup(false);
            }}
            style={{
              background: "linear-gradient(135deg,#6a11cb,#2575fc)",
              borderRadius: "10px",
              color: "white",
              padding: "15px",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              transition: "transform 0.3s",
              minWidth: "300px", // each card width
              maxWidth: "300px",
              flex: "0 0 auto",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "scale(1)")
            }
          >
            <img
              src={event.image}
              alt={event.name}
              style={{
                width: "100%",
                height: "120px",
                objectFit: "cover",
                borderRadius: "8px",
                marginBottom: "10px",
              }}
            />
            <h3>{event.name}</h3>
            <p style={{ fontSize: "13px" }}>📅 <p>
  {`${new Date(event.date).getDate().toString().padStart(2, '0')}-${(new Date(event.date).getMonth()+1).toString().padStart(2, '0')}-${new Date(event.date).getFullYear()}`}
</p>
</p>
            <p style={{ fontSize: "13px" }}>Type: {event.type}</p>
          </div>
        ))}
      </div>
    </div>







              {/* )) */}
              
              
              
              {/* } */}
            </div>

            <button
              onClick={handleEventPopUp}
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                background: "#333",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Event Details Popup */}
   {selectedEvent && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.85)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      animation: "fadeIn 0.5s ease-in-out",
      backdropFilter: "blur(6px)",
    }}
    onClick={() => setSelectedEvent(null)}
  >
    <div
      style={{
        background: "linear-gradient(145deg, #ffffff, #f3f3f3)",
        borderRadius: "20px",
        maxWidth: "800px",
        width: "90%",
        padding: "30px",
        textAlign: "center",
        position: "relative",
        animation: "zoomIn 0.5s ease-in-out",
        boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
        transform: "translateY(-10px)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => setSelectedEvent(null)}
        style={{
          position: "absolute",
          top: "15px",
          right: "20px",
          border: "none",
          background: "transparent",
          fontSize: "26px",
          cursor: "pointer",
          color: "#333",
          transition: "transform 0.2s ease",
        }}
        onMouseEnter={(e) => (e.target.style.transform = "scale(1.2)")}
        onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
      >
        ✖
      </button>
      <img
        src={selectedEvent.image}
        alt={selectedEvent.name}
        style={{
          width: "100%",
          height: "320px",
          objectFit: "cover",
          borderRadius: "15px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
          transition: "transform 0.4s ease",
        }}
        onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
        onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
      />
      <h2 style={{ margin: "20px 0 12px", fontSize: "28px", color: "#222" }}>
        {selectedEvent.name}
      </h2>
      <p style={{ fontSize: "18px", marginBottom: "5px" }}>📅<p>
  {`${new Date(selectedEvent.date).getDate().toString().padStart(2, '0')}-${(new Date(selectedEvent.date).getMonth()+1).toString().padStart(2, '0')}-${new Date(selectedEvent.date).getFullYear()}`}
</p>
</p>
      <p style={{ fontSize: "18px", marginBottom: "15px" }}>
        🎟️ Type: <b>{selectedEvent.type}</b>
      </p>
      <p
        style={{
          color: "#444",
          fontSize: "16px",
          lineHeight: "1.6",
          marginTop: "10px",
          padding: "0 15px",
        }}
      >
        {selectedEvent.description}
      </p>
    </div>
  </div>
)}


      {/* ADDED: Add Event Popup (opens from + button on base screen) */}
      {showAddEventPopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            animation: "fadeIn 0.25s ease",
          }}
          onClick={() => setShowAddEventPopup(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "14px",
              maxWidth: "500px",
              width: "90%",
              padding: "24px",
              position: "relative",
              boxShadow: "0 12px 28px rgba(0,0,0,0.25)",
              animation: "slideUp 0.3s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ textAlign: "center", margin: "0 0 16px" }}>➕ Add Event</h2>

             <input
        name="name"
        placeholder="Event Name"
        style={inputStyle}
        value={eventData.name}
        onChange={handleChange}
      />
      <input
        name="type"
        placeholder="Event Type"
        style={inputStyle}
        value={eventData.type}
        onChange={handleChange}
      />
      <input
        name="date"
        type="date"
        style={inputStyle}
        value={eventData.date}
        onChange={handleChange}
      />
      <input
        name="imageUrl"
        placeholder="Image URL"
        style={inputStyle}
        value={eventData.imageUrl}
        onChange={handleChange}
      />
      <textarea
        name="description"
        placeholder="Description"
        rows="3"
        style={{ ...inputStyle, resize: "none" }}
        value={eventData.description}
        onChange={handleChange}
      />
     
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "10px" }}>
              <button
                onClick={() => setShowAddEventPopup(false)}
                style={{
                  padding: "10px 18px",
                  background: "#e5e7eb",
                  color: "#111",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
              <button
                // onClick={() => setShowAddEventPopup(false)}
                onClick={handleSubmit}
                style={{
                  padding: "10px 18px",
            background: "rgb(128, 128, 128)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          input, textarea {
            width: 100%;
            margin-bottom: 12px;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 6px;
            font-size: 14px;
          }

          @keyframes scroll-left {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}
        `}
      </style>
    </>
  );
}

const inputStyle = {
  width: "100%",
  marginBottom: "12px",
  padding: "10px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  fontSize: "14px",
};
