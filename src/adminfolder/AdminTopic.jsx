import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminTopics = () => {
  const [topics, setTopics] = useState([]);
  const [editId, setEditId] = useState(null);
  const [newDays, setNewDays] = useState('');

  // Fetch topics with suggestions
  const fetchTopics = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/admin/topics/suggestions');
      if (res.data.success) setTopics(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  // Handle approve / edit
  const handleUpdate = async (topic_id) => {
    if (!newDays) return alert("Enter number of days");
    try {
      const res = await axios.put('http://localhost:3000/api/admin/topics/update-days', {
        topic_id,
        new_required_days: parseInt(newDays)
      });
      if (res.data.success) {
        alert(res.data.message);
        setEditId(null);
        setNewDays('');
        fetchTopics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Admin: Suggest / Approve Required Days</h2>
      <table border="1" cellPadding="8" style={{ width: '100%', marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>Topic</th>
            <th>Current Required Days</th>
            <th>Suggested Days (History)</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {topics.map(topic => (
            <tr key={topic.id}>
              <td>{topic.topic_name}</td>
              <td>{topic.required_days}</td>
              <td>{topic.suggested_days}</td>
              <td>
                {editId === topic.id ? (
                  <>
                    <input
                      type="number"
                      value={newDays}
                      onChange={e => setNewDays(e.target.value)}
                      style={{ width: '60px' }}
                    />
                    <button onClick={() => handleUpdate(topic.id)}>Save</button>
                    <button onClick={() => setEditId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditId(topic.id); setNewDays(topic.suggested_days) }}>
                      Approve / Edit
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTopics;