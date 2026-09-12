import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CentalizationLoginForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [buttonBgColor, setButtonBgColor] = useState('#5a7488'); 
  const [showPassword, setShowPassword] = useState(false); 
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (formData.username && formData.password) {
        fetch('https://cleezoclass.com:4000/api/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: formData.username,
                password: formData.password,
            }),
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.message === "Login successful") {
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
                    : normalizedRole;

                const schoolCode =
                  data.schoolCode ||
                  data.user?.schoolCode ||
                  data.user?.school_code ||
                  "";

                localStorage.setItem("instituteName", data.user?.institute_name || "");
                localStorage.setItem("username", data.user?.username || "");
                localStorage.setItem("centralizationUsername", data.user?.username || "");
                localStorage.setItem("schoolCode", schoolCode);
                localStorage.setItem("userRole", resolvedUserAccess);
                localStorage.setItem("userType", normalizedUserType);
                localStorage.setItem("name", data.name || data.user?.name || data.user?.username || "");

                sessionStorage.setItem("userRole", resolvedUserAccess);
                sessionStorage.setItem("userType", normalizedUserType);

                navigate("/CentralizationDashboard");
            } else {
                setError(data.message);
            }
        })
        .catch((err) => {
            setError('Something went wrong. Please try again.');
            console.error("Login error: ", err);
        });
    } else {
        setError('Please fill out all fields');
    }
};


  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const containerStyle = {
    width: '300px',
    margin: '50px auto',
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '20px',
  };

  const formGroupStyle = {
    marginBottom: '15px',
    position: 'relative',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ccc',
    borderRadius: '4px',
  };

  const eyeIconStyle = {
    position: 'absolute',
    right: '10px',
    top: '65%',
    transform: 'translateY(-50%)',
    cursor: 'pointer',
    fontSize: '18px',
  };

  const buttonStyle = {
    width: '100%',
    padding: '10px',
    backgroundColor: buttonBgColor,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
  };

  const forgotPasswordStyle = {
    textAlign: 'center',
    marginTop: '10px',
  };

  const forgotPasswordLinkStyle = {
    textDecoration: 'none',
    color: '#007BFF',
  };

  const errorMessageStyle = {
    color: 'red',
    fontSize: '14px',
    marginBottom: '10px',
  };

  return (
    <div style={containerStyle}>
      <h2 style={headerStyle}>Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={formGroupStyle}>
          <label htmlFor="username" style={labelStyle}>Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </div>

        <div style={formGroupStyle}>
          <label htmlFor="password" style={labelStyle}>Password</label>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={inputStyle}
          />
          <span
            style={eyeIconStyle}
            onClick={togglePasswordVisibility}
          >
            {showPassword ? "👁️" : "🔒"}
          </span>
        </div>

        {error && <div style={errorMessageStyle}>{error}</div>}

        <button 
          type="submit" 
          style={buttonStyle}
          onMouseEnter={() => setButtonBgColor('#3e4c59')} 
          onMouseLeave={() => setButtonBgColor('#5a7488')} 
        >
          Login
        </button>

        <div style={forgotPasswordStyle}>
          <a 
            href="/forgot-password" 
            style={forgotPasswordLinkStyle}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            Forgot Password?
          </a>
        </div>
      </form>
    </div>
  );
};

export default CentalizationLoginForm;
