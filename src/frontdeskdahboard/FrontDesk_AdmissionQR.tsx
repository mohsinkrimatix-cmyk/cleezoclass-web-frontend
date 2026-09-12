import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./FrontDesk_Admission.css";
import "../STYLES/solidbutton.css";
import ErrorPopup from "../shared/ErrorPopup";
import cameraIcon from "../assets/camera.png";

interface LeadFormData {
  student_name: string;
  full_name: string;
  occupation: string;
  mobile_number: string;
  email_id: string;
  address: string;
  dob: string;
  lead_admission_for: string;
  interest_status: string;
  entry_type: "manual" | "automatic";
  refer_by: string;
}

const getCampaignStaffOptionLabel = (item: any) =>
  String(
    item?.teacher_name ??
      item?.name ??
      item?.full_name ??
      item?.assigned_teacher_name ??
      item?.refer_by ??
      ""
  ).trim();

const FrontDeskAdmissionQR: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const qrSchoolCodeRaw = String(params.get("schoolCode") || "").trim();
  const qrSchoolCode =
    qrSchoolCodeRaw &&
    qrSchoolCodeRaw.toLowerCase() !== "null" &&
    qrSchoolCodeRaw.toLowerCase() !== "undefined"
      ? qrSchoolCodeRaw
      : "";

  const [formData, setFormData] = useState<LeadFormData>({
    student_name: "",
    full_name: "",
    occupation: "",
    mobile_number: "",
    email_id: "",
    address: "",
    dob: "",
    lead_admission_for: "",
    interest_status: "",
    entry_type: "manual",
    refer_by: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [referByOptions, setReferByOptions] = useState<string[]>([]);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  const interestStatusOptions = [
    "Interested",
    "Not Interested",
    "Partially Interested",
  ];

  useEffect(() => {
    if (!qrSchoolCode) return;
    localStorage.setItem("schoolCode", qrSchoolCode);
  }, [qrSchoolCode]);

  useEffect(() => {
    const schoolCode = getValidSchoolCode();
    if (!schoolCode) return;

    let isMounted = true;

    const loadReferByOptions = async () => {
      try {
        const [usersRes, campaignStaffRes] = await Promise.all([
          fetch("https://cleezoclass.com:4000/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              schoolCode,
              user_type: "teacher",
            }),
          }),
          fetch(
            `https://cleezoclass.com:4000/api/lead-staff?schoolCode=${encodeURIComponent(schoolCode)}`
          ),
        ]);

        const usersData = await usersRes.json();
        const campaignStaffData = await campaignStaffRes.json();
        const combinedStaff = [
          ...(Array.isArray(usersData) ? usersData : []),
          ...(Array.isArray(campaignStaffData)
            ? campaignStaffData
            : Array.isArray(campaignStaffData?.leads)
              ? campaignStaffData.leads
              : Array.isArray(campaignStaffData?.data)
                ? campaignStaffData.data
                : []),
        ];

        const options = Array.from(
          new Set(
            combinedStaff.map((item: any) => getCampaignStaffOptionLabel(item)).filter(Boolean)
          )
        ).sort((a, b) => a.localeCompare(b));

        if (isMounted) {
          setReferByOptions(options);
        }
      } catch (error) {
        console.error("Failed to load refer by options:", error);
        if (isMounted) {
          setReferByOptions([]);
        }
      }
    };

    loadReferByOptions();

    return () => {
      isMounted = false;
    };
  }, [qrSchoolCode]);

  const getValidSchoolCode = () => {
    const raw = String(localStorage.getItem("schoolCode") || "").trim();
    if (!raw) return "";
    const lowered = raw.toLowerCase();
    if (lowered === "null" || lowered === "undefined") return "";
    return raw;
  };

  const normalizeComparableText = (value: unknown) =>
    String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();

  const normalizeComparableDate = (value: unknown) =>
    String(value ?? "").trim().slice(0, 10);

  const normalizeComparableMobile = (value: unknown) => {
    const cleaned = String(value ?? "").replace(/\D/g, "");
    if (!cleaned) return "";
    if (cleaned.length === 12 && cleaned.startsWith("91")) return cleaned.slice(-10);
    if (cleaned.length === 11 && cleaned.startsWith("0")) return cleaned.slice(-10);
    if (cleaned.length > 10) return cleaned.slice(-10);
    return cleaned;
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "mobile_number") {
      formattedValue = value.replace(/\D/g, "").slice(0, 10);
    } else if (
      ["full_name", "student_name", "occupation"].includes(name)
    ) {
      const onlyLetters = value.replace(/[^a-zA-Z ]/g, "");
      formattedValue = onlyLetters.replace(/\b\w+/g, (word) => {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      });
    } else if (name === "email_id") {
      formattedValue = value.slice(0, 100);
    } else if (name === "address") {
      formattedValue = value
        .split(" ")
        .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
        .join(" ");
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const isDuplicateLead = async (schoolCode: string) => {
    const res = await fetch("https://cleezoclass.com:4000/api/check-duplicate-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolCode,
        ...formData,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Unable to check duplicate lead");
    }

    return data;
  };

  const submitLead = async (allowDuplicate = false) => {
    const schoolCode = getValidSchoolCode();
    if (!schoolCode) {
      setPopupMessage("School Code is missing. Please login again.");
      setShowPopup(true);
      return;
    }

    const dataToSend = new FormData();
    dataToSend.append("schoolCode", schoolCode);
    (Object.keys(formData) as Array<keyof LeadFormData>).forEach((key) => {
      dataToSend.append(key, formData[key]);
    });
    dataToSend.append("allow_duplicate", allowDuplicate ? "true" : "false");
    dataToSend.append("test_type", "");
    dataToSend.append("test_date", "");
    dataToSend.append("counselling_required", "");
    dataToSend.append("counselling_date", "");
    dataToSend.append("counselling_time", "");

    if (photo) dataToSend.append("photo", photo);

    try {
      const res = await fetch("https://cleezoclass.com:4000/api/add-lead", {
        method: "POST",
        body: dataToSend,
      });

      const data = await res.json();
      if (res.status === 409 && data?.duplicate) {
        throw new Error(data.error || "You already have submitted this lead. Do you want to submit it again?");
      }
      if (!res.ok) throw new Error(data.error || "Lead submission failed");

      setPopupMessage("Lead submitted successfully!");
      setShowPopup(true);

      const posterUrl = `https://cleezoclass.com:4000/posters/school_poster_${data.reg_no}.png`;
      const loginLink = `https://cleezoclass.com/CRM/ParentAdmissionLogin?schoolCode=${encodeURIComponent(
        schoolCode
      )}`;
      const message = `Hi ${data.full_name}! 🎉\nYour child registration is successful.\n\nReg No: ${data.reg_no}\nTicket No: ${data.ticket_no}\n\n🔐 Parent Login: ${loginLink}\n🖼️ Download your registration poster: ${posterUrl}`;

      if (data.email_id) {
        try {
          const schedule = [];
          const now = new Date();
          const immediateTime = new Date(now.getTime() + 60 * 1000);
          const immediateTimeStr = immediateTime.toTimeString().split(" ")[0];

          schedule.push({
            leadId: data.id,
            leadName: data.full_name,
            phone: data.mobile_number,
            email: data.email_id,
            date: now.toISOString().split("T")[0],
            time: immediateTimeStr,
            channels: ["Mail"],
            message,
            schoolCode,
          });

          const startDate = new Date();
          startDate.setDate(startDate.getDate() + 1);
          startDate.setHours(10, 0, 0, 0);

          for (let i = 0; i < 29; i++) {
            const sendDate = new Date(startDate);
            sendDate.setDate(startDate.getDate() + i);

            schedule.push({
              leadId: data.id,
              leadName: data.full_name,
              phone: data.mobile_number,
              email: data.email_id,
              date: sendDate.toISOString().split("T")[0],
              time: "10:00:00",
              channels: ["Mail"],
              message,
              schoolCode,
            });
          }

          await fetch("https://cleezoclass.com:4000/api/schedule-messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ schedule, schoolCode }),
          });
        } catch (err) {
          console.error("Failed to schedule QR lead emails:", err);
        }
      }

      setFormData({
        student_name: "",
        full_name: "",
        occupation: "",
        mobile_number: "",
        email_id: "",
        address: "",
        dob: "",
        lead_admission_for: "",
        interest_status: "",
        entry_type: "manual",
        refer_by: "",
      });
      setPhoto(null);
      setPhotoPreview(null);
    } catch (err: any) {
      setPopupMessage(err.message || "Lead submission failed");
      setShowPopup(true);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const schoolCode = getValidSchoolCode();

    if (!schoolCode) {
      setPopupMessage("School Code is missing. Please login again.");
      setShowPopup(true);
      return;
    }

    try {
      const duplicateResult = await isDuplicateLead(schoolCode);
      if (duplicateResult?.duplicate) {
        setShowDuplicateConfirm(true);
        return;
      }

      await submitLead();
    } catch (err: any) {
      setPopupMessage(err.message || "Unable to verify duplicate lead");
      setShowPopup(true);
    }
  };

  const handleDuplicateConfirm = async () => {
    setShowDuplicateConfirm(false);
    await submitLead(true);
  };

  return (
    <div className="container qr-admission-page">
      <div className="mainGrid">
        <div className="processHeading">Admission Details</div>
        <form onSubmit={handleSubmit}>
          <div className="sectionContainer1">
            <div className="sectionTitle">Lead Details</div>
            <div className="formWrapper">
              <div className="formColumn">
                <div className="formRow">
                  <div className="inputGroup">
                    <label className="label">Parent Full Name *</label>
                    <input
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      className="input btn-dropdown-FeesManagement"
                    />
                  </div>
                  <div className="inputGroup">
                    <label className="label">Occupation</label>
                    <input
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleChange}
                      placeholder="Enter occupation (optional)"
                      className="input btn-dropdown-FeesManagement"
                    />
                  </div>
                </div>

                <div className="formRow">
                  <div className="inputGroup">
                    <label className="label">Mobile Number *</label>
                    <input
                      name="mobile_number"
                      value={formData.mobile_number}
                      onChange={handleChange}
                      placeholder="Mobile number"
                      className="input btn-dropdown-FeesManagement"
                    />
                  </div>
                  <div className="inputGroup">
                    <label className="label">Email Id</label>
                    <input
                      name="email_id"
                      value={formData.email_id}
                      onChange={handleChange}
                      placeholder="Email address (optional)"
                      className="input btn-dropdown-FeesManagement"
                    />
                  </div>
                </div>

                <div className="formRow addressField">
                  <div className="inputGroup">
                    <label className="label">Address</label>
                    <input
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter address (optional)"
                      className="input btn-dropdown-FeesManagement"
                    />
                  </div>
                </div>

                <div className="formRow">
                  <div className="inputGroup">
                    <label className="label">Student Name *</label>
                    <input
                      name="student_name"
                      value={formData.student_name}
                      onChange={handleChange}
                      placeholder="Student name"
                      className="input btn-dropdown-FeesManagement"
                    />
                  </div>
                  <div className="inputGroup">
                    <label className="label">Admission *</label>
                    <input
                      name="lead_admission_for"
                      value={formData.lead_admission_for}
                      onChange={handleChange}
                      placeholder="Lead Admission For"
                      className="input btn-dropdown-FeesManagement"
                    />
                  </div>
                </div>

                <div className="formRow">
                  <div className="inputGroup">
                    <label className="label">Date Of Birth (DOB) *</label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      className="input btn-dropdown-FeesManagement"
                    />
                  </div>
                  <div className="inputGroup">
                    <label className="label">Interest Status</label>
                    <select
                      name="interest_status"
                      value={formData.interest_status}
                      onChange={handleChange}
                      className="input btn-dropdown-FeesManagement"
                    >
                      <option value="">Select Interest Status</option>
                      {interestStatusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="formRow">
                  <div className="inputGroup">
                    <label className="label">Refer By</label>
                    <select
                      name="refer_by"
                      value={formData.refer_by}
                      onChange={handleChange}
                      className="input btn-dropdown-FeesManagement"
                    >
                      <option value="">Select Campaign User</option>
                      {referByOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="formRow">
               
                  <button type="submit" className="registerBtn">
                    Register
                  </button>
                </div>
              </div>

              <div className="cameraColumn">
                <div
                  className="photoUploadWrapper"
                  onClick={() => document.getElementById("photoInput")?.click()}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" />
                  ) : (
                    <img src={cameraIcon} alt="Camera" className="cameraIcon" />
                  )}
                  <input
                    id="photoInput"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handlePhotoChange}
                  />
                  <label className="labelSmall">Student&apos;s photo</label>
                </div>
              </div>
            </div>
          </div>
        </form>
        {showDuplicateConfirm && (
          <div className="overlayStyle">
            <div className="popupStyle qr-confirm-popup">
              <div className="sectionTitle" style={{ paddingLeft: 0, marginBottom: 12 }}>
                Duplicate Lead
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: "#333" }}>
                You already have submitted this lead.
                <br />
                Do you want to submit it again?
              </div>
              <div className="qr-confirm-actions">
                <button
                  type="button"
                  className="qr-confirm-btn qr-confirm-cancel"
                  onClick={() => setShowDuplicateConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="qr-confirm-btn qr-confirm-submit"
                  onClick={handleDuplicateConfirm}
                >
                  Submit Again
                </button>
              </div>
            </div>
          </div>
        )}
        <ErrorPopup
          message={showPopup ? popupMessage : ""}
          onClose={() => {
            setShowPopup(false);
            setPopupMessage("");
          }}
        />
      </div>
    </div>
  );
};

export default FrontDeskAdmissionQR;