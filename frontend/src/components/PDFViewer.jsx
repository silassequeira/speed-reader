import React, { useEffect } from "react";
import PropTypes from "prop-types";
import "../App.css";

const PDFViewer = ({
  pages,
  currentPage,
  onPageChange,
  allWords,
  currentWordIndex,
  displayState,
  cumulativeWordCounts,
  onCurrentWordChange, // New prop for handling word index changes
}) => {
  const [inputPage, setInputPage] = React.useState(currentPage.toString());
  const [inputWord, setInputWord] = React.useState(""); // New state for word input

  useEffect(() => {
    setInputPage(currentPage.toString());
  }, [currentPage]);

  // Page navigation handlers
  const handlePageInputChange = (e) => {
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

  // Word navigation handlers
  const handleWordInputChange = (e) => {
    setInputWord(e.target.value);
  };

  const handleWordSubmit = () => {
    const wordNumber = parseInt(inputWord, 10);

    if (isNaN(wordNumber) || wordNumber < 0 || wordNumber >= allWords.length) {
      alert("Invalid word number - please enter a valid number");
      return;
    }

    // Find paragraph containing the target word
    const paragraphIndex = cumulativeWordCounts.findIndex((start, i) => {
      const nextStart = cumulativeWordCounts[i + 1] || allWords.length;
      return wordNumber >= start && wordNumber < nextStart;
    });

    if (paragraphIndex === -1) {
      alert("Word not found in text");
      return;
    }

    // Calculate target page
    let cumulativeParagraphs = 0;
    let targetPage = 0;
    for (let i = 0; i < pages.length; i++) {
      const pageLength = pages[i].length;
      if (paragraphIndex < cumulativeParagraphs + pageLength) {
        targetPage = i + 1; // Pages are 1-indexed
        break;
      }
      cumulativeParagraphs += pageLength;
    }

    // Update page and word index
    onPageChange(targetPage);
    onCurrentWordChange(wordNumber); // Trigger parent to update word index
    setInputWord(""); // Clear input field
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

            let className = "word";
            if (displayState === "playing" && isCurrentWord) {
              className += " word-playing";
            } else if (displayState === "paused" && isCurrentWord) {
              className += " word-paused";
            } else if (displayState === "idleDisplay") {
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

      {/* New word navigation controls */}
      <div>
        <input
          type="number"
          value={inputWord}
          onChange={handleWordInputChange}
          onKeyDown={(e) => e.key === "Enter" && handleWordSubmit()}
          placeholder={
            displayState === "idleDisplay"
              ? allWords.length
              : displayState === "playing"
              ? currentWordIndex + 1
              : displayState === "paused" && currentWordIndex
          }
          min="0"
          max={allWords.length - 1}
        />
      </div>

      <div className="pagination-controls">
        {/* Page navigation controls */}
        <div>
          Page
          <input
            type="number"
            value={inputPage}
            onChange={handlePageInputChange}
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
  onCurrentWordChange: PropTypes.func.isRequired, // New prop
};

export default PDFViewer;
