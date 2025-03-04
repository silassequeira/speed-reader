import React, { useState, useEffect } from "react";

const PDFViewer = ({ pages, currentPage, onPageChange }) => {
  const [inputPage, setInputPage] = useState(currentPage.toString());

  useEffect(() => {
    setInputPage(currentPage.toString());
  }, [currentPage]);

  const handleInputChange = (e) => {
    setInputPage(e.target.value);
  };

  const handlePageSubmit = () => {
    const rawInput = inputPage.trim();
    let pageNumber = parseInt(rawInput, 10);

    if (isNaN(pageNumber)) {
      pageNumber = currentPage;
    } else {
      pageNumber = Math.max(1, Math.min(pageNumber, pages.length));
    }

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
