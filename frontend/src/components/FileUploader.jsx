import React, { useState, useRef } from "react";
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

  return (
    <div
      className={`file-uploader-container ${file ? "uploaded" : "idle"}`}
      onClick={handleContainerClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      {!file ? (
        <p className="file-uploader-text">
          Click or drop to insert the PDF file
        </p>
      ) : (
        <p className="file-uploader-text uploaded">
          {file.name} uploaded successfully
        </p>
      )}
    </div>
  );
};

export default FileUploader;
