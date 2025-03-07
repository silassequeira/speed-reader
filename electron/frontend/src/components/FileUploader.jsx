import React, { useState, useRef, useEffect } from "react";
import Icons from "./Icons";
import "../App.css";

const FileUploader = ({ onUpload }) => {
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFile) => {
    // Validate file type
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      onUpload(selectedFile);
    } else {
      alert("Please upload a valid PDF file");
    }
  };

  const handleFileChange = (event) => {
    handleFileSelect(event.target.files[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    handleFileSelect(event.dataTransfer.files[0]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleContainerClick = () => {
    fileInputRef.current.click();
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "Enter") {
        fileInputRef.current.click();
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  return (
    <div
      className={`file-uploader-container ${
        file ? "uploaded margin-top-4" : "idle margin-top-4"
      }`}
      onClick={handleContainerClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      title="Upload"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      {!file ? (
        <div>
          <div className="file-uploader-icon">
            <Icons iconName="Upload" />
          </div>
          <p className="margin-top-3 grey">
            Drop PDF file here or click to upload
          </p>
        </div>
      ) : (
        <p className="file-uploader-icon uploaded">
          {file.name} uploaded successfully
        </p>
      )}
    </div>
  );
};

export default FileUploader;
