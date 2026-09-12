import React, { useState, useEffect } from 'react'
import axios from 'axios';

function SchoolEventsHeading() {

    const [festival, setFestival] = useState(null);
    const [loading, setLoading] = useState(true);

    const [instituteName] = useState(localStorage.getItem("schoolName"));
    const [schoolCode] = useState(localStorage.getItem("schoolCode"));

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
                console.log("✅ Festival API:===================================================", res.data);
                setFestival(res.data.data?.[0] || null);
                setLoading(false);
            })
            .catch((err) => {
                console.log("❌ Festival API Error:", err.message);
                setLoading(false);
            });
    }, [schoolCode]);

     // ================= HEADING =================
    const getFestivalHeading = () => {
        if (!festival) return "";

        const today = new Date();
        const festDate = new Date(festival.festival_date);

        today.setHours(0, 0, 0, 0);
        festDate.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil(
            (festDate - today) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 0) return `${festival.festival_name} Today`;
        if (diffDays === 1) return `${festival.festival_name} Tomorrow`;
        return `${festival.festival_name} in ${diffDays} days`;
    };

    return (
        <div>
            {getFestivalHeading()}
        </div>
    )
}

export default SchoolEventsHeading