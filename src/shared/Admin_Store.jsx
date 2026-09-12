import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faAngleRight, faSearch, faShoppingBasket, faClock, faExclamationTriangle, faCheckCircle, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import '../STYLES/tabhower.css'
import './Admin_Store.css';

// --- ErrorPopup Component ---
const ErrorPopup = ({ message, type, onClose }) => {
  if (!message) return null;

  return (
    <div className="error-popup-overlay">
      <div className="error-popup-container">
        <div className="error-popup-header">
          {type === "error" ? (
            <>
              <FontAwesomeIcon icon={faExclamationTriangle} className="error-popup-icon" />
              Notification
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faCheckCircle} className="error-popup-icon success" />
              Notification
            </>
          )}
        </div>
        <div className="error-popup-message">{message}</div>
      </div>
    </div>
  );
};

// --- RequestStockPO COMPONENT ---
const RequestStockPO = ({ title, stockOptions, isMobile, font, category, fetchActionsAndStock, showPopup, schoolCode }) => {
  const [selectedStock, setSelectedStock] = useState(stockOptions[0] || "");
  const [otherStockName, setOtherStockName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const finalStockName = selectedStock === "Other (New Stock)" ? otherStockName : selectedStock;

  const handlePOSubmit = async (action) => {
    if (!finalStockName || quantity <= 0) {
      showPopup({
        message: "Please enter a valid Stock Name and Quantity.",
        type: "error"
      });
      return;
    }
    if (!schoolCode) {
      showPopup({
        message: "Missing school identification code. Please log in again.",
        type: "error"
      });
      return;
    }
    const requestData = {
      stockName: finalStockName,
      quantity: quantity,
      category: category,
      action: action,
      schoolCode: schoolCode
    };
    try {
      const response = await fetch('https://cleezoclass.com:4000/api/po/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      if (response.ok) {
        showPopup({
          message: `${finalStockName} - ${action} PO request submitted successfully and is awaiting approval.`,
          type: "success"
        });
        if (fetchActionsAndStock) fetchActionsAndStock();
        setSelectedStock(stockOptions[0] || "");
        setOtherStockName("");
        setQuantity(1);
      } else {
        showPopup({
          message: `Failed to ${action} PO request. Status: ${response.status}`,
          type: "error"
        });
      }
    } catch (error) {
      showPopup({
        message: `Error submitting PO request: ${error.message}`,
        type: "error"
      });
    }
  };

  return (
    <div className="store-request-container">
      <div className="store-request-title">
        <span className="section-header"> Request Stock (PO)</span>
      </div>
      <div className="store-form-group">
        <div className="store-form-column">
          <div className="store-label">Stock Name</div>
          <select
            className="btn-dropdown-FeesManagement"
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
          >
            {stockOptions.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
            <option value="Other (New Stock)">Other (New Stock)</option>
          </select>
        </div>
        {selectedStock === "Other (New Stock)" && (
          <div className="store-form-column">
            <div className="store-label">Enter New</div>
            <input
              type="text"
              className="store-input store-width-150"
              placeholder="New Stock Name"
              value={otherStockName}
              onChange={(e) => setOtherStockName(e.target.value)}
            />
          </div>
        )}
        <div className="store-form-column">
          <div className="store-label">Qty</div>
          <input
            type="number"
            className="btn-dropdown-FeesManagement"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
          />
        </div>
        <div className="store-form-column">
          <div className="store-label">Action</div>
          <button
            className="btn-solid"
            onClick={() => handlePOSubmit("PLACE")}
            disabled={!finalStockName}
          >
            Place
          </button>
        </div>
      </div>
    </div>
  );
};

// --- BarChart Component ---
const BarChart = ({ data, totalQuantity }) => {
  const maxVal = totalQuantity > 0 ? totalQuantity * 1.2 : 100;
  return (
    <div className="store-bar-chart">
      {data.map((bar, index) => (
        <div
          key={index}
          title={`${bar.label}: ${bar.value}`}
          className="store-bar"
          style={{ height: `${(bar.value / maxVal) * 80}px` }}
        >
          <div className="store-bar-value">{bar.value}</div>
        </div>
      ))}
    </div>
  );
};

// --- Reminder Component ---
const Reminder = ({ isMobile, font }) => {
  return (
    <div className="store-reminder-container">
      <div className="store-reminder-title">
        <span className="section-header">Reminder Qty</span>
      </div>
      <div className="store-reminder-input-group">
        
        
                                      <div className="expense-input-field">

       <input
  type="number"
  className="btn-dropdown-FeesManagement"
  defaultValue="5"
  min="1"
  
/></div>
        <button className="btn-solid ">
          Set
        </button>
      </div>
    </div>
  );
};

// --- Actions Component ---
const Actions = ({ actions, isMobile, font, handleProcessPO, showPopup }) => {
  return (
<> <div className="store-actions-title">Actions</div>
      <div className="store-font-size-10 store-margin-bottom-5">Current Utility Stock (Qty):</div>
      {actions.length > 0 ? (
        actions.map((action, index) => (
          <div key={index} className="store-flex-row store-align-items-flex-start store-margin-bottom-10">
            <FontAwesomeIcon icon={faArrowRight} className="staff-action-arrow" />
            <div className="store-action-text">{action.text}</div>
            {action.status === "AWAITING" ? (
              <div className="store-action-btn-group">
                <button
                  className="store-action-btn store-action-btn-accept"
                  onClick={() => handleProcessPO(action.id, "OK", action.stockName, action.quantity, action.category)}
                >
                  Accept
                </button>
                <button
                  className="store-action-btn store-action-btn-reject"
                  onClick={() => handleProcessPO(action.id, "Rejected")}
                >
                  Reject
                </button>
              </div>
            ) : (
              <div
                className={`store-action-btn store-action-btn-status ${action.status === "OK" ? "store-bg-success" : action.status === "Rejected" ? "store-bg-error" : "store-bg-pending"}`}
              >
                {action.status}
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="store-color-gray store-font-size-12">No pending or recent PO requests.</div>
      )}
</>  );
};

// --- OutgoingStock Component ---
const OutgoingStock = ({ title, stockData, isMobile, currentStockList, showReportModal }) => {
  const maxStockQuantity = stockData.reduce((max, item) => Math.max(max, item.value), 0);
  return (
    <div className="store-outgoing-stock">
      <div className="store-outgoing-title">
        <span className="section-header">Current Stock Levels</span>
      </div>
      <BarChart data={stockData} totalQuantity={maxStockQuantity} />
      <button className="store-view-report-btn btn-outline" onClick={() => showReportModal(title, currentStockList)}>
        View Report
      </button>
      <div className="store-current-stock">
        <div className="section-header">Current Stock (Qty):</div>
        {currentStockList.length > 0 ? (
          currentStockList.map((item, index) => (
            <div key={index} className="store-list-item">
              * {item.stockName}: <span className="store-current-stock-quantity">{item.quantity}</span>
            </div>
          ))
        ) : (
          <div className="store-color-gray store-font-size-12">No stock data available.</div>
        )}
      </div>
    </div>
  );
};

// --- ResourceCard Component ---
const ResourceCard = ({
  title,
  stockData,
  isMobile,
  currentStockList,
  stockOptions,
  category,
  showOutgoing = true,
  fetchActionsAndStock,
  showPopup,
  schoolCode,
  showReportModal
}) => {
  return (
    <div className="store-resource-card">
      <div className="store-resource-layout">
        {showOutgoing && (
          <div className="store-resource-outgoing">
            <OutgoingStock
              title={title}
              stockData={stockData}
              isMobile={isMobile}
              currentStockList={currentStockList}
              showReportModal={showReportModal}
            />
          </div>
        )}

        <div className="store-resource-controls">
          <RequestStockPO
            title={title}
            stockOptions={stockOptions}
            isMobile={isMobile}
            font="'Century Gothic', 'AppleGothic', sans-serif"
            category={category}
            fetchActionsAndStock={fetchActionsAndStock}
            showPopup={showPopup}
            schoolCode={schoolCode}
          />
          <Reminder isMobile={isMobile} font="'Century Gothic', 'AppleGothic', sans-serif" />
        </div>
      </div>
    </div>
  );
};

// --- ConfirmationModal Component ---
const ConfirmationModal = ({ isVisible, message, onConfirm, onCancel }) => {
  if (!isVisible) return null;
  return (
    <div className="store-modal">
      <div className="store-modal-content">
        <div className="store-modal-header">
          <FontAwesomeIcon icon={faExclamationTriangle} className="store-margin-right-10" />
          Confirm Action
        </div>
        <p>{message}</p>
        <div className="store-modal-btn-group">
          <button className="store-modal-btn store-modal-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="store-modal-btn store-modal-btn-confirm" onClick={onConfirm}>
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
};

// --- ReportModal Component ---
const ReportModal = ({ isVisible, title, data, onClose }) => {
  if (!isVisible) return null;
  return (
    <div className="store-report-modal" onClick={onClose}>
      <div className="store-report-modal-content" onClick={e => e.stopPropagation()}>
        <div className="store-flex-row store-justify-space-between store-align-items-center store-width-100 store-padding-10-0">
          <div className="store-report-modal-header">{title} - Stock Report</div>
          <button className="store-report-modal-close-btn btn-solid" onClick={onClose}>Close</button>
        </div>
        {data && data.length > 0 ? (
          <table className="store-report-modal-table">
            <thead>
              <tr>
                <th className="store-report-modal-th">Stock Name</th>
                <th className="store-report-modal-th store-width-80 store-text-center">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index}>
                  <td className="store-report-modal-td">{item.stockName}</td>
                  <td className="store-report-modal-td store-text-center store-text-bold">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No stock data available for this report.</p>
        )}
      </div>
    </div>
  );
};

// --- StoreDashboard Component ---
const StoreDashboard = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [actionItems, setActionItems] = useState([]);
  const [stockLevels, setStockLevels] = useState([]);
  const [popup, setPopup] = useState({ message: "", type: "" });
  const [confirmModal, setConfirmModal] = useState({ isVisible: false, message: '', onConfirm: () => {} });
  const [reportModal, setReportModal] = useState({ isVisible: false, title: '', data: [] });
  const SCHOOL_CODE = localStorage.getItem('schoolCode');

  const showPopup = (popupData) => {
    setPopup(popupData);
  };

  const closePopup = () => {
    setPopup({ message: "", type: "" });
  };

  const showConfirm = (message, onConfirmCallback) => {
    setConfirmModal({
      isVisible: true,
      message,
      onConfirm: () => {
        setConfirmModal({ ...confirmModal, isVisible: false });
        onConfirmCallback();
      },
      onCancel: () => setConfirmModal({ ...confirmModal, isVisible: false })
    });
  };

  const showReportModal = (title, data) => {
    setReportModal({ isVisible: true, title, data });
  };

  const closeReportModal = () => {
    setReportModal({ isVisible: false, title: '', data: [] });
  };

  const fetchActionsAndStock = useCallback(async () => {
    if (!SCHOOL_CODE) {
      showPopup({
        message: "Cannot fetch data: School code is missing. Please log in again.",
        type: "error"
      });
      return;
    }
    const baseUrl = 'https://cleezoclass.com:4000/api';
    const poUrl = `${baseUrl}/po/requests?schoolCode=${SCHOOL_CODE}`;
    const stockUrl = `${baseUrl}/stock/levels?schoolCode=${SCHOOL_CODE}`;

    try {
      const poResponse = await fetch(poUrl);
      if (poResponse.ok) {
        const poData = await poResponse.json();
        setActionItems(poData);
      } else {
        showPopup({
          message: "Failed to fetch PO requests. Please try again later.",
          type: "error"
        });
        setActionItems([]);
      }
    } catch (error) {
      showPopup({
        message: `Error fetching PO requests: ${error.message}`,
        type: "error"
      });
    }

    try {
      const stockResponse = await fetch(stockUrl);
      if (stockResponse.ok) {
        const stockData = await stockResponse.json();
        setStockLevels(stockData);
      } else {
        showPopup({
          message: "Failed to fetch stock levels. Please try again later.",
          type: "error"
        });
        setStockLevels([]);
      }
    } catch (error) {
      showPopup({
        message: `Error fetching stock levels: ${error.message}`,
        type: "error"
      });
    }
  }, [SCHOOL_CODE]);

  useEffect(() => {
    fetchActionsAndStock();
  }, [fetchActionsAndStock]);

  const handleProcessPO = (id, new_status, stockName, quantity, category) => {
    const processAction = async () => {
      if (new_status === 'OK' && (!stockName || !quantity || !category)) {
        showPopup({
          message: "Error: Missing stock details for ACCEPT action.",
          type: "error"
        });
        return;
      }
      if (!SCHOOL_CODE) {
        showPopup({
          message: "Error: Missing school code for processing PO.",
          type: "error"
        });
        return;
      }
      try {
        const response = await fetch('https://cleezoclass.com:4000/api/po/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, new_status, stockName, quantity, category, schoolCode: SCHOOL_CODE })
        });
        if (response.ok) {
          const result = await response.json();
          showPopup({
            message: `PO ID ${id} ${new_status} successfully. ${result.message}`,
            type: "success"
          });
          fetchActionsAndStock();
        } else {
          const errorData = await response.json();
          showPopup({
            message: `Failed to process PO ID ${id}. Error: ${errorData.error || 'Unknown error'}`,
            type: "error"
          });
        }
      } catch (error) {
        showPopup({
          message: `Error processing PO: ${error.message}`,
          type: "error"
        });
      }
    };
    showConfirm(`Are you sure you want to ${new_status} PO ID ${id}?`, processAction);
  };

  const getCategoryStockData = (category) => {
    return stockLevels.filter(stock => stock.category === category).map(stock => ({ value: stock.quantity, label: stock.stock_name }));
  };

  const getCurrentStockList = (category) => {
    return stockLevels.filter(stock => stock.category === category).map(stock => ({ stockName: stock.stock_name, quantity: stock.quantity }));
  };

  const academicStockData = getCategoryStockData('ACADEMIC');
  const amenitiesStockData = getCategoryStockData('AMENITIES');
  const academicCurrentStockList = getCurrentStockList('ACADEMIC');
  const amenitiesCurrentStockList = getCurrentStockList('AMENITIES');
  const utilitiesCurrentStockList = getCurrentStockList('UTILITIES');

  const academicOptions = ["Chalk Boxes", "Stationery Pens", "Guides – II (Physics)", "Whiteboard Markers"];
  const amenitiesOptions = ["Uniforms (IBM)", "Sports – CBs", "Tech's-Monitors", "Footballs", "First Aid Kit"];
  const utilitiesOptions = ["Grocery – Sugar", "Drinking Water", "Cleaning Supplies", "Generator Fuel"];

  return (
    <div className="store-outer-container">
      <h1 className="footprintsinner">Operations - Academic - Store</h1>

      <ErrorPopup message={popup.message} type={popup.type} onClose={closePopup} />
      <ConfirmationModal
        isVisible={confirmModal.isVisible}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel}
      />
      <ReportModal isVisible={reportModal.isVisible} title={reportModal.title} data={reportModal.data} onClose={closeReportModal} />
     

      <div className="store-dashboard-grid">
        <div className="store-dashboard-panel">
          <ResourceCard
            stockData={academicStockData}
            currentStockList={academicCurrentStockList}
            stockOptions={academicOptions}
            category="ACADEMIC"
            fetchActionsAndStock={fetchActionsAndStock}
            showPopup={showPopup}
            schoolCode={SCHOOL_CODE}
            showReportModal={showReportModal}
          />
        </div>

        <div className="store-dashboard-panel">
          <Actions
            title="Academic Resources"
            actions={actionItems}
            isMobile={isMobile}
            font="'Century Gothic', 'AppleGothic', sans-serif"
            handleProcessPO={handleProcessPO}
            showPopup={showPopup}
          />
        </div>

        <div className="store-dashboard-panel">
          <ResourceCard
            stockData={amenitiesStockData}
            currentStockList={amenitiesCurrentStockList}
            stockOptions={amenitiesOptions}
            category="AMENITIES"
            fetchActionsAndStock={fetchActionsAndStock}
            showPopup={showPopup}
            schoolCode={SCHOOL_CODE}
            showReportModal={showReportModal}
          />
        </div>

        <div className="store-dashboard-panel store-dashboard-panel-utilities">
          <div className="store-right-content">
            <div className="store-right-header">
              <FontAwesomeIcon
                icon={faClock}
                className="store-margin-right-8 store-color-primary"
              />
              Utilities
            </div>

            <div className="store-font-weight-600 store-margin-bottom-5">
              Current Utility Stock (Qty):
            </div>
            <div className="store-margin-bottom-15">
              {utilitiesCurrentStockList.length > 0 ? (
                utilitiesCurrentStockList.map((item, index) => (
                  <div
                    key={index}
                    className="store-font-size-12-14 store-margin-bottom-5 store-color-555"
                  >
                    * {item.stockName}:{" "}
                    <span className="store-text-bold store-color-333 store-margin-left-5">
                      {item.quantity}
                    </span>
                  </div>
                ))
              ) : (
                <div className="store-color-gray store-font-size-12-14">
                  No stock data available.
                </div>
              )}
            </div>

            <div className="utilities-row">
              <div className="utilities-half">
                <RequestStockPO
                  title="Utilities"
                  stockOptions={utilitiesOptions}
                  isMobile={isMobile}
                  font="'Century Gothic', 'AppleGothic', sans-serif"
                  category="UTILITIES"
                  fetchActionsAndStock={fetchActionsAndStock}
                  showPopup={showPopup}
                  schoolCode={SCHOOL_CODE}
                />
              </div>

              <div className="utilities-half">
                <Reminder
                  isMobile={isMobile}
                  font="'Century Gothic', 'AppleGothic', sans-serif"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreDashboard;
