
import React, { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import jsPDF from 'jspdf';
import { Download, Share, ArrowLeft, ChevronRight, Calendar, Circle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiArrowLeft } from 'react-icons/fi';
import { Share2 } from 'lucide-react';

import { Link } from 'react-router-dom';
import { FaBackward } from 'react-icons/fa';
import { Toaster, toast } from "react-hot-toast";
import AdiminAcademicsNew from '../adminfolder/AdiminAcademicsNew';

const schoolLogo = ""; // Optional custom logo

function Radiusselectingg() {
  const [radius, setRadius] = useState('');
  const [latlng, setLatlng] = useState({ lat: 0, lng: 0 });
  const [address, setAddress] = useState("");
  const [showMapPopup, setShowMapPopup] = useState(false);
  const mapRef = useRef(null);
  const circleRef = useRef(null);
  const logoSrc = schoolLogo || "/default-logo.png";
  const dateInputRef = useRef(null);
  const contentRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState('const useNavigate = setNavgate()');
  const [activePage, setActivePage] = useState(null);
  const headerRef = useRef();
  const navigate = useNavigate();
  const [showAttendance, setShowAttendance] = useState(false);
  const dashboardRef = useRef(null);
  const [activeContent, setActiveContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRadiusPopup, setShowRadiusPopup] = useState(true)


  const handleAttendanceClick = () => {
    setActivePage('attendance');
    setActiveContent(true);
  };

  const handleBackClick = () => {
    navigate('/RecruitmentDashboard');
  };

  const handleGroupChartClick = () => {
    setActivePage('groupchart');
    setActiveContent(true);
  };

  const handleteacherstimetableClick = () => {
    setActivePage('timetable');
    setActiveContent(true);
  };

  const handlestaffperformanceClick = () => {
    setActivePage('staffperform');
    setActiveContent(true);
  };

  const handlesaccedamicmanagemenClick = () => {
    setActivePage('accdemic');
    setActiveContent(true);
  };

  const openCalendar = () => {
    dateInputRef.current?.showPicker();
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Check this out!',
      text: 'Here is something worth sharing.',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        console.log('Shared successfully');
      } else {
        alert('Web Share API not supported in this browser.');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleContainerClick = (content) => {
    setActiveContent(content);
  };

  const handleDownload = async () => {
    const input = dashboardRef.current;
    if (!input) return;

    const originalStyle = {
      height: input.style.height,
      overflow: input.style.overflow,
    };

    const fullHeight = input.scrollHeight;

    input.style.height = fullHeight + 'px';
    input.style.overflow = 'visible';

    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        width: input.scrollWidth,
        height: input.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = 210;
      const pageHeight = 297;
      const imgProps = pdf.getImageProperties(imgData);

      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('full-dashboard.pdf');
    } catch (error) {
      console.error('Error generating full PDF:', error);
    } finally {
      input.style.height = originalStyle.height;
      input.style.overflow = originalStyle.overflow;
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const numericRadius = Number(radius);
    const rawSchoolcode = localStorage.getItem("schoolCode");

    const predefinedSchools = {
      BLUEBELLS: {
        lat: 13.623645,
        lng: 79.442220,
        address: "Bluebells School, Korramenugunta (Tirupati)"
      },
      FIRST_IMPRESSION_PRE_SCHOOL: {
        lat: 13.631,
        lng: 79.485,
        address: "FIRST IMPRESSION PRE SCHOOL | UPADHYAYA NAGAR | TIRUPATHI | UPADHYAYA NAGAR"
      },
      SREE_GEETHANJALI_EM: {
        lat: 13.649662,
        lng: 79.421505,
        address: "SREE GEETHANJALI E.M | K.T.ROAD, TIRUPATHI | TIRUPATI | Dwaraka Nagar"
      },
      SREE_GEETHANJALI_EM_SCHOOL: {
        lat: 13.628756,
        lng: 79.419180,
        address: "SREE GEETHANJALI E.M SCHOOL"
      }
    };

    if (!rawSchoolcode) {
      setIsLoading(false);
      toast.error("Please ensure the school code is saved in localStorage!");
      return;
    }

    if (!radius || isNaN(numericRadius)) {
      setIsLoading(false);
      toast.error("Please enter a valid radius.");
      return;
    }

    try {
      const res = await fetch(
        "https://cleezoclass.com:4000/api/radius",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            radius: numericRadius,
            schoolcode: rawSchoolcode,
          }),
        }
      );

      const data = await res.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      const storedRadius = String(data.radius ?? numericRadius);
      const storedRadiusDate = new Date().toLocaleDateString("en-IN");

      localStorage.setItem("attendanceRadius", storedRadius);
      localStorage.setItem("attendanceRadiusDate", storedRadiusDate);

      toast.success(
        data.message || "Radius inserted successfully"
      );
      if (toast.success) {
        setIsLoading(false);
        setTimeout(() => {
          navigate(-1)
        }, 1000)
      }

      if (predefinedSchools[rawSchoolcode]) {
        const school = predefinedSchools[rawSchoolcode];

        setLatlng({
          lat: school.lat,
          lng: school.lng,
        });

        setAddress(school.address);
        setRadius(data.radius);

        setTimeout(() => {
          setShowMapPopup(true);
        }, 1000);

        return;
      }

      const baseAddress = data.address || "";

      const baseParts = baseAddress
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

      const states = [
        "Andhra Pradesh",
        "Telangana",
        "Tamil Nadu",
        "Kerala",
      ];

      const locationAttempts = [];

      const schoolNameVariants = [
        `${rawSchoolcode} School`,
        `${rawSchoolcode} Institution`,
        `${rawSchoolcode} Campus`,
      ];

      for (const variant of schoolNameVariants) {
        for (let i = 0; i < baseParts.length; i++) {
          const partial = baseParts.slice(i).join(", ");

          for (const state of states) {
            locationAttempts.push(
              `${variant}, ${partial}, ${state}, India`
            );
          }
        }

        locationAttempts.push(
          `${variant}, ${baseAddress}, India`
        );
      }

      let foundLocation = null;

      for (const fullAddress of locationAttempts) {
        const locRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            fullAddress
          )}`,
          {
            headers: {
              "User-Agent": "SchoolLocator/1.0",
              "Accept-Language": "en",
            },
          }
        );

        const locData = await locRes.json();

        if (locData.length > 0) {
          foundLocation = locData[0];
          break;
        }
      }

      // if (!foundLocation) {
      //   toast.error(
      //     "Location not found on map, but radius was saved successfully."
      //   );
      //   return;
      // }

      const { lat, lon } = foundLocation;

      setLatlng({
        lat: parseFloat(lat),
        lng: parseFloat(lon),
      });

      setAddress(data.address);
      setRadius(data.radius);

      setTimeout(() => {
        setShowMapPopup(false);
      }, 1000);

    } catch (err) {
      console.error(err);
      // toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);

    }
  };

  


// useEffect(() => {
//   const handlePopState = () => {
//     if (showRadiusPopup) {
//       setShowRadiusPopup(false);
//     }
//   };

//   window.addEventListener("popstate", handlePopState);

//   return () => {
//     window.removeEventListener("popstate", handlePopState);
//   };
// }, [showRadiusPopup]);


  useEffect(() => {
    if (showMapPopup && mapRef.current) {
      // Initialize Leaflet map with white OSM tiles
      const map = L.map(mapRef.current).setView([latlng.lat, latlng.lng], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Define a custom icon for the location marker
      const locationIcon = L.icon({
        iconUrl: 'https://cdn.jsxdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconSize: [50, 82], // Size of the icon (scaled up)
        iconAnchor: [25, 82], // Anchor point of the icon
        popupAnchor: [0, -78], // Offset for the popup
      });

      // Marker at the institute with the custom icon
      L.marker([latlng.lat, latlng.lng], { icon: locationIcon }).addTo(map);

      // Remove old circle and draw new one
      if (circleRef.current) circleRef.current.remove();
      circleRef.current = L.circle([latlng.lat, latlng.lng], {
        radius: Number(radius),
        color: '#FF0000',
        weight: 3,
        fillColor: '#90EE90',
        fillOpacity: 0.2,
      }).addTo(map);
    }
  }, [showMapPopup, latlng, radius]);
  const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
  const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');

  useEffect(() => {
    const fetchSchoolLogo = async () => {
      console.log('🚀 Starting logo fetch process...');

      const code = localStorage.getItem('schoolCode');
      console.log('🧾 localStorage.getItem("schoolCode") =', code, '| Type:', typeof code);

      if (!code) {
        console.warn('❌ No school code found in localStorage. Aborting fetch.');
        return;
      }

      setDynamicSchoolCode(code);
      console.log('📦 Set dynamic school code in state:', code);

      try {
        console.log('📡 Sending POST request to backend with secretecode...');
        const response = await axios.post(
          'https://cleezoclass.com:4000/api/schoollogodynamic',
          { secretecode: code },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('📬 Response from backend:', response);
        console.log('📬 Response.data:', response.data);

        if (response.data.logoPath) {
          console.log('✅ Logo fetched successfully from backend.');
          setDynamicLogoSrc(response.data.logoPath);
        } else {
          console.warn('⚠️ No logo path found in backend response.');
        }
      } catch (error) {
        console.error('🔥 Error fetching school logo:', error.response?.data || error.message);
      }
    };

    fetchSchoolLogo();
  }, []);
  const linkStyle = {
    margin: "0 10px",
    textDecoration: "none",
    display: "flex",
    alignItems: "center"
  };

  const iconStyle = {
    padding: "10px",
    borderRadius: "50%",
    fontSize: "25px",
    transition: "all 0.3s",
    width: "40px",
    height: "40px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  };
  const userRole = localStorage.getItem('userRole');
  return (
    <>




      <main className="main-content">

        <style>
          {`
    @media (max-width: 768px) {
      /* --- Header Adjustments (Corrected) --- */
      .top-bar {
        justify-content: center !important; 
        align-items: center !important;
        padding: 0.5rem !important;
        gap: 15px;
        height: 70px !important;
      }
      .top-bar .header-logo {
        position: static !important; /* Make it a regular flex item */
        transform: none !important;
        height: 50px !important; /* Reduce its size */
      }
      .top-bar .header-title {
        font-size: 1.2rem !important; /* Reduce title size */
      }

      /* --- Main Content Card Adjustments (Unchanged) --- */
      main.main-content > section.dashboard-body > div[style*="maxWidth: 1000px"] {
        width: 25% !important;
        padding: 20px !important;
        margin: 30px auto !important;
      }

      /* --- Stack Form and Image (Unchanged) --- */
      div[style*="display: flex"][style*="gap: 30px"] {
        flex-direction: column !important;
      }
      
      /* --- Form and Text Adjustments (Unchanged) --- */
      div[style*="flex: 1"] > h2 {
        font-size: 28px !important;
        text-align: center !important;
      }
      
      div[style*="flex: 1"][style*="padding: 40px 30px"] {
        padding: 20px !important;
      }
      
      /* --- Image Adjustments (Unchanged) --- */
      div[style*="flex: 1"] > img 
{showRadiusPopup && (
  <div
    onClick={() => setShowRadiusPopup(false)}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.6)",
  {
        max-height: 300px;
      }
    }
  `}
        </style>

        <section className="dashboard-body">


          <div ref={dashboardRef} style={{ overflowY: 'auto' }}></div>

          <div
            style={{
              position: "relative",
              backgroundColor: "#ffffff",
              padding: "40px",
              maxWidth: "1000px",
              // margin: "60px auto",
              borderRadius: "16px",
              boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
            }}
          >
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                border: "none",
                background: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                transition: "all 0.2s ease",
                zIndex: 10,
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <div
              style={{
                display: "flex",
                gap: "30px",
                borderRadius: "12px",
                overflow: "hidden",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              }}
            >
              {/* Left Side - Form */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: "#ffffff",
                  padding: "40px 30px",
                  boxShadow: "inset 0 0 10px rgba(0,0,0,0.05)",
                  borderRadius: "12px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <h2
                  style={{
                    marginBottom: "30px",
                    fontWeight: "700",
                    fontSize: "38px",
                    color: "#1a1a1a",
                    letterSpacing: "1px",
                    textAlign: "left",
                  }}
                >
                  Set Radius (in meters)
                </h2>

                <style>
                  {`
                      .loader {
                        border: 4px solid rgba(0, 0, 0, 0.1);
                        border-radius: 50%;
                        border-top: 4px solid #3a86ff;
                        width: 30px;
                        height: 30px;
                        animation: spin 1s linear infinite;
                        margin: 20px auto;
                      }

                      @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                      }
                    `}
                </style>

                <form onSubmit={handleSubmit}>
                  <input
                    type="number"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    placeholder="Radius in meters"
                    style={{
                      width: "100%",
                      padding: "12px 15px",
                      fontSize: "16px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      outline: "none",
                      marginBottom: "20px",
                      transition: "border-color 0.3s",
                    }}

                    required
                    onFocus={(e) => (e.target.style.borderColor = "#3a86ff")}
                    onBlur={(e) => (e.target.style.borderColor = "#ccc")}
                  />

                  <button
                    type="submit"
                    style={{
                      width: "100%",
                      padding: "12px",
                      backgroundColor: "#3a86ff",
                      border: "none",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "16px",
                      fontWeight: "600",
                      cursor: "pointer",
                      boxShadow: "0 4px 8px rgba(58,134,255,0.3)",
                      transition: "background-color 0.3s",
                    }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = "#2f6dcc")}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = "#3a86ff")}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Submit'}
                  </button>

                  {isLoading && <div className="loader"></div>}
                </form>
              </div>

              {/* Right Side - Image */}
              <div
                style={{
                  flex: 1,
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "inset 0 0 10px rgba(0,0,0,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#ffffff",
                }}
              >
                <img
                  src="https://i.pinimg.com/736x/03/33/64/033364440dbaef7d3ba27f5622cdb4d0.jpg"
                  alt="Side Illustration"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </div>
          </div>

          {/* Map Popup */}
          {/* Map Popup */}
          {showMapPopup && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.7)",
                zIndex: 999999999,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "90%",
                  maxWidth: "900px",
                  background: "#fff",
                  borderRadius: "12px",
                  padding: "20px",
                  position: "relative",
                  zIndex: 1000000000,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                }}
              >
                <button
                  onClick={() => setShowMapPopup(false)}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "15px",
                    width: "35px",
                    height: "35px",
                    border: "none",
                    borderRadius: "50%",
                    background: "#f1f1f1",
                    cursor: "pointer",
                    fontSize: "22px",
                  }}
                >
                  ×
                </button>

                <h2 style={{ marginBottom: "15px" }}>
                  Preview your Radius
                </h2>

                <div
                  ref={mapRef}
                  style={{
                    width: "100%",
                    height: "500px",
                    borderRadius: "10px",
                  }}
                />

                <button
                  onClick={() => setShowMapPopup(false)}
                  style={{
                    marginTop: "20px",
                    padding: "10px 20px",
                    background: "#3085d6",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

    </>
  );
}

export default Radiusselectingg;
