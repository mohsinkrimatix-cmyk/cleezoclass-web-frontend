import React, { useState, useEffect } from "react";
import "./BusDetailsModal.css";

interface Branch {
  id: number;
  branchName: string;
  branchAddress: string;
}

interface Bus {
  busNumber: string;
  bus_latitude: string;
  bus_longitude: string;
  school_address: string;
  branch_address: string;
  branch_location: string;
  school_location: string;
  branch_start_time: string;
  branch_end_time: string;
  school_pickup_time: string;
  school_drop_time: string;
  home_pickup_time: string;
  home_drop_time: string;
  bus_attendance_time: string;
  bus_home_time: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: ()          => void;
}

const BusDetailsModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [busQty, setBusQty] = useState<number>(0);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBusIndex, setSelectedBusIndex] = useState<number | null>(null);

  // Fetch branches from backend
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch("https://cleezoclass.com:4000/api/branches");
        if (response.ok) {
          const data = await response.json();
          setBranches(data.branches);
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };
    fetchBranches();
  }, []);

  const handleBusQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const qty = parseInt(e.target.value) || 0;
    setBusQty(qty);
    setBuses(Array(qty).fill({
      busNumber: "",
      bus_latitude: "",
      bus_longitude: "",
      school_address: "",
      branch_address: "",
      branch_location: "",
      school_location: "",
      branch_start_time: "",
      branch_end_time: "",
      school_pickup_time: "",
      school_drop_time: "",
      home_pickup_time: "",
      home_drop_time: "",
      bus_attendance_time: "",
      bus_home_time: "",
    }));
  };

  const handleBusChange = (index: number, field: keyof Bus, value: string) => {
    const updatedBuses = [...buses];
    updatedBuses[index] = { ...updatedBuses[index], [field]: value };
    setBuses(updatedBuses);
  };

  const handleBusDetailChange = (field: keyof Bus, value: string) => {
    if (selectedBusIndex !== null) {
      const updatedBuses = [...buses];
      updatedBuses[selectedBusIndex] = { ...updatedBuses[selectedBusIndex], [field]: value };
      setBuses(updatedBuses);
    }
  };

  const saveBusDetails = async () => {
    try {
      const response = await fetch("https://cleezoclass.com:4000/api/buses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buses),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        onClose();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error saving bus details:", error);
      alert("Failed to save bus details. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="sgo-bus-modal-overlay">
      <div className="sgo-bus-modal-container">
        <div className="sgo-bus-modal-header">
          <h3>ADD BUS DETAILS</h3>
          <button className="sgo-bus-close-x" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="sgo-bus-modal-body">
          <div className="sgo-bus-branches-section">
            <h4>Branches</h4>
            <ul>
              {branches.map((branch) => (
                <li key={branch.id}>{branch.branch_location} - {branch.branch_address}</li>
              ))}
            </ul>
          </div>

          <div className="sgo-bus-qty-section">
            <label>Bus Quantity</label>
            <input
              type="number"
              value={busQty}
              onChange={handleBusQtyChange}
            />
          </div>

          <div className="sgo-bus-list-section">
            {buses.map((bus, index) => (
              <div key={index} className="sgo-bus-card">
                <h4>Bus {index + 1}</h4>
                <div className="sgo-bus-number-group">
                  <label>Bus Number</label>
                  <input
                    type="text"
                    value={bus.busNumber}
                    onChange={(e) => handleBusChange(index, "busNumber", e.target.value)}
                  />
                </div>
                <button
                  className="sgo-bus-add-details-btn"
                  onClick={() => setSelectedBusIndex(index)}
                >
                  + Add Details
                </button>
              </div>
            ))}
          </div>

          {selectedBusIndex !== null && (
            <div className="sgo-bus-details-form">
              <h4>Bus Details for Bus {selectedBusIndex + 1}</h4>
              <div className="sgo-bus-form-grid">
                <div className="sgo-bus-form-group">
                  <label>Bus Latitude</label>
                  <input
                    type="text"
                    value={buses[selectedBusIndex].bus_latitude}
                    onChange={(e) => handleBusDetailChange("bus_latitude", e.target.value)}
                  />
                </div>
                <div className="sgo-bus-form-group">
                  <label>Bus Longitude</label>
                  <input
                    type="text"
                    value={buses[selectedBusIndex].bus_longitude}
                    onChange={(e) => handleBusDetailChange("bus_longitude", e.target.value)}
                  />
                </div>
                <div className="sgo-bus-form-group">
                  <label>School Address</label>
                  <textarea
                    value={buses[selectedBusIndex].school_address}
                    onChange={(e) => handleBusDetailChange("school_address", e.target.value)}
                  />
                </div>
                <div className="sgo-bus-form-group">
                  <label>Branch Address</label>
                  <textarea
                    value={buses[selectedBusIndex].branch_address}
                    onChange={(e) => handleBusDetailChange("branch_address", e.target.value)}
                  />
                </div>
                <div className="sgo-bus-form-group">
                  <label>Branch Location</label>
                  <input
                    type="text"
                    value={buses[selectedBusIndex].branch_location}
                    onChange={(e) => handleBusDetailChange("branch_location", e.target.value)}
                  />
                </div>
                <div className="sgo-bus-form-group">
                  <label>School Location</label>
                  <input
                    type="text"
                    value={buses[selectedBusIndex].school_location}
                    onChange={(e) => handleBusDetailChange("school_location", e.target.value)}
                  />
                </div>
                <div className="sgo-bus-form-group">
                  <label>Branch Start Time</label>
                  <input
                    type="time"
                    value={buses[selectedBusIndex].branch_start_time}
                    onChange={(e) => handleBusDetailChange("branch_start_time", e.target.value)}
                  />
                </div>
                <div className="sgo-bus-form-group">
                  <label>Branch End Time</label>
                  <input
                    type="time"
                    value={buses[selectedBusIndex].branch_end_time}
                    onChange={(e) => handleBusDetailChange("branch_end_time", e.target.value)}
                  />
                </div>
                <div className="sgo-bus-form-group">
                  <label>School Pickup Time</label>
                  <input
                    type="time"
                    value={buses[selectedBusIndex].school_pickup_time}
                    onChange={(e) => handleBusDetailChange("school_pickup_time", e.target.value)}
                  />
                </div>
                <div className="sgo-bus-form-group">
                  <label>School Drop Time</label>
                  <input
                    type="time"
                    value={buses[selectedBusIndex].school_drop_time}
                    onChange={(e) => handleBusDetailChange("school_drop_time", e.target.value)}
                  />
                </div>
                <div className="sgo-bus-form-group">
                  <label>Home Pickup Time</label>
                  <input
                    type="time"
                    value={buses[selectedBusIndex].home_pickup_time}
                    onChange={(e) => handleBusDetailChange("home_pickup_time", e.target.value)}
                  />
                </div>
                <div className="sgo-bus-form-group">
                  <label>Home Drop Time</label>
                  <input
                    type="time"
                    value={buses[selectedBusIndex].home_drop_time}
                    onChange={(e) => handleBusDetailChange("home_drop_time", e.target.value)}
                  />
                </div>
                <div className="sgo-bus-form-group">
                  <label>Bus Attendance Time</label>
                  <input
                    type="datetime-local"
                    value={buses[selectedBusIndex].bus_attendance_time}
                    onChange={(e) => handleBusDetailChange("bus_attendance_time", e.target.value)}
                  />
                </div>
                <div className="sgo-bus-form-group">
                  <label>Bus Home Time</label>
                  <input
                    type="datetime-local"
                    value={buses[selectedBusIndex].bus_home_time}
                    onChange={(e) => handleBusDetailChange("bus_home_time", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="sgo-bus-modal-footer">
          <button className="sgo-bus-save-btn" onClick={saveBusDetails}>
            Save
          </button>
          <button className="sgo-bus-cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusDetailsModal;
