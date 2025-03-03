import React, { useState } from "react";
import uploadPDF from "../services/pdfService"; // Import the uploadPDF service

const PDFUploader = () => {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setFile(event.dataTransfer.files[0]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) return;

    try {
      const extractedText = await uploadPDF(file);
      setText(extractedText);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
        />
        <div onDrop={handleDrop} onDragOver={handleDragOver}>
          Drop PDF file here
        </div>
        <button type="submit">Upload PDF</button>
      </form>
      {text && (
        <div>
          <h3>Extracted Text:</h3>
          <p className="text-left">{text}</p>
        </div>
      )}
    </div>
  );
};

export default PDFUploader;
