import poster from "./images/birthdayposter6.png"
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

    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1eee9;
      font-family: Arial, Helvetica, sans-serif;
    }

    .birthday-card {
      width: 500px;
      height: 500px;
      position: relative;
      overflow: hidden;
      border-radius: 10px;
      background-image: url(${poster});
      background-position: center;
      background-size: cover;
      box-shadow: 0 14px 35px rgba(49, 31, 38, 0.18);
    }

    .birthday-card::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.48) 0%,
        rgba(255, 255, 255, 0.2) 62%,
        rgba(255, 255, 255, 0.05) 100%
      );
      pointer-events: none;
    }

    .header {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 16px 36px 4px;
      text-align: center;
    }

    .logo {
      position: absolute;
      top: 5px;
      left: 10px;
      width: 70px;
      height: 70px;
      flex: 0 0 auto;
      object-fit: contain;
      padding: 5px;
      border-radius: 50%;
      
      
    }

    .school-name {
      max-width: 340px;
      color: #5B2C83;
      font-size: 22px;
      line-height: 1.1;
      font-weight: 800;
      text-transform: uppercase;
    }

    .content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 0 58px 0;
      margin-top: 30px;
    }

    .greeting {
     margin-top: -15px;
      color: #C9A227;
      font-family: "Z003", "Brush Script MT", "Segoe Script", cursive;
      font-size: 42px;
      line-height: 0.82;
      font-style: italic;
      font-weight: 700;
      text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
    }

    .greeting span {
      display: block;
    
      color: #1F3A5F;
      font-size: 35px;
      font-family: 'Yeseva One', serif;
    

    }

    .student-photo {
      width: 106px;
      height: 106px;
      margin-top: -20px;
      display: block;
      object-fit: cover;
      border-radius: 50%;
      border: 5px solid #fff;
      background: #fff;
      box-shadow: 0 9px 22px rgba(64, 33, 45, 0.2);
    }

    .student-name {
      margin-top: 4px;
      color: #3c1f2b;
      font-size: 23px;
      line-height: 1.1;
      font-weight: 800;
    }

    .birthday-message {
      color: #555555;
      font-size: 14px;
      line-height: 1.2;
      font-weight: 600;
    }

    .wish-line {
      margin-top: 4px;
      color: #C2185B;
      font-size: 14px;
      line-height: 1.35;
      font-weight: 800;
    }

    .school-signature {
      margin-top: 5px;
      color: #4A2C2A;
      font-size: 14px;
      line-height: 1.35;
      font-weight: 800;
    }
    
    .school-signature strong {
      display: block;
      color: #5B2C83;
      font-size: 15px;
      text-transform: uppercase;
    }
  </style>
</head>

<body>
  <main class="birthday-card">
    <header class="header">
      <img src="${logo}" alt="School Logo" class="logo">
      <div class="school-name">${institute_name}</div>
    </header>

    <section class="content">
      <h1 class="greeting">Happy <span>Birthday</span></h1>

      <img src="${studentPhoto}" alt="Student Photo" class="student-photo">

      <div class="student-name">${student}</div>

      <p class="birthday-message">
        May this birthday bring you endless joy and good health as you continue to impart invaluable knowledge as guidence to us. 
      </p>

      <div class="wish-line">Enjoy your special day!</div>

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
    
   
