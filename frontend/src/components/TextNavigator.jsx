import React, { useState } from "react";

function TextNavigator({ pages, cumulativeWordCounts, allWords }) {
  // State to track the current page, the current word to highlight, and the input value.
  const [currentPage, setCurrentPage] = useState(1);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");

  // Update the input value as the user types.
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // When the user clicks the button (or presses Enter) this function will:
  // 1. Validate the input word number.
  // 2. Find the paragraph that contains this word using the cumulativeWordCounts.
  // 3. Determine which page contains that paragraph.
  // 4. Update the state to jump to that page and highlight the word.
  const handleJump = () => {
    const wordNumber = parseInt(inputValue, 10);

    // Validate the input.
    if (isNaN(wordNumber) || wordNumber < 0 || wordNumber >= allWords.length) {
      alert("Please enter a valid word number.");
      return;
    }

    // Find the paragraph index that contains the specified word.
    const paragraphIndex = cumulativeWordCounts.findIndex((start, i) => {
      const nextStart = cumulativeWordCounts[i + 1] || allWords.length;
      return wordNumber >= start && wordNumber < nextStart;
    });

    if (paragraphIndex === -1) {
      alert("Word not found.");
      return;
    }

    // Determine which page the paragraph is on.
    let cumulativeParagraphCount = 0;
    let newPage = 0;
    for (let i = 0; i < pages.length; i++) {
      if (paragraphIndex < cumulativeParagraphCount + pages[i].length) {
        newPage = i + 1; // assuming pages are 1-indexed
        break;
      }
      cumulativeParagraphCount += pages[i].length;
    }

    // Update state: jump to the page and highlight the word.
    setCurrentPage(newPage);
    setCurrentWordIndex(wordNumber);
    setInputValue(""); // Optionally clear the input after jump.
  };

  return (
    <div>
      {/* Input for user to type the word number */}
      <div>
        <input
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Enter word number"
        />
        <button onClick={handleJump}>Go</button>
      </div>

      {/* Render the text on the current page */}
      <div>
        {pages[currentPage - 1] &&
          pages[currentPage - 1].map((paragraph, paraIndexInCurrentPage) => {
            // Split the paragraph into individual words.
            const words = paragraph.split(" ");

            // Calculate the paragraph's index in the complete text.
            const currentParagraphIndexInAll =
              pages
                .slice(0, currentPage - 1)
                .reduce((sum, page) => sum + page.length, 0) +
              paraIndexInCurrentPage;
            const paraStartIndex =
              cumulativeWordCounts[currentParagraphIndexInAll];

            return words.map((word, wordIndexInPara) => {
              // Determine the global index of the current word.
              const globalIndex = paraStartIndex + wordIndexInPara;
              const isCurrentWord = globalIndex === currentWordIndex;
              let className = "word";
              if (isCurrentWord) {
                className += " highlighted"; // Use CSS to style highlighted words
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
    </div>
  );
}

export default TextNavigator;
