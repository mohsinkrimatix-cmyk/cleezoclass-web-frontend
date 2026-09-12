import React, { useState } from "react";
// import "./DriverHelperModal.css";

interface Driver {
  driver_name: string;
  driver_experience: string;
  driver_joining_date: string;
  driver_enrollment: string;
  driver_phone_no: string;
  driver_id: string;
  driver_licence_no: string;
  driver_address: string;
  driver_salary: string;
  driver_roll_no: string;
}

interface Helper {
  helper_name: string;
  helper_joining_date: string;
  helper_enrollment: string;
  helper_phone_no: string;
  helper_id: string;
  helper_address: string;
  helper_salary: string;
  helper_roll_no: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DriverHelperModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"driver" | "helper">("driver");

  const [driver, setDriver] = useState<Driver>({
    driver_name: "",
    driver_experience: "",
    driver_joining_date: "",
    driver_enrollment: "",
    driver_phone_no: "",
    driver_id: "",
    driver_licence_no: "",
    driver_address: "",
    driver_salary: "",
    driver_roll_no: "",
  });

  const [helper, setHelper] = useState<Helper>({
    helper_name: "",
    helper_joining_date: "",
    helper_enrollment: "",
    helper_phone_no: "",
    helper_id: "",
    helper_address: "",
    helper_salary: "",
    helper_roll_no: "",
  });

  const handleDriverChange = (field: keyof Driver, value: string) => {
    setDriver({ ...driver, [field]: value });
  };

  const handleHelperChange = (field: keyof Helper, value: string) => {
    setHelper({ ...helper, [field]: value });
  };

  const saveDriver = async () => {
    try {
      const response = await fetch("https://cleezoclass.com:5000/api/drivers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(driver),
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
      console.error("Error saving driver:", error);
      alert("Failed to save driver. Please try again.");
    }
  };

  const saveHelper = async () => {
    try {
      const response = await fetch("https://cleezoclass.com:5000/api/helpers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(helper),
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
      console.error("Error saving helper:", error);
      alert("Failed to save helper. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="sgo-driver-helper-modal-overlay">
      <div className="sgo-driver-helper-modal-container">
        <div className="sgo-driver-helper-modal-header">
          <h3>ADD DRIVER / HELPER</h3>
          <button className="sgo-driver-helper-close-x" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="sgo-driver-helper-tabs">
          <button
            className={activeTab === "driver" ? "sgo-driver-helper-active" : ""}
            onClick={() => setActiveTab("driver")}
          >
            Driver
          </button>
          <button
            className={activeTab === "helper" ? "sgo-driver-helper-active" : ""}
            onClick={() => setActiveTab("helper")}
          >
            Helper
          </button>
        </div>
        <div className="sgo-driver-helper-modal-body">
          {activeTab === "driver" ? (
            <div className="sgo-driver-helper-form-grid">
              <div className="sgo-driver-helper-form-group">
                <label>Driver Name</label>
                <input
                  type="text"
                  value={driver.driver_name}
                  onChange={(e) => handleDriverChange("driver_name", e.target.value)}
                />
              </div>
              <div className="sgo-driver-helper-form-group">
                <label>Experience (Years)</label>
                <input
                  type="number"
                  value={driver.driver_experience}
                  onChange={(e) => handleDriverChange("driver_experience", e.target.value)}
                />
              </div>
              <div className="sgo-driver-helper-form-group">
                <label>Joining Date</label>
                <input
                  type="date"
                  value={driver.driver_joining_date}
                  onChange={(e) => handleDriverChange("driver_joining_date", e.target.value)}
                />
              </div>
              <div className="sgo-driver-helper-form-group">
                <label>Enrollment No</label>
                <input
                  type="text"
                  value={driver.driver_enrollment}
                  onChange={(e) => handleDriverChange("driver_enrollment", e.target.value)}
                />
              </div>
              <div className="sgo-driver-helper-form-group">
                <label>Phone No</label>
                <input
                  type="text"
                  value={driver.driver_phone_no}
                  onChange={(e) => handleDriverChange("driver_phone_no", e.target.value)}
                />
              </div>
              <div className="sgo-driver-helper-form-group">
                <label>ID</label>
                <input
                  type="text"
                  value={driver.driver_id}
                  onChange={(e) => handleDriverChange("driver_id", e.target.value)}
                />
              </div>
              <div className="sgo-driver-helper-form-group">
                <label>Licence No</label>
                <input
                  type="text"
                  value={driver.driver_licence_no}
                  onChange={(e) => handleDriverChange("driver_licence_no", e.target.value)}
                />
              </div>
              <div className="sgo-driver-helper-form-group">
                <label>Address</label>
                <textarea
                  value={driver.driver_address}
                  onChange={(e) => handleDriverChange("driver_address", e.target.value)}
                />
              </div>
              <div className="sgo-driver-helper-form-group">
                <label>Salary</label>
                <input
                  type="text"
                  value={driver.driver_salary}
                  onChange={(e) => handleDriverChange("driver_salary", e.target.value)}
                />
              </div>
              <div className="sgo-driver-helper-form-group">
                <label>Roll No</label>
                <input
                  type="text"
                  value={driver.driver_roll_no}
                  onChange={(e) => handleDriverChange("driver_roll_no", e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="sgo-driver-helper-form-grid">
              <div className="sgo-driver-helper-form-group">
                <label>Helper Name</label>
                <input
                  type="text"
                  value={helper.helper_name}
                  onChange={(e) => handleHelperChange("helper_name", e.target.value)}
                />
              </div>
              <div className="sgo-driver-helper-form-group">
                <label>Joining Date</label>
                <input
                  type="date"
                  value={helper.helper_joining_date}
                  onChange={(e) => handleHelperChange("helper_joining_date", e.target.value)}
                />
              </div>
              <div className="sgo-driver-helper-form-group">
                <label>Enrollment No</label>
                <input
                  type="text"
                  value={helper.helper_enrollment}
                  onChange={(e) => handleHelperChange("helper_enrollment", e.target.value)}
                />
              </div>
              <div className="sgo-driver-helper-form-group">
                <label>Phone No</label>
                <input
                  type="text"
                  value={helper.helper_phone_no}
                  onChange={(e) => handleHelperChange("helper_phone_no", e.target.value)}
                />
              </div>
              <div className="sgo-driver-helper-form-group">
                <label>ID</label>
                <input
                  type="text"
                  value={helper.helper_id}
                  onChange={(e) => handleHelperChange("helper_id", e.target.value)}
                />
              </div>
              <div className="sgo-driver-helper-form-group">
                <label>Address</label>
                <textarea
                  value={helper.helper_address}
                  onChange={(e) => handleHelperChange("helper_address", e.target.value)}
                />
              </div>
              <div className="sgo-driver-helper-form-group">
                <label>Salary</label>
                <input
                  type="text"
                  value={helper.helper_salary}
                  onChange={(e) => handleHelperChange("helper_salary", e.target.value)}
                />
              </div>
              <div className="sgo-driver-helper-form-group">
                <label>Roll No</label>
                <input
                  type="text"
                  value={helper.helper_roll_no}
                  onChange={(e) => handleHelperChange("helper_roll_no", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
        <div className="sgo-driver-helper-modal-footer">
          <button
            className="sgo-driver-helper-save-btn"
            onClick={activeTab === "driver" ? saveDriver : saveHelper}
          >
            Save
          </button>
          <button className="sgo-driver-helper-cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverHelperModal;
