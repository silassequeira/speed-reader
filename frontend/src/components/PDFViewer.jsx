import React, { useEffect } from "react";
import PropTypes from "prop-types";
import "../App.css"; // Ensure the correct path to the CSS file

const PDFViewer = ({
  pages,
  currentPage,
  onPageChange,
  allWords,
  currentWordIndex,
  displayState,
  cumulativeWordCounts,
}) => {
  const [inputPage, setInputPage] = React.useState(currentPage.toString());

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
        {pages[currentPage - 1]?.map((paragraph, paraIndexInCurrentPage) => {
          const words = paragraph.split(" ");
          const currentParagraphIndexInAll =
            pages
              .slice(0, currentPage - 1)
              .reduce((sum, page) => sum + page.length, 0) +
            paraIndexInCurrentPage;
          const paraStartIndex =
            cumulativeWordCounts[currentParagraphIndexInAll];
          return words.map((word, wordIndexInPara) => {
            const globalIndex = paraStartIndex + wordIndexInPara;
            const isCurrentWord = globalIndex === currentWordIndex;
            const isHighlightedEnd =
              displayState === "paused" &&
              isCurrentWord &&
              currentWordIndex === allWords.length - 1;

            // Determine the class names based on the display state
            let className = "word";
            if (displayState === "playing" && isCurrentWord) {
              className += " word-playing";
            } else if (isHighlightedEnd) {
              className += " word-highlighted-end";
            } else if (
              displayState === "idleDisplay" ||
              displayState === "paused"
            ) {
              className += " word-idle";
            } else if (displayState === "playing") {
              className += " word-other";
            }

            return (
              <span
                key={`${currentPage}-${paraIndexInCurrentPage}-${wordIndexInPara}`}
                className={className}
              >
                {word}{" "}
              </span>
            );
          });
        })}
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

PDFViewer.propTypes = {
  pages: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  currentPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  allWords: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentWordIndex: PropTypes.number.isRequired,
  displayState: PropTypes.string.isRequired,
  cumulativeWordCounts: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default PDFViewer;
