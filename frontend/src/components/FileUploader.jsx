import React, { useState, useRef } from "react";

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
      style={{
        width: "400px",
        height: "250px",
        border: "2px dashed #cccccc",
        borderRadius: "8px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        cursor: "pointer",
        backgroundColor: file ? "#e6f3ff" : "#f8f9fa",
        transition: "background-color 0.3s ease",
      }}
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
        <p style={{ color: "#6c757d", userSelect: "none" }}>
          Click or drop to insert the PDF file
        </p>
      ) : (
        <p style={{ color: "#28a745", userSelect: "none" }}>
          {file.name} uploaded successfully
        </p>
      )}
    </div>
  );
};

export default FileUploader;
