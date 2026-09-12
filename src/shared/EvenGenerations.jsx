import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function EventsUpcoming() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recipientType, setRecipientType] = useState('students');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notificationLinks, setNotificationLinks] = useState(null);

  // Fetch events on mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const schoolCode = localStorage.getItem('schoolCode');
        const response = await axios.get('https://cleezoclass.com:4000/api/events', {
          params: { schoolCode },
        });
        setEvents(response.data);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Handle dropdown selection
  const handleEventChange = (e) => {
    const id = Number(e.target.value);
    const event = events.find((ev) => ev.id === id);
    setSelectedEvent(event);
    setEventDetails(null); // Clear previous details until Generate is clicked
  };

  // Manual Generate button
  const handleGenerateManual = () => {
    if (!selectedEvent || !title) {
      alert('Please select an event and enter a title.');
      return;
    }
    console.log('Manual Generate:', { event: selectedEvent, title, description });
    setEventDetails({ ...selectedEvent, title, description });
    alert(
      `Manual Event Generated:\nEvent: ${selectedEvent.event_name}\nTitle: ${title}\nDescription: ${description}`
    );
  };

  // Automatic Generate button
  const handleGenerateAutomatic = () => {
    if (!selectedEvent) {
      alert('Please select an event.');
      return;
    }
    console.log('Automatic Generate:', selectedEvent);
    setEventDetails(selectedEvent);
    alert(`Automatic Event Generated:\nEvent: ${selectedEvent.event_name}`);
  };

  // Handle image download
  const handleImageDownload = (imageData) => {
    const link = document.createElement('a');
    link.href = `data:image/jpeg;base64,${imageData}`;
    link.download = `${eventDetails.event_name}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Send WhatsApp notification
  const handleSendNotification = async () => {
    if (!selectedEvent) return;
    try {
      setError(null);
      setIsLoading((prev) => ({ ...prev, notification: true }));
      const schoolCode = localStorage.getItem('schoolCode');
      const response = await axios.post('https://cleezoclass.com:4000/api/generate-whatsapp-links', {
        eventId: selectedEvent.id,
        recipientType,
        schoolCode,
      });
      setNotificationLinks(response.data);
    } catch (error) {
      console.error('Error generating WhatsApp links:', error);
      setError(error.response?.data?.error || 'Failed to generate WhatsApp links. Please try again.');
    } finally {
      setIsLoading((prev) => ({ ...prev, notification: false }));
    }
  };

  // Styles
  const outerContainer = { display: 'flex', justifyContent: 'center', width: '100%', marginTop: 30 };
  const card = { padding: 20, borderRadius: 20, backgroundColor: '#ffffff', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '500px', maxWidth: '90%' ,
      };
  const sectionHeading = { fontSize: 20, fontWeight: '700', marginTop: 10, marginBottom: 15, color: '#333' };
  const row = { display: 'flex', gap: 15, marginBottom: 15 };
  const selectStyle = { flex: 1, padding: 12, borderRadius: 10, border: '1px solid #dcdcdc', fontSize: 15, outline: 'none', backgroundColor: '#fafafa' };
  const inputStyle = { flex: 1, padding: 12, borderRadius: 10, border: '1px solid #dcdcdc', fontSize: 15, outline: 'none', backgroundColor: '#fafafa' };
  const textarea = { width: '100%', height: 80, padding: 12, borderRadius: 10, border: '1px solid #dcdcdc', fontSize: 15, resize: 'none', outline: 'none', backgroundColor: '#fafafa' };
  const generateBtn = { width: '100%', padding: 14, backgroundColor: '#007bff', border: 'none', color: 'white', fontSize: 16, fontWeight: '600', borderRadius: 10, cursor: 'pointer', marginTop: 20, boxShadow: '0 3px 8px rgba(0,0,0,0.15)' };

  return (
    <div style={outerContainer}>
      <div style={card}>
        {/* Manual Section */}
        <div style={sectionHeading}>Manual Event Entry</div>
        <div style={row}>
          <select style={selectStyle} value={selectedEvent?.id || ''} onChange={handleEventChange}>
            <option value="">Select Event</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.event_name}
              </option>
            ))}
          </select>
          <input
            type="text"
            maxLength={150}
            placeholder="Enter title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
          />
        </div>
    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
  <textarea
    maxLength={150}
    placeholder="Write up to 150 characters..."
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    style={{ ...textarea, flex: 2 }}
  />
  <button
    style={{ ...generateBtn, flex: 1, marginTop: 0 }}
    onClick={handleGenerateManual}
  >
    Generate
  </button>
</div>


        {/* Automatic Section */}
        <div style={{ ...sectionHeading, marginTop: 40 }}>Automatic Event Entry</div>
    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
  <select
    style={{ ...selectStyle, flex: 2, marginBottom: 0 }}
    value={selectedEvent?.id || ''}
    onChange={handleEventChange}
  >
    <option value="">Select Event</option>
    {events.map((event) => (
      <option key={event.id} value={event.id}>
        {event.event_name}
      </option>
    ))}
  </select>
  <button
    style={{ ...generateBtn, flex: 1, marginTop: 0 }}
    onClick={handleGenerateAutomatic}
  >
    Generate 
  </button>
</div>


        {/* Event Details Section */}
        {eventDetails && (
          <div
            style={{
              backgroundColor: '#f9fafb',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              marginTop: '2rem',
              border: '1px solid #e5e7eb',
              width: '100%',
              maxWidth: '800px',
              textAlign: 'center',
            }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'semibold', marginBottom: '1rem' }}>Event Details</h2>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{eventDetails.event_name}</h3>

            {eventDetails.title && <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Title: {eventDetails.title}</p>}
            {eventDetails.description && <p style={{ marginBottom: '0.5rem' }}>Description: {eventDetails.description}</p>}

            {eventDetails.image && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
                <img
                  src={`data:image/jpeg;base64,${eventDetails.image}`}
                  alt={eventDetails.event_name}
                  style={{ width: '100%', maxWidth: '300px', height: 'auto', objectFit: 'cover', borderRadius: '0.25rem', marginBottom: '0.75rem' }}
                />
                <button
                  onClick={() => handleImageDownload(eventDetails.image)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.25rem',
                    backgroundColor: '#5a7488',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Download Image
                </button>
              </div>
            )}
          </div>
        )}

        {isLoading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </div>
  );
}
