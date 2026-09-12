import poster from './images/birthdayposter4.png'
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
    /* Page reset */
    body {
      margin: 0;
      padding: 0;
      background: #f0f2f5;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      width:100%;
      height: 100vh;
      
    }

    .poster-canvas {
      width: 500px;
      height: 500px;
      position: relative;
      border-radius: 10px;
      overflow: hidden;
     
      background-image: url(${poster});
      background-size: cover;
      background-position: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
    }


    .header {
      position: relative;
      z-index: 2;
      text-align: center;
      padding-top: 18px;
      padding-bottom: 6px;
    }

    .header img.logo {
      position: absolute;
      top: 0;
      left: -125px;
      height: 64px;
      width: 64px;
      display: block;
      margin: 0;
    }

    .school-name {
      font-size: 22px;
      font-weight: 800;
      color: #111;
      letter-spacing: 0.6px;
    }

    .content {
      position: relative;
      z-index: 2;
      text-align: center;
      width: 100%;
      padding: 18px 54px 20px 76px;
      margin-top: 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .greeting {
      margin-top: -2px;
    }

    .happy,
    .birthday {
      font-size: 40px;
      font-weight: 900;
      color: #040404;
       margin-top: -15px;
      font-family: Garamond, serif;
      line-height: 0.9;
    }
.birthday {
    color: #E91E63;
    margin-top: 5px;
    font-family: 'Bromello';
}

    .student-photo {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      margin-top: 14px;
      border: 4px solid rgba(255,255,255,0.7);
      box-shadow: 0 6px 18px rgba(0,0,0,0.18);
    }

    .student-name {
      font-size: 22px;
      font-weight: 800;
      color: #1a6aff;
      margin: 12px 0 6px 0;
    }

    .wish {
      max-width: 280px;
      font-size: 15px;
      color: #050505;
      line-height: 1.6;
      text-align: center;
      margin-bottom: 18px;
   
       
    }

    .signature {
      font-size: 15px;
      color: #bb8308;
      font-weight: 650;
      margin-top: -10px;
    }
  </style>
</head>
<body>

  <div class="poster-canvas">
  <div class="header">
      <img src="${logo}" alt="School Logo" class="logo">
      <div class="school-name">${institute_name}</div>
    </div>
    
   <div class="content">
      <div class="greeting">
        <div class="happy">Happy</div>
        <div class="birthday">Birthday</div>
      </div>

      <img src="${studentPhoto}" alt="Student Photo" class="student-photo">

      <div class="student-name">${student}</div>

      <div class="wish">
       May your birthday bring lots of smiles, happiness, and fun. 
       Wishing you a bright future filled with success and wonderful achievements.
        
      </div>

      <div class="signature"> Principal, Teachers & Staff of <br>${institute_name} 🏫</div>
    </div>
  </div>

    
  
</body>

</html>`
}


