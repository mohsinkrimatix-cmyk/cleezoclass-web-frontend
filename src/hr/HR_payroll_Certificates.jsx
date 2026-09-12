import React, { useState, useEffect } from "react";
import CertificateSelector from "./HR_Certificates_SelectorCertificate";
import TransferCertificate from "./HR_certificates_transfercertificate";
import MigrationCertificate from "../shared/MigrationCertificate1";
import ObjectionCertificate from "../shared/ObjectionCertificate1";
import AppreciationCertificate from "./HR_certificates_AppreciationCertificate";
import BonafiedCertificate from "./HR_certificates_bonafideCertificate";
import StudyCertificate from "./HR_certificates_StudyCertificate";
import NoDueCertificate from "../shared/NoDueCertificate";

const Certificates = () => {
  const [certificatePopup, setCertificatePopup] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const certificateComponents = {
    transfer: TransferCertificate,
    appreciation: AppreciationCertificate,
    completion: StudyCertificate,
    migration: MigrationCertificate,
    bonafide: BonafiedCertificate,
    objection: ObjectionCertificate,
    nodue: NoDueCertificate,
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const styles = {
    wrapper: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      width: "100%",
      background: "#f5f6fa",
      padding: isMobile ? "10px" : "20px",
    },
    container: {
      background: "#ffffff",
      borderRadius: "16px",
      boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
      padding: isMobile ? "20px" : "35px",
      textAlign: "center",
      width: isMobile ? "90%" : "50%",
      transition: "all 0.3s ease",
      maxHeight: "90vh",
      overflowY: "auto",
    },
    title: {
      fontFamily: "Century Gothic, sans-serif",
      fontWeight: "600",
      fontSize: isMobile ? "16px" : "20px",
      marginBottom: "20px",
      color: "#333",
    },
    popupOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2000,
    },
    popupContent: {
      background: "#fff",
      borderRadius: "16px",
      padding: "25px",
      maxWidth: "900px",
      width: isMobile ? "90%" : "75%",
      height: isMobile ? "85vh" : "90vh",
      overflowY: "auto",
      position: "relative",
      boxShadow: "0px 8px 20px rgba(0,0,0,0.2)",
    },
    closeButton: {
      position: "absolute",
      top: "10px",
      right: "15px",
      background: "transparent",
      border: "none",
      fontSize: "24px",
      cursor: "pointer",
      color: "#333",
    },
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h4 style={styles.title}>Certificates</h4>

        <CertificateSelector
          onLocalNavigate={(next, passingStudentsData) => {
            setSelectedStudent(passingStudentsData);
            if (certificateComponents[next]) setCertificatePopup(next);
          }}
        />

       {certificatePopup && (
  <div
    style={styles.popupOverlay}
    onClick={() => setCertificatePopup(null)}   // ✅ Close when clicking outside
  >
    <div
      style={styles.popupContent}
      onClick={(e) => e.stopPropagation()}       // ❗ Prevent closing when clicking inside
    >
      <button
        onClick={() => setCertificatePopup(null)}
        style={styles.closeButton}
      >
        ✖
      </button>

      {(() => {
        const SelectedCertificate = certificateComponents[certificatePopup];
        return SelectedCertificate ? (
          <SelectedCertificate userData={selectedStudent} />
        ) : null;
      })()}
    </div>
  </div>
)}

      </div>
    </div>
  );
};

export default Certificates;
