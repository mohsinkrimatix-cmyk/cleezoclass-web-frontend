import React, { useState } from "react";

export default function UploadLogo() {
  const [institute, setInstitute] = useState("");
  const [logo, setLogo] = useState(null);

  const uploadLogo = async () => {
    const formData = new FormData();
    formData.append("institute_name", institute);
    formData.append("logo", logo);

    await fetch("https://cleezoclass.com:4000/api/upload-logo", {
      method: "POST",
      body: formData,
    });

    alert("Uploaded");
  };

  return (
    <div>
      <input
        placeholder="Institute Name"
        onChange={(e) => setInstitute(e.target.value)}
      />

      <input type="file" onChange={(e) => setLogo(e.target.files[0])} />

      <button onClick={uploadLogo}>Upload Logo</button>
    </div>
  );
}
