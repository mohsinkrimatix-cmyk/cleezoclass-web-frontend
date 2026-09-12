import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaPlus, FaUser } from "react-icons/fa";

import "./AccountantDashboardnew.css";
import "../frontdeskdahboard/FrontDesk.css";
import "./AdminEventsAndMeetings.css";
import "./AdminStoreNew.css";
import EditableProfileMenu from "../shared/EditableProfileMenu.jsx";
import ErrorPopup from "../shared/ErrorPopup";
import InstituteBrand from "../shared/InstituteBrand.jsx";
import { resolveInstituteDisplayName } from "../shared/instituteNameUtils";
import { getUserDisplayName } from "../shared/userDisplayName";

import dashboardIcon from "../assets/Dashboard.png";
import academicsIcon from "../assets/Staff Assign.png";
import eventsIcon from "../assets/Lead Profile.png";
import enrollmentIcon from "../assets/Enrollment.png";
import reportsIcon from "../assets/Reports .png";
import timelineIcon from "../assets/Timeline.png";
import followupIcon from "../assets/Profile.png";
import assistantIcon from "../assets/Assistant.png";
import communicationIcon from "../assets/Communication Assign.png";
import axios from "axios";
import HelpCenter from "../shared/HelpCenter.jsx";
import { FiHelpCircle } from "react-icons/fi";


import TaskOfTheDay from "../shared/TaskOfTheDay.tsx";


























































const API_BASE = "https://cleezoclass.com:4000/api";

const sidebarItems = [
  { key: "dashboard", label: "Dashboard", icon: dashboardIcon, route: "/AdminDashboard" },
  { key: "academics", label: "Academics", icon: academicsIcon, route: "/AdiminAcademicsNew" },
  { key: "events", label: "Events & Meetings", icon: eventsIcon, route: "/AdminEventsAndMeetings" },
  { key: "communication", label: "Generations", icon: communicationIcon, route: "/AdminGenerations" },
  { key: "store", label: "Store", icon: enrollmentIcon, route: "/AdminStoreNew" },
  { key: "report", label: "Report", icon: reportsIcon, route: "/AdminReportsPage" },
];

const quickCards = [
  { key: "livechat", title: "Live Chat", subtitle: "Approvals / Requests", icon: timelineIcon },
  { key: "storepo", title: "Store PO", subtitle: "Request Order / PO issue", icon: followupIcon },
  { key: "assistant", title: "Assistant", subtitle: "Daily Activity check", icon: assistantIcon },
];

const reminderItems = [
  "Reminder - 30/03/2026 - Class XA, Performance report issue",
  "Reminder - 30/03/2026 - Store, Request Order for Uniform",
];

const formatDateLabel = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const normalizeInstituteLogo = (rawLogo) => {
  if (!rawLogo) return "";

  let logo = rawLogo;

  if (typeof logo === "object" && logo?.type === "Buffer" && Array.isArray(logo?.data)) {
    try {
      logo = new Uint8Array(logo.data);
    } catch {
      return "";
    }
  }

  if (logo instanceof Uint8Array) {
    const binary = Array.from(logo, (byte) => String.fromCharCode(byte)).join("");
    return `data:image/png;base64,${btoa(binary)}`;
  }

  if (typeof logo !== "string") return "";
  logo = logo.trim();
  if (!logo) return "";
  if (logo.startsWith("data:image")) return logo;
  if (logo.startsWith("http")) return logo;

  if (logo.startsWith("0x")) {
    try {
      const hex = logo.slice(2);
      let binary = "";
      for (let i = 0; i < hex.length; i += 2) {
        binary += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
      }
      return `data:image/png;base64,${btoa(binary)}`;
    } catch {
      return "";
    }
  }

  if (logo.startsWith("uploads/")) {
    return `https://cleezoclass.com:4000/${logo}`;
  }
  if (logo.startsWith("/uploads/")) {
    return `https://cleezoclass.com:4000${logo}`;
  }

  if (/^[A-Za-z0-9+/=]+$/.test(logo) && logo.length > 100) {
    return `data:image/png;base64,${logo}`;
  }

  return "";
};

const AdminStoreNew = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const schoolCode = String(localStorage.getItem("schoolCode") || "").trim();
  const activeTopTab = useMemo(() => {
    const path = location.pathname;
    if (path === "/AdminDashboard") return "Dashboard";
    if (path === "/AdiminAcademicsNew") return "Academics";
    if (path === "/AdminEventsAndMeetings") return "Events & Meetings";
    return "";
  }, [location.pathname]);

  const [activeQuickPanel, setActiveQuickPanel] = useState("livechat");
  const [popupMessage, setPopupMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState("purchase");
  const [schoolName, setSchoolName] = useState("Unknown School");
  const [schoolLogo, setSchoolLogo] = useState("/default-logo.png");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [chatRequests, setChatRequests] = useState([]);
  const [storeActions, setStoreActions] = useState([]);
  const [assistantActions, setAssistantActions] = useState([]);
  const [popupType, setPopupType] = useState("");
  const [party1List, setParty1List] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [studentOptions, setStudentOptions] = useState([]);
          const [openHelpSection, setOpenHelpSection] = useState(null);
        const[isHelpOpen,setIsHelpOpen]=useState(false)
        const userRole = localStorage.getItem("userRole")
  const [liveChatForm, setLiveChatForm] = useState({
    party1: "",
    className: "",
    section: "",
    student: "",
    date: new Date().toISOString().split("T")[0],
    time: "",
  });

  const [itemForm, setItemForm] = useState({
    categoryType: "Books / Other",
    title: "",
    units: "0",
    pricePerUnit: "0",
    shortageReminder: "",
  });

  const [vendorForm, setVendorForm] = useState({
    company: "",
    address: "",
    itemSupply: "",
    contactName: "",
    contactNumber: "",
  });

  const [orderForm, setOrderForm] = useState({
    itemType: "",
    itemTitle: "",
    quantity: "",
    vendorName: "",
    orderDate: new Date().toISOString().split("T")[0],
    status: "purchase",
  });

  const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result?.message || result?.error || "Request failed");
    }
    return result;
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("schoolCode");
    localStorage.removeItem("userRole");
    localStorage.removeItem("name");
    sessionStorage.clear();
    window.location.replace(import.meta.env.BASE_URL || "/");
  };

  const openLiveChatPopup = () => setPopupType("liveChat");
  const closePopup = () => setPopupType("");

  const loadSchoolProfile = async () => {
    if (!schoolCode) return;
    try {
      const response = await fetch(`https://cleezoclass.com:4000/api/institute?dbName=${schoolCode}`);
      const data = await response.json();
      const resolvedSchoolName = resolveInstituteDisplayName({
        apiInstituteName: data?.institute_name || data?.instituteName || data?.school_name || data?.name || data?.schoolName,
        storedSchoolName: localStorage.getItem("schoolName"),
        storedInstituteName: localStorage.getItem("instituteName"),
        schoolCode,
        fallback: "Unknown School",
      });
      const normalizedLogo = normalizeInstituteLogo(data?.logo);
      setSchoolName(resolvedSchoolName || "Unknown School");
      setSchoolLogo(normalizedLogo || "/default-logo.png");
      localStorage.setItem("schoolName", resolvedSchoolName);
      localStorage.setItem("instituteName", resolvedSchoolName);
    } catch {
      const fallbackSchoolName = resolveInstituteDisplayName({
        storedSchoolName: localStorage.getItem("schoolName"),
        storedInstituteName: localStorage.getItem("instituteName"),
        schoolCode,
        fallback: "Unknown School",
      });
      setSchoolName(fallbackSchoolName);
      localStorage.setItem("schoolName", fallbackSchoolName);
      localStorage.setItem("instituteName", fallbackSchoolName);
      setSchoolLogo("/default-logo.png");
    }
  };

  const loadDashboard = async () => {
    if (!schoolCode) {
      setPopupMessage("Missing school code. Please login again.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetchJson(`${API_BASE}/admin-store/dashboard?schoolCode=${encodeURIComponent(schoolCode)}`);
      const data = response?.data || {};
      setItems(Array.isArray(data.items) ? data.items : []);
      setVendors(Array.isArray(data.vendors) ? data.vendors : []);
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setChatRequests(Array.isArray(data.chatRequests) ? data.chatRequests : []);
      setStoreActions(Array.isArray(data.storeActions) ? data.storeActions : []);
      setAssistantActions(Array.isArray(data.assistantActions) ? data.assistantActions : []);
    } catch (error) {
      setPopupMessage(error.message || "Failed to load store dashboard data.");
      setItems([]);
      setVendors([]);
      setOrders([]);
      setChatRequests([]);
      setStoreActions([]);
      setAssistantActions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchoolProfile();
    loadDashboard();
  }, [schoolCode]);

  useEffect(() => {
    if (!schoolCode) return;

    const loadLiveChatMeta = async () => {
      try {
        const [{ data: staffData }, { data: classData }] = await Promise.all([
          fetchJson(`${API_BASE}/party1?schoolCode=${encodeURIComponent(schoolCode)}`),
          fetchJson(`${API_BASE}/classes?schoolCode=${encodeURIComponent(schoolCode)}`),
        ]);

        setParty1List(Array.isArray(staffData) ? staffData : Array.isArray(staffData?.data) ? staffData.data : []);
        setClassOptions(Array.isArray(classData) ? classData : Array.isArray(classData?.data) ? classData.data : []);
      } catch (error) {
        console.error("Failed to load live chat meta", error);
      }
    };

    loadLiveChatMeta();
  }, [schoolCode]);

  useEffect(() => {
    if (!schoolCode || !liveChatForm.className) {
      setSectionOptions([]);
      setStudentOptions([]);
      return;
    }

    fetchJson(`${API_BASE}/sections/${encodeURIComponent(liveChatForm.className)}?schoolCode=${encodeURIComponent(schoolCode)}`)
      .then((data) => {
        const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        setSectionOptions(list);
        setLiveChatForm((prev) => ({ ...prev, section: "", student: "" }));
      })
      .catch((error) => {
        console.error("Failed to load sections", error);
        setSectionOptions([]);
      });
  }, [schoolCode, liveChatForm.className]);

  useEffect(() => {
    if (!schoolCode || !liveChatForm.className || !liveChatForm.section) {
      setStudentOptions([]);
      return;
    }

    fetchJson(
      `${API_BASE}/admin/students/${encodeURIComponent(liveChatForm.className)}/${encodeURIComponent(liveChatForm.section)}?schoolCode=${encodeURIComponent(schoolCode)}`
    )
      .then((data) => {
        const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        setStudentOptions(list);
        setLiveChatForm((prev) => ({ ...prev, student: "" }));
      })
      .catch((error) => {
        console.error("Failed to load students", error);
        setStudentOptions([]);
      });
  }, [schoolCode, liveChatForm.className, liveChatForm.section]);

  const handleCreateLiveChatRequest = async () => {
    const { party1, className, section, student, date, time } = liveChatForm;
    if (!party1 || !className || !section || !student) {
      setPopupMessage("Staff, class, section, and student are required.");
      return;
    }

    const party1Obj = party1List.find((item) => item.name === party1);
    if (!party1Obj) {
      setPopupMessage("Please select a valid staff member.");
      return;
    }

    try {
      const data = await fetchJson(`${API_BASE}/chat-request`, {
        method: "POST",
        body: JSON.stringify({
          party1_id: party1Obj.id,
          party1_name: party1Obj.name,
          party2_class: className,
          party2_section: section,
          party2_student: student,
          date,
          time,
          schoolCode,
        }),
      });

      if (!data?.success) {
        throw new Error(data?.message || "Failed to save chat request.");
      }

      setPopupMessage("Individual chat request has been successfully saved.");
      setLiveChatForm({
        party1: "",
        className,
        section,
        student: "",
        date: new Date().toISOString().split("T")[0],
        time: "",
      });
      closePopup();
      await loadDashboard();
    } catch (error) {
      console.error("Failed to save chat request", error);
      setPopupMessage(error.message || "Failed to save chat request.");
    }
  };

  const filteredOrders = useMemo(
    () =>
      orders.filter((item) => {
        const status = String(item?.status || "").toLowerCase();
        return status === orderFilter;
      }),
    [orders, orderFilter]
  );

  const requestItems = useMemo(
    () =>
      chatRequests.filter((item) => {
        const status = String(item?.status || item?.approval_status || "pending").toLowerCase();
        return status === "pending" || status === "requested" || status === "awaiting";
      }),
    [chatRequests]
  );

  const scheduledItems = useMemo(
    () =>
      chatRequests.filter((item) => {
        const status = String(item?.status || item?.approval_status || "").toLowerCase();
        return status === "approved" || status === "scheduled" || status === "fixed";
      }),
    [chatRequests]
  );

  const handleCreateItem = async () => {
    if (!itemForm.title.trim()) {
      setPopupMessage("Item title is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await fetchJson(`${API_BASE}/admin-store/items`, {
        method: "POST",
        body: JSON.stringify({ schoolCode, ...itemForm }),
      });
      setItemForm((prev) => ({ ...prev, title: "", shortageReminder: "" }));
      await loadDashboard();
      setPopupMessage("Item created successfully.");
    } catch (error) {
      setPopupMessage(error.message || "Failed to create item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateVendor = async () => {
    if (!vendorForm.company.trim()) {
      setPopupMessage("Vendor company name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await fetchJson(`${API_BASE}/admin-store/vendors`, {
        method: "POST",
        body: JSON.stringify({ schoolCode, ...vendorForm }),
      });
      setVendorForm({ company: "", address: "", itemSupply: "", contactName: "", contactNumber: "" });
      await loadDashboard();
      setPopupMessage("Vendor created successfully.");
    } catch (error) {
      setPopupMessage(error.message || "Failed to create vendor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!orderForm.itemType.trim() || !orderForm.itemTitle.trim() || !orderForm.quantity) {
      setPopupMessage("Item type, title, and quantity are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await fetchJson(`${API_BASE}/admin-store/orders`, {
        method: "POST",
        body: JSON.stringify({ schoolCode, ...orderForm }),
      });
      setOrderForm((prev) => ({
        ...prev,
        itemType: "",
        itemTitle: "",
        quantity: "",
      }));
      await loadDashboard();
      setPopupMessage("Order created successfully.");
    } catch (error) {
      setPopupMessage(error.message || "Failed to create order.");
    } finally {
      setIsSubmitting(false);
    }
  };
   const [performance, setPerformance] = useState({});
  
      useEffect(() => {
          getOverallPerformance();
      }, []);
  
      const getOverallPerformance = async () => {
  
          try {
  
              const schoolCode = localStorage.getItem("schoolCode");
  
              const response = await axios.get(
                  "https://cleezoclass.com:4000/api/overall-performance-percentage",
                  {
                      params: {
                          schoolCode,
                      },
                  }
              );
  
              if (response.data.success) {
                  setPerformance(response.data.data);
              }
  
          } catch (error) {
              console.log(error);
          }
  
      };
      const percentage = Number(performance?.overallPercentage || 0);
  const progressAngle = `${percentage * 3.6}deg`;
  return (
    <div className="dashboard-page dashboard-home-page frontdesk-dashboard-page accountant-dashboard-page accountant-dashboard-home-page">
      <div className="dashboard-shell accountant-dashboard-shell">
        <aside className="dashboard-sidebar accountant-sidebar-strip">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`dashboard-sidebar-item accountant-sidebar-item ${item.key === "store" ? "dashboard-sidebar-item-active accountant-sidebar-item-active" : ""}`}
              onClick={() => navigate(item.route)}
            >
              <div className="dashboard-sidebar-item-icon accountant-sidebar-item-icon">
                <img src={item.icon} alt={item.label} />
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        <div className="dashboard-main accountant-main-area">
          <div className="dashboard-topbar accountant-topbar">
            <div className="dashboard-topbar-left accountant-topbar-left">
              {["Dashboard", "Academics", "Events & Meetings","Reports"].map((tab) => (
                <div
                  key={tab}
                  className={`dashboard-topbar-tab accountant-topbar-tab ${activeTopTab === tab ? "dashboard-topbar-tab-active accountant-topbar-tab-active" : ""}`}
                >
                  <button
                    className="accountant-topbar-tab-button"
                    type="button"
                    onClick={() => {
                      if (tab === "Dashboard") navigate("/AdminDashboard");
                      if (tab === "Academics") navigate("/AdiminAcademicsNew");
                      if (tab === "Events & Meetings") navigate("/AdminEventsAndMeetings");
                      if (tab === "Reports") navigate("/AdminReportsPage");
                    }}
                  >
                    {tab}
                  </button>
                </div>
              ))}
            </div>

            <div className="dashboard-topbar-center accountant-topbar-center">
              <InstituteBrand
                logoSrc={schoolLogo || "/default-logo.png"}
                logoAlt={schoolName || "School Logo"}
                instituteName={schoolName || "Unknown School"}
              />
            </div>

            <div className="dashboard-topbar-right accountant-topbar-right">
              {/* <button className="accountant-branch-btn" type="button" onClick={() => navigate("/HrDashboard")}>
                Switch to HR <span className="accountant-branch-caret">▼</span>
              </button> */}
                    <button
                   className="accountant-help-icon-btn"
                   onClick={() => setIsHelpOpen(true)}
                 >
                 <FiHelpCircle
                 style={{
                   color: "#e9818c",
                   fontSize: "34px"
                 }}
               />
                 </button>
              <EditableProfileMenu showHrSwitch />
            </div>
          </div>

          <div className="admin-events-content">
            <div className="admin-events-top">
              <div className="accountant-welcome-block">
                <h2>Hi, {getUserDisplayName()}!</h2>
                <p>Check Store Inventory,</p>
                <p>Report Track to Class Teacher</p>
                <p>Submit Building maintenance</p>
              </div>

      {/* OLD STATIC CARD */}
{/* NEW DYNAMIC CARD */}
<div className="admin-events-task accountant-card">
  <div className="taskCardContent">
    <TaskOfTheDay />
  </div>
</div>
              <div className="accountant-mini-cards">
                {quickCards.map((card) => (
                  <div
                    key={card.title}
                    className="accountant-quick-card accountant-card accountant-quick-card-clickable"
                    onClick={() => setActiveQuickPanel(card.key)}
                  >
                    <div className="">
                      <img src={card.icon} alt={card.title} />
                    </div>
                    <h4>{card.title}</h4>
                    <p>{card.subtitle}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-events-middle">
              <div className="accountant-card admin-store-manager-card">
                <div className="admin-events-card-header">
                  <h3>Item Manager</h3>
                  <button type="button" className="collect-filter" onClick={loadDashboard}>
                    <span>{isLoading ? "Loading" : "Refresh"}</span>
                    <span>▼</span>
                  </button>
                </div>
                <div className="admin-store-manager-grid">
                  <select className="admin-events-input" value={itemForm.categoryType} onChange={(e) => setItemForm((prev) => ({ ...prev, categoryType: e.target.value }))}>
                    <option value="Books / Other">Books / Other</option>
                    <option value="Uniform">Uniform</option>
                    <option value="Stationery">Stationery</option>
                    <option value="Sports">Sports</option>
                  </select>
                  <input className="admin-events-input" placeholder="Title" value={itemForm.title} onChange={(e) => setItemForm((prev) => ({ ...prev, title: e.target.value }))} />
                  <input className="admin-events-input" type="number" min="0" placeholder="Units" value={itemForm.units} onChange={(e) => setItemForm((prev) => ({ ...prev, units: e.target.value }))} />
                  <input className="admin-events-input" type="number" min="0" placeholder="Price Per Unit" value={itemForm.pricePerUnit} onChange={(e) => setItemForm((prev) => ({ ...prev, pricePerUnit: e.target.value }))} />
                  <input className="admin-events-input" type="number" min="0" placeholder="Shortage Reminder" value={itemForm.shortageReminder} onChange={(e) => setItemForm((prev) => ({ ...prev, shortageReminder: e.target.value }))} />
                  <button type="button" className="admin-events-submit-btn admin-store-small-btn" onClick={handleCreateItem} disabled={isSubmitting}>
                    Create
                  </button>
                </div>
                <div className="admin-store-list-wrap">
                  <small>Items List</small>
                  {items.length === 0 ? (
                    <div className="admin-events-chat-item"><span>No items found.</span></div>
                  ) : (
                    items.slice(0, 5).map((item) => (
                      <div key={item.id} className="admin-events-chat-item">
                        <span>
                          {item.id} - {formatDateLabel(item.createdAt)}, {item.categoryType}, {item.title}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="accountant-card admin-store-manager-card">
                <div className="admin-events-card-header">
                  <h3>Vendor Manager</h3>
                </div>
                <div className="admin-store-manager-grid">
                  <input className="admin-events-input" placeholder="Company" value={vendorForm.company} onChange={(e) => setVendorForm((prev) => ({ ...prev, company: e.target.value }))} />
                  <input className="admin-events-input" placeholder="Address" value={vendorForm.address} onChange={(e) => setVendorForm((prev) => ({ ...prev, address: e.target.value }))} />
                  <input className="admin-events-input" placeholder="Item of Supply" value={vendorForm.itemSupply} onChange={(e) => setVendorForm((prev) => ({ ...prev, itemSupply: e.target.value }))} />
                  <input className="admin-events-input" placeholder="Contact Name" value={vendorForm.contactName} onChange={(e) => setVendorForm((prev) => ({ ...prev, contactName: e.target.value }))} />
                  <input className="admin-events-input" placeholder="Contact Number" value={vendorForm.contactNumber} onChange={(e) => setVendorForm((prev) => ({ ...prev, contactNumber: e.target.value }))} />
                  <button type="button" className="admin-events-submit-btn admin-store-small-btn" onClick={handleCreateVendor} disabled={isSubmitting}>
                    Create
                  </button>
                </div>
                <div className="admin-store-list-wrap">
                  <small>Vendor List</small>
                  {vendors.length === 0 ? (
                    <div className="admin-events-chat-item"><span>No vendors found.</span></div>
                  ) : (
                    vendors.slice(0, 5).map((item) => (
                      <div key={item.id} className="admin-events-chat-item">
                        <span>
                          V{item.id} - {formatDateLabel(item.createdAt)}, {item.company}, {item.itemSupply}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="admin-events-livechat accountant-card">
                <div className="admin-events-card-header">
                  <h3>{activeQuickPanel === "assistant" ? "Assistant Actions" : activeQuickPanel === "storepo" ? "Store PO" : "Live Chat"}</h3>
                  <div className="accountant-card-filters">
                    {activeQuickPanel === "livechat" ? (
                      <button type="button" className="admin-events-create-btn" onClick={openLiveChatPopup}>
                        + Create New
                      </button>
                    ) : null}
                    <div className="accountant-feetype-count">
                      <strong>
                        {activeQuickPanel === "assistant"
                          ? assistantActions.length
                          : activeQuickPanel === "storepo"
                            ? storeActions.length
                            : chatRequests.length}
                      </strong>
                      <span>{activeQuickPanel === "assistant" ? "Actions" : activeQuickPanel === "storepo" ? "Requests" : "Chats"}</span>
                    </div>
                  </div>
                </div>

                {activeQuickPanel === "assistant" ? (
                  <div className="admin-events-chat-section">
                    {assistantActions.length === 0 ? (
                      <div className="admin-events-chat-item"><span>No assistant actions available.</span></div>
                    ) : (
                      assistantActions.map((item, index) => (
                        <div key={`${item}-${index}`} className="admin-events-assistant-item">
                          <strong>Assistant</strong>
                          <span>{item}</span>
                        </div>
                      ))
                    )}
                  </div>
                ) : activeQuickPanel === "storepo" ? (
                  <div className="admin-events-chat-section">
                    <small>Requests PO</small>
                    {storeActions.length === 0 ? (
                      <div className="admin-events-chat-item"><span>No PO requests found.</span></div>
                    ) : (
                      storeActions.slice(0, 6).map((item, index) => (
                        <div key={item.id || index} className="admin-events-chat-item">
                          <span>{item.text || `${item.stockName || "Stock"}, ${item.quantity || 0} qty`}</span>
                          <div className="admin-events-chat-actions">
                            <button type="button">▷</button>
                            <button type="button">✕</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <>
                    <div className="admin-events-chat-section">
                      <small>Requests</small>
                      {requestItems.length === 0 ? (
                        <div className="admin-events-chat-item"><span>No requests found.</span></div>
                      ) : (
                        requestItems.slice(0, 3).map((item) => (
                          <div key={item.id} className="admin-events-chat-item">
                            <span>
                              Live Chat - {formatDateLabel(item.date)} - {item.party1_name || "Staff"} to {item.party2_student || "Student"}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="admin-events-chat-section">
                      <small>Scheduled</small>
                      {scheduledItems.length === 0 ? (
                        <div className="admin-events-chat-item"><span>No scheduled chats.</span></div>
                      ) : (
                        scheduledItems.slice(0, 3).map((item) => (
                          <div key={item.id} className="admin-events-chat-item">
                            <span>
                              Live Chat - {formatDateLabel(item.date)} - {item.party1_name || "Staff"} to {item.party2_student || "Student"}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="admin-events-bottom">
              <div className="admin-events-live-chat-panel accountant-card">
                <div className="admin-events-card-header">
                  <h3>Orders</h3>
                  <div className="admin-store-order-tabs">
                    {["purchase", "request", "cancelled"].map((tab) => (
                      <button key={tab} type="button" className={`admin-store-order-tab ${orderFilter === tab ? "active" : ""}`} onClick={() => setOrderFilter(tab)}>
                        {tab[0].toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin-store-order-grid">
                  <input className="admin-events-input" placeholder="Item Type" value={orderForm.itemType} onChange={(e) => setOrderForm((prev) => ({ ...prev, itemType: e.target.value }))} />
                  <input className="admin-events-input" placeholder="Item Title" value={orderForm.itemTitle} onChange={(e) => setOrderForm((prev) => ({ ...prev, itemTitle: e.target.value }))} />
                  <input className="admin-events-input" type="number" min="1" placeholder="Qty" value={orderForm.quantity} onChange={(e) => setOrderForm((prev) => ({ ...prev, quantity: e.target.value }))} />
                  <input className="admin-events-input" placeholder="Vendor" value={orderForm.vendorName} onChange={(e) => setOrderForm((prev) => ({ ...prev, vendorName: e.target.value }))} />
                  <input className="admin-events-input" type="date" value={orderForm.orderDate} onChange={(e) => setOrderForm((prev) => ({ ...prev, orderDate: e.target.value }))} />
                  <select className="admin-events-input" value={orderForm.status} onChange={(e) => setOrderForm((prev) => ({ ...prev, status: e.target.value }))}>
                    <option value="purchase">Purchase</option>
                    <option value="request">Request</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="admin-store-order-action-row">
                  <button type="button" className="admin-events-submit-btn admin-store-small-btn" onClick={handleCreateOrder} disabled={isSubmitting}>
                    Issue PO
                  </button>
                </div>

                <div className="admin-store-list-wrap">
                  {filteredOrders.length === 0 ? (
                    <div className="admin-events-chat-item"><span>No {orderFilter} orders found.</span></div>
                  ) : (
                    filteredOrders.slice(0, 7).map((item) => (
                      <div key={item.id} className="admin-events-chat-item">
                        <span>
                          PO{item.id} - {formatDateLabel(item.orderDate)} - {item.itemTitle} ({item.quantity})
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="admin-events-side-stack">
                <div className="admin-events-metrics">
                  <div className="admin-events-metric accountant-card">
<div
                      className="admin-events-ring"
                      style={{ "--admission-progress": progressAngle }}>
                      <span>{percentage}%</span>
                    </div>                    <h4>Performance</h4>
                    <span>Students Track</span>
                  </div>
                  <div className="admin-events-metric accountant-card">
                    <strong>{requestItems.length}</strong>
                    <small>req. / pending</small>
                    <h4>Live Chat</h4>
                    <span>Pending approvals</span>
                  </div>
                </div>

                <div className="admin-events-footer accountant-card">
                  <div className="admin-events-footer-item">
                    <strong>{items.length}</strong>
                    <span>Item Manager</span>
                    <small>Inventory</small>
                  </div>
                  <div className="admin-events-footer-item">
                    <strong>{vendors.length}</strong>
                    <span>Vendor Manager</span>
                    <small>Partners</small>
                  </div>
                  <div className="admin-events-footer-item">
                    <strong>{orders.length}</strong>
                    <span>Orders</span>
                    <small>Store PO</small>
                  </div>
                  <div className="admin-events-footer-item">
                    <strong>Complaints</strong>
                    <span>Store</span>
                    <small>Uniform</small>
                  </div>
                </div>
              </div>
            </div>
              </div>
            </div>
          </div>

      {popupType === "liveChat" && (
        <div className="admin-events-modal-overlay" onClick={closePopup}>
          <div className="admin-events-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-events-card-header">
              <h3>Individual Chat Request</h3>
              <button type="button" className="admin-events-modal-close" onClick={closePopup}>×</button>
            </div>
            <div className="admin-events-form-grid">
              <select
                className="admin-events-input"
                value={liveChatForm.party1}
                onChange={(e) => setLiveChatForm((prev) => ({ ...prev, party1: e.target.value }))}
              >
                <option value="">Party 1 Staff</option>
                {party1List.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name} ({item.user_type})
                  </option>
                ))}
              </select>
              <select
                className="admin-events-input"
                value={liveChatForm.className}
                onChange={(e) => setLiveChatForm((prev) => ({ ...prev, className: e.target.value }))}
              >
                <option value="">Class</option>
                {classOptions.map((item, index) => (
                  <option key={`${item}-${index}`} value={String(item)}>
                    {String(item)}
                  </option>
                ))}
              </select>
              <select
                className="admin-events-input"
                value={liveChatForm.section}
                onChange={(e) => setLiveChatForm((prev) => ({ ...prev, section: e.target.value }))}
                disabled={!liveChatForm.className}
              >
                <option value="">Section</option>
                {sectionOptions.map((item, index) => (
                  <option key={`${item}-${index}`} value={String(item)}>
                    {String(item)}
                  </option>
                ))}
              </select>
              <select
                className="admin-events-input"
                value={liveChatForm.student}
                onChange={(e) => setLiveChatForm((prev) => ({ ...prev, student: e.target.value }))}
                disabled={!liveChatForm.className || !liveChatForm.section}
              >
                <option value="">Student</option>
                {studentOptions.map((item, index) => (
                  <option key={`${item?.id || index}`} value={item?.name || item?.student_name || ""}>
                    {item?.name || item?.student_name || "Student"}
                  </option>
                ))}
              </select>
              <input
                className="admin-events-input"
                type="date"
                value={liveChatForm.date}
                onChange={(e) => setLiveChatForm((prev) => ({ ...prev, date: e.target.value }))}
              />
              <input
                className="admin-events-input"
                type="time"
                value={liveChatForm.time}
                onChange={(e) => setLiveChatForm((prev) => ({ ...prev, time: e.target.value }))}
              />
            </div>
            <div className="admin-events-action-row">
              <button type="button" className="admin-events-submit-btn" onClick={handleCreateLiveChatRequest}>
                Create Chat Request
              </button>
            </div>
          </div>
        </div>
      )}
 {
              isHelpOpen && (
                <>
                <HelpCenter
                userRole={userRole}
                openHelpSection={openHelpSection}
                    setOpenHelpSection={setOpenHelpSection}
                setIsHelpOpen={setIsHelpOpen}
                />
                </>
              )
            }
      <ErrorPopup message={popupMessage} onClose={() => setPopupMessage("")} />
    </div>
  );
};

export default AdminStoreNew;