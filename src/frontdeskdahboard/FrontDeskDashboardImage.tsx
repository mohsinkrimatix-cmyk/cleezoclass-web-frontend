import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout.jsx";
import homeIcon from "../assets/Dashboard.png";
import usersIcon from "../assets/Staff Assign.png";
import chartIcon from "../assets/Lead Profile.png";
import CommunicationIcon from "../assets/Communication Assign.png";
import settingsIcon from "../assets/Enrollment.png";
import reportSideIcon from "../assets/Reports .png";
import abcLogo from "../assets/logoab.png";

type ImageTemplateType =
  | "image"
  | "image+writeup"
  | "image+writeup+button";

const STORAGE_PREFIX = "frontdesk-dashboard-gallery-templates";

type TemplateButton = {
  id: string;
  label: string;
  url: string;
};

const FrontDeskDashboardImage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<ImageTemplateType | "">("");
  const [statusMessage, setStatusMessage] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedImageDataUrl, setUploadedImageDataUrl] = useState("");
  const [writeupText, setWriteupText] = useState("");
  const [buttonLabelInput, setButtonLabelInput] = useState("");
  const [buttonUrlInput, setButtonUrlInput] = useState("");
  const [buttons, setButtons] = useState<TemplateButton[]>([]);

  const schoolCode = localStorage.getItem("schoolCode") || "default";
  const storageKey = `${STORAGE_PREFIX}:${schoolCode}`;

  const templateOptions: Array<{ key: ImageTemplateType; label: string; note: string }> = [
    { key: "image", label: "Image", note: "Only image poster" },
    { key: "image+writeup", label: "Image + Writeup", note: "Image with text writeup" },
    {
      key: "image+writeup+button",
      label: "Image + Writeup + Button",
      note: "Image with writeup and button",
    },
  ];

  const previewUrl = useMemo(() => uploadedImageDataUrl || "", [uploadedImageDataUrl]);

  const resetContentFields = () => {
    setUploadedFileName("");
    setUploadedImageDataUrl("");
    setWriteupText("");
    setButtonLabelInput("");
    setButtonUrlInput("");
    setButtons([]);
  };

  const onImageSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatusMessage("Please upload image file only.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setUploadedImageDataUrl(result);
      setUploadedFileName(file.name);
      setStatusMessage("");
    };
    reader.readAsDataURL(file);
  };

  const addButton = () => {
    const label = buttonLabelInput.trim();
    const url = buttonUrlInput.trim();
    if (!label) {
      setStatusMessage("Enter button label.");
      return;
    }
    const newButton: TemplateButton = {
      id: `btn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label,
      url,
    };
    setButtons((prev) => [...prev, newButton]);
    setButtonLabelInput("");
    setButtonUrlInput("");
    setStatusMessage("");
  };

  const removeButton = (id: string) => {
    setButtons((prev) => prev.filter((btn) => btn.id !== id));
  };

  const saveTemplate = () => {
    if (!selectedTemplate) {
      setStatusMessage("Please select one option first.");
      return;
    }
    if (!uploadedImageDataUrl) {
      setStatusMessage("Please upload image.");
      return;
    }
    if (selectedTemplate !== "image" && !writeupText.trim()) {
      setStatusMessage("Please enter writeup.");
      return;
    }
    if (selectedTemplate === "image+writeup+button" && buttons.length === 0) {
      setStatusMessage("Please add at least one button.");
      return;
    }

    const id = `fd-template-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nowIso = new Date().toISOString();
    const nextItem = {
      id,
      photoId: id,
      file_name: uploadedFileName || `${selectedTemplate}.png`,
      file_path: uploadedImageDataUrl,
      gallery_scope: "both",
      scope: "both",
      isDashboardTemplate: true,
      templateType: selectedTemplate,
      writeup: writeupText.trim(),
      buttons,
      lead_name: "FrontDesk Dashboard Template",
      created_at: nowIso,
    };

    const existingRaw = localStorage.getItem(storageKey);
    let existing: any[] = [];
    try {
      const parsed = existingRaw ? JSON.parse(existingRaw) : [];
      existing = Array.isArray(parsed) ? parsed : [];
    } catch {
      existing = [];
    }

    const updated = [nextItem, ...existing].slice(0, 100);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    resetContentFields();
    setStatusMessage(
      "Saved. This is now available in FrontDeskCampaigning Communication Digital Gallery and Communication Staff Gallery."
    );
  };

  const sidebarItems = [
    {
      key: "home",
      label: "Home",
      icon: homeIcon,
      iconAlt: "home",
      active: false,
      onClick: () => navigate("/FrontDeskDashboard"),
    },
    {
      key: "users",
      label: "Campaigning",
      icon: usersIcon,
      iconAlt: "users",
      active: false,
      onClick: () => navigate("/FrontDeskCampaigning"),
    },
    {
      key: "analytics",
      label: "Admissions",
      icon: chartIcon,
      iconAlt: "chart",
      active: false,
      onClick: () => navigate("/FrontDeskDashboard"),
    },
    {
      key: "staff",
      label: "Communication",
      icon: CommunicationIcon,
      iconAlt: "staff",
      active: false,
      onClick: () => navigate("/FrontDeskDashboard"),
    },
    {
      key: "settings",
      label: "Enrollments",
      icon: settingsIcon,
      iconAlt: "settings",
      active: false,
      onClick: () => navigate("/FrontDeskDashboard"),
    },
    {
      key: "reports",
      label: "Reports",
      icon: reportSideIcon,
      iconAlt: "reports",
      active: false,
      onClick: () => navigate("/FrontDeskReport"),
    },
  ];

  const topbarTabs = [
    { key: "dashboard", label: "Dashboard", active: false, onClick: () => navigate("/FrontDeskDashboard") },
    { key: "campaigning", label: "Campaigning", active: false, onClick: () => navigate("/FrontDeskCampaigning") },
    { key: "admissions", label: "Admissions", active: false, onClick: () => navigate("/FrontDeskDashboard") },
    { key: "reports", label: "Reports", active: false, onClick: () => navigate("/FrontDeskReport") },
    { key: "images", label: "Images", active: true, onClick: () => navigate("/FrontDeskDashboardImage") },
  ];

  return (
    <DashboardLayout
      pageClassName="frontdesk-dashboard-page accountant-dashboard-page accountant-dashboard-home-page dashboard-home-page"
      lockViewport={false}
      sidebarItems={sidebarItems}
      topbarTabs={topbarTabs}
      footerLogoSrc={abcLogo}
      footerLogoAlt="Cleezo Class"
    >
      <div
        style={{
          height: "100%",
          overflowY: "auto",
          overflowX: "hidden",
          padding: 20,
        }}
      >
        <div className="accountant-card" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>FrontDesk Dashboard Images</h3>
          <p style={{ marginTop: 8, color: "#475569" }}>
            Step 1: Select one choice. Step 2: Click Go. Step 3: It gets saved and appears in both Campaigning galleries.
          </p>

          <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
            {templateOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  setSelectedTemplate(option.key);
                  resetContentFields();
                  setStatusMessage("");
                }}
                className={selectedTemplate === option.key ? "btn-solid" : "btn-solid1"}
                style={{ textAlign: "left" }}
              >
                <strong>{option.label}</strong> - {option.note}
              </button>
            ))}
          </div>

          {previewUrl ? (
            <div style={{ marginTop: 16 }}>
              <img
                src={previewUrl}
                alt="Selected template preview"
                style={{ width: "100%", maxWidth: 620, borderRadius: 12, border: "1px solid #cbd5e1" }}
              />
              {selectedTemplate !== "image" && writeupText.trim() ? (
                <p style={{ marginTop: 10, color: "#1e293b", maxWidth: 620 }}>{writeupText}</p>
              ) : null}
              {selectedTemplate === "image+writeup+button" && buttons.length > 0 ? (
                <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {buttons.map((btn) => (
                    <span
                      key={btn.id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "6px 12px",
                        borderRadius: 8,
                        background: "#f59e0b",
                        color: "#111827",
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      {btn.label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {selectedTemplate ? (
            <div style={{ marginTop: 16, display: "grid", gap: 12, maxWidth: 640 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  Upload Image
                </label>
                <input type="file" accept="image/*" onChange={onImageSelected} />
              </div>

              {selectedTemplate !== "image" ? (
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                    Writeup
                  </label>
                  <textarea
                    rows={4}
                    value={writeupText}
                    onChange={(e) => setWriteupText(e.target.value)}
                    placeholder="Enter writeup"
                    style={{ width: "100%", borderRadius: 8, border: "1px solid #cbd5e1", padding: 10 }}
                  />
                </div>
              ) : null}

              {selectedTemplate === "image+writeup+button" ? (
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                    Buttons
                  </label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <input
                      type="text"
                      value={buttonLabelInput}
                      onChange={(e) => setButtonLabelInput(e.target.value)}
                      placeholder="Button label"
                      style={{ flex: "1 1 180px", borderRadius: 8, border: "1px solid #cbd5e1", padding: 10 }}
                    />
                    <input
                      type="text"
                      value={buttonUrlInput}
                      onChange={(e) => setButtonUrlInput(e.target.value)}
                      placeholder="Button URL (optional)"
                      style={{ flex: "1 1 220px", borderRadius: 8, border: "1px solid #cbd5e1", padding: 10 }}
                    />
                    <button type="button" className="btn-solid1" onClick={addButton}>
                      Add Button
                    </button>
                  </div>
                  {buttons.length > 0 ? (
                    <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                      {buttons.map((btn) => (
                        <div
                          key={btn.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            border: "1px solid #e2e8f0",
                            borderRadius: 8,
                            padding: "8px 10px",
                            background: "#f8fafc",
                          }}
                        >
                          <span style={{ fontSize: 13 }}>
                            {btn.label}
                            {btn.url ? ` (${btn.url})` : ""}
                          </span>
                          <button
                            type="button"
                            className="btn-solid1"
                            style={{ margin: 0 }}
                            onClick={() => removeButton(btn.id)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <div style={{ marginTop: 16 }}>
            <button type="button" className="btn-solid" onClick={saveTemplate}>
              Go
            </button>
          </div>

          {statusMessage ? (
            <p style={{ marginTop: 12, color: "#0f766e", fontWeight: 600 }}>{statusMessage}</p>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FrontDeskDashboardImage;