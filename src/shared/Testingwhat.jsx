import React, { useState } from "react";

const WhatsAppSender = () => {
  const [number, setNumber] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const schoolCode = localStorage.getItem("schoolCode");

  const sendMessage = async () => {
    setStatus("Sending...");
    try {
      const res = await fetch(`https://cleezoclass.com:4000/api/send-test/${schoolCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number, message }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus("✅ Message sent!");
      } else {
        setStatus("❌ Failed to send: " + (data.message || ""));
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Error sending message");
    }
  };

  return (
    <div style={styles.container}>
      <h2>Send WhatsApp Message</h2>
      <input
        type="text"
        placeholder="Enter number (without 91)"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        style={styles.input}
      />
      <textarea
        placeholder="Enter message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={styles.textarea}
      />
      <button onClick={sendMessage} style={styles.button}>Send</button>
      <p>{status}</p>
    </div>
  );
};

const styles = {
  container: { width: 350, margin: "50px auto", textAlign: "center", padding: 20, border: "1px solid #ccc", borderRadius: 10 },
  input: { width: "100%", marginBottom: 10, padding: 8 },
  textarea: { width: "100%", marginBottom: 10, padding: 8 },
  button: { padding: "10px 20px", cursor: "pointer" },
};

export default WhatsAppSender;