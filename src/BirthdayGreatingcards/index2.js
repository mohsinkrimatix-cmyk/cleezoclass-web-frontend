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
    /* Reset and Center Container */
    body {
      margin: 0;
      padding: 0;
      background-color: #f0f2f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }

    /* 500px x 500px Poster Canvas */
    .poster-canvas {
      width: 500px;
      height: 500px;
      background: radial-gradient(circle at center, #ffe1e1 0%, #effaff 100%);
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      border-radius: 8px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .header {
      position: absolute;
      top: 18px;
      left: 0;
      width: 100%;
      z-index: 12;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 34px;
      text-align: center;
    }

    .logo {
      position: absolute;
      top: -3px;
      left: 30px;
      width: 58px;
      height: 58px;
      object-fit: contain;
    }

    .school-name {
      max-width: 310px;
      color: #1e62eb;
      font-size: 22px;
      line-height: 1.1;
      font-weight: 800;
      text-transform: uppercase;
      text-shadow: 0 1px 3px rgba(255,255,255,0.9);
    }

    /* Typography & Content Layout */
    .content-area {
      position: relative;
      z-index: 10; /* Ensures text stays in front of balloons */
      text-align: center;
      padding: 0 40px;
      margin-top: 18px; /* Perfectly balances the visual weight */
    }

    .birthday-heading {
      font-size: 22px;
      color: #1a1a1a;
      margin-bottom: 12px;
      font-weight: bold;
    }

    .student-photo-box {
      width: 88px;
      height: 88px;
      margin: 0 auto 12px;
      padding: 5px;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 8px 18px rgba(30, 98, 235, 0.22);
    }

    .student-photo {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
      border-radius: 5px;
    }

    .birthday-message {
      font-size: 15px;
      color: #4a4a4a;
      line-height: 1.6;
      margin-bottom: 16px;
    }


    .school-signature {
      font-size: 16px;
      color: #bfa15f; /* Elegant gold tone for the school staff signature */
      font-weight: 600;
    }

    /* 3D Balloon Engine (Pure CSS) */
    .balloon {
      position: absolute;
      border-radius: 50% 50% 50% 50% / 40% 40% 60% 60%; /* Creates the classic balloon egg shape */
    }

    /* Balloon Color Styles with Realistic 3D Highlights */
    .balloon.blue {
      background: radial-gradient(circle at 35% 35%, #6ba4ff 0%, #1e62eb 40%, #002d8c 100%);
    }

    .balloon.gold {
      background: radial-gradient(circle at 35% 35%, #fff1a8 0%, #e6b800 40%, #806000 100%);
    }

    .balloon.white {
      background: radial-gradient(circle at 35% 35%, #ffffff 0%, #e6e8eb 50%, #b0b5bc 100%);
      opacity: 0.9;
    }

    /* Exact Pixel Placements matching the bottom layout of the reference image */
    
    /* Bottom Left Cluster */
    .b1 { width: 85px; height: 100px; left: -25px; bottom: -10px; transform: rotate(-15deg); }
    .b2 { width: 95px; height: 110px; left: 10px; bottom: -45px; transform: rotate(-5deg); z-index: 2; }
    .b3 { width: 80px; height: 95px; left: 75px; bottom: -30px; transform: rotate(10deg); }
    .b4 { width: 100px; height: 115px; left: -10px; bottom: 65px; transform: rotate(-20deg); }

    /* Bottom Center Cluster */
    .b5 { width: 90px; height: 105px; left: 170px; bottom: -50px; transform: rotate(-8deg); }
    .b6 { width: 100px; height: 115px; left: 225px; bottom: -40px; transform: rotate(5deg); z-index: 2; }
    .b7 { width: 85px; height: 100px; left: 275px; bottom: -65px; transform: rotate(15deg); }

    /* Bottom Right Cluster */
    .b8 { width: 95px; height: 110px; right: -15px; bottom: -20px; transform: rotate(15deg); }
    .b9 { width: 85px; height: 100px; right: 25px; bottom: -45px; transform: rotate(-5deg); z-index: 2; }
    .b10 { width: 90px; height: 105px; right: -20px; bottom: 75px; transform: rotate(25deg); }
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

      <div class="student-photo-box">
        <img src="${studentPhoto}" alt="Student Photo" class="student-photo">
      </div>
      
      <div class="birthday-message">
        May your day be filled with smiles, happiness, and lots of blessings. 
        Wishing you success, good health, and a bright future.<br><br>
        Enjoy your special day!
      </div>
      
     
      
      <div class="school-signature">
        – Principal, Teachers & Staff of <br>${institute_name} 🏫💙
      </div>
    </div>

    <div class="balloon white b1"></div>
    <div class="balloon blue b2"></div>
    <div class="balloon gold b3"></div>
    <div class="balloon blue b4"></div>

    <div class="balloon gold b5"></div>
    <div class="balloon white b6"></div>
    <div class="balloon blue b7"></div>

    <div class="balloon blue b8"></div>
    <div class="balloon white b9"></div>
    <div class="balloon gold b10"></div>

  </div>
  
</body>

</html>`
}
    
   
