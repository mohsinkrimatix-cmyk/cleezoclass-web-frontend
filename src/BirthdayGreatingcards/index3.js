import poster from "./images/birthdayposter3.png"

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
<title>Birthday Poster</title>


<style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      height: 100vh;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #f7f1e8;
    }

    .poster-canvas {
      height: 500px;
      width: 500px;
      background-image: url(${poster});
      background-position: center;
      background-size: cover;
      background-repeat: no-repeat;
      border-radius: 10px;
      position: relative;
      overflow: hidden;
      font-family: Georgia, "Times New Roman", serif;
    }

    .header {
      position: relative;
      z-index: 1;
      min-height: 58px;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 10px;
      text-align: center;
      width:100%;
      gap:10px
    }

    .logo {
      position: absolute;
      top: 10px;
      left: 30px;
      width: 50px;
      height: 50px;
      object-fit: contain;
    }

    .school-name {
      max-width: 310px;
      color: #0f172a;
      font-size: 20px;
      line-height: 1.1;
      font-weight: 800;
      text-transform: uppercase;
      text-shadow: 0 1px 3px rgba(255,255,255,0.9);
      margin-top: 10px;
    }

    .greatings {
      text-align: center;
      margin-top: 8px;
      position: relative;
      z-index: 1;
    }

    .greatings h2 {
      margin: 0;
      color: #0f172a;
      font-size: 21px;
      line-height: 1.15;
      font-weight: 800;
    }

    .greatings>h2>strong {
      color: #d4af37;

    }

    .student-photo-box {
      width: 85px;
      height: 85px;
      margin: 10px auto 10px;
      padding: 5px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 8px 18px rgba(15,23,42,0.2);
      position: relative;
      z-index: 1;
    }

    .student-photo {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
      border-radius: 5px;
    }

    .birthday-message {
      font-size: 13px;
      color: #334155;
      line-height: 1.35;
      margin-bottom: 8px;
      font-weight: 600;

    }

    .wishes-highlight {
      font-size: 12px;
      color: #0f172a;
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 6px;

    }

    .school-signature {
      font-size: 12px;
      color: #0f172a;
      font-weight: 700;
      line-height: 1.25;

    }

    .birthday-message,
    .wishes-highlight,
    .school-signature {
      width: 235px;
      max-width: 235px;
      margin-left: auto;
      margin-right: auto;
      text-align: center;
      position: relative;
      z-index: 1;
    }
    .school-signature>strong{
      display: block;
    }
  </style>
  </head>
<body>

  <div class="poster-canvas">
    <div class="header">
      <img src="${logo}" alt="School Logo" class="logo">
      <div class="school-name">${institute_name}</div>
    </div>
    
     <div class="greatings">
      <h2>Happy Birthday, Dear
        <br><strong>${student}</strong>
      </h2>
    </div>

      <div class="student-photo-box">
      <img src="${studentPhoto}" alt="Student Photo" class="student-photo">
    </div>
      
       <div class="birthday-message">
      May your day be filled with smiles, happiness, and lots of blessings.
      Wishing you success, good health, and a bright future.<br><br>
      Enjoy your special day!
    </div>
      
     <div class="wishes-highlight">
      🌟 Wishing you a very Happy Birthday and a bright future ahead! 🌟
    </div>
      
    <div class="school-signature">
      – Principal, Teachers & Staff of <strong>${institute_name}</strong> 
    </div>
  </div>

</body>

</html>`
}