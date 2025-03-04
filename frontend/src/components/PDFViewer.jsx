import React, { useState, useEffect } from "react";

const PDFViewer = ({ pages, currentPage, onPageChange }) => {
  // State to track the user's input in the page input field
  const [inputPage, setInputPage] = useState(currentPage.toString());

  // Reset inputPage state when currentPage changes (from props)
  useEffect(() => {
    setInputPage(currentPage.toString());
  }, [currentPage]);

  // Handle input changes in the page input field
  const handleInputChange = (e) => {
    setInputPage(e.target.value);
  };

  // Validate and update page when user presses Enter
  const handlePageSubmit = () => {
    const rawInput = inputPage.trim();
    let pageNumber = parseInt(rawInput, 10);

    // If input is not a valid number, default to current page
    if (isNaN(pageNumber)) {
      pageNumber = currentPage;
    } else {
      // Clamp the page number between 1 and total pages
      pageNumber = Math.max(1, Math.min(pageNumber, pages.length));
    }

    // Update the page and reset the input field to the validated value
    onPageChange(pageNumber);
    setInputPage(pageNumber.toString());
  };

  return (
    <div>
      <div className="viewer-container">
        {pages[currentPage - 1]?.map((para, i) => (
          <p key={`${currentPage}-${i}`} className="lineHeight">
            {para}
          </p>
        ))}
      </div>
      <div className="pagination-controls">
        {/* Page input field with validation (no "Go" button) */}
        <div>
          Page
          <input
            type="number"
            value={inputPage}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === "Enter" && handlePageSubmit()}
            min="1"
            max={pages.length}
            inputMode="numeric"
            pattern="[0-9]*"
            required
          />
          of {pages.length}
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
