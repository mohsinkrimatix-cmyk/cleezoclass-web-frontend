import poster from "./images/birthdayposter10.png";

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
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1eef4;
      color: #2f2335;
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
      box-shadow: 0 14px 35px rgba(56, 34, 62, 0.22);
    }

    .header {
      position: relative;
      z-index: 1;
      min-height: 86px;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 22px 34px 0;
      text-align: center;
    }

    .logo {
      position: absolute;
      top: 18px;
      left: 34px;
      width: 58px;
      height: 58px;
      object-fit: contain;
      color: #fbf6fb;
      background-color:white;
      border-radius:50%
    }

    .school-name {
      max-width: 315px;
      color: #ffe7ef;
      font-size: 23px;
      line-height: 1.1;
      font-weight: 800;
      text-align: center;
      text-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
      text-transform: uppercase;
    }

    .content {
      position: relative;
      z-index: 1;
      width: 100%;
      padding: 10px 66px 24px;
      text-align: center;
    }

    .wish {
      margin: 0 0 14px;
      color: #ff7fa0;
      font-size: 33px;
      line-height: 1;
      font-weight: 900;
      text-shadow: 0 2px 5px rgba(0, 0, 0, 0.45);
    }

    .message {
      max-width: 330px;
      margin: 0 auto;
      color: #f9d9e4;
      font-size: 14px;
      line-height: 1.45;
      font-weight: 600;
      text-align: center;
    }

    .student-photo-box {
      width: 94px;
      height: 94px;
      margin: 14px auto 0;
      padding: 5px;
      border-radius: 8px;
      background: #ffffff;
      box-shadow: 0 8px 18px rgba(56, 34, 62, 0.22);
    }

    .student-photo {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
      border-radius: 5px;
    }

    .student-name {
      margin: 12px 0 0;
      color: #ff9fba;
      font-size: 19px;
      line-height: 1.1;
      font-weight: 800;
    }

    .school-signature {
      max-width: 285px;
      margin: 18px auto 0;
      color: #f9d9e4;
      font-size: 13px;
      line-height: 1.25;
      font-weight: 700;
      text-align: center;
    }

    .school-signature strong {
      display: block;
      margin-top: 10px;
      color: #ffffff;
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
        min-height: 74px;
        padding-top: 18px;
      }

      .logo {
        top: 16px;
        left: 22px;
        width: 46px;
        height: 46px;
      }

      .school-name {
        max-width: 230px;
        font-size: 18px;
      }

      .content {
        padding: 8px 38px 20px;
      }

      .wish {
        font-size: 26px;
        margin-bottom: 10px;
      }

      .message {
        max-width: 285px;
        font-size: 12px;
      }

      .student-photo-box {
        width: 70px;
        height: 70px;
      }

      .student-name {
        font-size: 16px;
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

      <p class="message">
       May your special day be filled with happiness, laughter, and wonderful memories. 
       Wishing you good health, success, and endless joy in the year ahead. Keep learning, growing, and shining brightly.
      </p>

      <div class="student-photo-box">
        <img src="${studentPhoto}" alt="Student Photo" class="student-photo">
      </div>

      <div class="student-name">${student}</div>

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
    
   
