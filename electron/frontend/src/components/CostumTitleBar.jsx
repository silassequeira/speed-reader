// filepath: c:\Users\silas\speed-reader\src\CustomTitleBar.jsx
import React, { useEffect } from "react";
import logo from "../assets/logov3.webp"; // Import the logo
import Icons from "./Icons"; // Import the Icons component

const CustomTitleBar = () => {
  useEffect(() => {
    if (window.electronAPI) {
      document.getElementById("minimize-btn").addEventListener("click", () => {
        window.electronAPI.minimizeWindow();
      });

      document.getElementById("maximize-btn").addEventListener("click", () => {
        window.electronAPI.maximizeWindow();
      });

      document.getElementById("close-btn").addEventListener("click", () => {
        window.electronAPI.closeWindow();
      });

      window.electronAPI.onDarkMode((event, args) => {
        document.body.classList.toggle("dark-mode", args.enabled);
      });
    } else {
      console.warn("Electron API not available.");
    }
  }, []);

  return (
    <div className="bar">
      <div className="title-bar width-80">
        <div className="title-logo flex-start">
          <img
            src={logo}
            alt="speed-reader-logo"
            className="logo flex-center"
          />
        </div>
      </div>
      <div id="custom-title-bar" className="flex-center">
        <button
          id="minimize-btn"
          title="Minimize"
          className="unstyled-button title-bar-icons flex-center"
        >
          <Icons iconName="Minimize" />
        </button>
        <button
          id="maximize-btn"
          title="Maximize"
          className="unstyled-button title-bar-icons"
        >
          <Icons iconName="Maximize" />
        </button>
        <button
          id="close-btn"
          title="Close"
          className="unstyled-button title-bar-icons"
        >
          <Icons iconName="Close" />
        </button>
      </div>
    </div>
  );
};

export default CustomTitleBar;
