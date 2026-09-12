const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const generatePoster = require("../utils/generatePoster");
const getSchoolDetails = require("../utils/getSchoolDetails");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files allowed'));
  }
});

// Database connection function
const getDbConnection = (schoolCode) => {
  return mysql.createConnection({
    host: '162.215.210.38',
    user: 'root',
    password: 'NavyAtagsoLnovA@$000',
    database: schoolCode
  }).promise(); // CRITICAL FIX: Add .promise() for async/await .execute()
};
// SEND EXPENSES TO SUPER ADMIN
router.post("/expenses-superadmin", async (req, res) => {
  const { schoolCode, fromDate, toDate, expenseType, expenses } = req.body;

  if (!schoolCode || !fromDate || !toDate || !expenses?.length) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const totalAmount = expenses.reduce(
      (sum, e) => sum + Number(e.price || 0),
      0
    );

    // 1️⃣ Insert report
    const [reportResult] = await connection.query(
      `
      INSERT INTO superadmin_expense_reports
      (school_code, expense_type, from_date, to_date, total_amount)
      VALUES (?, ?, ?, ?, ?)
      `,
      [schoolCode, expenseType || null, fromDate, toDate, totalAmount]
    );

    const reportId = reportResult.insertId;

    // 2️⃣ Insert expense items
    for (const item of expenses) {
      await connection.query(
        `
        INSERT INTO superadmin_expense_items
        (report_id, expense_date, expense_type, expense_name, description, amount)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          reportId,
          item.expense_date || null,
          item.expense_type,
          item.expense_name,
          item.description,
          item.price,
        ]
      );
    }

    await connection.commit();

    res.status(200).json({
      message: "Expenses sent to Super Admin successfully",
      reportId,
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
});
router.get('/chat_requests/sessions', async (req, res) => {
  let db;
  try {
    console.log("📥 GET /chat_requests/sessions called");

    const schoolCode = req.query.schoolCode; // ✅ FIX
    console.log("🏫 School Code received:", schoolCode);

    if (!schoolCode) {
      console.error("❌ schoolCode missing in query params");
      return res.status(400).json({ error: "schoolCode missing" });
    }

    db = await getDbConnection(schoolCode);
    console.log("🔌 DB connected to:", schoolCode);

    const sql = "SELECT id FROM chat_requests ORDER BY id DESC";
    console.log("📄 Executing query:", sql);

    const [rows] = await db.execute(sql);

    console.log("✅ Sessions fetched:", rows);
    res.json(rows);

  } catch (err) {
    console.error("🔥 Error fetching session IDs:", err);
    res.status(500).json({
      error: "Error fetching session IDs",
      details: err.message
    });
  } finally {
    if (db) {
      await db.end();
      console.log("🔒 DB connection closed");
    }
  }
});


router.post("/chat_requests/create", async (req, res) => {
  let db;
  try {
    const {
      schoolCode,
      sessionId,
      complaintTo,
      party1Name,
      party1Type,
      complaintText
    } = req.body;

    if (!schoolCode) {
      return res.status(400).json({ message: "schoolCode required" });
    }

    if (!sessionId || !complaintTo || !party1Name || !complaintText) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    db = await getDbConnection(schoolCode);

    const sql = `
      INSERT INTO chatcomplaints
      (session_id, complaint_to, party1_name, party1_type, complaint_text)
      VALUES (?, ?, ?, ?, ?)
    `;

    await db.execute(sql, [
      sessionId,
      complaintTo,
      party1Name,
      party1Type,
      complaintText
    ]);

    res.json({ message: "Complaint submitted successfully" });

  } catch (err) {
    console.error("❌ Complaint Insert Error:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (db) await db.end();
  }
});


/* GET COMPLAINTS BY ROLE */
router.get("/chat_requests/:role", async (req, res) => {
  let db;
  try {
    const role = req.params.role;
    const { schoolCode } = req.query;

    if (!schoolCode) {
      return res.status(400).json({ message: "schoolCode required" });
    }

    db = await getDbConnection(schoolCode);

    const [rows] = await db.execute(
      `SELECT * FROM chatcomplaints
       WHERE complaint_to = ?
       ORDER BY created_at DESC`,
      [role]
    );

    res.json(rows);

  } catch (err) {
    console.error("❌ Fetch Complaints Error:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (db) await db.end();
  }
});

router.post('/question-papers-save', async (req, res) => {
  const { class_name, subject, exam_type, chapter_code, topics, question_paper, schoolCode } = req.body;

  if (!class_name || !subject || !exam_type || !chapter_code || !topics || !question_paper || !schoolCode) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // ✅ Create a database connection based on schoolCode
    const db = await getDbConnection(schoolCode);

    const query = `
      INSERT INTO generated_question_papers
      (class_name, subject, exam_type, chapter_code, topics, question_paper)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await db.execute(query, [
      class_name,
      subject,
      exam_type,
      chapter_code,
      JSON.stringify(topics),
      JSON.stringify(question_paper),
    ]);

    await db.end(); // close the connection

    res.json({ message: 'Question paper saved successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

const nodemailer = require("nodemailer");

// Function to generate REG NO and TICKET NO
function generateNumbers() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 90000) + 10000;
  return {
    reg_no: `REG${year}${random}`,
    ticket_no: `TIC${year}${random}`,
  };
}
router.get('/api/admission-summary', async (req, res) => {
  const { schoolCode } = req.query;

  if (!schoolCode) {
    return res.status(400).json({ error: "schoolCode is required" });
  }

  try {
    const db = await getDbConnection(schoolCode);

    const [[total]] = await db.execute(
      'SELECT COUNT(*) AS count FROM leads'
    );

    const [[converted]] = await db.execute(
      'SELECT COUNT(*) AS count FROM leads WHERE ticket_status = "Accepted"'
    );

    const [[tests]] = await db.execute(
      'SELECT COUNT(*) AS count FROM leads WHERE test_date IS NOT NULL'
    );

    const [[counsel]] = await db.execute(
      'SELECT COUNT(*) AS count FROM leads WHERE counselling_required = "Yes"'
    );

    const [upcoming] = await db.execute(
      `SELECT lead_admission_for AS grade,
              DATE_FORMAT(test_date, "%d/%m/%Y") AS date
       FROM leads
       WHERE test_date >= CURDATE()
       ORDER BY test_date ASC
       LIMIT 1`
    );

    res.json({
      totalParticipations: total.count,
      converted: converted.count,
      scheduledTests: tests.count,
      scheduledCounselling: counsel.count,
      upcoming: upcoming[0] || { grade: "N/A", date: "N/A" }
    });

    await db.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Leads List for the Table
router.get('/api/leads-list', async (req, res) => {
  const { schoolCode } = req.query;

  if (!schoolCode) {
    return res.status(400).json({ error: "schoolCode is required" });
  }

  try {
    const db = await getDbConnection(schoolCode);

    const [rows] = await db.execute(
      `SELECT 
        id,
        full_name,
        lead_admission_for AS grade,
        counselling_required,
        DATE_FORMAT(test_date, "%d/%m/%Y") AS date,
        TIME_FORMAT(test_time, "%H:%i") AS time,
        test_status AS status
      FROM leads
      ORDER BY test_date DESC`
    );

    res.json(rows);
    await db.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Get assigned leads for a teacher
router.get('/api/assigned-leads', async (req, res) => {
  const { schoolCode, teacherName } = req.query;

  if (!schoolCode || !teacherName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const db = await getDbConnection(schoolCode);

    const [leads] = await db.execute(
      `SELECT id, full_name,student_name, test_mode, test_date, test_time, counselling_required, counselling_date, counselling_time, assigned_teacher_name, teacher_decision, teacher_reason
       FROM leads
       WHERE assigned_teacher_name = ?`,
      [teacherName]
    );

    await db.end();
    res.json({ success: true, leads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Accept/Reject lead decision
router.post('/api/teacher-decision', async (req, res) => {
  const { schoolCode, leadId, teacherName, decision, reason } = req.body;

  if (!leadId || !teacherName || !decision) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const db = await getDbConnection(schoolCode);

    await db.execute(
      `UPDATE leads 
       SET teacher_decision = ?, teacher_reason = ? 
       WHERE id = ? AND assigned_teacher_name = ?`,
      [decision, reason, leadId, teacherName]
    );

    await db.end();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Get complete lead details (Popup)
router.get('/api/lead-details/:id', async (req, res) => {
  const { schoolCode } = req.query;
  const { id } = req.params;

  if (!schoolCode) {
    return res.status(400).json({ error: "schoolCode is required" });
  }

  try {
    const db = await getDbConnection(schoolCode);

    const [rows] = await db.execute(
      `SELECT 
        id,
        full_name,
        mobile_number,
        email_id,
        address,
        dob,
        lead_admission_for,
        reg_no,
        ticket_no,
        test_type,
        test_mode,
        DATE_FORMAT(test_date, "%d/%m/%Y") AS test_date,
        TIME_FORMAT(test_time, "%H:%i") AS test_time,
        counselling_required,
        DATE_FORMAT(counselling_date, "%d/%m/%Y") AS counselling_date,
        TIME_FORMAT(counselling_time, "%H:%i") AS counselling_time,
        assigned_teacher_name,
        test_score,
        total_marks,
        test_status,
        ticket_status,
        remarks
      FROM leads
      WHERE id = ?`,
      [id]
    );

    res.json(rows[0] || null);
    await db.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Raise a ticket for an existing lead (dynamic database connection)
router.post('/raise', async (req, res) => {
  try {
    const { regNoOrMobile, issueType, action, remarks, schoolCode } = req.body;

    if (!regNoOrMobile || !issueType || !action || !schoolCode) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Create a connection to the school's database
    const db = getDbConnection(schoolCode);

    // Find the lead by reg_no or mobile_number
    const [leadRows] = await db.execute(
      'SELECT * FROM leads WHERE reg_no = ? OR mobile_number = ? LIMIT 1',
      [regNoOrMobile, regNoOrMobile]
    );

    if (leadRows.length === 0) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const lead = leadRows[0];

    // Update the lead with ticket details (raise ticket)
    await db.execute(
      `UPDATE leads 
       SET issue_type = ?, action = ?, remarks = ?, ticket_status = 'Ticket Raised'
       WHERE id = ?`,
      [issueType, action, remarks || '', lead.id]
    );

    res.json({
      message: 'Ticket raised successfully',
      ticketNo: lead.ticket_no,
      leadId: lead.id,
      leadName: lead.full_name
    });

    // Close the connection
    db.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post("/api/add-lead", async (req, res) => {

if (req.body.updateType === "ASSIGN_TEACHER") {
  let {
    lead_id,
    assigned_teacher_id,
    assigned_teacher_name,
    schoolCode,
    test_date,
    test_time,
    test_mode,
    counselling_required,
    counselling_date,
    counselling_time,
  } = req.body;

  if (!schoolCode || !lead_id) {
    return res.status(400).json({ error: "Missing required data" });
  }

  const db = getDbConnection(schoolCode);

  // 🔹 FORCE ALL NULLS
  assigned_teacher_id = assigned_teacher_id ?? null;
  assigned_teacher_name = assigned_teacher_name ?? null;
  test_date = test_date ?? null;
  test_time = test_time ?? null;
  test_mode = test_mode ?? null;

  const safeCounsellingRequired = counselling_required === "Yes" ? "Yes" : "No";
  const safeCounsellingDate =
    safeCounsellingRequired === "Yes" ? counselling_date ?? null : null;
  const safeCounsellingTime =
    safeCounsellingRequired === "Yes" ? counselling_time ?? null : null;

  const updateSql = `
    UPDATE leads
    SET assigned_teacher_id = ?,
        assigned_teacher_name = ?,
        test_date = ?,
        test_time = ?,
        test_mode = ?,
        counselling_required = ?,
        counselling_date = ?,
        counselling_time = ?
    WHERE id = ?
  `;

  try {
    await db.execute(updateSql, [
      assigned_teacher_id,
      assigned_teacher_name,
      test_date,
      test_time,
      test_mode,
      safeCounsellingRequired,
      safeCounsellingDate,
      safeCounsellingTime,
      lead_id,
    ]);

    return res.json({
      success: true,
      message: "Teacher assigned successfully",
    });
  } catch (err) {
    console.error("ASSIGN_TEACHER ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}


  // 🔽 🔽 🔽 EXISTING INSERT LOGIC (UNCHANGED) 🔽 🔽 🔽

  const {
    full_name,
    occupation,
    mobile_number,
    email_id,
    address,
    dob,
    lead_admission_for,
    entry_type,
    schoolCode,
  } = req.body;

  if (!schoolCode) {
    return res.status(400).json({ error: "schoolCode is required" });
  }

  if (!full_name || !mobile_number || !entry_type || !email_id) {
    return res.status(400).json({ error: "Required fields missing" });
  }

  const db = getDbConnection(schoolCode);
  const { reg_no, ticket_no } = generateNumbers();

  const sql = `
    INSERT INTO leads 
    (full_name, occupation, mobile_number, email_id, address, dob, 
     lead_admission_for, entry_type, reg_no, ticket_no, date, lead_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), CURTIME())
  `;

  const values = [
    full_name,
    occupation,
    mobile_number,
    email_id,
    address,
    dob,
    lead_admission_for,
    entry_type,
    reg_no,
    ticket_no,
  ];

try {
  const [result] = await db.execute(sql, values);
const school = await getSchoolDetails(schoolCode);

  // 🖼️ AUTO-GENERATE POSTER
  const posterPath = await generatePoster({
  
    full_name,
    reg_no,
    ticket_no,
    lead_admission_for,
  },
  school
);
  // ✉️ EMAIL WITH POSTER ATTACHMENT
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "shruthiduddeda88@gmail.com",
      pass: "atwr xeeu ghwz yqdc", // App password
    },
  });

  await transporter.sendMail({
    from: '"CleezoClass" <shruthiduddeda88@gmail.com>',
    to: email_id,
    subject: "🎉 Registration Successful – Poster Attached",
    html: `
      <h2>Hi ${full_name},</h2>
      <p>Your registration is successful.</p>
      <p><b>Reg No:</b> ${reg_no}</p>
      <p><b>Ticket No:</b> ${ticket_no}</p>
      <p>Please find your registration poster attached.</p>
    `,
    attachments: [
      {
        filename: `Registration-${reg_no}.png`,
        path: posterPath,
      },
    ],
  });

  res.json({
    id: result.insertId,
    reg_no,
    ticket_no,
    mobile_number,
    email_id,
    full_name,
    lead_admission_for,
    poster_sent: true,
  });

} catch (err) {
  console.error(err);
  res.status(500).json({ error: err.message });
}

});
router.post("/admission/login", async (req, res) => {
  const { schoolCode, reg_no, mobile_number } = req.body;

  if (!schoolCode) {
    return res.status(400).json({ error: "schoolCode required" });
  }

  if (!reg_no && !mobile_number) {
    return res
      .status(400)
      .json({ error: "Registration No or Mobile No is required" });
  }

  const db = getDbConnection(schoolCode);

  try {
    const query = `
      SELECT 
        l.*,
        l.test_score,
        l.total_marks,
        f.message AS feedback_message,
        f.rating,
        f.marks AS feedback_marks,
        f.created_at
      FROM leads l
      LEFT JOIN feedback f
        ON f.user_name = l.full_name
       AND f.student_class = l.lead_admission_for
      WHERE l.reg_no = ? OR l.mobile_number = ?
      ORDER BY f.created_at DESC
      LIMIT 1
    `;

    const [results] = await db.execute(query, [
      reg_no || "",
      mobile_number || "",
    ]);

    if (results.length === 0) {
      return res
        .status(401)
        .json({ error: "Invalid Registration No or Mobile No" });
    }

    const parent = results[0];

    const photoUrl = parent.student_photo
      ? `https://cleezoclass.com:4000/uploads/${parent.student_photo}`
      : null;

    res.json({
      success: true,
      message: "Login successful",
      data: {
        id: parent.id,
        full_name: parent.full_name,
        mobile_number: parent.mobile_number,
        reg_no: parent.reg_no,
        lead_admission_for: parent.lead_admission_for,
        student_photo: photoUrl,
        date: parent.date,
        email: parent.email_id,

        // ✅ TEST
        score: parent.test_score || 0,
        marks: parent.total_marks || 0,

        // ✅ FEEDBACK MESSAGE (NOW WORKS)
        message: parent.feedback_message || "No feedback available",
        rating: parent.rating || null,

        testDetails: {
          test_type: parent.test_type,
          test_mode: parent.test_mode,
          test_date: parent.test_date,
          test_time: parent.test_time,
          ticket_no: parent.ticket_no,
        },

        counsellorDetails: {
          name: parent.assigned_teacher_name,
          id: parent.assigned_teacher_id,
        },

        counsellingDetails: {
          counselling_required: parent.counselling_required,
          counselling_date: parent.counselling_date,
          counselling_time: parent.counselling_time,
        },
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Database error" });
  } finally {
    if (db) db.end();
  }
});





router.post("/api/submit-feedback", (req, res) => {
  const { user_name, student_class, message, rating, marks, schoolCode } = req.body;

  if (!schoolCode) {
    return res.status(400).json({ error: "schoolCode required" });
  }

  const db = getDbConnection(schoolCode);

  const query = `
    INSERT INTO feedback (user_name, student_class, message, rating, marks)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [user_name, student_class, message, rating, marks],
    (err) => {
      if (err) {
        console.error("Feedback insert error:", err);
        return res.status(500).json({ error: "Failed to submit feedback" });
      }

      res.json({
        success: true,
        message: "Feedback submitted successfully"
      });
    }
  );
});


router.get('/chief/available-teachers-marketing', (req, res) => {
  const { schoolCode, date, time } = req.query;

  if (!schoolCode || !date || !time) {
    return res.status(400).json({ error: "schoolCode, date, time required" });
  }

  const db = mysql.createConnection({
    host: '162.215.210.38',
    user: 'root',
    password: 'NavyAtagsoLnovA@$000',
    database: schoolCode
  });

  const day = new Date(date).toLocaleString('en-US', { weekday: 'long' });

  const query = `SELECT DISTINCT
  m.id   AS teacher_id,
  m.name AS teacher_name,
  m.designation,
  m.phone_no
FROM management_login_creation m
WHERE m.user_type = 'teacher'
AND m.designation NOT IN (
  SELECT DISTINCT subject FROM (
    SELECT period_1_subject  AS subject, period_1_from_time  AS f, period_1_to_time  AS t FROM UniqueTimetable WHERE day = ?
    UNION ALL
    SELECT period_2_subject, period_2_from_time, period_2_to_time FROM UniqueTimetable WHERE day = ?
    UNION ALL
    SELECT period_3_subject, period_3_from_time, period_3_to_time FROM UniqueTimetable WHERE day = ?
    UNION ALL
    SELECT period_4_subject, period_4_from_time, period_4_to_time FROM UniqueTimetable WHERE day = ?
    UNION ALL
    SELECT period_5_subject, period_5_from_time, period_5_to_time FROM UniqueTimetable WHERE day = ?
    UNION ALL
    SELECT period_6_subject, period_6_from_time, period_6_to_time FROM UniqueTimetable WHERE day = ?
    UNION ALL
    SELECT period_7_subject, period_7_from_time, period_7_to_time FROM UniqueTimetable WHERE day = ?
    UNION ALL
    SELECT period_8_subject, period_8_from_time, period_8_to_time FROM UniqueTimetable WHERE day = ?
    UNION ALL
    SELECT period_9_subject, period_9_from_time, period_9_to_time FROM UniqueTimetable WHERE day = ?
    UNION ALL
    SELECT period_10_subject, period_10_from_time, period_10_to_time FROM UniqueTimetable WHERE day = ?
  ) x
  WHERE subject IS NOT NULL
  AND ? BETWEEN f AND t
);
`;

  const params = [
    day, day, day, day, day,
    day, day, day, day, day,
    time
  ];

  db.query(query, params, (err, results) => {
    db.end();

    if (err) {
      console.error("SQL Error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    res.json(results);
  });
});



router.post("/api/send-lead-details", async (req, res) => {
  console.log("📨 /api/send-lead-details called");
  console.log("📥 Request body:", req.body);

  const {
    email,
    full_name,
    reg_no,
    ticket_no,
    test_type,
    counselling_required,
    counselling_date,
    counselling_time,
    lead_admission_for
  } = req.body;

  if (!email  || !reg_no || !ticket_no) {
    console.warn("⚠️ Missing required fields in request body");
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    console.log("🔧 Setting up Nodemailer transporter...");
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "shruthiduddeda88@gmail.com",
        pass: "atwr xeeu ghwz yqdc",
      },
    });

    let html = `
      <h2>Hi ${full_name},</h2>
      <p>Your registration is successful.</p>
      <p><b>Reg No:</b> ${reg_no}</p>
      <p><b>Ticket No:</b> ${ticket_no}</p>
      <p><b>Test Type:</b> ${test_type || '-'}</p>
    `;

    if (counselling_required === "Yes") {
      html += `<p><b>Counselling Date:</b> ${counselling_date || '-'}</p>`;
      html += `<p><b>Counselling Time:</b> ${counselling_time || '-'}</p>`;
    }

    console.log("📧 Composed email HTML:\n", html);

    console.log("✉️ Sending email to:", email);
    await transporter.sendMail({
      from: '"CleezoClass" <shruthiduddeda88@gmail.com>',
      to: email,
      subject: "Registration Details & Test Info",
      html,
    });

    console.log("✅ Email sent successfully to", email);
    res.json({ message: "Email sent successfully" });

  } catch (err) {
    console.error("❌ Email send failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// router.post("/api/add-lead", async (req, res) => {

// if (req.body.updateType === "ASSIGN_TEACHER") {
//   let {
//     lead_id,
//     assigned_teacher_id,
//     assigned_teacher_name,
//     schoolCode,
//     test_date,
//     test_time,
//     test_mode,
//     counselling_required,
//     counselling_date,
//     counselling_time,
//   } = req.body;

//   if (!schoolCode || !lead_id) {
//     return res.status(400).json({ error: "Missing required data" });
//   }

//   const db = getDbConnection(schoolCode);

//   // 🔹 FORCE ALL NULLS
//   assigned_teacher_id = assigned_teacher_id ?? null;
//   assigned_teacher_name = assigned_teacher_name ?? null;
//   test_date = test_date ?? null;
//   test_time = test_time ?? null;
//   test_mode = test_mode ?? null;

//   const safeCounsellingRequired = counselling_required === "Yes" ? "Yes" : "No";
//   const safeCounsellingDate =
//     safeCounsellingRequired === "Yes" ? counselling_date ?? null : null;
//   const safeCounsellingTime =
//     safeCounsellingRequired === "Yes" ? counselling_time ?? null : null;

//   const updateSql = `
//     UPDATE leads
//     SET assigned_teacher_id = ?,
//         assigned_teacher_name = ?,
//         test_date = ?,
//         test_time = ?,
//         test_mode = ?,
//         counselling_required = ?,
//         counselling_date = ?,
//         counselling_time = ?
//     WHERE id = ?
//   `;

//   try {
//     await db.execute(updateSql, [
//       assigned_teacher_id,
//       assigned_teacher_name,
//       test_date,
//       test_time,
//       test_mode,
//       safeCounsellingRequired,
//       safeCounsellingDate,
//       safeCounsellingTime,
//       lead_id,
//     ]);

//     return res.json({
//       success: true,
//       message: "Teacher assigned successfully",
//     });
//   } catch (err) {
//     console.error("ASSIGN_TEACHER ERROR:", err);
//     return res.status(500).json({ error: err.message });
//   }
// }


//   // 🔽 🔽 🔽 EXISTING INSERT LOGIC (UNCHANGED) 🔽 🔽 🔽

//   const {
//     full_name,
//     occupation,
//     mobile_number,
//     email_id,
//     address,
//     dob,
//     lead_admission_for,
//     entry_type,
//     schoolCode,
//   } = req.body;

//   if (!schoolCode) {
//     return res.status(400).json({ error: "schoolCode is required" });
//   }

//   if (!full_name || !mobile_number || !entry_type || !email_id) {
//     return res.status(400).json({ error: "Required fields missing" });
//   }

//   const db = getDbConnection(schoolCode);
//   const { reg_no, ticket_no } = generateNumbers();

//   const sql = `
//     INSERT INTO leads 
//     (full_name, occupation, mobile_number, email_id, address, dob, 
//      lead_admission_for, entry_type, reg_no, ticket_no, date, lead_time)
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), CURTIME())
//   `;

//   const values = [
//     full_name,
//     occupation,
//     mobile_number,
//     email_id,
//     address,
//     dob,
//     lead_admission_for,
//     entry_type,
//     reg_no,
//     ticket_no,
//   ];

// try {
//   const [result] = await db.execute(sql, values);
// const school = await getSchoolDetails(schoolCode);

//   // 🖼️ AUTO-GENERATE POSTER
//   const posterPath = await generatePoster({
  
//     full_name,
//     reg_no,
//     ticket_no,
//     lead_admission_for,
//   },
//   school
// );
//   // ✉️ EMAIL WITH POSTER ATTACHMENT
//   let transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: "shruthiduddeda88@gmail.com",
//       pass: "atwr xeeu ghwz yqdc", // App password
//     },
//   });

//   await transporter.sendMail({
//     from: '"CleezoClass" <shruthiduddeda88@gmail.com>',
//     to: email_id,
//     subject: "🎉 Registration Successful – Poster Attached",
//     html: `
//       <h2>Hi ${full_name},</h2>
//       <p>Your registration is successful.</p>
//       <p><b>Reg No:</b> ${reg_no}</p>
//       <p><b>Ticket No:</b> ${ticket_no}</p>
//       <p>Please find your registration poster attached.</p>
//     `,
//     attachments: [
//       {
//         filename: `Registration-${reg_no}.png`,
//         path: posterPath,
//       },
//     ],
//   });

//   res.json({
//     id: result.insertId,
//     reg_no,
//     ticket_no,
//     mobile_number,
//     email_id,
//     full_name,
//     lead_admission_for,
//     poster_sent: true,
//   });

// } catch (err) {
//   console.error(err);
//   res.status(500).json({ error: err.message });
// }

// });
// Example in Express
router.get("/api/feedback", async (req, res) => {
  const { user_name, student_class, schoolCode } = req.query;

  if (!user_name || !student_class || !schoolCode) {
    return res.status(400).json({ error: "user_name, student_class, and schoolCode are required" });
  }

  try {
    // Get DB connection based on schoolCode
    const db = getDbConnection(schoolCode);

    // Fetch feedback for the given lead
    const query = `
      SELECT id, message, marks, created_at
      FROM feedback
      WHERE user_name = ? AND student_class = ?
      ORDER BY created_at DESC
    `;
    const [rows] = await db.execute(query, [user_name, student_class]);

    res.json(rows);
  } catch (err) {
    console.error("Feedback fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


router.get("/api/leads", async (req, res) => {
  try {
    const { schoolCode } = req.query;

    if (!schoolCode) {
      return res.status(400).json({ error: "schoolCode is required" });
    }

    const db = getDbConnection(schoolCode);

    const [results] = await db.execute(
      "SELECT * FROM leads ORDER BY id DESC"
    );

    res.json(results);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/communication/leads", async (req, res) => {
  try {
    const { schoolCode } = req.query;

    if (!schoolCode) {
      return res.status(400).json({ error: "schoolCode is required" });
    }

    const db = getDbConnection(schoolCode);

    const [results] = await db.execute(`
      SELECT 
        l.*,
        sm.channel,
        sm.send_date,
        sm.send_time,
        sm.sent
      FROM leads l
      LEFT JOIN scheduled_messages sm 
        ON sm.lead_id = l.id
      ORDER BY l.id DESC
    `);

    res.json(results);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/Chiefattendance", async (req, res) => {
  let connection;
  console.log("🚀 /Chiefattendance API HIT");

  try {
    const { teacherId, date, status, schoolCode } = req.query;

    console.log("📥 Params:", req.query);

    if (!teacherId) {
      console.warn("⚠️ teacherId missing");
      return res.status(400).json({ error: "teacherId is required" });
    }

    if (!schoolCode) {
      console.warn("⚠️ schoolCode missing");
      return res.status(400).json({ error: "schoolCode is required" });
    }

    /* ---------------- DB CONNECTION ---------------- */
    console.log("🔌 Connecting to DB:", schoolCode);
    connection = getDbConnection(schoolCode);

    /* ---------------- SQL BUILD ---------------- */
    let query = `
      SELECT *
      FROM teachers_attendance
      WHERE teacher_id = ?
    `;
    const params = [teacherId];

    if (date) {
      query += " AND date = ?";
      params.push(date);
    }

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY date DESC, entry_time ASC";

    console.log("📄 SQL:", query);
    console.log("📦 Params:", params);

    /* ---------------- EXECUTE ---------------- */
    const [results] = await connection.execute(query, params);

    console.log("📊 Rows Found:", results.length);
    res.json(results);

  } catch (err) {
    console.error("❌ Error fetching attendance:", err);
    res.status(500).json({ error: "Internal Server Error" });

  } finally {
    if (connection) {
      console.log("🔒 DB connection closed");
      connection.end();
    }
  }
});

router.get("/Chiefattendance/current-month-count", async (req, res) => {
  let connection;
  console.log("🚀 /Chiefattendance/current-month-count HIT");

  try {
    const { teacherId, schoolCode } = req.query;

    if (!teacherId || !schoolCode) {
      return res.status(400).json({
        error: "teacherId and schoolCode are required",
      });
    }

    /* ---------------- DATE RANGE ---------------- */
    const now = new Date();
    const firstDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).toISOString().split("T")[0];

    const lastDay = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).toISOString().split("T")[0];

    console.log("📅 Date Range:", firstDay, "to", lastDay);

    /* ---------------- DB ---------------- */
    connection = getDbConnection(schoolCode);

    const query = `
      SELECT COUNT(*) AS presentCount
      FROM teachers_attendance
      WHERE teacher_id = ?
        AND status = 'present'
        AND date BETWEEN ? AND ?
    `;

    console.log("📄 SQL:", query);

    const [results] = await connection.execute(query, [
      teacherId,
      firstDay,
      lastDay,
    ]);

    console.log("✅ Present Count:", results[0].presentCount);

    res.json({
      presentCount: results[0].presentCount,
    });

  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Internal Server Error" });

  } finally {
    if (connection) {
      console.log("🔒 DB connection closed");
      connection.end();
    }
  }
});

router.post('/overall/academic-performance', async (req, res) => {
  const { name, class_name, section, schoolCode } = req.body;

  if (!schoolCode) {
    return res.status(400).json({ error: "schoolCode is required" });
  }

  if (!name || !class_name || !section) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const db = getDbConnection(schoolCode);

  const query = `
    SELECT subject, test_type, marks 
    FROM academic_performance_of_student 
    WHERE name = ? AND class_name = ? AND section = ? 
    ORDER BY subject, FIELD(test_type, 'FA1','FA2','FA3','FA4','SA1','SA2')
  `;

  try {
    const [results] = await db.query(query, [name, class_name, section]);

    const subjects = {};

    results.forEach(row => {
      if (!subjects[row.subject]) {
        subjects[row.subject] = {
          subject: row.subject,
          FA: [],
          SA: [],
          total: 0,
          maxTotal: 0,
          testGrades: {}
        };
      }

      if (row.test_type.startsWith("FA")) {
        subjects[row.subject].FA.push({ marks: row.marks, type: row.test_type });
        subjects[row.subject].total += row.marks;
        subjects[row.subject].maxTotal += 20;
      } else {
        subjects[row.subject].SA.push({ marks: row.marks, type: row.test_type });
        subjects[row.subject].total += row.marks;
        subjects[row.subject].maxTotal += 80;
      }
    });

    const performance = Object.values(subjects).map(sub => ({
      subject: sub.subject,
      FA: sub.FA.map(i => i.marks),
      SA: sub.SA.map(i => i.marks),
      total: sub.total,
      percentage: ((sub.total / sub.maxTotal) * 100).toFixed(2),
      overallGrade: (() => {
        const p = (sub.total / sub.maxTotal) * 100;
        return p >= 90 ? "A+" :
               p >= 80 ? "A" :
               p >= 70 ? "B+" :
               p >= 60 ? "B" :
               p >= 50 ? "C" : "D";
      })(),
      testGrades: sub.testGrades
    }));

    res.json(performance);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  } finally {
    db.end();
  }
});

// Get fee details by student ID
router.post("/studentFees", async (req, res) => {
  const { studentId, schoolCode } = req.body;

  if (!schoolCode) {
    return res.status(400).json({ error: "schoolCode is required" });
  }

  const db = getDbConnection(schoolCode);

  try {
    const sql = "SELECT * FROM FeesDetails WHERE login_id = ?";
    const [results] = await db.query(sql, [studentId]);

    if (!results.length) {
      return res.status(404).json({ message: "No fee details found for this student" });
    }

    res.json({ feeDetails: results[0] });

  } catch (err) {
    console.error("Fee Fetch Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    db.end();
  }
});

router.get("/feeDetailsByClassSection", async (req, res) => {
  const { className, section, schoolCode } = req.query;

  if (!schoolCode) {
    return res.status(400).json({ error: "schoolCode is required" });
  }

  const db = getDbConnection(schoolCode);

  const formattedClass = `Class ${className}`;

  const query = `
    SELECT 
      CompleteFee,
      Installment1_Amount, Installment1_Deadline_Date,
      Installment2_Amount, Installment2_Deadline_Date,
      Installment3_Amount, Installment3_Deadline_Date,
      Installment4_Amount, Installment4_Deadline_Date,
      Installment5_Amount, Installment5_Deadline_Date
    FROM FeesDetails
    WHERE class_name = ?
       OR (FeeClass = ? AND FeeSection = ?)
  `;

  try {
    const [results] = await db.query(query, [className, formattedClass, section]);

    if (!results.length) {
      return res.json({ feeDetail: null });
    }

    const finalData = {
      CompleteFee: null,
      Installment1_Amount: null,
      Installment1_Deadline_Date: null,
      Installment2_Amount: null,
      Installment2_Deadline_Date: null,
      Installment3_Amount: null,
      Installment3_Deadline_Date: null,
      Installment4_Amount: null,
      Installment4_Deadline_Date: null,
      Installment5_Amount: null,
      Installment5_Deadline_Date: null
    };

    results.forEach(row => {
      Object.keys(finalData).forEach(key => {
        if (row[key] !== null && finalData[key] === null) {
          finalData[key] = row[key];
        }
      });
    });

    res.json({ feeDetail: finalData });

  } catch (err) {
    console.error("Fee Class/Section Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    db.end();
  }
});


router.post('/report/behaviour', async (req, res) => {
  const { name, class_name, section, schoolCode } = req.body;

  if (!schoolCode) return res.status(400).json({ error: 'School code is required' });

  const connection = getDbConnection(schoolCode);

  try {
    const query = `
      SELECT report 
      FROM teachers_student_report 
      WHERE name = ? AND class_name = ? AND section = ?
    `;

    const [rows] = await connection.query(query, [name, class_name, section]);

    if (rows.length === 0) return res.json({ report: 'No report found' });

    res.json(rows[0]); // send the report object
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    connection.end();
  }
});
router.post('/report/attendance/monthly', async (req, res) => {
  const { name, class_name, section, schoolCode} = req.body;

  if (!schoolCode) return res.status(400).json({ error: 'School code is required' });

  let connection;
  try {
    connection = await getDbConnection(schoolCode);

    const query = `
      SELECT
        DATE_FORMAT(date, '%Y-%m') AS month,
        SUM(LOWER(leavetype) = 'present') AS present,
        SUM(LOWER(leavetype) = 'informed') AS informed,
        SUM(LOWER(leavetype) = 'uninformed') AS uninformed,
        COUNT(*) AS total
      FROM attendance_frontend
      WHERE name = ? AND class = ? AND section = ?
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY DATE_FORMAT(date, '%Y-%m');
    `;

    const [rows] = await connection.query(query, [name, class_name, section]);

    // Format month/year for frontend
    const formattedRows = rows.map(r => {
      const [year, month] = r.month.split('-');
      return { ...r, month, year };
    });

    // Calculate overall attendance %
    const totalPresent = formattedRows.reduce((acc, cur) => acc + cur.present, 0);
    const totalDays = formattedRows.reduce((acc, cur) => acc + cur.total, 0);
    const overallPercentage = totalDays ? ((totalPresent / totalDays) * 100).toFixed(2) : 0;

    res.json({ monthly: formattedRows, overallPercentage });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    if (connection) connection.end();
  }
});
// Middleware to extract schoolCode
router.use((req, res, next) => {
  const schoolCode = req.query.schoolCode || req.body.schoolCode;
  if (!schoolCode) {
    return res.status(400).json({ error: "Missing schoolCode parameter" });
  }
  req.schoolCode = schoolCode;
  next();
});



router.get('/expensemanagement-expense-types', async (req, res) => {
    try {
        const { schoolCode } = req.query;
        const db = getDbConnection(schoolCode);

        const [results] = await db.execute(
            `SELECT DISTINCT expense_type 
             FROM Accountant 
             WHERE expense_type IS NOT NULL`
        );

        res.json({ success: true, data: results.map(r => r.expense_type) });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
router.get('/expensemanagement-salary-options', async (req, res) => {
    try {
        const { schoolCode } = req.query;
        const db = getDbConnection(schoolCode);

        const [months] = await db.execute(
            `SELECT DISTINCT salary_month 
             FROM bizpulse_teacher_calculated_salary`
        );

        const [statuses] = await db.execute(
            `SELECT DISTINCT status 
             FROM bizpulse_teacher_calculated_salary`
        );

        res.json({
            success: true,
            months: months.map(m => m.salary_month),
            statuses: statuses.map(s => s.status)
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
router.get('/expensemanagement-previous-records', async (req, res) => {
    try {
        console.log("🔍 Incoming Request:", {
            method: req.method,
            url: req.originalUrl,
            contentType: req.headers["content-type"],
            body: req.body
        });

        const { schoolCode, from, to, expense_type, salary_month, salary_status } = req.query;

        console.log(`📥 Received schoolCode: "${schoolCode}"`);

        const db = getDbConnection(schoolCode);
        console.log(`✅ Connected to DB: "${schoolCode}"`);

        // ---------------------------
        // EXPENSE QUERY
        // ---------------------------
        let expenseQuery = `SELECT * FROM Accountant WHERE 1=1`;
        const expenseParams = [];

        if (from) { 
            expenseQuery += ` AND expense_date >= ?`;
            expenseParams.push(from);
        }
        if (to) { 
            expenseQuery += ` AND expense_date <= ?`;
            expenseParams.push(to);
        }
        if (expense_type && expense_type !== "EXP. TYPE") {
            expenseQuery += ` AND expense_type = ?`;
            expenseParams.push(expense_type);
        }

        expenseQuery += ` ORDER BY expense_date DESC`;

        console.log("🟦 Expense Query:", expenseQuery);
        console.log("🟦 Expense Params:", expenseParams);

        const [expenses] = await db.execute(expenseQuery, expenseParams);

        // ---------------------------
        // SALARY QUERY
        // ---------------------------
        let salaryQuery = `
            SELECT 
                t.*, 
                u.person_name AS teacher_name
            FROM bizpulse_teacher_calculated_salary t
            LEFT JOIN Accountant u ON t.teacher_id = u.id
            WHERE 1=1
        `;
        const salaryParams = [];

        if (salary_month && salary_month !== "Salary Month") {
            salaryQuery += ` AND t.salary_month = ?`;
            salaryParams.push(salary_month);
        }

        if (salary_status && salary_status !== "Status") {
            salaryQuery += ` AND t.status = ?`;
            salaryParams.push(salary_status);
        }

        salaryQuery += ` ORDER BY t.payment_date DESC`;

        console.log("🟩 Salary Query:", salaryQuery);
        console.log("🟩 Salary Params:", salaryParams);

        const [salaries] = await db.execute(salaryQuery, salaryParams);

        res.json({ success: true, expenses, salaries });

    } catch (err) {
        console.error("❌ ERROR:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});
router.get("/salarymanagement", async (req, res) => {
    try {
        const { schoolCode, month } = req.query;
        const db = getDbConnection(schoolCode);

        // Fixed Summary Query: Summing all reductions globally
        const summaryQuery = `
            SELECT 
                SUM(c.final_salary) AS total_paid,
                (
                    (SELECT COALESCE(SUM(s.hra + s.pf + s.professional_tax + s.mediclaim + s.deduction), 0) 
                     FROM bizpulse_teacher_salary s)
                    +
                    COALESCE(SUM(c.deductions), 0)
                ) AS total_reduction
            FROM bizpulse_teacher_calculated_salary c
            WHERE c.status = 'paid'
            ${month ? "AND c.salary_month = ?" : ""}
        `;

        // Fixed List Query: Uses LEFT JOIN to avoid the "subquery returns more than 1 row" error
        const listQuery = `
            SELECT 
                c.salary_calc_id,
                c.teacher_id,
                c.base_salary,
                c.deductions,
                c.bonuses,
                c.final_salary,
                c.salary_month,
                c.payment_date,
                COALESCE(s.hra + s.pf + s.professional_tax + s.mediclaim + s.deduction, 0) AS other_reductions
            FROM bizpulse_teacher_calculated_salary c
            LEFT JOIN bizpulse_teacher_salary s ON c.teacher_id = s.teacher_id
            WHERE c.status = 'paid'
            ${month ? "AND c.salary_month = ?" : ""}
        `;

        const params = month ? [month] : [];

        const [summary] = await db.execute(summaryQuery, params);
        const [list] = await db.execute(listQuery, params);

        res.json({
            summary: {
                total_paid: summary[0]?.total_paid ?? 0,
                total_reduction: summary[0]?.total_reduction ?? 0
            },
            list
        });

    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: err.message });
    }
});
// ========== Insert Letter API ==========
router.post("/report/insert-letter", upload.single("letterFile"), async (req, res) => {
  try {
    const db = getDbConnection(req.schoolCode);

    const { classSection, reportDate, reportType, letterType } = req.body;
    const filePath = req.file ? req.file.filename : null;

    const sql = `
      INSERT INTO report_letters 
      (class_section, report_date, report_type, letter_type, file_path)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(sql, [
      classSection, reportDate, reportType, letterType, filePath
    ]);

    res.json({
      message: "Letter submitted successfully",
      id: result.insertId,
      uploadedFile: filePath,
    });

  } catch (err) {
    res.status(500).json({ message: "Database Error" });
  }
});

router.get("/summary", async (req, res) => {
  try {
    const db = getDbConnection(req.schoolCode);

    let { fromDate, toDate, className, section } = req.query;
    let query = `
        SELECT 
            SUM(Paid_Amount) AS totalPaid,
            SUM(Final_Amount - Paid_Amount) AS totalUnpaid
        FROM FeesDetails
        WHERE 1=1
    `;
    let params = [];

    if (fromDate && toDate) {
      query += ` AND DATE(paidDate) BETWEEN ? AND ?`;
      params.push(fromDate, toDate);
    }
    if (className && className !== "ALL") {
      query += ` AND Class_name = ?`;
      params.push(className);
    }
    if (section && section !== "ALL") {
      query += ` AND Section = ?`;
      params.push(section);
    }

    const [results] = await db.execute(query, params);

    res.json({
      totalPaid: results[0].totalPaid || 0,
      totalUnpaid: results[0].totalUnpaid || 0
    });

  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});


router.get("/paid-list", async (req, res) => {
  try {
    const db = getDbConnection(req.schoolCode);

    let { fromDate, toDate, className, section } = req.query;

    let query = `
        SELECT StudentName, Class_name, Section, Paid_Amount, paidDate
        FROM FeesDetails
        WHERE Paid_Amount > 0
    `;
    let params = [];

    if (fromDate && toDate) {
      query += ` AND DATE(paidDate) BETWEEN ? AND ?`;
      params.push(fromDate, toDate);
    }
    if (className && className !== "ALL") {
      query += ` AND Class_name = ?`;
      params.push(className);
    }
    if (section && section !== "ALL") {
      query += ` AND Section = ?`;
      params.push(section);
    }

    const [results] = await db.execute(query, params);
    res.json(results);

  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});



// -------------------------------------------
// UNPAID LIST
// -------------------------------------------
const getClassSectionQuery = (className, section) => {
  let query = "";
  if (className && className !== "ALL") query += ` AND Class_name='${className}'`;
  if (section && section !== "ALL") query += ` AND Section='${section}'`;
  return query;
};
router.get("/unpaid-list", async (req, res) => {
  try {
    const db = getDbConnection(req.schoolCode);

    let { fromDate, toDate, className, section } = req.query;

    let query = `
      SELECT 
          StudentName, Class_name, Section, 
          (Final_Amount - Paid_Amount) AS unpaidAmount,
          Final_Amount, Paid_Amount
      FROM FeesDetails
      WHERE (Final_Amount - Paid_Amount) > 0
    `;
    let params = [];

    if (fromDate && toDate) {
      query += ` AND DATE(paidDate) BETWEEN ? AND ?`;
      params.push(fromDate, toDate);
    }
    if (className && className !== "ALL") {
      query += ` AND Class_name = ?`;
      params.push(className);
    }
    if (section && section !== "ALL") {
      query += ` AND Section = ?`;
      params.push(section);
    }

    const [results] = await db.execute(query, params);
    res.json(results);

  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/summary-daily", async (req, res) => {
  try {
    const db = getDbConnection(req.schoolCode);

    const { fromDate, toDate, className, section } = req.query;

    let sql = `
      SELECT 
        DATE(created_at) AS date,
        SUM(Paid_Amount) AS paid,
        SUM(Final_Amount - Paid_Amount) AS unpaid
      FROM FeesDetails
      WHERE DATE(created_at) BETWEEN ? AND ?
    `;
    
    let params = [fromDate, toDate];

    if (className && className !== "ALL") {
      sql += ` AND Class_name = ?`;
      params.push(className);
    }
    if (section && section !== "ALL") {
      sql += ` AND Section = ?`;
      params.push(section);
    }

    sql += ` GROUP BY DATE(created_at) ORDER BY DATE(created_at) ASC`;

    const [results] = await db.execute(sql, params);
    res.json(results);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ------------------------------------------------
router.get('/qp-pending', async (req, res) => {
  const db = getDbConnection(req.schoolCode); // connect to correct school DB
  const { examType } = req.query;

  try {
    // 1️⃣ Get all classes from management_login_creation
    const [allClasses] = await db.execute(`
      SELECT DISTINCT class_name
      FROM management_login_creation
    `);

    // 2️⃣ Get classes that already have question papers for this exam
    const [classesWithQP] = await db.execute(`
      SELECT DISTINCT class_name
      FROM generated_question_papers
      WHERE exam_type = ?
    `, [examType]);

    // 3️⃣ Calculate pending classes
    const classesWithQPSet = new Set(classesWithQP.map(row => row.class_name));
    const pendingClasses = allClasses
      .map(row => row.class_name)
      .filter(cls => !classesWithQPSet.has(cls));

    res.json({
      total_classes: allClasses.length,
      classes_with_qp: classesWithQP.length,
      pending_classes: pendingClasses.length,
      pending_class_list: pendingClasses
    });

  } catch (err) {
    console.error("QP Pending Error:", err);
    res.status(500).json({ message: "Error fetching pending QPs", error: err.message });
  }
});

// ------------------------------------------------
// 2. GET /api/invigilator-status
// ------------------------------------------------
router.get('/invigilator-status', async (req, res) => {
  const db = getDbConnection(req.schoolCode);

  try {
    const sql = `
      SELECT 
        id,
        class_name,
        teacher_name,
        assigned_date
      FROM invigilator_assignments
      ORDER BY assigned_date DESC;
    `;

    const [rows] = await db.execute(sql);

    res.json({
      total_invigilators: new Set(rows.map(r => r.teacher_name)).size,
      assignments: rows
    });

  } catch (err) {
    console.error("Invigilator Status Error:", err);
    res.status(500).json({ 
      message: "Error fetching invigilator status", 
      error: err.message 
    });
  }
});

// ------------------------------------------------
// 3. GET /api/seating-status
// ------------------------------------------------
router.get('/seating-status', async (req, res) => {
  const db = getDbConnection(req.schoolCode);

  try {
    const sql = `
      SELECT COUNT(DISTINCT roomNumber) AS total_assignments
      FROM seat_assignments;
    `;

    const roomsSql = `
      SELECT DISTINCT roomNumber
      FROM seat_assignments;
    `;

    const [countResults] = await db.execute(sql);
    const total_assignments = parseInt(countResults[0]?.total_assignments || 0);

    const [roomResults] = await db.execute(roomsSql);

    res.json({
      total_assignments,
      rooms_assigned: roomResults.map(row => "Room " + row.roomNumber)
    });

  } catch (err) {
    console.error("Seating Status Error:", err);
    res.status(500).json({ message: "Error fetching seating status", error: err.message });
  }
});

// ===========================
router.post('/po/request', async (req, res) => {
  const db = getDbConnection(req.schoolCode);
  const { stockName, quantity, category, action } = req.body;

  if (!stockName || !quantity || !category || !action) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const sql = `
    INSERT INTO po_requests (stock_name, quantity, category, action, status)
    VALUES (?, ?, ?, ?, 'PENDING')
  `;

  try {
    const [result] = await db.execute(sql, [
      stockName,
      quantity,
      category,
      action
    ]);

    res.status(201).json({
      message: "PO Request submitted",
      id: result.insertId,
    });
  } catch (err) {
    console.error("DB insert error:", err);
    res.status(500).json({ error: "DB Insert Failed" });
  } finally {
    db.end();
  }
});


// ----------------------------------------------------------
// 2. FETCH PO REQUESTS (GET)
// ----------------------------------------------------------
router.get('/po/requests', async (req, res) => {
  const db = getDbConnection(req.schoolCode);

  const sql = `
    SELECT id, stock_name, quantity, status, category
    FROM po_requests
    ORDER BY id DESC
    LIMIT 15
  `;

  try {
    const [rows] = await db.execute(sql);

    const formatted = rows.map(r => ({
      id: r.id,
      text: `PO - ${r.id}, ${r.stock_name}, ${r.quantity}qty`,
      status: r.status === 'PENDING' ? 'AWAITING' : r.status,
      stockName: r.stock_name,
      quantity: r.quantity,
      category: r.category
    }));

    res.json(formatted);
  } catch (err) {
    console.error("DB fetch error:", err);
    res.status(500).json({ error: "DB Fetch Failed" });
  } finally {
    db.end();
  }
});


// ----------------------------------------------------------
// 3. PROCESS PO (POST)
// ----------------------------------------------------------
router.post('/po/process', async (req, res) => {
  const db = getDbConnection(req.schoolCode);
  const { id, new_status, stockName, quantity, category } = req.body;

  if (!id || !new_status) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    // Update PO status
    await db.execute(
      `UPDATE po_requests SET status = ? WHERE id = ?`,
      [new_status, id]
    );

    // If accepted → update stock
    if (new_status === "OK") {
      await db.execute(
        `
        INSERT INTO stock_items (stock_name, category, quantity)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
        `,
        [stockName, category, quantity]
      );

      res.json({ message: "PO accepted and stock updated" });
    } else {
      res.json({ message: "PO status updated" });
    }
  } catch (err) {
    console.error("PO Process error:", err);
    res.status(500).json({ error: "Operation Failed" });
  } finally {
    db.end();
  }
});


// ----------------------------------------------------------
// 4. FETCH STOCK LEVELS (GET)
// ----------------------------------------------------------
router.get('/stock/levels', async (req, res) => {
  const db = getDbConnection(req.schoolCode);

  try {
    const [rows] = await db.execute(
      `SELECT stock_name, category, quantity FROM stock_items`
    );
    res.json(rows);
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      return res.json([]);
    }
    res.status(500).json({ error: "DB Fetch Failed" });
  } finally {
    db.end();
  }
});



// ----------------------
// GET ALL PENDING REQUESTS
// ----------------------
router.get('/pending', async (req, res) => {
  try {
    const db = getDbConnection(req.schoolCode);

    const [rows] = await db.execute("SELECT * FROM chat_requests WHERE status = 'pending'");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending requests', details: err.message });
  }
});

// ----------------------
// APPROVE A REQUEST
// ----------------------
router.post('/approve', async (req, res) => {
  try {
    const db = getDbConnection(req.schoolCode);
    const { id } = req.body;

    await db.execute("UPDATE chat_requests SET status = 'approved' WHERE id = ?", [id]);

    res.json({ success: true, message: 'Chat approved successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve request', details: err.message });
  }
});

// ----------------------
// GET ALL CLASSES
// ----------------------
router.get('/classes', async (req, res) => {
  try {
    const db = getDbConnection(req.schoolCode);

    const [rows] = await db.execute(`
      SELECT DISTINCT class_name
      FROM management_login_creation
      WHERE class_name IS NOT NULL AND class_name != ''
      ORDER BY class_name
    `);

    res.json(rows.map(r => r.class_name));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch classes', details: err.message });
  }
});

// ----------------------
// GET SECTIONS BY CLASS
// ----------------------
router.get('/sections/:class', async (req, res) => {
  try {
    const db = getDbConnection(req.schoolCode);
    const className = req.params.class;

    const [rows] = await db.execute(`
      SELECT DISTINCT section
      FROM management_login_creation
      WHERE class_name = ? AND section IS NOT NULL AND section != ''
      ORDER BY section
    `, [className]);

    res.json(rows.map(r => r.section));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sections', details: err.message });
  }
});

// ----------------------
// GET STUDENTS BY CLASS + SECTION
// ----------------------
router.get('/students/:class/:section', async (req, res) => {
  try {
    const db = getDbConnection(req.schoolCode);
    const { class: className, section } = req.params;

    const [rows] = await db.execute(`
      SELECT id, name
      FROM management_login_creation
      WHERE class_name = ? AND section = ? AND user_type = 'student'
      ORDER BY name ASC
    `, [className, section]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students', details: err.message });
  }
});

// ----------------------
// SAVE CHAT REQUEST
// ----------------------
router.post('/chat-request', async (req, res) => {
  console.log('📥 /chat-request HIT');

  try {
    // 🔹 Log school code
    console.log('🏫 School Code:', req.schoolCode);

    const db = getDbConnection(req.schoolCode);
    console.log('✅ DB connection established');

    const {
      party1_id,
      party1_name,
      party2_class,
      party2_section,
      party2_student,
      date,
      time,
    } = req.body;

    // 🔹 Log incoming body
    console.log('📦 Request Body:', {
      party1_id,
      party1_name,
      party2_class,
      party2_section,
      party2_student,
      date,
      time,
    });

    // 🔹 Validate required fields (log-level)
    if (!party1_id || !party1_name || !party2_class || !party2_section || !date || !time) {
      console.warn('⚠️ Missing required fields');
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    console.log('📝 Inserting chat request into DB...');

    const [result] = await db.execute(
      `
      INSERT INTO chat_requests
      (
        party1_id,
        party1_name,
        party2_class,
        party2_section,
        party2_student,
        date,
        time,
        created_at,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'pending')
      `,
      [
        party1_id,
        party1_name,
        party2_class,
        party2_section,
        party2_student || null,
        date,
        time,
      ]
    );

    // 🔹 Log insert result
    console.log('✅ Chat request inserted');
    console.log('🆔 Insert ID:', result.insertId);

    res.json({
      success: true,
      id: result.insertId,
      message: 'Chat request created',
    });

  } catch (err) {
    console.error('❌ Chat request error');
    console.error(err);

    res.status(500).json({
      error: 'Failed to save chat request',
      details: err.message,
    });
  }
});
router.post('/chat-requests', async (req, res) => {
  console.log('📥 /chat-requests HIT');

  try {
    console.log('🏫 School Code:', req.schoolCode);

    const db = getDbConnection(req.schoolCode);
    console.log('✅ DB connection established');

    const {
      party1_id,
      party1_name,
      party2_class,
      party2_section,
      party2_student,
      scheduled_at,
    } = req.body;

    console.log('📦 Raw Request Body:', req.body);

    if (
      !party1_id ||
      !party1_name ||
      !party2_class ||
      !party2_section ||
      !scheduled_at
    ) {
      console.warn('⚠️ Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const scheduledDate = new Date(scheduled_at);
    if (isNaN(scheduledDate.getTime())) {
      console.warn('⚠️ Invalid scheduled_at value');
      return res.status(400).json({ error: 'Invalid scheduled_at value' });
    }

    const date = scheduledDate.toISOString().slice(0, 10);
    const time = scheduledDate.toISOString().slice(11, 16);

    console.log('🕒 Parsed Date & Time:', { date, time });

    const [result] = await db.execute(
      `
      INSERT INTO chat_requests
      (
        party1_id,
        party1_name,
        party2_class,
        party2_section,
        party2_student,
        date,
        time,
        created_at,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'pending')
      `,
      [
        party1_id,
        party1_name,
        party2_class,
        party2_section,
        party2_student || null,
        date,
        time,
      ]
    );

    console.log('✅ Chat request inserted successfully');
    console.log('🆔 Insert ID:', result.insertId);

    res.json({
      success: true,
      id: result.insertId,
      message: 'Chat request created',
    });

  } catch (err) {
    console.error('❌ Chat request error:', err);
    res.status(500).json({
      error: 'Failed to save chat request',
      details: err.message,
    });
  }
});

// router.post('/chat-requestsmobile', async (req, res) => {
//   console.log('📥 /chat-requests HIT');

//   try {
//     const {
//       schoolCode,
//       class_name,
//       section,
//       student_name,
//       scheduled_at,
//       requested_by,
//     } = req.body;

//     console.log('📦 Body:', req.body);

//     // 🔴 Validation
//     if (
//       !schoolCode ||
//       !class_name ||
//       !section ||
//       !student_name ||
//       !scheduled_at ||
//       !requested_by
//     ) {
//       console.warn('⚠️ Missing required fields');
//       return res.status(400).json({
//         message: 'Missing required fields',
//       });
//     }

//     const db = getDbConnection(schoolCode);
//     console.log('✅ DB Connected:', schoolCode);

//     // 🔹 Split date & time from ISO
//     const scheduledDate = new Date(scheduled_at);
//     const date = scheduledDate.toISOString().split('T')[0];
//     const time = scheduledDate.toTimeString().slice(0, 5);

//     const [result] = await db.execute(
//       `
//       INSERT INTO chat_requests
//       (
//         party1_name,
//         party2_class,
//         party2_section,
//         party2_student,
//         date,
//         time,
//         status,
//         created_at
//       )
//       VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
//       `,
//       [
//         requested_by,
//         class_name,
//         section,
//         student_name,
//         date,
//         time,
//       ]
//     );

//     console.log('✅ Chat request inserted:', result.insertId);

//     res.json({
//       success: true,
//       id: result.insertId,
//       message: 'Chat request created successfully',
//     });

//   } catch (err) {
//     console.error('❌ Error creating chat request:', err);
//     res.status(500).json({
//       message: 'Failed to create chat request',
//       error: err.message,
//     });
//   }
// });

// ----------------------
// GET ALL CHAT REQUESTS
// ----------------------
router.get('/chat-requests', async (req, res) => {
  try {
    const db = getDbConnection(req.schoolCode);

    const [rows] = await db.execute(`
      SELECT *
      FROM chat_requests
      ORDER BY created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat requests', details: err.message });
  }
});
// -----------------------------------------------------
// POST: Submit Extra/Special Class Request
// -----------------------------------------------------
router.post('/request-class', async (req, res) => {
  const db = getDbConnection(req.schoolCode);

  let { 
    request_type, class_name, date, time, duration_minutes, staff_name, userId 
  } = req.body;

  // ✅ Ensure all required fields are present
  if (!request_type || !class_name || !date || !time || !duration_minutes || !staff_name) {
    return res.status(400).json({ message: "All form fields are required." });
  }
    // Convert duration to integer
  const duration = parseInt(duration_minutes, 10);
  if (isNaN(duration) || duration <= 0) {
    return res.status(400).json({ message: "Duration must be a positive number." });
  }

console.log({
  request_type,
  class_name,
  date,
  time,
  duration,
  staff_name,
  userId
});


  // Ensure userId is either a valid value or null
  userId = userId ?? null;

  try {
    await db.execute(
      `
        INSERT INTO extra_special_class_requests
        (request_type, class_name, request_date, start_time, duration_minutes, staff_name, requested_by_user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [request_type, class_name, date, time, duration, staff_name, userId]
    );

    res.status(201).json({
      message: `${request_type} class request submitted successfully and is PENDING approval.`
    });

  } catch (err) {
    console.error("Database error submitting request:", err);
    res.status(500).json({ message: "Error submitting request." });
  }
});


// Helper to calculate start & end date for month
const getMonthStartAndEnd = (monthYear) => {
  const [year, month] = monthYear.split('-');
  const startDate = `${year}-${month.padStart(2, '0')}-01`;
  const nextMonth = month === "12" ? 1 : parseInt(month) + 1;
  const nextYear = month === "12" ? parseInt(year) + 1 : year;
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  return { startDate, endDate };
};

// 1. Dashboard Totals
router.get(`/dashboard-totals`, async (req, res) => {
  const { month } = req.query; 
  if (!month) return res.status(400).json({ error: 'Month parameter is required' });

  const { startDate, endDate } = getMonthStartAndEnd(month);
  let connection;

  try {
    connection = getDbConnection(req.schoolCode);

    const results = {};

    // total tests + monthly average score
    const [testStats] = await connection.execute(`
      SELECT COUNT(id) as totalTests, AVG(marks) as monthlyAvgScore
      FROM academic_performance_of_student
      WHERE createdAt >= ? AND createdAt < ?;
    `, [startDate, endDate]);

    results.totalTests = testStats[0].totalTests || 0;
    results.monthlyAvgScore = testStats[0].monthlyAvgScore || 0;

    // poor performers
    const [poorResult] = await connection.execute(`
      SELECT COUNT(DISTINCT name) AS count
      FROM academic_performance_of_student
      WHERE test_type='FA1' AND marks < 40;
    `);
    results.poorPerformers = poorResult[0].count;

    // high performers
    const [highResult] = await connection.execute(`
      SELECT COUNT(DISTINCT name) AS count
      FROM academic_performance_of_student
      WHERE test_type='FA1' AND marks >= 80;
    `);
    results.highPerformers = highResult[0].count;

    // unpunctual
    const [unpunctualResult] = await connection.execute(`
      SELECT COUNT(DISTINCT name) AS count
      FROM attendance_frontend
      WHERE submission_time > '08:00:00'
      AND date >= ? AND date < ?;
    `, [startDate, endDate]);

    results.unpunctualStudents = unpunctualResult[0].count;

    // reports generated
    const [reportsResult] = await connection.execute(`
      SELECT COUNT(id) AS count
      FROM teachers_student_report
      WHERE created_at >= ? AND created_at < ?;
    `, [startDate, endDate]);

    results.progressReportsGenerated = reportsResult[0].count;

    // attendance tracked
    const [attendanceResult] = await connection.execute(`
      SELECT COUNT(DISTINCT date) as count
      FROM attendance_frontend
      WHERE date >= ? AND date < ?;
    `, [startDate, endDate]);

    results.attendanceTracked = attendanceResult[0].count;

    // SPL count
    const [splCount] = await connection.execute(`
      SELECT COUNT(DISTINCT CONCAT(class_name, '-', section)) as splCount
      FROM academic_performance_of_student;
    `);
    results.splCount = splCount[0].splCount || 0;

    res.json(results);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error fetching dashboard totals" });
  } finally {
    if (connection) connection.end();
  }
});
router.get(`/test-performance-by-type`, async (req, res) => {
  let connection;

  console.log("====================================");
  console.log("🚀 API HIT: /test-performance-by-type");
  console.log("⏰ Time:", new Date().toISOString());
  console.log("📥 Request Query Params:", req.query);
  console.log("====================================");

  try {
    /* ------------------ SCHOOL CODE ------------------ */
    const schoolCode = req.query.schoolCode || req.schoolCode;
    console.log("🏫 School Code Received:", schoolCode);

    if (!schoolCode) {
      console.warn("⚠️ School code is missing!");
    }

    /* ------------------ DB CONNECTION ------------------ */
    console.log("🔌 Attempting DB connection...");
    connection = getDbConnection(schoolCode);
    console.log("✅ Database connection established");

    /* ------------------ SQL QUERY ------------------ */
    const sqlQuery = `
      SELECT test_type, AVG(marks) AS average_score
      FROM academic_performance_of_student
      GROUP BY test_type
      ORDER BY average_score DESC
      LIMIT 6;
    `;

    console.log("📄 Executing SQL Query:");
    console.log(sqlQuery);

    const [data] = await connection.execute(sqlQuery);

    console.log("📊 Raw SQL Result:");
    console.table(data);

    /* ------------------ DATA PROCESSING ------------------ */
    console.log("🔄 Formatting SQL data...");

    const formatted = data.map((item, index) => {
      const avg = Number(item.average_score);

      const formattedItem = {
        test_type: item.test_type,
        average_score: isNaN(avg) ? 0 : Number(avg.toFixed(2)),
      };

      console.log(`➡️ Row ${index + 1} processed:`, formattedItem);
      return formattedItem;
    });

    console.log("✅ Final Formatted Response:");
    console.table(formatted);

    /* ------------------ RESPONSE ------------------ */
    console.log("📤 Sending response to client...");
    res.json(formatted);

    console.log("🎉 Response sent successfully");

  } catch (err) {
    /* ------------------ ERROR HANDLING ------------------ */
    console.error("❌ ERROR OCCURRED!");
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);

    res.status(500).json({
      error: "Internal Server Error",
      details: err.message,
    });

  } finally {
    /* ------------------ CONNECTION CLOSE ------------------ */
    if (connection) {
      console.log("🔒 Closing database connection");
      connection.end();
    }
    console.log("====================================");
    console.log("🛑 API Execution Finished");
    console.log("====================================\n");
  }
});

router.get(`/chieftest-performance-by-type`, async (req, res) => {
  let connection;

  console.log("====================================");
  console.log("🚀 API HIT: /chieftest-performance-by-type");
  console.log("⏰ Time:", new Date().toISOString());
  console.log("📥 Request Query Params:", req.query);
  console.log("====================================");

  try {
    const { schoolCode, subject, className } = req.query;

    if (!schoolCode) {
      console.warn("⚠️ Missing schoolCode!");
      return res.status(400).json({ error: "schoolCode is required" });
    }

    console.log("🔌 Connecting to DB:", schoolCode);
    connection = getDbConnection(schoolCode);
    console.log("✅ DB connection established");

    let sqlQuery = `
      SELECT test_type, AVG(marks) AS average_score
      FROM academic_performance_of_student
      WHERE 1=1
    `;
    const params = [];

    // Filter by subject
    if (subject) {
      sqlQuery += " AND subject = ?";
      params.push(subject);
      console.log("🔹 Filtering by subject:", subject);
    }

    // Filter by multiple classes
    if (className) {
      const classes = Array.isArray(className)
        ? className
        : className.split(',').map(c => c.trim());

      sqlQuery += ` AND class_name IN (${classes.map(() => '?').join(',')})`;
      params.push(...classes);
      console.log("🔹 Filtering by classes:", classes);
    }

    sqlQuery += `
      GROUP BY test_type
      ORDER BY average_score DESC
      LIMIT 6
    `;

    console.log("📄 Executing SQL:", sqlQuery);
    console.log("📄 SQL Params:", params);

    const [data] = await connection.execute(sqlQuery, params);

    if (!data.length) {
      console.log("⚠️ No data found for given filters");
    } else {
      console.log("📊 Raw SQL Result:");
      console.table(data);
    }

    // Format data safely
    const formatted = data.map((item, index) => ({
      test_type: item.test_type,
      average_score: item.average_score !== null
        ? Number(Number(item.average_score).toFixed(2))
        : 0
    }));

    console.log("✅ Final Formatted Response:");
    console.table(formatted);

    res.json(formatted);

  } catch (err) {
    console.error("❌ Error occurred:", err.message);
    console.error(err.stack);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  } finally {
    if (connection) {
      console.log("🔒 Closing DB connection");
      connection.end();
    }
    console.log("====================================");
    console.log("🛑 API Execution Finished");
    console.log("====================================\n");
  }
});


// 3. Line Chart - Monthly Trend
router.get(`/monthly-performance-trend`, async (req, res) => {
  let connection;

  try {
    connection = getDbConnection(req.schoolCode);

    const [data] = await connection.execute(`
      SELECT DATE_FORMAT(createdAt, '%Y-%m') AS month, AVG(marks) AS avg_performance
      FROM academic_performance_of_student
      WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month
      ORDER BY month ASC;
    `);

    res.json(data);

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to fetch trend data." });
  } finally {
    if (connection) connection.end();
  }
});
// ----------------------------------
router.post('/schedule', async (req, res) => {
    const db = getDbConnection(req.schoolCode);

    const { class: schClass, section, date, time } = req.body;

    try {
        const [result] = await db.execute(
            `INSERT INTO schedule_requests (class_name, section_name, schedule_date, schedule_time)
             VALUES (?, ?, ?, ?)`,
            [schClass, section, date, time]
        );

        res.json({
            success: true,
            schedule: {
                id: result.insertId,
                class: schClass,
                section,
                date,
                time
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


// ----------------------------------
// 📌 ADD AGENDA
// ----------------------------------
router.post('/agenda', async (req, res) => {
    const db = getDbConnection(req.schoolCode);

    const { meetingNo, agendaItem } = req.body;

    try {
        const [result] = await db.execute(
            `INSERT INTO meeting_agendas (meeting_no, agenda_item) VALUES (?, ?)`,
            [meetingNo, agendaItem]
        );

        res.json({
            success: true,
            agenda: {
                id: result.insertId,
                meetingNo,
                agendaItem
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET meetings filtered by schoolCode
router.get("/meetings", async (req, res) => {
    try {
        const { schoolCode } = req.query; // schoolCode from frontend

        if (!schoolCode) {
            return res.status(400).json({ success: false, error: "schoolCode is required" });
        }

        // Get DB connection for this school
        const db = getDbConnection(schoolCode);

        // Fetch meeting IDs for this school
        const [results] = await db.execute(
            `SELECT id FROM schedule_requests ORDER BY id DESC`
        );

        res.json(results); // returns [{id: 1}, {id: 2}, ...]
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


// ----------------------------------
// 📌 UPLOAD MINUTES
// ----------------------------------


router.put('/minutes/edit/:id', upload.single('minutesFile'), async (req, res) => {
    const { schoolCode } = req.body;
    const { id } = req.params;
    const db = getDbConnection(schoolCode);

    if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });

    try {
        // Get old file path to delete
        const [rows] = await db.execute(`SELECT file_path FROM meeting_minutes WHERE id = ?`, [id]);
        if (rows.length > 0) fs.unlink(rows[0].file_path, () => {});

        // Update DB
        await db.execute(`UPDATE meeting_minutes SET file_path = ? WHERE id = ?`, [req.file.path, id]);

        res.json({ success: true, message: "Minutes updated successfully" });

    } catch (err) {
        fs.unlink(req.file.path, () => {});
        res.status(500).json({ success: false, error: err.message });
    }
});
router.delete('/minutes/delete/:id', async (req, res) => {
    const { schoolCode } = req.query; // can send as query parameter
    const { id } = req.params;
    const db = getDbConnection(schoolCode);

    try {
        const [rows] = await db.execute(`SELECT file_path FROM meeting_minutes WHERE id = ?`, [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, error: "Record not found" });

        fs.unlink(rows[0].file_path, () => {}); // delete file
        await db.execute(`DELETE FROM meeting_minutes WHERE id = ?`, [id]);

        res.json({ success: true, message: "Minutes deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ----------------------------------
router.get('/holidays', async (req, res) => {
    const db = getDbConnection(req.schoolCode);

    try {
        const [result] = await db.execute(
            `SELECT id, holiday_date as date, holiday_name as name FROM holidays`
        );
        res.json(result);

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


router.post('/holidays', async (req, res) => {
    const db = getDbConnection(req.schoolCode);

    const { date, name } = req.body;

    try {
        const [result] = await db.execute(
            `INSERT INTO holidays (holiday_date, holiday_name) VALUES (?, ?)`,
            [date, name]
        );

        res.json({ success: true, id: result.insertId });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/holidays/:id', async (req, res) => {
    const db = getDbConnection(req.schoolCode);

    try {
        await db.execute(`DELETE FROM holidays WHERE id = ?`, [req.params.id]);

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


// ----------------------
// PARTY 1 (Teacher + Management) - FIXED TO USE 'query'
// ----------------------
router.get('/party1', async (req, res) => {
    console.log("➡️ /party1 API called");

    // Log schoolCode sent from frontend
    console.log("📌 schoolCode received:", req.schoolCode);

    let db;
    try {
        db = getDbConnection(req.schoolCode);
        console.log("✅ Database connection created successfully");
    } catch (connErr) {
        console.error("❌ Database connection error:", connErr.message);
        return res.status(500).json({ success: false, error: "DB Connection Failed" });
    }

    const query = `
        SELECT id, name, user_type
        FROM management_login_creation
        WHERE user_type IN ('teacher', 'management')
        ORDER BY name ASC
    `;

    console.log("🧾 SQL Query:", query);

    try {
        console.log("🚀 Executing SQL...");
        const [rows] = await db.execute(query);
        console.log("📊 Query Result:", rows);

        res.json(rows);

    } catch (err) {
        console.error("❌ SQL Execution Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. Tests Ledger
router.get(`/all-tests-ledger`, async (req, res) => {
  let connection;
  try {
    connection = getDbConnection(req.schoolCode);

    const [data] = await connection.execute(`
      SELECT name, class_name, section, subject, marks, test_type, DATE(createdAt) as createdAt
      FROM academic_performance_of_student
      ORDER BY createdAt DESC LIMIT 100;
    `);

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch ledger" });
  } finally {
    if (connection) connection.end();
  }
});


// 5. Low Performance List (<40)
router.get(`/low-performance-list`, async (req, res) => {
  let connection;
  try {
    connection = getDbConnection(req.schoolCode);

    const [data] = await connection.execute(`
      SELECT DISTINCT name, class_name, section, subject, marks
      FROM academic_performance_of_student
      WHERE test_type='FA1' AND marks < 40
      ORDER BY class_name, name;
    `);

    res.json(data);
  } finally {
    if (connection) connection.end();
  }
});


// 6. High Performance List (>=80)
router.get(`/high-performance-list`, async (req, res) => {
  let connection;

  try {
    connection = getDbConnection(req.schoolCode);

    const [data] = await connection.execute(`
      SELECT DISTINCT name, class_name, section, subject, marks
      FROM academic_performance_of_student
      WHERE test_type='FA1' AND marks >= 80
      ORDER BY class_name, name;
    `);

    res.json(data);
  } finally {
    if (connection) connection.end();
  }
});


// 7. Unpunctual Students List
router.get(`/unpunctual-students-list`, async (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ error: "Month is required" });

  const { startDate, endDate } = getMonthStartAndEnd(month);
  let connection;

  try {
    connection = getDbConnection(req.schoolCode);

    const [data] = await connection.execute(`
      SELECT DISTINCT name, class, section, DATE(date) AS date, submission_time
      FROM attendance_frontend
      WHERE submission_time > '08:00:00'
      AND date >= ? AND date < ?
      ORDER BY date DESC;
    `, [startDate, endDate]);

    res.json(data);
  } finally {
    if (connection) connection.end();
  }
});
router.get('/attendance-detail', async (req, res) => {
  const { name, class_name, section, schoolCode } = req.query;  // use query params

  if (!schoolCode) return res.status(400).json({ error: 'School code is required' });

  let connection;
  try {
    connection = getDbConnection(schoolCode);

    // Fetch raw attendance rows
    const query = `
      SELECT *
      FROM attendance_frontend
      WHERE name = ? AND class = ? AND section = ?
      ORDER BY date ASC;
    `;

    const [rows] = await connection.query(query, [name, class_name, section]);

    // Optionally format dates if needed
    const formattedRows = rows.map(r => {
      return { ...r, date: r.date ? r.date.toISOString().split("T")[0] : "N/A" };
    });

    res.json(formattedRows); // send raw data array
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    if (connection) connection.end();
  }
});


// 8. SPL List (Topper of each class/section)
router.get(`/spl-list`, async (req, res) => {
  let connection;

  try {
    connection = getDbConnection(req.schoolCode);

    const [data] = await connection.execute(`
      SELECT T1.class_name, T1.section, T1.marks,
          (SELECT name FROM academic_performance_of_student T2
           WHERE T2.class_name=T1.class_name 
           AND T2.section=T1.section AND T2.marks=T1.marks
           ORDER BY T2.name LIMIT 1) AS name
      FROM (
          SELECT class_name, section, MAX(marks) AS marks
          FROM academic_performance_of_student
          GROUP BY class_name, section
      ) AS T1
      ORDER BY T1.class_name, T1.section;
    `);

    res.json(data);

  } finally {
    if (connection) connection.end();
  }
});
// API 1: Monthly Deductions
// =======================================
router.get("/api/monthly-deductions", (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ message: "Month is required (YYYY-MM)" });

  // Use the standard connection for .query()
  const db = mysql.createConnection({
    host: '162.215.210.38',
    user: 'root',
    password: 'NavyAtagsoLnovA@$000',
    database: req.schoolCode
  });

  const query = `
    SELECT
      SUM(IFNULL(pf,0)) AS total_pf,
      SUM(IFNULL(mediclaim,0)) AS total_mediclaim,
      SUM(IFNULL(deduction,0)) AS other_deductions,
      SUM(IFNULL(salary_amount,0)) AS total_pay
    FROM bizpulse_teacher_salary
    WHERE DATE_FORMAT(payment_date,'%Y-%m') = ?
  `;

  db.query(query, [month], (err, result) => {
    db.end();
    if (err) return res.status(500).json({ error: err.message });

    res.json({
      month,
      total_pf: result[0].total_pf || 0,
      total_mediclaim: result[0].total_mediclaim || 0,
      other_deductions: result[0].other_deductions || 0,
      total_pay: result[0].total_pay || 0
    });
  });
});


// =======================================
// API 2: Salary Report (Paid Salary)
// =======================================
router.get("/api/salary-report", (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ message: "Month is required (YYYY-MM)" });

  // Use the standard connection for .query()
  const db = mysql.createConnection({
    host: '162.215.210.38',
    user: 'root',
    password: 'NavyAtagsoLnovA@$000',
    database: req.schoolCode
  });

  const query = `
    SELECT 
      SUM(cs.final_salary) AS total_paid_amount,
      COUNT(cs.teacher_id) AS total_employees_paid,
      MAX(cs.payment_date) AS last_payment_date
    FROM bizpulse_teacher_calculated_salary cs
    WHERE DATE_FORMAT(cs.payment_date, '%Y-%m') = ?
      AND cs.status = 'paid'
  `;

  db.query(query, [month], (err, results) => {
    db.end();
    if (err) return res.status(500).json({ error: err.message });

    res.json({
      month,
      total_paid_amount: results[0].total_paid_amount || 0,
      total_employees_paid: results[0].total_employees_paid || 0,
      last_payment_date: results[0].last_payment_date || "No payments"
    });
  });
});
router.get('/chief/absent-teachers', (req, res) => {
    const today = new Date().toISOString().slice(0, 10);

    console.log("=============================================");
    console.log("📌 /chief/absent-teachers API CALLED");
    console.log("📅 Today:", today);
    console.log("🏫 School Code:", req.schoolCode);
    console.log("=============================================");

    // Database connection
    const db = mysql.createConnection({
        host: '162.215.210.38',
        user: 'root',
        password: 'NavyAtagsoLnovA@$000',
        database: req.schoolCode
    });

    db.connect((err) => {
        if (err) {
            console.log("❌ DB Connection Failed:", err);
            return res.status(500).json({ error: "Database connection error" });
        }
        console.log("✅ DB Connected Successfully");
    });

    const query = `
      SELECT 
        t.id AS record_id,
        t.teacher_id,
        m.name AS teacher_name,
        m.designation AS subject,
        t.status,
        t.date,
        t.entry_time,
        t.exit_time
      FROM teachers_attendance t
      LEFT JOIN management_login_creation m ON t.teacher_id = m.id
      WHERE t.date = ? AND t.status = 'Absent'
    `;

    console.log("🔍 Executing Query:");
    console.log(query);
    console.log("📌 Parameters:", [today]);

    db.query(query, [today], (err, results) => {
        console.log("🔄 Query Execution Completed");

        db.end(() => console.log("🔌 DB Connection Closed"));

        if (err) {
            console.log("❌ SQL Error:", err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        console.log("📊 Total Absent Teachers Found:", results.length);
        console.log("=============================================");

        res.json(results);
    });
});


// ============================================================
// 2️⃣ GET SUBSTITUTE TEACHER
// ============================================================

router.get('/chief/substitute/:period/:subject', (req, res) => {
  const { period, subject } = req.params;
  const periodNum = parseInt(period);
  const today = new Date().toLocaleString('en-US', { weekday: 'long' });

  const timeCol = `period_${periodNum}_from_time`;
  const subjectCol = `period_${periodNum}_subject`;

  // Use the standard connection for .query()
  const db = mysql.createConnection({
    host: '162.215.210.38',
    user: 'root',
    password: 'NavyAtagsoLnovA@$000',
    database: req.schoolCode
  });

  const query = `
    SELECT 
      ut.class_id AS class,
      ut.section_id AS section,
      ut.${timeCol} AS time,
      ut.${subjectCol} AS subject,
      (
        SELECT mlc.name
        FROM management_login_creation mlc
        LEFT JOIN UniqueTimetable t2 
          ON t2.day = ? AND t2.period_${periodNum}_subject = mlc.designation
        WHERE mlc.designation = ? AND t2.period_${periodNum}_subject IS NULL
        LIMIT 1
      ) AS substitute
    FROM UniqueTimetable ut
    WHERE ut.day = ? AND ut.${subjectCol} = ?
    LIMIT 1
  `;

  db.query(query, [today, subject, today, subject], (err, results) => {
    db.end();

    if (err) return res.status(500).json({ error: 'Server error' });

    if (results.length === 0) {
      return res.json({
        class: "Not Available",
        section: "Not Available",
        time: "Not Available",
        subject,
        substitute: "Not Assigned",
        period: periodNum
      });
    }

    const { class: cls, section, time, substitute } = results[0];

    res.json({
      class: cls || "Not Available",
      section: section || "Not Available",
      time: time || "Not Available",
      subject,
      substitute: substitute || "Not Assigned",
      period: periodNum
    });
  });
});


// ============================================================
// 3️⃣ AVAILABLE TEACHERS FOR PERIOD
// ============================================================
router.get('/chief/available-teachers/:period/:subject', (req, res) => {
  const { period, subject } = req.params;
  const { schoolCode } = req.query; // make sure you pass ?schoolCode=XXX in request

  if (!schoolCode) {
    console.error("❌ Missing schoolCode query parameter");
    return res.status(400).json({ error: "Missing schoolCode query parameter" });
  }

  console.log(`📌 Fetching available teachers for period ${period}, subject ${subject}, school ${schoolCode}`);

  const db = mysql.createConnection({
    host: '162.215.210.38',
    user: 'root',
    password: 'NavyAtagsoLnovA@$000',
    database: schoolCode
  });

  const periodNum = parseInt(period);
  const day = new Date().toLocaleString('en-US', { weekday: 'long' });
  const subjectCol = `period_${periodNum}_subject`;

  console.log(`⏰ Day: ${day}, Subject Column: ${subjectCol}`);

  const query = `
    SELECT id AS teacher_id, name AS teacher_name, designation, phone_no
    FROM management_login_creation
    WHERE designation != ?
    AND id NOT IN (
      SELECT id FROM UniqueTimetable 
      WHERE day = ? AND ${subjectCol} IS NOT NULL
    )
  `;

  db.query(query, [subject, day], (err, results) => {
    db.end();

    if (err) {
      console.error("❌ Error fetching available teachers:", err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    console.log(`✅ Found ${results.length} available teachers`);
    results.forEach((t) => console.log(`👨‍🏫 ${t.teacher_name} - ${t.phone_no}`));

    res.json(results);
  });
});


// ============================================================
// 4️⃣ ASSIGN SUBSTITUTE TEACHER
// ============================================================

router.post('/chief/assign-substitute', (req, res) => {
  const { period, subject, substituteId, classId, sectionId } = req.body;

  if (!period || !subject || !substituteId || !classId || !sectionId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Use the standard connection for .query()
  const db = mysql.createConnection({
    host: '162.215.210.38',
    user: 'root',
    password: 'NavyAtagsoLnovA@$000',
    database: req.schoolCode
  });

  const day = new Date().toLocaleString('en-US', { weekday: 'long' });
  const periodNum = parseInt(period);
  const subjectCol = `period_${periodNum}_subject`;

  const getSubNameQuery = `SELECT name FROM management_login_creation WHERE id = ?`;

  db.query(getSubNameQuery, [substituteId], (err, result) => {
    if (err) {
      db.end();
      return res.status(500).json({ error: 'Error fetching substitute name' });
    }

    if (result.length === 0) {
      db.end();
      return res.status(404).json({ error: 'Substitute teacher not found' });
    }

    const substituteName = result[0].name;

    const updateQuery = `
      UPDATE UniqueTimetable
      SET ${subjectCol} = ?
      WHERE day = ? AND class_id = ? AND section_id = ? AND ${subjectCol} = ?;
    `;

    db.query(updateQuery, [substituteName, day, classId, sectionId, subject], (err, result) => {
      db.end();

      if (err) return res.status(500).json({ error: 'Error updating timetable' });

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'No matching class/section/subject found' });
      }

      res.json({ message: `✔ Substitute ${substituteName} assigned successfully` });
    });
  });
});


router.get('/classesselectedstudents', (req, res) => {
  console.log('✅ /api/classesselectedstudents route hit');
  
  // Check if schoolCode is present
  if (!req.schoolCode) {
    console.warn('⚠️ schoolCode missing in request!');
    return res.status(400).json({ message: 'Missing schoolCode in request.' });
  }

  console.log('➡️ schoolCode =', req.schoolCode);

  // Use the standard connection for .query()
  const db = mysql.createConnection({
    host: '162.215.210.38',
    user: 'root',
    password: 'NavyAtagsoLnovA@$000',
    database: req.schoolCode
  });
  if (!db) {
    console.error('❌ Failed to get DB connection.');
    return res.status(500).send('Database connection failed.');
  }

  const query = 'SELECT DISTINCT class_name FROM management_login_creation WHERE class_name IS NOT NULL';

  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ DB Query Error:', err);
      db.end(); // Ensure connection is closed on error
      return res.status(500).send('Server error during class fetch.');
    }
    console.log('✅ Classes fetched:', results);
    res.json(results);
    db.end();
  });
});

router.post('/users', (req, res) => {
  const { user_type } = req.body;
  console.log('✅ /api/users route hit');
  console.log('➡️ user_type =', user_type);

  if (!req.schoolCode) {
    console.warn('⚠️ schoolCode missing in request!');
    return res.status(400).json({ message: 'Missing schoolCode in request.' });
  }
  if (!user_type) {
    console.warn('⚠️ user_type is missing in request body!');
    return res.status(400).json({ message: 'user_type is required.' });
  }

  // Use the standard connection for .query()
  const db = mysql.createConnection({
    host: '162.215.210.38',
    user: 'root',
    password: 'NavyAtagsoLnovA@$000',
    database: req.schoolCode
  });
  if (!db) {
    console.error('❌ Failed to get DB connection.');
    return res.status(500).send('Database connection failed.');
  }

const query = 'SELECT * FROM management_login_creation WHERE user_type = ? AND is_deleted = 0';
  db.query(query, [user_type], (err, results) => {
    if (err) {
      console.error('❌ DB Query Error:', err);
      db.end(); // Ensure connection is closed on error
      return res.status(500).send('Server error during user fetch.');
    }
    console.log(`✅ Found ${results.length} users with user_type=${user_type}`);

    const teachersWithPhotos = results.map((teacher, idx) => {
      if (teacher.photo) {
        try {
          let filePath;
          
          // Handle different data types from database
          if (Buffer.isBuffer(teacher.photo)) {
            // Convert BLOB to string
            filePath = teacher.photo.toString('utf8');
            
            // If it's still binary-looking, try hex conversion
            if (filePath.includes('\u0000') || filePath.length === 0) {
              filePath = teacher.photo.toString('hex');
              // Convert hex to string if it represents a path
              if (filePath.startsWith('75706c6f6164732f')) { // "uploads/" in hex
                filePath = Buffer.from(filePath, 'hex').toString('utf8');
              }
            }
          } else if (typeof teacher.photo === 'string') {
            filePath = teacher.photo;
            
            // Handle hex strings that might start with 0x
            if (filePath.startsWith('0x')) {
              filePath = Buffer.from(filePath.slice(2), 'hex').toString('utf8');
            }
          } else {
            console.warn(`Unexpected photo data type for teacher ${idx}`);
            return teacher;
          }
          
          // Ensure the path is relative to public/uploads
          if (!filePath.startsWith('uploads/') && !filePath.startsWith('/')) {
            filePath = `uploads/${filePath}`;
          }
          
          // Remove any leading slash to make it relative to public directory
          filePath = filePath.replace(/^\/+/, '');
          
          // Construct the full path
          const fullPath = path.join(__dirname, '../public', filePath);
          
          // Check if file exists before trying to read it
if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
  const imageBuffer = fs.readFileSync(fullPath);
            const base64Photo = imageBuffer.toString('base64');
            return {
              ...teacher,
              photo: `data:image/jpeg;base64,${base64Photo}`
            };
          } else {
            console.warn(`File not found for teacher ${idx}: ${fullPath}`);
            return teacher;
          }
        } catch (err) {
          console.error(`Error reading photo for teacher ${idx}:`, err);
          return teacher;
        }
      }
      return teacher;
    });

    res.json(teachersWithPhotos);
    db.end();
  });
});

// Photo upload endpoint
router.post('/upload-photo', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const photoPath = `/uploads/${req.file.filename}`;
  res.json({ photoPath });
});

// Update teacher
router.put('/users/:id', (req, res) => {
  console.log('--- Debug: PUT /users/:id ---');
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);

  const userId = req.params.id;
  const { photoPath, dob, ...updatedData } = req.body;
  // Use the standard connection for .query()
  const db = mysql.createConnection({
    host: '162.215.210.38',
    user: 'root',
    password: 'NavyAtagsoLnovA@$000',
    database: req.schoolCode
  });

  console.log('User ID:', userId);
  console.log('Photo path (before update):', photoPath);
  console.log('Date of birth (raw):', dob);
  console.log('Updated data (before processing):', updatedData);

  // Update photo path if provided
  if (photoPath) {
    updatedData.photo = photoPath;
    console.log('Photo path (after update):', updatedData.photo);
  }

  // Format date of birth if provided
  if (dob) {
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      console.error('Invalid date format for dob:', dob);
      db.end(); // Ensure connection is closed
      return res.status(400).send('Invalid date format for dob');
    }
    updatedData.dob = dobDate.toISOString().split('T')[0];
    console.log('Date of birth (formatted):', updatedData.dob);
  }

  const query = 'UPDATE management_login_creation SET ? WHERE id = ?';
  console.log('SQL query:', query);
  console.log('Query params:', [updatedData, userId]);

  db.query(query, [updatedData, userId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      db.end(); // Ensure connection is closed on error
      return res.status(500).send('Server error');
    }
    console.log('Database result:', result);
    if (result.affectedRows === 0) {
      console.warn('No rows affected. Teacher not found.');
      db.end(); // Ensure connection is closed
      return res.status(404).send('Teacher not found');
    }
    console.log('Teacher updated successfully');
    res.json({ message: 'Teacher updated successfully' });
    db.end(); // FIX: Added db.end() to close the connection
  });
});

router.get('/users/:class', (req, res) => {
  // Use the standard connection for .query()
  const db = mysql.createConnection({
    host: '162.215.210.38',
    user: 'root',
    password: 'NavyAtagsoLnovA@$000',
    database: req.schoolCode
  });
  const className = req.params.class;
  const section = req.query.section || '';
  const userType = req.query.user_type || '';

  console.log(`Fetching users for class: ${className}, section: ${section}, userType: ${userType}`);

  // ✅ Start base query (exclude deleted users)
  let query = 'SELECT * FROM management_login_creation WHERE class_name = ? AND is_deleted = 0';
  const params = [className];

  if (userType) {
    query += ' AND user_type = ?';
    params.push(userType);
  }
  if (section) {
    query += ' AND section = ?';
    params.push(section);
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      db.end(); // Ensure connection is closed on error
      return res.status(500).send('Server error');
    }

    console.log(`Found ${results.length} users in database`);

    const usersWithPhotos = results.map(user => {
      if (user.photo) {
        try {
          console.log('Original photo data for user', user.id, ':', user.photo);

          let photoPath = user.photo;

          // Handle hex-encoded paths
          if (typeof photoPath === 'string' && photoPath.startsWith('0x')) {
            console.log('Processing hex-encoded photo path');
            photoPath = Buffer.from(photoPath.substring(2), 'hex').toString('utf8');
          } else if (Buffer.isBuffer(photoPath)) {
            console.log('Processing buffer photo path');
            photoPath = photoPath.toString('utf8');
          }

          photoPath = photoPath.trim();
          console.log('Processed photo path:', photoPath);

          // Ensure proper path format
          if (!photoPath.startsWith('/uploads/') && !photoPath.startsWith('http')) {
            photoPath = '/uploads/' + photoPath.replace(/^\/+/, '');
            console.log('Adjusted photo path:', photoPath);
          }

          return { ...user, photo: photoPath };
        } catch (e) {
          console.error('Error processing photo for user:', user.id, 'Error:', e);
          return { ...user, photo: null };
        }
      }
      return user;
    });

    console.log('Final users data being sent:', usersWithPhotos);
    res.json(usersWithPhotos);
    db.end();
  });
});

// Get all sections for a specific class
router.get('/sections/:class', (req, res) => {
  // Use the standard connection for .query()
  const db = mysql.createConnection({
    host: '162.215.210.38',
    user: 'root',
    password: 'NavyAtagsoLnovA@$000',
    database: req.schoolCode
  });
  const className = req.params.class;

  const query = `
    SELECT DISTINCT section
    FROM management_login_creation
    WHERE class_name = ? AND section IS NOT NULL
  `;

  db.query(query, [className], (err, results) => {
    if (err) {
      console.error('Error fetching sections:', err);
      db.end(); // Ensure connection is closed on error
      return res.status(500).send('Server error');
    }

    res.json(results.map(row => row.section));
    db.end();
  });
});

// Delete teacher
// Soft delete teacher (or student)
router.delete('/users/:id', (req, res) => {
  const userId = req.params.id;
  // Use the standard connection for .query()
  const db = mysql.createConnection({
    host: '162.215.210.38',
    user: 'root',
    password: 'NavyAtagsoLnovA@$000',
    database: req.schoolCode
  });

  const updateQuery = 'UPDATE management_login_creation SET is_deleted = 1 WHERE id = ?';
  db.query(updateQuery, [userId], (err, result) => {
    if (err) {
      console.error(err);
      db.end(); // Ensure connection is closed on error
      return res.status(500).send('Server error');
    }

    if (result.affectedRows === 0) {
      db.end(); // Ensure connection is closed
      return res.status(404).send('User not found');
    }

    res.json({ message: 'User moved to deleted list successfully' });
    db.end();
  });
});
// ✅ Get all deleted users (soft-deleted)
router.get('/deleted-students', (req, res) => {
  // Use the standard connection for .query()
  const db = mysql.createConnection({
    host: '162.215.210.38',
    user: 'root',
    password: 'NavyAtagsoLnovA@$000',
    database: req.schoolCode
  });

  const sql = `
    SELECT * FROM management_login_creation 
    WHERE is_deleted = 1 AND user_type = 'student'
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      db.end(); // Ensure connection is closed on error
      return res.status(500).send('Server error');
    }

    res.json(results);
    db.end();
  });
});
router.get('/deleted-teachers', (req, res) => {
  // Use the standard connection for .query()
  const db = mysql.createConnection({
    host: '162.215.210.38',
    user: 'root',
    password: 'NavyAtagsoLnovA@$000',
    database: req.schoolCode
  });

  const sql = `
    SELECT * FROM management_login_creation 
    WHERE is_deleted = 1 AND user_type = 'teacher'
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      db.end(); // Ensure connection is closed on error
      return res.status(500).send('Server error');
    }

    res.json(results);
    db.end();
  });
});


module.exports = router;