import React, { useState } from "react";
// import "./AddSchoolBranchModal.css";

interface Branch {
  branchName: string;
  branchAddress: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddSchoolBranchModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const [schoolName, setSchoolName] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [branches, setBranches] = useState<Branch[]>([
    { branchName: "", branchAddress: "" }
  ]);

  const handleBranchChange = (index: number, field: keyof Branch, value: string) => {
    const updatedBranches = [...branches];
    updatedBranches[index] = { ...updatedBranches[index], [field]: value };
    setBranches(updatedBranches);
  };

  const addBranch = () => {
    setBranches([...branches, { branchName: "", branchAddress: "" }]);
  };

  const removeBranch = (index: number) => {
    if (branches.length > 1) {
      const updatedBranches = branches.filter((_, i) => i !== index);
      setBranches(updatedBranches);
    }
  };

  const saveSchoolBranch = async () => {
    try {
      const response = await fetch("https://cleezoclass.com:5000/api/schools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          school_name: schoolName,
          school_address: schoolAddress,
          branches: branches,
        }),
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
      console.error("Error saving school/branch:", error);
      alert("Failed to save school/branch. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>ADD SCHOOL / BRANCH</h3>
          <button className="sgo-driver-helper-close-x" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div className="top-inputs">
            <input
              type="text"
              placeholder="SCHOOL NAME"
              className="main-input"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
            />
            <input
              type="text"
              placeholder="ADDRESS"
              className="main-input"
              value={schoolAddress}
              onChange={(e) => setSchoolAddress(e.target.value)}
            />
            <button className="add-branch-btn" onClick={addBranch}>
              + ADD BRANCH
            </button>
          </div>

          <div className="branches-grid">
            {branches.map((branch, index) => (
              <div className="branch-card" key={index}>
                <header>BRANCH {index + 1}</header>
                <input
                  type="text"
                  placeholder="BRANCH NAME"
                  value={branch.branchName}
                  onChange={(e) => handleBranchChange(index, "branchName", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="ADDRESS"
                  value={branch.branchAddress}
                  onChange={(e) => handleBranchChange(index, "branchAddress", e.target.value)}
                />
                <button className="add-loc">+ ADD LOCATION</button>
                {branches.length > 1 && (
                  <button className="remove-branch" onClick={() => removeBranch(index)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="save-btn" onClick={saveSchoolBranch}>
            Save
          </button>
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSchoolBranchModal;
