import React from "react";
import "./FrontDesk_Admission.css";
import "../STYLES/solidbutton.css";
import { useEffect, useState } from "react";
import axios from "axios";
import loader from "../assets/loader.gif";
import { CampaignStatus } from "./FrontDesk_Admission";
import cleezo from "../assets/Cleezo.png";
// AdmissionReportPopup.tsx or your component file
import cleezoImg from "../assets/Cleezo Class C logo.png";
import googleImg from "../assets/google.png";
import metaImg from "../assets/meta.png";
import youtubeImg from "../assets/youtube.png";
/* ---------------- SECTION COMPONENT (KEEP SAME) ---------------- */

interface SectionProps {
  title: string;
  children: React.ReactNode;
  variant?: "default" | "lead" | "marketing";
  style?: React.CSSProperties;
  className?: string;
}

const Section: React.FC<SectionProps> = ({
  title,
  children,
  variant = "default",
  style = {},
  className = ""
}) => {
  const compactVariants = ["lead", "marketing"];
  const containerClass = compactVariants.includes(variant)
    ? "sectionContainer1"
    : "sectionContainer";

  return (
    <div className={`${containerClass} ${className}`} style={style}>
      <div className="sectionTitle">{title}</div>
      {children}
    </div>
  );
};

/* ---------------- INPUT FIELD COMPONENT (KEEP SAME) ---------------- */

interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<any>) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "date" | "select";
  className?: string;
  style?: React.CSSProperties;
  options?: string[];
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  className,
  style,
  options = [],
}) => {
  return (
    <div className="inputGroup" style={style}>
      <label className="label">{label}</label>

      {type === "select" ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={`input ${className || ""}`}
        >
          <option value="">{placeholder || "Select"}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`input ${className || ""}`}
        />
      )}
    </div>
  );
};

/* ---------------- NEW CAMPAIGNING POPUP ---------------- */

const AdmissionReportPopup: React.FC = () => {
  const [selectedCampaign, setSelectedCampaign] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [showCampaignStatus, setShowCampaignStatus] = React.useState(false);
  const [selectedLead, setSelectedLead] = React.useState(null);

  const [formData, setFormData] = React.useState({
  city: "",
  location: "",
  radius: "",
  occupation: "",
  age: "",
  gender: "",
   state: "",
});

const handleChange = (e: React.ChangeEvent<any>) => {
  const { name, value } = e.target;

  setFormData((prev) => ({
    ...prev,
    [name]: value
  }));
};
const [leads, setLeads] = useState<Lead[]>([]);
const [visibleCount, setVisibleCount] = useState(0); // controls how many leads are visibleconst [visibleCount, setVisibleCount] = useState(0); // controls how many leads are visibleconst [batchIndex, setBatchIndex] = useState(0);
// const handleRun = async () => {
//   const { state, location, radius, occupation, age, gender } = formData;

//   if (!state || !location || !radius || !occupation || !age || !gender) {
//     alert("Please fill the campaigning criteria.");
//     return;
//   }

//   if (isRunDisabled) return;

//   setIsRunDisabled(true);
//   setIsLoading(true);
//   setVisibleCount(0); // reset visible leads

//   try {
//     const schoolCode = localStorage.getItem('schoolCode');

//     const response = await fetch(
//       `https://cleezoclass.com:4000/api/fetch-leads?schoolCode=${schoolCode}`
//     );
//     const data = await response.json();

//     if (data.success) {
//       setLeads(data.leads);

//       // 0.5s delay for the first lead
//       setTimeout(() => {
//         setVisibleCount(1);

//         // Then reveal the rest every 1 second
//         let index = 1; // already shown first lead
//         const interval = setInterval(() => {
//           setVisibleCount((prev) => {
//             if (index >= data.leads.length) {
//               clearInterval(interval);
//               return prev;
//             }
//             index++;
//             return prev + 1;
//           });
//         }, 1000);
//       }, 500);
//     } else {
//       alert('Failed to fetch leads');
//     }
//   } catch (err) {
//     console.error(err);
//     alert('Error fetching leads');
//   }

//   setIsLoading(false);

//   // Re-enable the run button after 5 minutes
//   setTimeout(() => {
//     setIsRunDisabled(false);
//   }, 300000);
// };


const handleRun = async () => {
  if (isRunDisabled) return;

  setIsRunDisabled(true);
  setIsLoading(true);

  try {
    const schoolCode = localStorage.getItem("schoolCode");

    const response = await fetch("https://cleezoclass.com:4000/api/run-campaign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolCode }),
    });

    const data = await response.json();
    const displayedLeads = Array.isArray(data.leads) ? data.leads.slice(0, 3) : [];

    if (!data.success || displayedLeads.length === 0) {
      alert(data?.message || "Daily limit of 10 leads has already been reached.");
      setIsLoading(false);
      setIsRunDisabled(false);
      return;
    }

    // Show up to 3 leads one by one with 0.5 sec interval
    setLeads([]); // reset visible leads for this batch
    window.dispatchEvent(
      new CustomEvent("frontdesk-campaign-leads-updated", {
        detail: {
          schoolCode,
          count: displayedLeads.length,
        },
      })
    );
    let index = 0;
    const interval = setInterval(() => {
      setLeads((prev) => [...prev, displayedLeads[index]]);
      index++;
      if (index >= displayedLeads.length) {
        clearInterval(interval);
      }
    }, 500);
  } catch (err) {
    console.error(err);
    alert("Error running campaign");
  }

  setIsLoading(false);

  // Disable button for 5 minutes (300,000 ms)
  setTimeout(() => setIsRunDisabled(false), 300000);
};
const [isRunDisabled, setIsRunDisabled] = React.useState(false);
const stateCityData = {
"Andhra Pradesh": [
  "Visakhapatnam",
  "Vijayawada",
  "Guntur",
  "Tirupati",
  "Kurnool",
  "Rajahmundry",
  "Kakinada",
  "Nellore",
  "Anantapur",
  "Kadapa",
  "Chittoor",
  "Eluru",
  "Machilipatnam",
  "Ongole",
  "Srikakulam",
  "Vizianagaram",
  "Amaravati",
  "Tenali",
  "Proddatur",
  "Adoni",
  "Hindupur",
  "Gudivada",
  "Bhimavaram",
  "Narasaraopet",
  "Tadepalligudem",
  "Madanapalle",
  "Nandyal",
  "Dharmavaram",
  "Chilakaluripet",
  "Bapatla",
  "Palakollu",
  "Kavali",
  "Rayachoti",
  "Guntakal",
  "Puttur",
  "Sattenapalle",
  "Markapur",
  "Parvathipuram",
  "Tuni",
  "Yemmiganur",
  "Kadiri",
  "Pedana",
  "Repalle",
  "Amalapuram",
  "Tanuku",
  "Sullurpeta",
  "Rajampet",
  "Pithapuram",
  "Samalkot"
],  "Arunachal Pradesh": ["Itanagar","Tawang","Ziro","Pasighat"],
  "Assam": ["Guwahati","Dibrugarh","Silchar","Jorhat","Tezpur"],
  "Bihar": ["Patna","Gaya","Bhagalpur","Muzaffarpur","Darbhanga"],
  "Chhattisgarh": ["Raipur","Bhilai","Bilaspur","Korba","Durg"],
  "Goa": ["Panaji","Margao","Vasco da Gama","Mapusa"],
  "Gujarat": ["Ahmedabad","Surat","Vadodara","Rajkot","Bhavnagar"],
  "Haryana": ["Chandigarh","Gurugram","Faridabad","Panipat","Ambala"],
  "Himachal Pradesh": ["Shimla","Manali","Dharamshala","Solan","Mandi"],
  "Jharkhand": ["Ranchi","Jamshedpur","Dhanbad","Bokaro"],
  "Karnataka": ["Bengaluru","Mysuru","Mangalore","Hubli","Belagavi"],
  "Kerala": ["Thiruvananthapuram","Kochi","Kozhikode","Thrissur","Alappuzha"],
  "Madhya Pradesh": ["Bhopal","Indore","Gwalior","Jabalpur","Ujjain"],
  "Maharashtra": ["Mumbai","Pune","Nagpur","Nashik","Aurangabad","Thane"],
  "Manipur": ["Imphal","Thoubal","Bishnupur"],
  "Meghalaya": ["Shillong","Tura","Nongpoh"],
  "Mizoram": ["Aizawl","Lunglei","Champhai"],
  "Nagaland": ["Kohima","Dimapur","Mokokchung"],
  "Odisha": ["Bhubaneswar","Cuttack","Rourkela","Puri","Sambalpur"],
  "Punjab": ["Chandigarh","Ludhiana","Amritsar","Jalandhar","Patiala"],
  "Rajasthan": ["Jaipur","Udaipur","Jodhpur","Kota","Bikaner"],
  "Sikkim": ["Gangtok","Namchi","Gyalshing"],
  "Tamil Nadu": ["Chennai","Coimbatore","Madurai","Salem","Tiruchirappalli"],
"Telangana": [
  "Hyderabad",
  "Warangal",
  "Hanamkonda",
  "Karimnagar",
  "Ramagundam",
  "Khammam",
  "Nizamabad",
  "Mahabubnagar",
  "Suryapet",
  "Miryalaguda",
  "Jagtial",
  "Kamareddy",
  "Adilabad",
  "Mancherial",
  "Nirmal",
  "Kothagudem",
  "Bhadrachalam",
  "Siddipet",
  "Medak",
  "Sangareddy",
  "Zaheerabad",
  "Vikarabad",
  "Mahabubabad",
  "Jangaon",
  "Bhupalpally",
  "Wanaparthy",
  "Nagarkurnool",
  "Gadwal",
  "Narayanpet",
  "Medchal",
  "Shamirpet",
  "Chevella",
  "Tandur",
  "Peddapalli",
  "Sircilla",
  "Bhongir",
  "Yadadri",
  "Huzurnagar",
  "Kodad",
  "Devarakonda",
  "Armur",
  "Bodhan",
  "Bellampalli",
  "Asifabad",
  "Luxettipet",
  "Manuguru",
  "Palwancha",
  "Dornakal",
  "Parkal",
  "Ghatkesar",
  "Uppal",
  "LB Nagar",
  "Secunderabad"
],  "Tripura": ["Agartala","Udaipur","Dharmanagar"],
  "Uttar Pradesh": ["Lucknow","Kanpur","Varanasi","Agra","Noida","Prayagraj"],
  "Uttarakhand": ["Dehradun","Haridwar","Rishikesh","Haldwani"],
  "West Bengal": ["Kolkata","Howrah","Durgapur","Siliguri","Asansol"]
};
const [instituteData, setInstituteData] = useState(null);

useEffect(() => {
  const fetchInstitute = async () => {
    try {
      const schoolCode = localStorage.getItem("schoolCode");

      if (!schoolCode) {
        console.warn("No schoolCode found in localStorage");
        return;
      }

      const res = await axios.get(
        `https://cleezoclass.com:4000/api/institute?dbName=${schoolCode}`
      );

      console.log("Institute Data:", res.data);
      setInstituteData(res.data);

    } catch (err) {
      console.error("Error fetching institute:", err);
    }
  };

  fetchInstitute();
}, []);
  return (
    <Section
  title="Campaigning"
  variant="marketing"
  className="campaignPopup"
>
  <div className="wrap">
<div className="wrap-left">
  <div className="wrap-top">
<div className="formRow campaignButtons campaignTopRow">
  <button type="button" className="registerBtn2" onClick={() => setSelectedCampaign("leadx")}>
    <img src={cleezoImg} alt="LeadX" className="campaignBtnImage" />
  </button>

  <button type="button" className="registerBtn2">
    <img src={googleImg} alt="Google" className="campaignBtnImage" />
  </button>

  <button type="button" className="registerBtn2">
    <img src={metaImg} alt="Meta" className="campaignBtnImage" />
  </button>

  <button type="button" className="registerBtn2">
    <img src={youtubeImg} alt="YouTube" className="campaignBtnImage" />
  </button>
</div>
</div>  

      {/* DETAILS */}
     {selectedCampaign === "leadx" && (
  <div className="wrap-bottom">
      <div className="sectionTitle" style={{ marginTop: "20px" }}>
        Details
      </div>

      <div className="formRow">
        {/* City */}
<div className="inputGroup">
  <label className="label">State & City</label>

  <select
    name="state"
    value={formData.state}
    onChange={handleChange}
    className="input btn-dropdown-FeesManagement"
  >
    <option value="">Select State</option>

    {!formData.state &&
      Object.keys(stateCityData).map((state) => (
        <option key={state} value={state}>
          {state}
        </option>
      ))}

    {formData.state && (
      <>
        <optgroup label={formData.state}>
          <option value={formData.state}>
            {formData.state}
          </option>

          {stateCityData[formData.state]?.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </optgroup>
      </>
    )}
  </select>
</div>

        <InputField
          label="Area"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="Enter Area"
          className="btn-dropdown-FeesManagement"
        />

        <InputField
          label="Radius"
          name="radius"
          value={formData.radius}
          onChange={handleChange}
          placeholder="Enter radius (km)"
          className="btn-dropdown-FeesManagement"
        />
      </div>

      {/* FILTERS */}
      <div className="sectionTitle" style={{ marginTop: "20px" }}>
        Filters
      </div>

      <div className="formRow">
        <InputField
          label="Occupation"
          name="occupation"
          value={formData.occupation}
          onChange={handleChange}
          type="select"
          options={[
            "Govt Employee","NGOs","Engineers","Doctors",
            "Small Scale Business","Medium Size Business",
            "Large Scale Business","Unregistered Business",
            "Farmers","Other"
          ]}
          className="btn-dropdown-FeesManagement"
        />

        <InputField
          label="Age"
          name="age"
          value={formData.age}
          onChange={handleChange}
          type="select"
          options={["18-25","25-35","36-40","41-45","46-55"]}
          className="btn-dropdown-FeesManagement"
        />

        <InputField
          label="Gender"
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          type="select"
          options={["Both","Male","Female","Not Disclosed"]}
          className="btn-dropdown-FeesManagement"
        />
      </div>

      {/* ORGANISATION DETAILS */}
      <div className="sectionTitle" style={{ marginTop: "20px" }}>
        Organisation Details
      </div>
<div className="formRow organisationButtons">
  <button type="button" className="registerBtn">
    {instituteData?.institute_name || "School Name"}
  </button>

  <button type="button" className="registerBtn">
    {instituteData?.address || "Address"}
  </button>

  <button type="button" className="registerBtn">
    {instituteData?.website || "Website"}
  </button>

  <button type="button" className="registerBtn">
    {instituteData?.institute_contact_number || "Phone Number"}
  </button>

  <button type="button" className="registerBtn">
    {instituteData?.area_name || "Location"}
  </button>

  <button
    type="button"
    className="registerBtn runBtn"
    onClick={handleRun}
    disabled={isRunDisabled}
    style={{
      opacity: isRunDisabled ? 0.5 : 1,
      cursor: isRunDisabled ? "not-allowed" : "pointer"
    }}
  >
    {isRunDisabled ? "Please wait 5 minutes..." : "Run"}
  </button>
</div>
      </div>
      )}
</div>
{/* <div className="formRow campaignButtons">
 
</div> */}
      
<div className="wrap-right">

   {selectedCampaign === "leadx" && (
  <div className="campaignContentWrapper">

   

    {/* RIGHT SIDE - STATUS */}
    <div className="campaignRight1">
  <div className="leadsList">
    {leads.length > 0 ? (
      leads.map((lead) => {
        const formattedDate = lead.date
          ? new Date(lead.date).toISOString().split("T")[0]
          : "N/A";

        const formattedTime = lead.date
          ? new Date(lead.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "N/A";

        return (
          <div key={lead.id} className="leadItemWrapper">
            <div className="leadContent">
              <div className="leadDate">
                <div className="leadDateValue">{formattedDate}</div>
                <div className="leadTime">{formattedTime}</div>
              </div>

              <div className="leadAvatar">
                <img src={cleezo} alt="logo" className="leadAvatarLogo" />
              </div>

              <div className="leadInfo">
                <span className="leadName">{lead.full_name}</span> - {lead.occupation || "N/A"}
                <br />
                Contact: {lead.mobile_number} / {lead.email_id || "N/A"}
                <br />
                Gender: {lead.gender || "N/A"} / Address: {lead.address || "N/A"}
              </div>
            </div>
          </div>
        );
      })
    ) : (
      <div className="noLeadsMessage" style={{ textAlign: "center", padding: "40px", color: "#888" }}>
        🚫 No leads available at the moment.
        <br />
        Please run the campaign or check back later.
      </div>
    )}
  </div>
</div>
  </div>
)}

      
      {isLoading && (
        
            <div className="campaignLeft">

  <div className="campaignLoaderOverlay">
    <img src={loader} alt="Loading..." />
  </div>
  </div>
)}
</div>
</div>
    </Section>
  );
};

export default AdmissionReportPopup;
