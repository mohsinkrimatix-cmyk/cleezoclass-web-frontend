import poster from "./images/birthdayposter8.png"
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
      color: #172033;
      font-family: Georgia, "Times New Roman", serif;
    }

    .poster {
      width: 500px;
      height: 500px;
      position: relative;
      overflow: hidden;
      border-radius: 10px;
      background-image: url(${poster});
      background-position: center;
      background-size: cover;
      box-shadow: 0 14px 35px rgba(24, 45, 58, 0.22);
    }

    .header {
      position: relative;
      z-index: 1;
      min-height: 95px;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 30px 34px 0;
      text-align: center;
    }

    .logo {
      position: absolute;
      top: 28px;
      left: 45px;
      width: 58px;
      height: 58px;
      object-fit: contain;
      margin-left:15px;
    }

    .school-name {
      max-width: 320px;
      color: #1E3A8A;
      font-size: 23px;
      line-height: 1.1;
      font-weight: 800;
      text-align: center;
      text-shadow: 0 1px 4px rgba(255,255,255,0.9);
      margin-top:10px
    }

    .content {
      position: relative;
      z-index: 1;
      width: 100%;
      padding: 4px 72px 24px;
      text-align: center;
    }

    .wish {
     margin-top: -20px;
      color: #D97706;
      font-size: 32px;
      line-height: 1;
      font-weight: 900;
      
    }

    .student-name {
      margin: 0 0 15px;
      color: #C9A227;
      font-size: 19px;
      line-height: 1.1;
      font-weight: 800;
      
    }

    .student-photo-box {
      width: 100px;
      height: 100px;
      margin: 0 auto 12px;
      padding: 5px;
      border-radius: 8px;
      background: #ffffff;
      box-shadow: 0 8px 18px rgba(24,45,58,0.22);
    }

    .student-photo {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
      border-radius: 5px;
    }

    .message {
      max-width: 315px;
      margin: 0 auto;
      color: #334155;
      font-size: 14px;
      line-height: 1.45;
      font-weight: 600;
      text-align: center;
    }

    .school-signature {
      max-width: 270px;
      margin: 20px auto 0;
      color: #1E3A8A;
      font-size: 13px;
      line-height: 1.25;
      font-weight: 700;
      text-align: center;
    }

    .school-signature strong {
      display: block;
      margin-top: 3px;
      color: #2563EB;
      font-size: 14px;
      text-transform: uppercase;
    }

    @media (max-width: 600px) {
      body {
        padding: 12px;
      }

      .poster {
        width: min(500px, 100vw - 24px);
        height: auto;
        aspect-ratio: 1;
      }

      .header {
        min-height: 78px;
        padding-top: 24px;
      }

      .logo {
        top: 20px;
        left: 22px;
        width: 46px;
        height: 46px;
      }

      .school-name {
        max-width: 230px;
        font-size: 18px;
      }

      .content {
        padding: 16px 40px 20px;
      }

      .wish {
        font-size: 26px;
      }

      .student-name {
        font-size: 16px;
      }

      .student-photo-box {
        width: 70px;
        height: 70px;
      }

      .message {
        font-size: 12px;
        max-width: 280px;
      }
    }
  </style>
</head>
<body>
  <main class="poster">
    <header class="header">
      <img src="${logo}" alt="School Logo" class="logo">
      <div class="school-name">${institute_name}</div>
    </header>

    <section class="content">
      <h1 class="wish">Happy Birthday!</h1>
      <div class="student-name">${student}</div>

      <div class="student-photo-box">
        <img src="${studentPhoto}" alt="Student Photo" class="student-photo">
      </div>

      <p class="message">
       May your day be filled with smiles, happiness, and lots of blessings.
        Wishing you success, good health, and a bright future..
      </p>

      <div class="school-signature">
        With warm wishes from<br>
        Principal, Teachers & Staff of
        <strong>${institute_name}</strong>
      </div>
    </section>
  </main>
</body>

</html>`
}
    
   
