import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./schoolEvent.css";
import SchoolEventsHeading from "./SchoolEventsHeading";
import SchoolEventsPosters from "./SchoolEventsPosters";
const SchoolEvents = () => {
    const [festival, setFestival] = useState(null);
    const [festivalPosters, setFestivalPosters] = useState([]);
    const [selectedPoster, setSelectedPoster] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [loading, setLoading] = useState(true);

    const [instituteName] = useState(localStorage.getItem("schoolName"));
    const [schoolCode] = useState(localStorage.getItem("schoolCode"));

    const containerRef = useRef(null);

    const APIBase = "https://cleezoclass.com:4000/download-poster?";

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
            .get("https://cleezoclass.com:4000/api/school-festival", {
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



    // ================= RENDER =================
    if (loading) return <div>Loading...</div>;
    if (!festival) return <div>No Festival Within Next 3 Days</div>

    return (
        <div className="school-events">
            <h2><SchoolEventsHeading /></h2>

            <SchoolEventsPosters />

        </div>
    );
};

export default SchoolEvents;