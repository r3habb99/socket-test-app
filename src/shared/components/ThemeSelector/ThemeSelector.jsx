import React, { useState } from "react";
import { Button, Drawer, Radio, Space, Typography, Divider } from "antd";
import { BgColorsOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useThemeContext } from "../../../core/providers/ThemeProvider";
import { THEME_PRESETS } from "../../../core/providers/themePresets";
import "./ThemeSelector.css";

const { Title, Text } = Typography;

/**
 * ThemeSelector component for choosing theme presets
 * @returns {JSX.Element} ThemeSelector component
 */
export const ThemeSelector = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { themePreset, changeThemePreset, availablePresets, resolvedTheme } = useThemeContext();

  const handlePresetChange = (preset) => {
    changeThemePreset(preset);
  };

  const showDrawer = () => {
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  return (
    <>
      <Button
        type="text"
        icon={<BgColorsOutlined />}
        onClick={showDrawer}
        className="theme-selector-button"
        title="Change Theme"
      >
        <span className="theme-selector-label">Theme</span>
      </Button>

      <Drawer
        title={
          <div className="theme-drawer-header">
            <BgColorsOutlined style={{ marginRight: 8 }} />
            <span>Choose Your Theme</span>
          </div>
        }
        placement="right"
        onClose={closeDrawer}
        open={drawerVisible}
        width={360}
        className="theme-selector-drawer"
      >
        <div className="theme-selector-content">
          <Text type="secondary" className="theme-selector-description">
            Select a color theme that matches your style
          </Text>

          <Divider />

          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {availablePresets.map((preset) => {
              const presetConfig = THEME_PRESETS[preset];
              const colors = presetConfig[resolvedTheme];
              
              return (
                <motion.div
                  key={preset}
                  className={`theme-preset-option ${themePreset === preset ? 'selected' : ''}`}
                  onClick={() => handlePresetChange(preset)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="theme-preset-header">
                    <Radio checked={themePreset === preset}>
                      <Text strong>{presetConfig.name}</Text>
                    </Radio>
                  </div>
                  
                  <div className="theme-preset-preview">
                    {/* Gradient preview */}
                    <div 
                      className="theme-gradient-preview"
                      style={{ background: colors.gradient }}
                    />
                    
                    {/* Color swatches */}
                    <div className="theme-color-swatches">
                      <div 
                        className="color-swatch"
                        style={{ backgroundColor: colors.primary }}
                        title="Primary"
                      />
                      <div 
                        className="color-swatch"
                        style={{ backgroundColor: colors.bgSurface }}
                        title="Surface"
                      />
                      <div 
                        className="color-swatch"
                        style={{ backgroundColor: colors.textPrimary }}
                        title="Text"
                      />
                    </div>
                  </div>

                  {themePreset === preset && (
                    <motion.div
                      className="theme-selected-indicator"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      ✓
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </Space>

          <Divider />

          <div className="theme-selector-footer">
            <Text type="secondary" style={{ fontSize: '0.85rem' }}>
              💡 Tip: Your theme preference is saved automatically
            </Text>
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default ThemeSelector;

