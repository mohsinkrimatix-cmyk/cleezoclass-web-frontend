import './MouOrderForm.css';
import { useState, useRef } from 'react';
import axios from 'axios';
import headerImg from '../assets/header.png';
import footerImg from '../assets/footer.png';
import qrImg from '../assets/qr.jpeg';

export default function MouOrderForm() {
  const [data, setData] = useState({
    contactPerson: '',
    designation: '',
    schoolName: '',
    address: '',
    phone: '',
    email: '',
    totalAmount: '',
    advanceAmount: '',
    balanceAmount: '',
    executedDate: '',
    city: '',
    state: '',
    strength: '',
    advancePaidDate: "",   // ✅ NEW
  balancePaidDate: "",   // ✅ NEW
  });

  const [showBranchPopup, setShowBranchPopup] = useState(false);
  const [branchData, setBranchData] = useState({
    branchName: '',
    address: '',
    principalName: '',
    phone: '',
    email: '',
    strength: '',
  });
  const [branches, setBranches] = useState<any[]>([]);
  const [editingBranchIndex, setEditingBranchIndex] = useState<number | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [plan, setPlan] = useState('');
  const [moduleCount, setModuleCount] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [amountPerStudent, setAmountPerStudent] = useState('');
  const [witness1, setWitness1] = useState('');
const [witness2, setWitness2] = useState('');

const signatureRef = useRef<HTMLCanvasElement | null>(null);
let drawing = false;

const startDraw = (e: React.MouseEvent) => {
  const canvas = signatureRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  drawing = true;
  ctx.beginPath();
  ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
};

const draw = (e: React.MouseEvent) => {
  if (!drawing) return;

  const canvas = signatureRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.lineWidth = 4;
ctx.lineCap = "round";
ctx.lineJoin = "round";
ctx.strokeStyle = "#000";

  ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  ctx.stroke();
};

const endDraw = () => {
  drawing = false;
};

const clearSignature = () => {
  const canvas = signatureRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
};


const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;

  let newValue = value;
  if (["strength", "amountPerStudent", "advanceAmount"].includes(name)) {
    newValue = value.replace(/[^0-9.]/g, "");
  }

  setData((prev) => {
    let updatedData = { ...prev, [name]: newValue };

    const strength = parseFloat(updatedData.strength || "0");
    const amountPerStudent = parseFloat(updatedData.amountPerStudent || "0");
    const advanceAmount = parseFloat(updatedData.advanceAmount || "0");

    const totalAmount = strength * amountPerStudent;
    updatedData.totalAmount = (Math.round(totalAmount * 100) / 100).toFixed(2);

    const balance = totalAmount - advanceAmount;
    updatedData.balanceAmount = (Math.round(balance * 100) / 100).toFixed(2);

    return updatedData;
  });
};
  const handleBranchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBranchData({ ...branchData, [e.target.name]: e.target.value });
  };

  const handleAddBranch = () => {
    if (!branchData.principalName.trim()) {
      alert('Principal Name is required');
      return;
    }
    if (!branchData.email.trim()) {
      alert('Email is required');
      return;
    }
    if (editingBranchIndex !== null) {
      // UPDATE EXISTING
      const updated = [...branches];
      updated[editingBranchIndex] = branchData;
      setBranches(updated);
    } else {
      // ADD NEW
      setBranches([...branches, branchData]);
    }
    // RESET
    setBranchData({
      branchName: '',
      address: '',
      principalName: '',
      phone: '',
      email: '',
      strength: '',
    });
    setEditingBranchIndex(null);
    setShowBranchPopup(false);
  };

  const handleDeleteBranch = () => {
    if (editingBranchIndex === null) return;
    const updated = branches.filter((_, i) => i !== editingBranchIndex);
    setBranches(updated);
    setEditingBranchIndex(null);
    setShowBranchPopup(false);
    setBranchData({
      branchName: '',
      address: '',
      principalName: '',
      phone: '',
      email: '',
      strength: '',
    });
  };

  const submit = async () => {
    try {
      const payload = {
        ...data,
        branches,
        plan,
        moduleCount,
        paymentType,
        amountPerStudent,
      };

      // Submit the form data
      await axios.post('https://cleezoclass.com:8443/api/submit', payload);

      

      alert('Submitted! A signing link has been sent to your email.');
    } catch (err) {
      console.error(err);
      alert('Failed to submit.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
    ];
    if (!allowedTypes.includes(file.type)) {
      alert('Only PDF, JPG or PNG allowed');
      return;
    }
    setUploadedFile(file);
  };

  const states = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ];

  const cities: Record<string, string[]> = {
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
],    "Arunachal Pradesh": ["Itanagar", "Tawang", "Pasighat", "Ziro"],
    "Assam": ["Guwahati", "Dibrugarh", "Jorhat", "Silchar", "Tezpur"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia"],
    "Chhattisgarh": ["Raipur", "Bilaspur", "Durg", "Korba", "Jagdalpur"],
    "Goa": ["Panaji", "Margao", "Vasco da Gama", "Ponda"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
    "Haryana": ["Chandigarh", "Gurgaon", "Faridabad", "Panipat", "Karnal"],
    "Himachal Pradesh": ["Shimla", "Dharamshala", "Manali", "Mandi"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro Steel City"],
    "Karnataka": ["Bangalore", "Mysore", "Mangalore", "Hubli", "Belgaum"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Alappuzha"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane"],
    "Manipur": ["Imphal", "Thoubal", "Bishnupur"],
    "Meghalaya": ["Shillong", "Tura", "Nongpoh"],
    "Mizoram": ["Aizawl", "Lunglei", "Serchhip"],
    "Nagaland": ["Kohima", "Dimapur", "Mokokchung"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur"],
    "Punjab": ["Chandigarh", "Amritsar", "Ludhiana", "Jalandhar", "Patiala"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Bikaner", "Ajmer"],
    "Sikkim": ["Gangtok", "Namchi", "Geyzing"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
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
],    "Tripura": ["Agartala", "Udaipur", "Dharmanagar"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Noida"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Nainital", "Rishikesh"],
    "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Siliguri", "Durgapur"],
    "Andaman and Nicobar Islands": ["Port Blair", "Car Nicobar"],
    "Chandigarh": ["Chandigarh"],
    "Dadra and Nagar Haveli and Daman and Diu": ["Silvassa", "Daman", "Diu"],
    "Delhi": ["New Delhi", "Dwarka", "Rohini", "Karol Bagh"],
    "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla"],
    "Ladakh": ["Leh", "Kargil"],
    "Lakshadweep": ["Kavaratti", "Agatti"],
    "Puducherry": ["Pondicherry", "Karaikal", "Mahe", "Yanam"]
  };

  const planModules: Record<string, string> = {
    Starter: '20',
    Standard: '40',
    Enterprise: '80'
  };

  const handlePlanChange = (value: string) => {
    setPlan(value);
    if (value === 'other') {
      setModuleCount('');
    } else {
      setModuleCount(planModules[value]);
    }
  };

  const paymentOptions =
    plan === 'standard' || plan === 'enterprise'
      ? [
          { value: 'annually', label: 'Annually' },
          { value: 'halfyearly', label: 'Half Yearly' },
          { value: 'quarterly', label: 'Quarterly' }
        ]
      : [
          { value: 'annually', label: 'Annually' },
          { value: 'halfyearly', label: 'Half Yearly' }
        ];

  return (
    <table className="print-wrapper">
      <thead>
        <tr><td>
          <img src={headerImg} alt="Header" className="header-img" />
        </td></tr>
      </thead>
      <tbody>
        <tr><td>
          <div className="page">
            <div className="title">MEMORANDUM OF UNDERSTANDING</div>
            <p className="mou-line">
  <span className="mou-text">
    This Memorandum of Understanding (MOU) is made and executed on
  </span>

  <input
    type="date"
    name="executedDate"
    value={data.executedDate}
    onChange={handleChange}
    className="inline-input date-input"
  />

  {" "}at{" "}

  <select
    name="state"
    value={data.state}
    onChange={(e) =>
      setData({ ...data, state: e.target.value, city: '' })
    }
    className="inline-input stretch-field"
  >
    <option value="">Select State</option>
    {states.map((s) => (
      <option key={s} value={s}>{s}</option>
    ))}
  </select>
</p>

<p className="mou-line second-line">
  <select
  name="city"
  value={data.city}
  onChange={handleChange}
  className="inline-input city-field"
  disabled={!data.state}
>
    <option value="">Select City</option>
    {data.state &&
      cities[data.state].map((c) => (
        <option key={c} value={c}>{c}</option>
      ))
    }
  </select>
</p>

            <p><strong>BETWEEN</strong></p>

<p>
  M/s <strong>CODENAUT PRIVATE LIMITED</strong>, having its registered office at
  Capitol Tower, Plot No. 1, 2nd Floor, Beside N Convention, Khanamet,
  Hitech City, Madhapur, Hyderabad, Telangana 500081, India,
  represented by Director, hereinafter referred to as the <strong>First Party</strong>.
</p>

<p><strong>AND</strong></p>

<p className="stretch-line">
  M/s{" "}
  <span className={`underline-text stretch-field ${data.schoolName ? "filled" : ""}`}>
    {data.schoolName || ""}
  </span>
</p>

<p className="stretch-line">
  having its office at{" "}
  <input
    type="text"
    className="inline-input stretch-field"
    placeholder=""
  />
</p>

<p>
  India, represented by Mr. or Ms.{" "}
  <span className={`underline-text ${data.contactPerson ? "filled" : ""}`}>
    {data.contactPerson || "________________"}
  </span>
  {" "}hereinafter referred to as the <strong>Second Party</strong>.
</p>
<p>The First party and Second Party are hereinafter individually referred to as a "Party" and collectively as the "Parties" </p>

            <h4>1. PURPOSE OF THE MOU</h4>

<p>
The purpose of this MOU is to define the terms under which the First Party shall
provide a school management and communication platform to the Second Party,
and the Second Party shall subscribe to and use the platform for a minimum agreed term.
</p>


<h4>2. OBLIGATIONS OF THE SECOND PARTY</h4>

<ul>
<li>
The School or Institution shall submit a duly filled Order Form in the prescribed format along with the first-year payment to the First Party.
</li>

<li>
The School or Institution agrees to continue the program for a minimum period of two years from the date of deployment.
</li>

<li>
The School or Institution shall provide accurate and complete data required for onboarding and platform setup in a timely manner.
</li>
</ul>


<h4>3. OBLIGATIONS OF THE FIRST PARTY</h4>

<p>
Upon receipt of the completed Order Form and required data, the First Party shall provide login credentials and access details within <strong>ten days</strong> of data submission.
</p>

<p>
The First Party shall provide a fully integrated web and mobile based school management platform.
</p>


<h4>4. TOOL OVERVIEW</h4>

<p>The platform includes, but is not limited to, the following features:</p>

<ul>
<li>AI driven assistance for administrative operations</li>
<li>Centralized data management</li>
<li>Attendance tracking and reporting</li>
<li>Performance and academic management</li>
<li>Streamlined communication between school management, staff, and stakeholders</li>
</ul>


<h4>5. IMPLEMENTATION AND TRAINING</h4>

<ul>
<li>
The First Party shall assist in the deployment and configuration of the platform within the School or Institution.
</li>

<li>
Training sessions shall be provided to school staff, teachers, and administrators to ensure effective usage of the platform.
</li>
</ul>


<h4>6. TERMS OF PAYMENT</h4>

<h5>6.1 Initial Payment</h5>

<p>
To initiate the onboarding process, the Second Party shall make the following payments:
</p>

<ul>
<li>
Fifty percent of the student login charges based on the estimated annual student count.
</li>
</ul>

<h5>6.2 Annual Billing</h5>

<ul>
<li>The platform shall be billed annually.</li>
<li>The first invoice shall be raised upon deployment of the platform.</li>
<li>A Year-on-Year price escalation of 5 percent shall apply after completion of the first two years.</li>
</ul>

<h5>6.3 Payment Due Date</h5>

<p>
All payments shall be payable immediately upon receipt of invoice from the First Party.
</p>


<h4>7. STUDENT STRENGTH ADJUSTMENT</h4>

<p>
Any increase or decrease in student strength shall be reviewed annually, and billing shall be adjusted accordingly for subsequent billing cycles.
</p>


<h4>8. PAYMENT DETAILS</h4>

<div className="payment-section">

<div className="bank-details">

<p>Payments may be made to:</p>

<p>
<strong>Account Name:</strong> Codenaut Private Limited<br/>
<strong>Account Number:</strong> 126520800000286<br/>
<strong>IFSC Code:</strong> YESB0001265<br/>
<strong>Bank Branch:</strong> Shaikpet, Hyderabad
</p>

<p>
Alternatively, payment may be made via UPI using the provided QR code.
</p>

</div>

<div className="qr-box">
<div className="scan-text">SCAN & PAY</div>

<img src={qrImg} alt="QR Code" className="qr-image"/>

<div className="upi-text">
UPI ID: yespay.mabs1265208wkito286@yesbank
</div>
</div>

</div>

            

            <div className="order-form-box">
              <h3 className="center">ORDER FORM</h3>

              <div className="line">
                SCHOOL / INSTITUTION NAME:
                <input name="schoolName" value={data.schoolName} onChange={handleChange} />
              </div>

              <div className="line two-fields">
                <div>
                  CONTACT PERSON NAME:
                  <input name="contactPerson" value={data.contactPerson} onChange={handleChange} />
                </div>
                <div>
                  DESIGNATION:
                  <input name="designation" value={data.designation} onChange={handleChange} />
                </div>
              </div>

              <div className="line">
                ADDRESS:
                <textarea name="address" value={data.address} onChange={handleChange} />
              </div>

              <div className="line">
                PHONE NO:
                <input name="phone" value={data.phone} autoComplete='off' onChange={handleChange} />
              </div>

              <div className="line">
                EMAIL ID:
                <input name="email" value={data.email} onChange={handleChange} />
              </div>

              <div className="line">
                <label>Strength (Total Students)</label>
                <input
                  type="number"
                  name="strength"
                  value={data.strength}
                  onChange={handleChange}
                  placeholder="Enter total strength"
                />
              </div>

<div className="line">
  <label>Price Per Student (₹)</label>
  <input
    type="number"
    name="amountPerStudent"
    value={data.amountPerStudent}
    onChange={handleChange}
    placeholder="Enter price per student"
    className="no-spin"
  />
</div>

              <button
                type="button"
                className="add-branch-btn"
                onClick={() => {
                  setEditingBranchIndex(null);
                  setBranchData({
                    branchName: '',
                    address: '',
                    principalName: '',
                    phone: '',
                    email: '',
                    strength: '',
                  });
                  setShowBranchPopup(true);
                }}
              >
                + Add Branch
              </button>

              {branches.length > 0 && (
                <div className="branch-list">
                  {branches.map((b, index) => (
                    <div
                      key={index}
                      className="branch-chip"
                      onClick={() => {
                        setBranchData(b);
                        setEditingBranchIndex(index);
                        setShowBranchPopup(true);
                      }}
                    >
                      Branch: {b.branchName} - {b.strength}
                    </div>
                  ))}
                </div>
              )}

              <h4 className="center">PAYMENT DETAILS</h4>
         <table>
      <tbody>
<tr>
  <td>Total Amount</td>
  <td>
    <input
      type="text"
      readOnly
      value={`${data.strength || 0} students × ${data.amountPerStudent || 0} = ${data.totalAmount || 0}`}
      style={{
        width: "100%",
        padding: "6px 10px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        fontSize: "14px",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#fff",
      }}
    />
  </td>
</tr>
        <tr>
          <td>Advance Amount</td>
          <td>
            <input
              name="advanceAmount"
              value={data.advanceAmount}
              onChange={handleChange}
            />
          </td>
        </tr>
        <tr>
          <td>Balance Amount</td>
          <td>
            <input
              name="balanceAmount"
              value={data.balanceAmount}
              readOnly // User cannot edit manually
            />
          </td>
        </tr>
        <tr>
  <td>Advance Paid Date</td>
  <td>
    <input
      type="date"
      name="advancePaidDate"
      value={data.advancePaidDate || ""}
      onChange={handleChange}
    />
  </td>
</tr>

<tr>
  <td>Balance Paid Date</td>
  <td>
    <input
      type="date"
      name="balancePaidDate"
      value={data.balancePaidDate || ""}
      onChange={handleChange}
    />
  </td>
</tr>
      </tbody>
    </table>

    <p style={{marginTop:"20px"}}>
Both the parties have affixed their signature as token of their acceptance to the terms and conditions as mentioned above:
</p>

<table className="signature-table">
<tbody>

<tr>
<td>
<strong>For M/s. CODENAUT PRIVATE LIMITED</strong>
</td>

<td>
<strong>For</strong>
</td>
</tr>

<tr className="signature-space">
<td>
<strong>Partner/Marketing Partner</strong>
</td>

<td>
<div>Signature:</div>

<div className="signature-row-box">

<canvas
  ref={signatureRef}
  width={300}
  height={80}
  className="signatureCanvas"
  onMouseDown={startDraw}
  onMouseMove={draw}
  onMouseUp={endDraw}
  onMouseLeave={endDraw}
/>

<button
  type="button"
  className="clear-btn"
  onClick={clearSignature}
>
  Clear
</button>

</div>

<div className="designation-below-sign">
Director/Correspondent/Principal
</div>
</td>
</tr>

<tr>
<td>
<strong>M/s. CODENAUT PRIVATE LIMITED</strong><br/>
Capitol Tower, Plot No 1, 2nd Floor Beside N Convention,<br/>
Khanamet, Hitech City, Madhapur HYD, TG 500081
</td>

<td>
<label>Address:</label>
<textarea placeholder="Enter address"></textarea>
</td>
</tr>

</tbody>
</table>
              {showBranchPopup && (
                <div
                  className="popup-overlay"
                  onClick={() => {
                    setShowBranchPopup(false);
                    setEditingBranchIndex(null);
                  }}
                >
                  <div
                    className="popup-box"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3>{editingBranchIndex !== null ? 'Edit Branch' : 'Add Branch'}</h3>
                    <div className="popup-field">
                      <label>Branch Name</label>
                      <input
                        name="branchName"
                        value={branchData.branchName}
                        onChange={handleBranchChange}
                      />
                    </div>
                    <div className="popup-field">
                      <label>Address</label>
                      <input
                        name="address"
                        value={branchData.address}
                        onChange={handleBranchChange}
                      />
                    </div>
                    <div className="popup-field">
                      <label>Principal Name</label>
                      <input
                        name="principalName"
                        value={branchData.principalName}
                        onChange={handleBranchChange}
                      />
                    </div>
                    <div className="popup-field">
                      <label>Phone</label>
                      <input
                        name="phone"
                        autoComplete='off'
                        value={branchData.phone}
                        onChange={handleBranchChange}
                      />
                    </div>
                    <div className="popup-field">
                      <label>Email</label>
                      <input
                        name="email"
                        value={branchData.email}
                        onChange={handleBranchChange}
                      />
                    </div>
                    <div className="popup-field">
                      <label>Strength</label>
                      <input
                        name="strength"
                        value={branchData.strength}
                        onChange={handleBranchChange}
                      />
                    </div>
                    <div className="popup-buttons">
                      <button type="button" onClick={handleAddBranch}>
                        {editingBranchIndex !== null ? 'Update Branch' : 'Submit Branch'}
                      </button>
                      {editingBranchIndex !== null && (
                        <button
                          type="button"
                          onClick={handleDeleteBranch}
                          style={{ background: '#e53935', color: 'white' }}
                        >
                          Delete
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowBranchPopup(false);
                          setEditingBranchIndex(null);
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="submit-container">
                <div className="left-actions">
                  <label className="upload-btn">
                    Upload File
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      hidden
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
                <button className="submit-btn" onClick={submit}>
                  Submit
                </button>
           
              </div>
              {uploadedFile && (
                <div style={{ marginTop: '8px', fontSize: '14px', textAlign: 'right' }}>
                  Selected: {uploadedFile.name}
                </div>
              )}
            </div>
          </div>
        </td></tr>
      </tbody>
      <tfoot>
        <tr><td>
          <img src={footerImg} alt="Footer" className="footer-img" />
        </td></tr>
      </tfoot>
    </table>
  );
}