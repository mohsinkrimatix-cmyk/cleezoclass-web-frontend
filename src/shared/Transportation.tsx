import React, { useState } from "react";
import "./AddTransport.css";
import AddSchoolBranchModal from "./AddSchoolBranchModal";
import AddPeopleModal from "./StudentModalOpen";
import DriverHelperModal from "./DriverModal";
import BusDetailsModal from "./BusDetails";

const AddTransport: React.FC = () => {
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [isDriverHelperModalOpen, setIsDriverHelperModalOpen] = useState(false);
  const [isBusDetailsModalOpen, setIsBusDetailsModalOpen] = useState(false);

  const transportItems = [
    { title: "School / Branch", onClick: () => setIsSchoolModalOpen(true) },
    { title: "Buses / Transport", onClick: () => setIsBusDetailsModalOpen(true) },
    { title: "Driver / Helper", onClick: () => setIsDriverHelperModalOpen(true) },
    { title: "Students / Passengers", onClick: () => setIsStudentsModalOpen(true) },
  ];

  return (
    <div className="transport-container">
      <h2 className="page-title">Add Transport</h2>
      <div className="transport-grid">
        {transportItems.map((item, index) => (
          <div key={index} className="transport-card" onClick={item.onClick}>
            <div className="title">+ {item.title}</div>
          </div>
        ))}
      </div>

      <AddSchoolBranchModal
        isOpen={isSchoolModalOpen}
        onClose={() => setIsSchoolModalOpen(false)}
      />
      <AddPeopleModal
        isOpen={isStudentsModalOpen}
        onClose={() => setIsStudentsModalOpen(false)}
      />
      <DriverHelperModal
        isOpen={isDriverHelperModalOpen}
        onClose={() => setIsDriverHelperModalOpen(false)}
      />
      <BusDetailsModal
        isOpen={isBusDetailsModalOpen}
        onClose={() => setIsBusDetailsModalOpen(false)}
      />
    </div>
  );
};

export default AddTransport;
