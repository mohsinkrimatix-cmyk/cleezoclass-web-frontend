import React, { useEffect, useState } from "react";
import "./NumberOfStudents.css"
// import CountUp from "react-countup";

function NumberOfStudents() {
    const [noOfLogins, setNoOfLogins] = useState(0);
    const [loading, setLoading] = useState(true);
    const [noOfActiveLogins, setNoOfActiveLogins] = useState(0)

    // useEffect(() => {
    //     const fetchStudents = async () => {
    //         try {
    //             const response = await fetch(
    //                 "https://cleezoclass.com:4000/api/current-students"
    //             );

    //             const data = await response.json();

    //             setNoOfLogins(data.length);
    //         } catch (err) {
    //             console.log(err);
    //         } finally {
    //             setLoading(false);
    //         }
    //     };

    //     fetchStudents();
    // }, []);

    // useEffect(() => {
    //     const fetchStudents = async () => {
    //         try {
    //             const response = await fetch("https://cleezoclass.com:4000/api/active-students");

    //             const data = await response.json();
    //             setNoOfActiveLogins(data.length);
    //         } catch (err) {
    //             console.log(err);
    //         } finally {
    //             setLoading(false)
    //         }
    //     }
    //     fetchStudents();
    // }, [])

    useEffect(() => {
    const fetchData = async () => {
        try {
            const [allStudentsResponse, activeStudentsResponse] = await Promise.all([
                fetch("https://cleezoclass.com:4000/api/current-students"),
                fetch("https://cleezoclass.com:4000/api/active-students"),
            ]);

            const [allStudents, activeStudents] = await Promise.all([
                allStudentsResponse.json(),
                activeStudentsResponse.json(),
            ]);

            setNoOfLogins(allStudents.length);
            setNoOfActiveLogins(activeStudents.length);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
}, []);

    const today = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    if (loading) return <h2>Loading...</h2>;

    return (
        <div className="dashboard">
            <div className="login-card">
                <div className="card-header">
                    Total Parent Logins
                </div>

                <div className="count">
                    <div className="count">
                        {/* <CountUp
                            start={0}
                            end={noOfLogins}
                            duration={2}
                            separator=","
                            useEasing={true}
                            easingFn={(t, b, c, d) => {
                                t /= d;
                                return -c * t * (t - 2) + b;
                            }}
                        /> */}
                        <p>{noOfLogins}</p>
                    </div>
                </div>
                <div className="date-box">
                    {today}
                </div>
            </div>
            <div className="login-card">
                <div className="card-header">
                    Total Active Parent Logins <span className="dot"></span>
                </div>

                <div className="count">
                    <div className="count">
                        {/* <CountUp
                            start={0}
                            end={noOfActiveLogins}
                            duration={2.7}
                            separator=","
                            useEasing={true}
                            easingFn={(t, b, c, d) => {
                                t /= d;
                                return -c * t * (t - 2) + b;
                            }}
                        /> */}
                        <p>{noOfActiveLogins}</p>
                    </div>
                </div>
                <div className="date-box">
                    {today}
                </div>
            </div>
        </div>
    );
}

export default NumberOfStudents;