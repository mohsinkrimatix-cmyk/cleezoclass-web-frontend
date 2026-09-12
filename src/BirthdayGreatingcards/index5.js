import poster from "./images/birthdayposter5.png"
export default function getSchoolDetails(details = {}) {
    const {
        logo = "",
        institute_name = "",
        student = "",
        studentPhoto = "",
    } = details;

    return `

<!DOCTYPE html>
<html lang="en">

<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Student Birthday wishes</title>

<style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ece8df;
      font-family: Arial, Helvetica, sans-serif;
    }

    .poster-canvas {
      width: 500px;
      height: 500px;
      position: relative;
      overflow: hidden;
      border-radius: 10px;
      background-image: url(${poster});
      background-position: center;
      background-size: cover;
      box-shadow: 0 14px 35px rgba(45, 18, 18, 0.22);
    }

    .card::before {
      content: "";
      position: absolute;
      inset: 0;
      background: rgba(255, 251, 242, 0.2);
      pointer-events: none;
    }

    .header {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      min-height: 76px;
      padding: 14px 34px 6px;
      text-align: center;
    }

    .logo {
      width: 60px;
      height: 60px;
      object-fit: contain;
      flex: 0 0 auto;
      padding: 5px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.82);
      box-shadow: 0 5px 14px rgba(71, 22, 22, 0.18);
      margin-left: -90px; /* Adjust value as needed */
    }

    .school-name {
      max-width: 330px;
      color: #6B0F1A;
      font-size: 14px;
      line-height: 1.1;
      font-weight: 800;
      text-transform: uppercase;
      margin-left:90px; /* Adjust value as needed */
    }

    .content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 0 54px 18px;
    }

    .title {
      margin: 0 0 8px;
      color: #c28318;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 36px;
      line-height: 0.95;
      font-weight: 900;
    }

    .title span {
      display: block;
      color: #640d0d;
      font-size: 31px;
      
    }

    .student-photo {
      width: 104px;
      height: 104px;
Enjoy your special day!
With warm wishes from
Principal, Teachers & Staff of
${institute_name}
      display: block;
      object-fit: cover;
      border-radius: 50%;
      border: 5px solid #fff8eb;
      background: #fff8eb;
      box-shadow: 0 9px 22px rgba(73, 24, 24, 0.24);
    }
    .birthday-heading{
        text-align: center;
    }

    .student-name {
      margin-top: 8px;
      color: #2c0606;
      font-size: 23px;
      line-height: 1.1;
      font-weight: 800;
    }

    .message {
      width: 100%;
      margin: 9px 0 0;
      color: #4A2C2A;
      font-size: 14px;
      line-height: 1.4;
      font-weight: 600;
    }

    .highlight {
      margin-top: 7px;
      color: #8b1616;
      font-size: 14px;
      line-height: 1.35;
      font-weight: 800;
    }

    .signature {
      margin-top: 12px;
      color: #B8860B;
      font-size: 14px;
      line-height: 1.28;
      font-weight: 800;
    }

    .signature strong {
      display: block;
      color: #B8860B;
      font-size: 15px;
      text-transform: uppercase;
       margin-top: 10px;
    }


  </style>
</head>
<body>

  <div class="poster-canvas">
    <div class="header">
      <img src="${logo}" alt="School Logo" class="logo">
      <div class="school-name">${institute_name}</div>
    </div>
    
    <div class="content-area">
      <div class="birthday-heading">🎉 Happy Birthday, Dear
        <br> ${student} 🎉</div>
</header>

    <section class="content">
      <h1 class="title">Happy <span>Birthday</span></h1>

      <img src="${studentPhoto}" alt="Student Photo" class="student-photo">

      <div class="student-name">${student}</div>

      <p class="message">
        May your special day be filled with smiles, happiness, blessings, and
        beautiful memories. Wishing you success, good health, and a bright
        future ahead.
      </p>

      <div class="highlight">
        Enjoy your special day!
      </div>

      <div class="signature">
        With warm wishes from<br>
        Principal, Teachers & Staff of
        <strong>${institute_name}</strong>
      </div>
    </section>
  </main>
</body>

</html>`
}
    
   
