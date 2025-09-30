import React, { useState, useRef, useEffect } from 'react';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';
import { useTheme } from '../../hooks';
import { THEME_MODES } from '../../../core/providers/ThemeProvider';
import './ThemeToggle.css';

/**
 * Theme Toggle Component
 * Provides a dropdown menu to switch between light, dark, and system themes
 * @param {Object} props - Component props
 * @param {boolean} props.compact - Whether to show compact version (icon only)
 * @returns {JSX.Element} ThemeToggle component
 */
export const ThemeToggle = ({ compact = false }) => {
  const { themeMode, setTheme, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleThemeChange = (mode) => {
    setTheme(mode);
    setIsOpen(false);
  };

  const themeOptions = [
    {
      mode: THEME_MODES.LIGHT,
      label: 'Light',
      icon: <FiSun className="theme-option-icon" />,
    },
    {
      mode: THEME_MODES.DARK,
      label: 'Dark',
      icon: <FiMoon className="theme-option-icon" />,
    },
    {
      mode: THEME_MODES.SYSTEM,
      label: 'System',
      icon: <FiMonitor className="theme-option-icon" />,
    },
  ];

  return (
    <>
      <div className="theme-toggle-container" ref={dropdownRef}>
        <button
          className={`theme-toggle-button ${compact ? 'compact' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle theme"
          aria-expanded={isOpen}
        >
          <span className="theme-toggle-icon">
            {isDark ? <BulbFilled /> : <BulbOutlined />}
          </span>
          {!compact && <span className="theme-toggle-label">Theme</span>}
        </button>

        {isOpen && (
          <>
            <div
              className="theme-dropdown-overlay"
              onClick={() => setIsOpen(false)}
            />
            <div className="theme-dropdown">
              {/* <div className="theme-dropdown-header">
                <span>Choose theme</span>
              </div> */}
              <ul className="theme-options-list">
                {themeOptions.map((option) => (
                  <li key={option.mode}>
                    <button
                      className={`theme-option ${themeMode === option.mode ? 'active' : ''}`}
                      onClick={() => handleThemeChange(option.mode)}
                      aria-label={`Switch to ${option.label} theme`}
                    >
                      {option.icon}
                      <span className="theme-option-label">{option.label}</span>
                      {themeMode === option.mode && (
                        <span className="theme-option-check">✓</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </>
  );
};

