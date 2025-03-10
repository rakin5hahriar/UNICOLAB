import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaTrash } from 'react-icons/fa';

const ChecklistItem = ({ item, index, onToggle, onDelete, onUpdate }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(item.text);

  const handleSubmit = () => {
    if (text.trim()) {
      onUpdate(index, text.trim());
      setIsEditing(false);
    }
  };

  return (
    <motion.div
      className={`checklist-item ${item.completed ? 'completed' : ''}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      whileHover={{ scale: 1.01 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="checklist-content">
        <motion.div
          className="checkbox-wrapper"
          whileTap={{ scale: 0.9 }}
        >
          <input
            type="checkbox"
            id={`checklist-item-${index}`}
            checked={item.completed}
            onChange={() => onToggle(index)}
            className={item.completed ? 'completed' : ''}
          />
          <motion.div
            className="checkbox-circle"
            initial={false}
            animate={item.completed ? { scale: 1 } : { scale: 0 }}
          >
            <FaCheck />
          </motion.div>
        </motion.div>

        {isEditing ? (
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleSubmit}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            autoFocus
            className="edit-input"
          />
        ) : (
          <motion.span
            className={`item-text ${item.completed ? 'completed-text' : ''}`}
            onClick={() => setIsEditing(true)}
            whileHover={{ x: 5 }}
          >
            {item.text}
          </motion.span>
        )}
      </div>

      <motion.button
        className="delete-button"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onDelete(index)}
      >
        <FaTrash />
      </motion.button>

      <style jsx>{`
        .checklist-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          margin: 8px 0;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }

        .checklist-item.completed {
          background: rgba(76, 175, 80, 0.1);
        }

        .checklist-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .checkbox-wrapper {
          position: relative;
          width: 24px;
          height: 24px;
        }

        input[type="checkbox"] {
          width: 24px;
          height: 24px;
          border: 2px solid #ddd;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        input[type="checkbox"]:checked {
          border-color: #4CAF50;
          background: #4CAF50;
        }

        .checkbox-circle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          pointer-events: none;
        }

        .item-text {
          font-size: 16px;
          color: #333;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .completed-text {
          text-decoration: line-through;
          color: #666;
        }

        .edit-input {
          flex: 1;
          font-size: 16px;
          padding: 4px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          outline: none;
          transition: all 0.3s ease;
        }

        .edit-input:focus {
          border-color: #4CAF50;
          box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
        }

        .delete-button {
          background: none;
          border: none;
          color: #ff5252;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </motion.div>
  );
};

export default ChecklistItem; 