import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'


function SchoolEventsPosters() {
    const [festival, setFestival] = useState(null);
    const [festivalPosters, setFestivalPosters] = useState([]);
    const [selectedPoster, setSelectedPoster] = useState(null);
    const [currentPosterIndex, setCurrentPosterIndex] = useState(0);
    const [showPreview, setShowPreview] = useState(false);
    const [loading, setLoading] = useState(true);

    const [instituteName] = useState(localStorage.getItem("schoolName"));
    const [schoolCode] = useState(localStorage.getItem("schoolCode"));

    const containerRef = useRef(null);

    const APIBase = "https://cleezoclass.com:5000/download-poster?";

    // ================= FETCH FESTIVAL =================
    useEffect(() => {
        console.log("🔥 Component Loaded");
        console.log("schoolCode:", schoolCode);

        if (!schoolCode) {
            console.log("❌ Missing schoolCode");
            setLoading(false);
            return;
        }

        axios
            .get("https://cleezoclass.com:5000/api/school-festival", {
                params: { schoolCode },
            })
            .then((res) => {
                console.log("✅ Festival API:", res.data);
                setFestival(res.data.data?.[0] || null);
                setLoading(false);
            })
            .catch((err) => {
                console.log("❌ Festival API Error:", err.message);
                setLoading(false);
            });
    }, [schoolCode]);

    // ================= FETCH POSTERS =================
    useEffect(() => {
        if (!festival?.festival_name || !schoolCode) return;

        console.log("📦 Fetching posters for:", festival.festival_name);

        axios
            .get("https://cleezoclass.com:5000/api/festival-poster", {
                params: {
                    festival: festival.festival_name,
                    schoolCode,
                    schoolName: instituteName,
                },
            })
            .then((res) => {
                console.log("🎯 Poster API:", res.data);

                const posters = res.data.posters || [];
                const matched = posters.filter(
                    (p) => p.festival === festival.festival_name
                );

                console.log("✅ Matched Posters:", matched);
                setFestivalPosters(matched);

                if (matched.length > 0) {
                    setCurrentPosterIndex(0);
                    setSelectedPoster(matched[0]);
                }
            })
            .catch((err) => {
                console.log("❌ Poster Error:", err.message);
            });
    }, [festival?.festival_name, schoolCode, instituteName]);

    // ================= HANDLE GENERATE =================
    const handleGenerate = () => {
        if (festivalPosters.length === 0) {
            alert("No templates available");
            return;
        }

        const currentPoster = festivalPosters[currentPosterIndex];

        setSelectedPoster(currentPoster);
        setShowPreview(true);
    };



    // ================= DOWNLOAD =================
    const downloadImage = async () => {
        if (!selectedPoster) return;

        try {
            console.log("Downloading:", selectedPoster);

            const response = await fetch(
                `${APIBase}posterUrl=${encodeURIComponent(
                    selectedPoster.url
                )}&schoolName=${encodeURIComponent(
                    instituteName
                )}&festival=${encodeURIComponent(
                    selectedPoster.festival
                )}&schoolCode=${encodeURIComponent(schoolCode)}`
            );

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `${selectedPoster.festival}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.log("Download error:", err.message);
        }
    };

    const handleReGenerate = () => {
        if (festivalPosters.length === 0) return;

        const nextIndex =
            currentPosterIndex === festivalPosters.length - 1
                ? 0
                : currentPosterIndex + 1;

        setCurrentPosterIndex(nextIndex);
        setSelectedPoster(festivalPosters[nextIndex]);

        // Optional: close preview when changing poster
        setShowPreview(false);
    };

    // ================= RENDER =================
    // if (loading) return <div>Loading...</div>;
    // if (!festival) return <div>No Festival Within Next 3 Days</div>

    return (
        <div>

            <p>Choose Template</p>

            {/* ================= POSTERS ================= */}
            <div className="posters-gallery">

                {festivalPosters.length > 0 && (
                    <div
                        className={`gallery-item ${selectedPoster?.fileName ===
                            festivalPosters[currentPosterIndex]?.fileName
                            ? "selected"
                            : ""
                            }`}
                    >
                        <div className="template-box"
                        style={{position:"relative"}}>
                            <iframe
                                src={`https://cleezoclass.com:5000${festivalPosters[currentPosterIndex].url}?schoolName=${encodeURIComponent(
                                    instituteName
                                )}&schoolCode=${encodeURIComponent(
                                    schoolCode
                                )}`}
                                title={festivalPosters[currentPosterIndex].fileName}
                                className="template-preview"
                                scrolling="no"
                            />

                            <div
                                className="template-overlay"
  style={{
    position: "absolute",
    inset: 0,
    cursor: "pointer",
    zIndex: 10,
  }}
  onClick={() => {
      console.log("Poster clicked")
    setSelectedPoster(festivalPosters[currentPosterIndex]);
    setShowPreview(true);
  }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ================= BUTTON ================= */}
            <div className="button-row">
                <button className='generate-btn'
                    onClick={handleReGenerate}
                          style={{backgroundColor:"pink",borderRadius:"10px",padding:"5px",color:"white"}}>
                    ReGenerate
                </button>
            </div>

            {/* ================= PREVIEW MODAL ================= */}
        {showPreview && selectedPoster && (
  <div
    onClick={() => setShowPreview(false)}
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.75)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
      padding: "20px",
      boxSizing: "border-box",
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "95%",
        maxWidth: "900px",
        height: "90vh",
        background: "#fff",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 20px",
          borderBottom: "1px solid #eee",
          background: "#fafafa",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: "600",
          }}
        >
          {selectedPoster.festival}
        </h3>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={downloadImage}
            style={{
              background: "#f9b1b8",
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Download
          </button>

          <button
            onClick={() => setShowPreview(false)}
            style={{
              background: "#ffffff",
              color: "#af0000",
              border: "none",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: "18px",
            }}
          >
            ✕
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflow: "hidden",
        }}
      >
        <iframe
          ref={containerRef}
          src={`https://cleezoclass.com:5000${selectedPoster.url}?schoolName=${encodeURIComponent(
            instituteName
          )}&schoolCode=${encodeURIComponent(schoolCode)}`}
          title={selectedPoster.fileName}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
          }}
        />
      </div>
    </div>
  </div>
)}
        </div>
    );
};



export default SchoolEventsPosters