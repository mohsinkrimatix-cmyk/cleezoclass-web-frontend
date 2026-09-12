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
*{
    margin:0;
    padding:0;
    box-sizing:border-box;
}
body{
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}

.poster{
    width:500px;
    height:500px;
    position:relative;
    overflow:hidden;
    font-family:Arial, sans-serif;
    background:radial-gradient(circle at center,
        #ffffff 0%,
        #dcefff 35%,
        #7ec8ff 75%,
        #2f9fff 100%);
    border:4px solid #fff;
    border-radius: 10px;
}

.header{
    position:absolute;
    top:18px;
    left:0;
    width:100%;
    z-index:12;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:0 34px;
    text-align:center;
}

.logo{
    position:absolute;
    left:30px;
    top:-4px;
    width:58px;
    height:58px;
    object-fit:contain;
}

.school-name{
    max-width:310px;
    color:#0a3d91;
    font-size:22px;
    line-height:1.1;
    font-weight:800;
    text-transform:uppercase;
    text-shadow:0 1px 3px rgba(255,255,255,0.85);
}

/* Main Content */
.content{
    position:absolute;
    top:52%;
    left:50%;
    transform:translate(-50%,-50%);
    width:80%;
    text-align:center;
    z-index:10;
}

.content h1{
    font-size:28px;
    color:#0a3d91;
    margin-bottom:15px;
    font-weight:700;
}

.student-photo-box{
    width:92px;
    height:92px;
    margin:0 auto 12px;
    padding:5px;
    background:#fff;
    border-radius:8px;
    box-shadow:0 8px 18px rgba(10,61,145,0.22);
}

.student-photo{
    width:100%;
    height:100%;
    display:block;
    object-fit:cover;
    border-radius:5px;
}

.content p{
    font-size:15px;
    line-height:1.6;
    color:#1b1b1b;
    margin-bottom:10px;
}

.highlight{
    color:#0a3d91;
    font-weight:700;
    font-size:18px;
}

.signature{
    margin-top:15px;
    color:#0a3d91;
    font-weight:700;
    font-size:16px;
}

/* Bottom Balloons */
.balloon{
    position:absolute;
    border-radius:50%;
}

.left-blue{
    width:75px;
    height:100px;
    background:#0066ff;
    left:-10px;
    bottom:35px;
}

.left-red{
    width:70px;
    height:95px;
    background:#ff3d3d;
    left:40px;
    bottom:10px;
}

.left-yellow{
    width:70px;
    height:95px;
    background:#ffd400;
    left:0;
    bottom:-15px;
}

.right-blue{
    width:75px;
    height:100px;
    background:#0066ff;
    right:-10px;
    bottom:35px;
}

.right-red{
    width:70px;
    height:95px;
    background:#ff3d3d;
    right:40px;
    bottom:10px;
}

.right-yellow{
    width:70px;
    height:95px;
    background:#ffd400;
    right:0;
    bottom:-15px;
}
</style>
</head>
<body>

<div class="poster">
    <div class="header">
        <img src="${logo}" alt="School Logo" class="logo">
        <div class="school-name">${institute_name}</div>
    </div>

    <!-- Content -->
    <div class="content">
        <h1>🎉 Happy Birthday, Dear 
            <br>${student}! 🎉</h1>

        <div class="student-photo-box">
            <img src="${studentPhoto}" alt="Student Photo" class="student-photo">
        </div>

        <p>
            May your day be filled with smiles,
            happiness, and lots of blessings.
            Wishing you success, good health,
            and a bright future.
        </p>

        <p style="font-weight:bold;color:#d62828;">
            Enjoy your special day!
        </p>

        <p class="highlight">
            🌟 Wishing you a very Happy Birthday and a bright future ahead! 🌟
        </p>

        <div class="signature">
            – Principal, Teachers & Staff of<br>
            ${institute_name} 🏫💙
        </div>
    </div>

    <!-- Bottom Left Balloons -->
    <div class="balloon left-blue"></div>
    <div class="balloon left-red"></div>
    <div class="balloon left-yellow"></div>

    <!-- Bottom Right Balloons -->
    <div class="balloon right-blue"></div>
    <div class="balloon right-red"></div>
    <div class="balloon right-yellow"></div>

</div>

</body>

</html>`
}
