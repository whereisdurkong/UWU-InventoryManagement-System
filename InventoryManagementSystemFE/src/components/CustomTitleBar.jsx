import React from 'react';
import { useElectron } from '../contexts/ElectronContext';
import { X, Square, Minus } from 'lucide-react';

const CustomTitleBar = () => {
    const { isElectron, minimizeWindow, maximizeWindow, closeWindow } = useElectron();

    if (!isElectron) return null;

    return (
        <div className="electron-title-bar">
            <div className="title-bar-drag-region">
                <span className="app-title">Inventory Management System</span>
            </div>
            <div className="title-bar-controls">
                <button
                    className="title-bar-button minimize"
                    onClick={minimizeWindow}
                    aria-label="Minimize"
                >
                    <Minus size={16} />
                </button>
                <button
                    className="title-bar-button maximize"
                    onClick={maximizeWindow}
                    aria-label="Maximize"
                >
                    <Square size={14} />
                </button>
                <button
                    className="title-bar-button close"
                    onClick={closeWindow}
                    aria-label="Close"
                >
                    <X size={16} />
                </button>
            </div>
            <style jsx>{`
        .electron-title-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 32px;
          background: linear-gradient(90deg, #2c3e50 0%, #3498db 100%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 9999;
          -webkit-app-region: drag;
          user-select: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .title-bar-drag-region {
          flex: 1;
          height: 100%;
          -webkit-app-region: drag;
          display: flex;
          align-items: center;
          padding-left: 12px;
          color: white;
          font-weight: 500;
          font-size: 14px;
        }
        
        .app-title {
          opacity: 0.9;
        }
        
        .title-bar-controls {
          display: flex;
          height: 100%;
          -webkit-app-region: no-drag;
        }
        
        .title-bar-button {
          width: 46px;
          height: 100%;
          border: none;
          background: transparent;
          color: #ecf0f1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .title-bar-button:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .title-bar-button.close:hover {
          background: #e74c3c;
        }
        
        .title-bar-button svg {
          stroke-width: 2.5;
        }
      `}</style>
        </div>
    );
};

export default CustomTitleBar;