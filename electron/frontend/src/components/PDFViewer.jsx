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
  onCurrentWordChange,
  elementType,
  onDisplayStateChange, // New prop to handle display state change
}) => {
  const [inputPage, setInputPage] = React.useState(currentPage.toString());
  const [inputWord, setInputWord] = React.useState(""); // New state for word input

  // Effect to update the input page state when the current page changes
  useEffect(() => {
    setInputPage(currentPage.toString());
  }, [currentPage]);

  // Handles changes in the page input field
  const handlePageInputChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      // Ensures only numbers or empty input
      setInputPage(value);
    }
  };

  // Handles key down events in the page input field
  const handlePageKeyDown = (e) => {
    if (e.key === "Enter") {
      handlePageSubmit(); // Confirm input on Enter
    } else if (e.key === "ArrowRight") {
      setInputPage((prev) => {
        const newPage = (prev ? parseInt(prev, 10) : currentPage) + 1;
        return Math.min(newPage, pages.length).toString(); // Ensure within range
      });
    } else if (e.key === "ArrowLeft") {
      setInputPage((prev) => {
        const newPage = (prev ? parseInt(prev, 10) : currentPage) - 1;
        return Math.max(newPage, 1).toString(); // Ensure within range
      });
    }
  };

  // Handles the submission of the page input field
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

  // Handles changes in the word input field
  const handleWordInputChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setInputWord(value);
    }
  };

  // Handles key down events in the word input field
  const handleWordKeyDown = (e) => {
    if (e.key === "Enter") {
      handleWordSubmit(); // Confirm input on Enter
    } else if (e.key === "ArrowRight") {
      setInputWord((prev) => {
        const newWord = (prev ? parseInt(prev, 10) : currentWordIndex) + 1;
        return Math.min(newWord, allWords.length - 1).toString(); // Ensure within range
      });
    } else if (e.key === "ArrowLeft") {
      setInputWord((prev) => {
        const newWord = (prev ? parseInt(prev, 10) : currentWordIndex) - 1;
        return Math.max(newWord, 0).toString(); // Ensure within range
      });
    }
  };

  // Handles the submission of the word input field
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

    // Change display state to "paused" if it was "idleDisplay"
    if (displayState === "idleDisplay") {
      onDisplayStateChange("paused");
    }
  };

  const handleWordClick = (wordIndex) => {
    // Find paragraph containing the clicked word
    const paragraphIndex = cumulativeWordCounts.findIndex((start, i) => {
      const nextStart = cumulativeWordCounts[i + 1] || allWords.length;
      return wordIndex >= start && wordIndex < nextStart;
    });

    if (paragraphIndex === -1) {
      alert("Word not found in text");
      return;
    }

    // Calculate the target page
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

    // Update state to jump to the selected word
    onPageChange(targetPage);
    onCurrentWordChange(wordIndex);

    // Change display state to "paused" if it was "idleDisplay"
    if (displayState === "idleDisplay") {
      onDisplayStateChange("paused");
    }
  };

  if (elementType === "text") {
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
                  onClick={() => handleWordClick(globalIndex)}
                  className={className}
                >
                  {word}{" "}
                </span>
              );
            });
          })}
        </div>
      </div>
    );
  } else if (elementType === "inputs") {
    let wordCount = "word";
    if (displayState === "playing") {
      wordCount += " word-other minimal-input";
    } else if (displayState === "paused") {
      wordCount += " word-paused minimal-input";
    } else if (displayState === "idleDisplay") {
      wordCount += " word-other minimal-input";
    }

    return (
      <div className="flex-column">
        <div className="width-fit flex-end width-100">
          <input
            type="number"
            value={inputWord}
            onChange={handleWordInputChange}
            onKeyDown={handleWordKeyDown}
            title="Enter word number"
            placeholder={
              displayState === "idleDisplay"
                ? allWords.length
                : displayState === "playing"
                ? currentWordIndex + 1
                : displayState === "paused" && currentWordIndex
            }
            min="0"
            max={allWords.length - 1}
            className={wordCount}
          />
        </div>

        <div className="pagination-controls width-fit width-100">
          <div className="grey">
            <input
              type="number"
              value={inputPage}
              onChange={handlePageInputChange}
              title="Enter page number"
              onKeyDown={handlePageKeyDown}
              min="1"
              max={pages.length}
              className="minimal-input"
              inputMode="numeric"
              pattern="[0-9]*"
              required
            />
            &#160;- {pages.length}
          </div>
        </div>
      </div>
    );
  }
};

PDFViewer.propTypes = {
  pages: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
  currentPage: PropTypes.number,
  onPageChange: PropTypes.func,
  allWords: PropTypes.arrayOf(PropTypes.string),
  currentWordIndex: PropTypes.number,
  displayState: PropTypes.string,
  cumulativeWordCounts: PropTypes.arrayOf(PropTypes.number),
  onCurrentWordChange: PropTypes.func,
  elementType: PropTypes.string.isRequired,
  onDisplayStateChange: PropTypes.func.isRequired, // New prop type
};

export default PDFViewer;
