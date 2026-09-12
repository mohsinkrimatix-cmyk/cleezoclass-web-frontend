import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import heroImage from "../assets/logo1.png";
import ErrorPopup from "./ErrorPopup";
import cleezoLogo from "../assets/Cleezo.png";

const ROLE_HOME_ROUTE = {
  hr: "/HRDashboard",
  director: "/form",
  accountant: "/AccountantDashboard",
  teacher: "/TeacherDashboard",
  student: "/ParentHomepage",
  management: "/homepage3",
  superadmin: "/ChiefDashboard",
  marketing: "/FrontDeskDashboard",
  campaigning: "/CentralizationDashboard",
  admin: "/AdminDashboard",
};

function LoginPage2() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [hover, setHover] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const resize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    if (location.state?.authError) {
      setErrorMsg(location.state.authError);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const role = sessionStorage.getItem("userRole");
    if (!role) return;
    const homeRoute = ROLE_HOME_ROUTE[role];
    if (homeRoute) {
      navigate(homeRoute, { replace: true });
    }
  }, [navigate]);

  const handleAuthSuccess = (data) => {
    const normalizedRole = String(
      data.role || data.user?.role || data.user?.user_role || ""
    ).toLowerCase();

    const normalizedUserType = String(
      data.user_type ||
        data.userType ||
        data.user?.user_type ||
        data.user?.userType ||
        ""
    ).toLowerCase();

    const resolvedUserAccess =
      normalizedUserType === "campaigning"
        ? "campaigning"
        : normalizedUserType === "student"
        ? "student"
        : normalizedRole;

    localStorage.setItem("username", data.username);
    localStorage.setItem("userRole", resolvedUserAccess);
    localStorage.setItem("schoolCode", data.schoolCode);
    localStorage.setItem("name", data.name);
    localStorage.setItem("designation", data.designation || "");

    sessionStorage.setItem("userRole", resolvedUserAccess);
    sessionStorage.setItem("designation", data.designation || "");

    localStorage.setItem("userType", normalizedUserType);
    sessionStorage.setItem("userType", normalizedUserType);

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    switch (resolvedUserAccess) {
      case "hr": navigate("/HRDashboard", { replace: true }); break;
      case "director": navigate("/form", { replace: true }); break;
      case "accountant": navigate("/AccountantDashboard", { replace: true }); break;
      case "teacher": navigate("/TeacherDashboard", { replace: true }); break;
      case "student": navigate("/ParentHomepage", { replace: true }); break;
      case "management": navigate("/homepage3", { replace: true }); break;
      case "superadmin": navigate("/ChiefDashboard", { replace: true }); break;
      case "marketing": navigate("/FrontDeskDashboard", { replace: true }); break;
      case "campaigning": navigate("/CentralizationDashboard", { replace: true }); break;
      case "admin": navigate("/AdminDashboard", { replace: true }); break;
      default: navigate("/OperationsPage", { replace: true });
    }
  };

const handleLogin = async (e) => {
  e.preventDefault();

  if (!username) {
    setErrorMsg("Please enter username or email.");
    return;
  }

  // ✅ detect email
  const isEmail = username.includes("@");

  // ❌ If username login → password required
  if (!isEmail && !password) {
    setErrorMsg("Please enter password.");
    return;
  }

  try {
    const requestBody = isEmail
      ? { username, emailOnly: true }   // ✅ email login (no password)
      : { username, password };        // ✅ username login

    const response = await fetch(
      "https://cleezoclass.com:4000/api/logincredentials",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    // ✅ direct login success
    handleAuthSuccess(data);

  } catch (err) {
    if (err.message === "Failed to fetch") {
      setErrorMsg("Network issue. Please login again.");
    } else {
      setErrorMsg(err.message || "Login failed");
    }
    localStorage.clear();
  }
};

  const styles = {
    page: {
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px",
      background: "#f4f6f9",
    },

    card: {
      width: "100%",
      maxWidth: "1100px",
      background: "#fff",
      borderRadius: "16px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      overflow: "hidden",
    },

left: {
  flex: 1,
  display: "flex",
  flexDirection: "row",  // stack items vertically
  alignItems: "center",     // center horizontally
  padding: isMobile ? "20px" : "30px",
},


    image: {
      maxWidth: isMobile ? "70%" : "100%",
      height:'auto'
    },

    right: {
      flex: 1,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },

    formBox: {
      width: "100%",
      maxWidth: "420px",
      padding: isMobile ? "25px 20px" : "40px",
    },

    title: {
      fontSize: isMobile ? "24px" : "28px",
      fontWeight: "700",
      marginBottom: "6px",
    },

    subtitle: {
      fontSize: isMobile ? "16px" : "18px",
      marginBottom: "25px",
      opacity: 0.9,
    },

    input: {
      width: "100%",
      padding: "14px",
      marginBottom: "15px",
      borderRadius: "8px",
      border: "1px solid #ddd",
      fontSize: "15px",
    },

    passwordWrapper: {
      position: "relative",
    },

    showBtn: {
      position: "absolute",
      right: "10px",
      top: "20%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      cursor: "pointer",
      fontWeight: "600",
    },

    button: {
      width: "100%",
      padding: "14px",
      borderRadius: "10px",
      background: hover ? "#0a3d62b0" : "#0a3d62", // hover color
      color: "#fff",
      border: "none",
      fontSize: "16px",
      cursor: "pointer",
      marginTop: "10px",
      transition: "all 0.8s ease", // smooth transition for all properties
      transform: hover ? "scale(1.05)" : "scale(1)", // scale animation
      boxShadow: hover
        ? "0px 8px 15px #0a3d627a" // glow on hover
        : "0px 4px 6px rgba(0, 0, 0, 0.2)", // default shadow
    },
  };
const logoStyle = {
  width: "100px",
  height: "100px",
  borderRadius: "8px",
  
};

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.left}>
            <img
    src={cleezoLogo}
    alt="Logo"
    style={{ 
      ...logoStyle, 
      cursor: "pointer", 
      alignSelf: "flex-start",  // push it to the start (left)
      marginBottom: "20px" ,
      marginTop: "0px",            // distance from top
      marginLeft: "-10px",           // distance from left     // space between logo and hero image
    }}
    onClick={() => window.location.href = "https://cleezoclass.com"}
  />
          <img src={heroImage} alt="Login" style={styles.image} />
        </div>
        <div style={styles.right}>
          
          <div style={styles.formBox}>
            <h1 style={styles.title}>Let us ease your work</h1>
            <p style={styles.subtitle}>
              Everything, better. Everything, simpler.
            </p>

            <form onSubmit={handleLogin}>
              <input
                style={styles.input}
                placeholder=" Enter Username or Email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <div style={styles.passwordWrapper}>
                <input
                  style={styles.input}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.showBtn}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <button
                type="submit"
                style={styles.button}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
              >
                Login
              </button>

              <ErrorPopup message={errorMsg} onClose={() => setErrorMsg("")} />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage2;
