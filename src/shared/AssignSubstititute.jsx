import React, { useState, useEffect } from 'react';
import axios from 'axios';

// The base URL for your Express server
const API_BASE_URL = 'https://cleezoclass.com:4000/api'; // Assuming your backend runs on port 5000

// --- Color Palette and Common Styles ---
const colors = {
    primary: '#007bff', // Blue for actions
    secondary: '#6c757d', // Gray for general text
    success: '#28a745', // Green for success
    danger: '#dc3545', // Red for errors
    warning: '#ffc107', // Yellow for selection/info
    backgroundLight: '#f8f9fa', // Light background
    cardBackground: '#ffffff', // Card background
    border: '#dee2e6', // Border color
};

const styles = {
    // MODIFIED: Added margin: '0 auto' and set a max-width for centering
    container: {
        padding: '30px',
        fontFamily: 'Roboto, Arial, sans-serif',
        backgroundColor: colors.backgroundLight,
        minHeight: '100vh',
        maxWidth: '800px', // Set a max-width for the centered content
        margin: '0 auto', // Center the container horizontally
    },
    header: {
        fontSize: '2em',
        color: colors.primary,
        marginBottom: '20px',
        borderBottom: `2px solid ${colors.primary}`,
        paddingBottom: '10px',
    },
    sectionTitle: {
        fontSize: '1.5em',
        color: colors.secondary,
        marginBottom: '15px',
    },
table: {
        width: '100%',
        borderCollapse: 'collapse',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: colors.cardBackground,
    },
    tableHead: {
        backgroundColor: colors.primary,
        color: 'white',
        textAlign: 'left',
        fontSize: '1em',
    },
    tableHeaderCell: {
        padding: '12px 15px',
        fontWeight: '500',
        // --- MODIFICATIONS FOR TH ---
        textAlign: 'center', // Center content horizontally
        borderRight: `1px solid ${colors.cardBackground}`, // Use card background color for border in header
        borderBottom: `1px solid ${colors.cardBackground}`, 
    },
    tableRow: (isSelected) => ({
        borderBottom: `1px solid ${colors.border}`,
        backgroundColor: isSelected ? '#e3f2fd' : colors.cardBackground, // Light blue selection
        transition: 'background-color 0.3s ease',
        ':hover': {
            backgroundColor: isSelected ? '#bbdefb' : '#f1f1f1',
        }
    }),
    tableCell: {
        padding: '12px 15px',
        color: colors.secondary,
        // --- MODIFICATIONS FOR TD ---
        textAlign: 'center', // Center content horizontally
        borderRight: `1px solid ${colors.border}`, // Add right border
        borderBottom: `1px solid ${colors.border}`, // Add bottom border (this is technically redundant due to tableRow, but ensures consistency)
    },
    button: (type = 'primary') => ({
        padding: '8px 15px',
        borderRadius: '5px',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'background-color 0.3s ease, transform 0.1s ease',
        backgroundColor: colors[type] || colors.primary,
        color: type === 'warning' ? colors.secondary : 'white',
        ':hover': {
            opacity: 0.9,
            transform: 'translateY(-1px)',
        }
    }),
    card: {
        border: `1px solid ${colors.border}`,
        padding: '25px',
        borderRadius: '8px',
        backgroundColor: colors.cardBackground,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        marginTop: '30px',
    },
    listItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: `1px dashed ${colors.border}`,
    },
    message: (isError) => ({
        marginTop: '25px',
        padding: '15px',
        borderRadius: '5px',
        fontWeight: 'bold',
        color: 'white',
        backgroundColor: isError ? colors.danger : colors.success,
    }),
    note: {
        fontSize: '0.9em',
        color: colors.secondary,
        padding: '10px',
        backgroundColor: colors.backgroundLight,
        borderRadius: '4px',
        borderLeft: `3px solid ${colors.warning}`,
        margin: '15px 0',
    },
    // NEW STYLES FOR MODAL (POP-UP)
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: colors.cardBackground,
        padding: '30px',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        maxHeight: '90vh', // Limit the modal height to 90% of the screen height
        overflowY: 'auto', // Enable internal vertical scrolling for the whole modal
    },
    closeButton: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'none',
        border: 'none',
        fontSize: '1.5em',
        cursor: 'pointer',
        color: colors.secondary,
    },
    // NEW STYLE: For controlling the height and scroll of the substitute list
    substitutesListContainer: {
        maxHeight: '300px', // Cap the list height
        overflowY: 'auto', // Enable scrolling within the list itself
        paddingRight: '10px', // Add padding for appearance next to the scrollbar
    }
};

/**
 * 🧑‍🏫 Substitute Assignment Component
 * Displays absent teachers, allows fetching available substitutes,
 * and facilitates assigning a substitute to a class.
 */
function SubstituteAssignment() {
  const [absentTeachers, setAbsentTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null); 
  const [availableSubstitutes, setAvailableSubstitutes] = useState([]);
  const [assignmentMessage, setAssignmentMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // NEW STATE: To control modal visibility

  // --- 1. Fetch Absent Teachers ---
  useEffect(() => {
    const fetchAbsentTeachers = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/chief/absent-teachers`);
        setAbsentTeachers(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching absent teachers:', err);
        setError('Failed to load absent teacher data.');
        setLoading(false);
      }
    };
    fetchAbsentTeachers();
  }, []);

  // --- 2. Fetch Available Substitutes ---
  const handleFindSubstitutes = async (teacher) => {
    setSelectedTeacher(teacher);
    setAvailableSubstitutes([]); 
    setAssignmentMessage(''); 
    setIsModalOpen(true); // OPEN THE MODAL
    
    // Hardcoded for simplicity; replace with dynamic period/class logic in a real app
    const period = 1; 
    
    try {
        const response = await axios.get(`${API_BASE_URL}/chief/available-teachers/${period}/${teacher.subject}`);
        setAvailableSubstitutes(response.data);
    } catch (err) {
        console.error('Error fetching available substitutes:', err);
        setAssignmentMessage('Failed to find available substitutes.');
    }
  };

  // --- 3. Assign Substitute ---
  const handleAssignSubstitute = async (substituteId) => {
    if (!selectedTeacher) {
      setAssignmentMessage('Please select an absent teacher first.');
      return;
    }
    
    // Hardcoded for simplicity; replace with dynamic period/class logic in a real app
    const period = 1; 
    const classId = '10'; 
    const sectionId = 'A'; 

    const assignmentData = {
      period: period,
      subject: selectedTeacher.subject,
      substituteId: substituteId,
      classId: classId,
      sectionId: sectionId,
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/chief/assign-substitute`, assignmentData);
      setAssignmentMessage(response.data.message);
      setAvailableSubstitutes([]); 
      setSelectedTeacher(null); 
      setIsModalOpen(false); // CLOSE MODAL ON SUCCESS
    } catch (err) {
      console.error('Error assigning substitute:', err);
      const msg = err.response?.data?.error || 'An unexpected error occurred during assignment.';
      setAssignmentMessage(`❌ Assignment failed: ${msg}`);
      // Modal remains open on failure to show the error
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTeacher(null); // Clear selection when closing
    setAvailableSubstitutes([]); // Clear subs when closing
    setAssignmentMessage(''); // Clear message when closing
  }

  // --- Assignment Modal Component (Rendered conditionally) ---
  const AssignmentModal = () => {
    if (!selectedTeacher) return null;

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <button onClick={closeModal} style={styles.closeButton}>×</button>
                
                <h3 style={{ color: colors.primary, marginBottom: '10px' }}>
                    Assign Substitute for: <span style={{ fontWeight: 'bold' }}>{selectedTeacher.teacher_name}</span> ({selectedTeacher.subject})
                </h3>
                
                <p style={styles.note}>
                    *Note: Currently assuming **Period 1** for Class **10A**. 
                    In a complete system, you would select the specific period/class needing coverage.
                </p>

                {availableSubstitutes.length > 0 ? (
                    <div>
                        <h4 style={{ color: colors.secondary, marginBottom: '15px' }}>
                          Available Teachers for {selectedTeacher.subject} coverage:
                        </h4>
                        
                        {/* Apply the scrollable container style here */}
                        <div style={styles.substitutesListContainer}>
                            <ul style={{ listStyleType: 'none', padding: '0' }}>
                                {availableSubstitutes.map((sub) => (
                                    <li key={sub.teacher_id} style={styles.listItem}>
                                        <span style={{ fontSize: '1.1em', color: colors.secondary }}>
                                            {sub.teacher_name} (<span style={{ fontStyle: 'italic' }}>{sub.designation}</span>)
                                        </span>
                                        <button 
                                            onClick={() => handleAssignSubstitute(sub.teacher_id)} 
                                            style={styles.button('success')}
                                        >
                                            Assign
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ) : (
                    // Display loading or prompt based on current state
                    <p style={{ color: colors.secondary }}>
                        {assignmentMessage.includes('Failed') ? 'No substitutes found or loading failed.' : 'Searching for available substitutes...'}
                    </p>
                )}
                
                {/* Assignment Message (Success/Error) within Modal */}
                {assignmentMessage && (
                    <p style={styles.message(assignmentMessage.startsWith('❌'))}>
                        {assignmentMessage}
                    </p>
                )}
            </div>
        </div>
    );
  };

  // --- Rendering ---

  if (loading) return <p style={{ ...styles.sectionTitle, color: colors.primary }}>Loading absent teachers...</p>;
  if (error) return <p style={styles.message(true)}>{error}</p>;

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>📝 Substitute Assignment Dashboard</h1>

      {/* Absent Teachers List */}
      <h2 style={styles.sectionTitle}>Absent Teachers Today</h2>
      {absentTeachers.length === 0 ? (
        <p style={{ padding: '15px', backgroundColor: colors.warning, borderRadius: '5px', color: colors.secondary }}>
          🎉 No absent teachers found today!
        </p>
      ) : (
        <table style={styles.table}>
          <thead style={styles.tableHead}>
            <tr>
              <th style={styles.tableHeaderCell}>Teacher Name</th>
              <th style={styles.tableHeaderCell}>Subject Taught</th>
              <th style={styles.tableHeaderCell}>Action</th>
            </tr>
          </thead>
          <tbody>
            {absentTeachers.map((teacher) => (
              <tr 
                key={teacher.teacher_id} 
                style={styles.tableRow(selectedTeacher?.teacher_id === teacher.teacher_id)}
              >
                <td style={styles.tableCell}>{teacher.teacher_name}</td>
                <td style={styles.tableCell}>{teacher.subject}</td>
                <td style={styles.tableCell}>
                  <button 
                    // This button now opens the modal
                    onClick={() => handleFindSubstitutes(teacher)}
                    style={styles.button('primary')}
                  >
                    Find Substitute
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {/* RENDER MODAL CONDITIONALY */}
      {isModalOpen && <AssignmentModal />}

    </div>
  );
}

export default SubstituteAssignment;