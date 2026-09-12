import poster from "./images/birthdayposter7.png"
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
<title>Student Birthday Wishes</title>

 <style>
    * {
      box-sizing: border-box;
    }

    html,
    body {
      min-height: 100%;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #eef3f6;
      color: #111;
      font-family: Georgia, "Times New Roman", serif;
      -webkit-font-smoothing:antialiased;
      -moz-osx-font-smoothing:grayscale;
    }

    .overlay {
      width: 500px;
      height: 500px;
      position: relative;
      overflow: hidden;
      display:flex;
      flex-direction:column;
      background-image:
        linear-gradient(rgba(255,255,255,0.16), rgba(255,255,255,0.16)),
        url(${poster});
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      border-radius: 10px;
      box-shadow: 0 14px 35px rgba(24, 45, 58, 0.2);
    }

    .header {
      display:flex;
      align-items:center;
      justify-content:center;
      min-height: 72px;
      padding: 18px 28px 0;
      position: relative;
      z-index: 1;
    }

    .logo { 
      position: absolute;
      top: 16px;
      left: 55px;
      width: 60px; 
      height: 60px; 
      object-fit: contain;
      background-color:white;
      border-radius:50%
    }

    .school-name { 
      max-width: 300px;
      text-align:center; 
      font-size:23px; 
      line-height: 1.1;
      font-weight:700; 
      color:#1F3A5F; 
      text-shadow:0 2px 6px #eceef1;
      transform: translateY(6px);
    }

    .spacer {
      display: none;
    }

    .container { 
      flex:1; 
      display:flex; 
      align-items:flex-start; 
      justify-content:center; 
      padding: 18px 62px 24px;
      position: relative;
      z-index: 1;
    }

    .poster-content {
      width: 100%;
      text-align: center;
    }

    .wish { 
      display:flex;
      justify-content:center;
      gap:14px;
      font-size:30px; 
      line-height: 1;
      margin: 0 0 10px; 
      color:#C9A227; 
      font-weight:800;
    }

    .student-photo-box {
      width: 100px;
      height: 100px;
      margin: 0 auto 12px;
      padding: 5px;
      border-radius: 8px;
      background: #f7f4f4;
      box-shadow: 0 8px 18px rgba(14, 14, 15, 0.22);
    }

    .student-photo {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
      border-radius: 5px;
    }

    .message { 
      font-size:14px; 
      color:#475569; 
      max-width: 330px;
      margin:0 auto; 
      line-height:1.45;
      text-align: center;
      
    }

    .student-name {
      margin: 0 auto 10px;
      color: #1F3A5F;
      font-size: 18px;
      line-height: 1.1;
      font-weight: 800;
    }

    .school-signature { 
      margin-top:18px; 
      text-align:center; 
      color:#1E40AF;
      font-size: 13px;
      line-height: 1.25;
      font-weight: 650;
    }

    .school-signature strong {
      display: block;
      color:#1F3A5F;
      font-size: 14px;
      margin-top: 3px;
      text-transform: uppercase;
    }

    @media (max-width:600px) {
      body {
        padding: 12px;
      }

      .overlay {
        width: min(500px, 100vw - 24px);
        height: auto;
        aspect-ratio: 1;
      }

      .logo {
        width: 46px;
        height: 46px;
        top: 14px;
        left: 22px;
      }

      .school-name {
        font-size:18px;
        max-width: 230px;
      }

      .container {
        padding: 18px 34px 20px;
      }

      .wish {
        font-size:26px;
        gap:10px;
      }

      .message {
        font-size: 12px;
      }

      .student-photo-box {
        width: 68px;
        height: 68px;
      }

      .student-name {
        font-size: 15px;
      }
    }
  </style>
</head>
<body>

  <div class="overlay">
    <header class="header">
      <img class="logo" src="${logo}" alt="School Logo">
      <div class="school-name">${institute_name}</div>
      <div class="spacer"></div>
    </header>

    <main class="container">
      <section class="poster-content">
        <h1 class="wish"><span>Happy</span><span>Birthday!</span></h1>
        <div class="student-name">${student}</div>
        <div class="student-photo-box">
          <img src="${studentPhoto}" alt="Student Photo" class="student-photo">
        </div>
        <p class="message">Every year is a new opportunity to learn, dream, and achieve greater things. May you always stay curious, confident, and determined to reach your goals. 
            Wishing you endless success and happiness.
        </p>
        <div class="school-signature">
          With warm wishes from<br>
          Principal, Teachers & Staff of
          <strong>${institute_name}</strong>
        </div>
      </section>
    </main>
  </div>

</body>

</html>`
}
    
   
