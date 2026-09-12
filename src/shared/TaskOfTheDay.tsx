import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./TaskOfTheDay.css";

type Task = {
  id: string;
  date?: string; // YYYY-MM-DD (legacy)
  task_date?: string;
  text?: string; // legacy
  description?: string;
  createdAt?: string; // legacy
  created_at?: string;
};

const toDateOnly = (value?: string) => (value ? value.slice(0, 10) : "");

const normalizeTask = (task: any): Task => ({
  id: String(task?.id ?? task?._id ?? `${task?.task_date || task?.date || "task"}-${task?.created_at || task?.createdAt || Math.random()}`),
  date: toDateOnly(task?.date || task?.task_date || task?.created_at || task?.createdAt),
  task_date: toDateOnly(task?.task_date || task?.date || task?.created_at || task?.createdAt),
  text: task?.text ?? task?.description ?? "",
  description: task?.description ?? task?.text ?? "",
  createdAt: task?.createdAt ?? task?.created_at ?? task?.created_at ?? task?.createdAt,
  created_at: task?.created_at ?? task?.createdAt ?? task?.created_at ?? task?.createdAt,
});

const normalizeTaskResponse = (payload: any): Task[] => {
  const list =
    Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.tasks)
          ? payload.tasks
          : Array.isArray(payload?.result)
            ? payload.result
            : Array.isArray(payload?.rows)
              ? payload.rows
              : [];

  return list.map(normalizeTask);
};

type TaskOfTheDayProps = {
  showSeparatedControls?: boolean;
};

const TaskOfTheDay: React.FC<TaskOfTheDayProps> = ({ showSeparatedControls = false }) => {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [taskText, setTaskText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const schoolCode = localStorage.getItem("schoolCode") || "";

  const fetchTasks = async (date: string) => {
    if (!schoolCode) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await axios.get(
        `https://cleezoclass.com:4000/api/tasks?schoolCode=${schoolCode}&date=${date}`
      );
      setTasks(normalizeTaskResponse(res.data));
    } catch (err) {
      console.error(err);
      setTasks([]);
      setErrorMsg("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!schoolCode) return;
    fetchTasks(selectedDate);
  }, [schoolCode, selectedDate]);

  const currentDayTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          toDateOnly(t.task_date) === selectedDate ||
          toDateOnly(t.date) === selectedDate ||
          toDateOnly(t.created_at) === selectedDate ||
          toDateOnly(t.createdAt) === selectedDate
      ),
    [tasks, selectedDate]
  );

  const handleAddTask = async () => {
    if (!taskText.trim()) return;
    if (!schoolCode) {
      setErrorMsg("schoolCode missing. Please login again.");
      return;
    }
    try {
      setSuccessMsg("");
      setErrorMsg("");
      const res = await axios.post("https://cleezoclass.com:4000/api/tasks", {
        schoolCode,
        task_date: selectedDate,
        description: taskText.trim(),
      });
      setSuccessMsg("Task added successfully.");
      const savedTask = normalizeTask(res.data || {
        task_date: selectedDate,
        description: taskText.trim(),
      });
      setTasks((prev) => {
        const next = [savedTask, ...prev.filter((task) => String(task.id) !== String(savedTask.id))];
        return next;
      });
      setTaskText("");
      setShowInput(false);
      setShowPicker(false);
      fetchTasks(selectedDate);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to add task.");
    }
  };

  return (
    <div className="tod-container">
      <div className="tod-header">
        <div>
          <div className="Heading">Task Of The Day</div>
          <div className="normalText">Select a date and add tasks</div>
        </div>
        {showSeparatedControls ? (
          <div className="tod-header-actions">
            <input
              type="date"
              className="tod-date tod-date-filter"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              aria-label="Select task date"
            />
            <button
              className="tod-add-button"
              onClick={() => {
                setShowInput(true);
                setShowPicker(false);
              }}
              title="Add Task"
            >
              Add Task
            </button>
          </div>
        ) : (
          <button
            className="tod-plus"
            onClick={() => {
              setShowPicker(true);
              setShowInput(false);
            }}
            title="Add Task"
          >
            +
          </button>
        )}
      </div>

      {(showPicker || showInput) && (
        <div className="tod-overlay" role="dialog" aria-modal="true">
          <div className="tod-float-card">
            {!showInput ? (
              <>
                <div className="tod-card-title">Choose Date</div>
                <input
                  type="date"
                  className="tod-date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setShowInput(true);
                  }}
                />
                <div className="tod-actions">
                  <button
                    className="tod-btn ghost"
                    onClick={() => {
                      setShowPicker(false);
                      setShowInput(false);
                    }}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="tod-card-title">Add Task</div>
                <div className="tod-date-label">Date: {selectedDate}</div>
                <textarea
                  className="tod-textarea"
                  placeholder="Write task description..."
                  value={taskText}
                  onChange={(e) => setTaskText(e.target.value)}
                />
                <div className="tod-actions">
                  <button
                    className="tod-btn ghost"
                    onClick={() => {
                      setShowInput(false);
                      setShowPicker(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button className="btn-solid" onClick={handleAddTask}>
                    Save Task
                  </button>
                </div>
                {successMsg && <div className="tod-success">{successMsg}</div>}
                {errorMsg && <div className="tod-error">{errorMsg}</div>}
              </>
            )}
          </div>
        </div>
      )}

      <div className="tod-list">
        {loading ? (
          <div className="tod-empty">Loading tasks...</div>
        ) : currentDayTasks.length === 0 ? (
          <div className="normalText">No tasks for this date.</div>
        ) : (
          currentDayTasks.map((task) => (
            <div key={task.id} className="tod-item">
              <span className="tod-item-bullet" aria-hidden="true" />
              <span className="reminder-date-task">
                {toDateOnly(task.task_date || task.date || selectedDate)}
              </span>
              <span className="tod-item-separator">-</span>
              <div className="tod-item-text">{task.description || task.text}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskOfTheDay;
