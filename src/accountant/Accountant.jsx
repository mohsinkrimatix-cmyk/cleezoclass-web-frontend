import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import axios from "axios";

const CommercePage = () => {
  const navigate = useNavigate();


  const font = "'Century Gothic', 'AppleGothic', sans-serif";
  const container = {
    fontFamily: font,
    backgroundColor: "#F0F0F0",
    minHeight: "100vh",
    padding: "20px",
    boxSizing: "border-box",
  };
  const header = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    padding: "15px 25px",
    marginBottom: "25px",
    flexWrap: "wrap",
  };
  const logoBox = { display: "flex", alignItems: "center", gap: "10px" };
  const logo = { width: "40px", height: "40px", backgroundColor: "#001F3F", borderRadius: "8px" };
  const logoText = { fontSize: "18px", fontWeight: "600" };
  const logoSub = { fontSize: "12px", color: "#777" };
  const schoolTitle = { fontSize: "20px", fontWeight: "600", color: "#333", textAlign: "center", flex: 1 };
  const buttonGroup = { display: "flex", gap: "10px" };
  const btn = { backgroundColor: "#e0e0e0", border: "none", borderRadius: "10px", padding: "8px 16px", cursor: "pointer", fontSize: "14px", fontWeight: "500", fontFamily: font };
  const card = { backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", padding: "20px", cursor: "pointer" };
  const sectionTitle = { fontSize: "28px", fontWeight: "600", color: "#333", marginBottom: "10px", textAlign: "center", cursor: "pointer" };
  const listItem = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", fontSize: "22px" };
  const circle = (color) => ({ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: color, marginRight: "10px" });
  const progress = (c1, c2) => ({ display: "flex", width: "90px", height: "20px", borderRadius: "4px", overflow: "hidden", background: `linear-gradient(to right, ${c1} 60%, ${c2} 40%)`, marginLeft: "auto" });
  const smallText = { fontSize: "15px", color: "#666", textAlign: "left" };
  const itemContent = { display: "flex", alignItems: "flex-start", flexDirection: "column", textAlign: "left" };

  const commerceItems = [
    { color: "#9CC3F8", title: "Income", desc: ["Fees Paid Report", "Fees Unpaid Report", "Income Ledger"], link: "/commerce/income" },
    { color: "#CFA7A7", title: "Expense", desc: ["Excess Expenses Report", "Pending Expenses", "Expense Ledger"], link: "/commerce/expense" },
  ];

    const [projectedPending, setProjectedPending] = useState(0);
  const [finalPaid, setFinalPaid] = useState(0);
  const [finalPending, setFinalPending] = useState(0);
   const [loading, setLoading] = useState(true); 
   const [allFees, setAllFees] = useState([]);
const [classFeeMap, setClassFeeMap] = useState({}); 
      const schoolCode = localStorage.getItem('schoolCode');
  const [timeFilter, setTimeFilter] = useState("thisWeek"); // <-- NEW filter

   const [feeData, setFeeData] = useState({
     fees: [],
     total_fees: 0
   });
  const [name, setName] = useState(""); // state for user name

  // Fetch user name on component mount
  useEffect(() => {
    const fetchUserName = async () => {
      const username = localStorage.getItem("username");
      if (!username) return;

      try {
        const response = await fetch(`https://cleezoclass.com:4000/getUserName?username=${encodeURIComponent(username)}`);
        if (!response.ok) return;
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) return;
        const data = await response.json();
        if (data && typeof data.name === "string") setName(data.name);
      } catch (err) {
        console.error("Error fetching user name:", err);
      }
    };

    fetchUserName();
  }, []);

  const [chartData, setChartData] = useState([]);


  const filterOptions = [
    { label: "This Week", value: "thisWeek" },
    { label: "This Month", value: "thisMonth" },
    { label: "Last Month", value: "lastMonth" },
    { label: "This Year", value: "thisYear" },
    { label: "Half Year", value: "halfYear" },
    { label: "Financial Year", value: "financialYear" },
  ];



const applyTimeFilter = () => {
  if (!allFees.length) {
    console.warn("⚠️ No fee data available (allFees is empty)");
    return;
  }

  const now = new Date();
  let filtered = [];

  console.group("🧭 Time Filter Debug Logs");
  console.log("🕒 Current Date:", now);
  console.log("📊 Selected Time Filter:", timeFilter);

  switch (timeFilter) {
    case "thisWeek": {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay()); // Start of the week (Sunday)
      const end = new Date(start);
      end.setDate(start.getDate() + 6); // End of week (Saturday)

      console.log("📅 Week Start:", start);
      console.log("📅 Week End:", end);

      filtered = allFees.filter(
        (f) =>
          new Date(f.created_at) >= start && new Date(f.created_at) <= end
      );
      console.table(
        filtered.map((f) => ({
          ID: f.id,
          Date: f.created_at,
          Paid: f.Paid_Amount,
          Pending: (Number(f.CompleteFee) || 0) - (Number(f.Paid_Amount) || 0),
        }))
      );
      break;
    }

    case "thisMonth": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      console.log("📅 Month:", now.toLocaleString("en-US", { month: "long" }));
      console.log("📅 Month Start:", start);
      console.log("📅 Month End:", end);

      filtered = allFees.filter(
        (f) =>
          new Date(f.created_at) >= start && new Date(f.created_at) <= end
      );
      console.table(
        filtered.map((f) => ({
          Date: f.created_at,
          Paid: f.Paid_Amount,
          Pending: (Number(f.CompleteFee) || 0) - (Number(f.Paid_Amount) || 0),
        }))
      );
      break;
    }

    case "lastMonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);

      console.log("📅 Last Month Start:", start);
      console.log("📅 Last Month End:", end);

      filtered = allFees.filter(
        (f) =>
          new Date(f.created_at) >= start && new Date(f.created_at) <= end
      );
      console.table(
        filtered.map((f) => ({
          Date: f.created_at,
          Paid: f.Paid_Amount,
          Pending: (Number(f.CompleteFee) || 0) - (Number(f.Paid_Amount) || 0),
        }))
      );
      break;
    }

    case "halfYear": {
      const start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      console.log("🗓️ Half-Year Start:", start, "| Current:", now);

      filtered = allFees.filter((f) => new Date(f.created_at) >= start);
      console.table(
        filtered.map((f) => ({
          Month: new Date(f.created_at).toLocaleString("en-US", { month: "short" }),
          Paid: f.Paid_Amount,
          Pending: (Number(f.CompleteFee) || 0) - (Number(f.Paid_Amount) || 0),
        }))
      );
      break;
    }

    case "thisYear": {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);

      console.log("📆 This Year:", now.getFullYear());
      console.log("📅 Year Start:", start);
      console.log("📅 Year End:", end);

      filtered = allFees.filter(
        (f) =>
          new Date(f.created_at) >= start && new Date(f.created_at) <= end
      );
      console.table(
        filtered.map((f) => ({
          Month: new Date(f.created_at).toLocaleString("en-US", { month: "short" }),
          Paid: f.Paid_Amount,
          Pending: (Number(f.CompleteFee) || 0) - (Number(f.Paid_Amount) || 0),
        }))
      );
      break;
    }

    case "financialYear": {
      const fyStartMonth = 3; // April (0-indexed)
      const year =
        now.getMonth() >= fyStartMonth
          ? now.getFullYear()
          : now.getFullYear() - 1;
      const start = new Date(year, fyStartMonth, 1);
      const end = new Date(year + 1, fyStartMonth, 0);

      console.log("💰 Financial Year:", `${year}-${year + 1}`);
      console.log("📅 FY Start:", start);
      console.log("📅 FY End:", end);

      filtered = allFees.filter(
        (f) =>
          new Date(f.created_at) >= start && new Date(f.created_at) <= end
      );
      console.table(
        filtered.map((f) => ({
          Month: new Date(f.created_at).toLocaleString("en-US", { month: "short" }),
          Paid: f.Paid_Amount,
          Pending: (Number(f.CompleteFee) || 0) - (Number(f.Paid_Amount) || 0),
        }))
      );
      break;
    }

    default:
      filtered = allFees;
      console.warn("⚠️ No specific time filter applied. Showing all records.");
  }

  console.log("✅ Filtered Records Count:", filtered.length);

  // --- 🧮 Grouping Logic for Chart ---
  const groupBy = (array, keyFn) =>
    array.reduce((acc, item) => {
      const key = keyFn(item);
      acc[key] = acc[key] || { Paid: 0, Pending: 0 };
      acc[key].Paid += Number(item.Paid_Amount) || 0;
      acc[key].Pending +=
        (Number(item.CompleteFee) || 0) - (Number(item.Paid_Amount) || 0);
      return acc;
    }, {});

  let groupedData = {};

if (timeFilter === "thisWeek") {
  groupedData = groupBy(filtered, (f) =>
    new Date(f.created_at).toLocaleDateString("en-US", { weekday: "short" })
  );
} else if (timeFilter === "thisMonth" || timeFilter === "lastMonth") {
  groupedData = groupBy(filtered, (f) => {
    const d = new Date(f.created_at);
    return `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })}`; // e.g. "8 Sep"
  });
} else {
  groupedData = groupBy(filtered, (f) =>
    new Date(f.created_at).toLocaleDateString("en-US", { month: "short" })
  );
}

  console.group("📊 Grouped Data Breakdown");
  Object.entries(groupedData).forEach(([key, val]) => {
    console.log(
      `📅 ${key}: Paid = ${val.Paid.toLocaleString()}, Pending = ${val.Pending.toLocaleString()}`
    );
  });
  console.groupEnd();

  const chartData = Object.entries(groupedData).map(([label, values]) => ({
    label,
    Paid: values.Paid,
    Pending: values.Pending,
  }));

  console.log("📈 Final Chart Data:", chartData);
  console.groupEnd();

  setChartData(chartData);
};

  useEffect(() => {
    applyTimeFilter();
  }, [timeFilter, allFees]);

   const getCompleteFeeBasedOnClass = async (classNames) => {
     try {
       const response = await axios.post(`https://cleezoclass.com:4000/api/getClassFeeDetailsledger`, {
         schoolCode,
         classNames
       });
    
       if (!response.data || response.data.error) {
         throw new Error(response.data.error || 'Failed to fetch class fee details');
       }
    
       console.log("Class-wise Complete Fees:", response.data.data);
    
       // ✅ 2. Save first fee for each unique class
       const uniqueFees = {};
       response.data.data.forEach((item) => {
         if (!uniqueFees[item.Class_name]) {
           uniqueFees[item.Class_name] = item.CompleteFee;
         }
       });
    
       // ✅ 3. Save to state
       setClassFeeMap(uniqueFees);
    
     } catch (error) {
       console.error("Error fetching class fee details:", error.message);
     }
   };

   const fetchFeeData = async () => {
    const schoolCode = localStorage.getItem("schoolCode");
    try {
      setLoading(true);
      const res = await axios.post(
        `https://cleezoclass.com:4000/api/feeDataFinanceNew?schoolCode=${schoolCode}`
      );

      const fees = res.data.results || [];
      setAllFees(fees);

      const totalPaid = fees.reduce((a, b) => a + (Number(b.Paid_Amount) || 0), 0);
      const totalPending = fees.reduce(
        (a, b) => a + (Number(b.CompleteFee) - (Number(b.Paid_Amount) || 0)),
        0
      );

      setFinalPaid(totalPaid);
      setFinalPending(totalPending);

      // Default Chart
      setChartData([
        { stage: "Start", Paid: 0, Pending: 0 },
        { stage: "Paid", Paid: totalPaid, Pending: 0 },
        { stage: "Pending", Paid: totalPaid, Pending: totalPending },
      ]);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeData();
  }, []);


  return (
    <div style={container}>
      {/* Header */}
      <div style={header}>
        <div style={logoBox}>
          <div style={logo}></div>
          <div>
            <div style={logoText}>Tanz AI</div>
            <div style={logoSub}>For Schools</div>
          </div>
        </div>
        <div style={schoolTitle}>ABC School, Miyapur, Hyderabad</div>
        <div style={buttonGroup}>
          <button style={btn}>Switch Branch ▾</button>
          <button style={btn}>Logout</button>
        </div>
      </div>
      {/* Welcome */}
   <div style={{ fontSize: "22px", fontWeight: "600", marginBottom: "15px", textAlign: "left" }}>
        {name ? `Welcome ${name}..!` : "Welcome Marketing Department..!"}
      </div>
      {/* Commerce Section */}
      <div style={card}>
        <div style={sectionTitle}>Commerce</div>
        {/* Filter Row */}
     <div
  style={{
    fontSize: "14px",
    marginBottom: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  }}
>
  <span>Total Term Fees: {timeFilter || ""}</span>
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <strong>Filter:</strong>
    <select
      value={timeFilter}
      onChange={(e) => setTimeFilter(e.target.value)}
      style={{
        padding: "5px 10px",
        borderRadius: "6px",
        border: "1px solid #ccc",
      }}
    >
      {filterOptions.map((f) => (
        <option key={f.value} value={f.value}>
          {f.label}
        </option>
      ))}
    </select>
  </div>
</div>

        {/* Graph & Summary Row */}
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
          {/* Graph on Left */}
          <div style={{ flex: "1 1 55%", minWidth: "250px", height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value)} />
                <Legend />
                <Line type="monotone" dataKey="Paid" stroke="#6CA6FF" strokeWidth={3} name="Total Paid" />
                <Line type="monotone" dataKey="Pending" stroke="#9C6262" strokeWidth={3} name="Total Pending" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Income & Expense Summary on Right */}
          <div style={{ flex: "1 1 40%", minWidth: "280px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {commerceItems.map((i) => (
              <div key={i.title} style={listItem} onClick={() => navigate(i.link)}>
                <div style={{ display: "flex", alignItems: "flex-start" }}>
                  <div style={circle(i.color)}></div>
                  <div style={itemContent}>
                    <div style={{ fontWeight: "500", cursor: "pointer" }}>{i.title}</div>
                    <div style={smallText}>
                      {i.desc.map((d, idx) => <div key={idx}>{d}</div>)}
                    </div>
                  </div>
                </div>
                <div style={progress("#B97FA5", "#92D09B")}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommercePage;