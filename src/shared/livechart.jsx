import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom"; // 🚀 Import useNavigate

const socket = io('https://cleezoclass.com/:3010'); // Connect to your server

const ChatApp = () => {
  const navigate = useNavigate(); // 🚀 Initialize navigate
  const user = JSON.parse(localStorage.getItem("loggedInTeacher"));
  const [sender, setSender] = useState(user?.username || "");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); 
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [messagesRes, teachersRes] = await Promise.all([
          axios.get("https://cleezoclass.com/:3010/api/messages"),
          axios.get("https://cleezoclass.com/:3010/api/teachersmessage"),
        ]);

        setMessages(Array.isArray(messagesRes.data) ? messagesRes.data : []);
        const teacherList = teachersRes.data?.data || [];
        setTeachers(Array.isArray(teacherList) ? teacherList : []);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (sender) {
      socket.emit("register-user", sender);
    }

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("receive-message", handleReceiveMessage);

    return () => {
      socket.off("receive-message", handleReceiveMessage);
    };
  }, [sender]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const receivers =
      selectedUsers.length === 0
        ? teachers.map((t) => t.username)
        : selectedUsers;

    const newMsg = {
      sender,
      receiver: receivers,
      message,
    };

    socket.emit("send-message", newMsg);

    try {
      await axios.post("https://cleezoclass.com/:3010/api/send-message", newMsg);
    } catch (err) {
      console.error("Error sending to backend:", err);
    }

    setMessage("");
  };

  const filteredMessages = messages.filter((msg) => {
    const msgReceivers = Array.isArray(msg.receiver)
      ? msg.receiver
      : typeof msg.receiver === "string"
      ? msg.receiver.split(",")
      : [];

    if (selectedUsers.length === 0) {
      return msg.sender === sender || msgReceivers.includes(sender);
    }

    return selectedUsers.some(
      (user) =>
        (msg.sender === sender && msgReceivers.includes(user)) ||
        (msg.sender === user && msgReceivers.includes(sender))
    );
  });

  const filteredTeachers = Array.isArray(teachers)
    ? teachers
        .filter(
          (t) =>
            t.username !== sender &&
            t.name?.trim() &&
            t.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/LoginPage"); // 🚀 Navigate to login page
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div
        style={{
          width: "250px",
          backgroundColor: "#1f2d3d",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          padding: "20px",
          overflow: "hidden",
        }}
      >
        <h3 style={{ marginBottom: "10px" }}>Contacts</h3>

        {/* 🔍 Search Input */}
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            marginBottom: "10px",
            padding: "8px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />

        <div style={{ flex: 1, overflowY: "auto" }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {filteredTeachers.map((t) => {
              const isSelected = selectedUsers.includes(t.username);
              return (
                <li
                  key={t.id}
                  onClick={() => {
                    setSelectedUsers((prev) =>
                      isSelected
                        ? prev.filter((user) => user !== t.username)
                        : [...prev, t.username]
                    );
                  }}
                  style={{
                    padding: "10px",
                    marginBottom: "5px",
                    cursor: "pointer",
                    backgroundColor: isSelected ? "#007bff" : "transparent",
                    color: isSelected ? "#fff" : "#ccc",
                    borderRadius: "5px",
                  }}
                >
                  {t.name}
                </li>
              );
            })}
          </ul>
        </div>

        <button
          onClick={handleLogout}
          style={{
            marginTop: "20px",
            backgroundColor: "#dc3545",
            color: "#fff",
            padding: "10px",
            border: "none",
            borderRadius: "5px",
          }}
        >
          Logout
        </button>
      </div>

      {/* Chat area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "20px",
          backgroundColor: "#f0f2f5",
        }}
      >
        <h2 style={{ marginBottom: "10px" }}>
          {selectedUsers.length > 0
            ? `Chat with ${selectedUsers.join(", ")}`
            : "Select a contact to start chatting"}
        </h2>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "10px",
          }}
        >
          {filteredMessages.map((msg, idx) => {
            const isSender = msg.sender === sender;
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: isSender ? "flex-end" : "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    backgroundColor: isSender ? "#d1e7dd" : "#f1f1f1",
                    padding: "10px 15px",
                    borderRadius: "18px",
                    maxWidth: "65%",
                    color: "#333",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "14px",
                      color: "#2c3e50",
                      marginBottom: "6px",
                    }}
                  >
                    {msg.sender}
                  </div>
                  <div>{msg.message}</div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#777",
                      marginTop: 6,
                      textAlign: "right",
                    }}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {selectedUsers && (
          <div style={{ display: "flex", marginTop: "15px" }}>
            <input
              type="text"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                backgroundColor: "#28a745",
                color: "#fff",
                padding: "12px 18px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatApp;
