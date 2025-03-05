import React, { useState, useEffect, useMemo, useCallback } from "react";
import FileUploader from "./FileUploader";
import Loader from "./Loader";
import PDFViewer from "./PDFViewer";
import uploadPDF from "../services/pdfService";

const PDFStateManager = () => {
  const [status, setStatus] = useState("idle");
  const [extractedText, setExtractedText] = useState("");
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalWords, setTotalWords] = useState(0);
  const [allWords, setAllWords] = useState([]);
  const [cumulativeWordCounts, setCumulativeWordCounts] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [intervalId, setIntervalId] = useState(null);
  const [fileName, setFileName] = useState("");

  const CONTAINER_WIDTH = 636;
  const LINE_HEIGHT = 26;
  const CONTAINER_HEIGHT = 676;
  const FONT_STYLE = "18px Roboto, sans-serif";

  const measureText = useMemo(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    return (text) => {
      ctx.font = FONT_STYLE;
      return ctx.measureText(text).width;
    };
  }, [FONT_STYLE]);

  /**
   * Calculates the number of lines a given paragraph will occupy based on the container width.
   *
   * @param {string} paragraph - The paragraph text to be measured.
   * @returns {number} - The number of lines the paragraph will occupy.
   */
  const calculateLines = useCallback(
    (paragraph) => {
      const words = paragraph.split(" "); // Split paragraph into words
      let line = "";
      let lines = 1;

      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word; // Add a space if it's not the first word
        const width = measureText(testLine); // Measure the width of the line

        if (width > CONTAINER_WIDTH) {
          // If the line exceeds the container width, start a new line
          lines++;
          line = word;
        } else {
          line = testLine;
        }
      }

      return lines; // Return the total number of lines
    },
    [measureText, CONTAINER_WIDTH]
  );

  useEffect(() => {
    if (!extractedText) return; // Do nothing if extracted text is empty
    const allWords = extractedText
      .replace(/(\r\n|\n|\r)/gm, " ") // Remove newlines and carriage returns
      .replace(/\s+/g, " ") // Replace multiple spaces with a single space
      .split(" ") // Split text into words
      .filter((word) => word.trim() !== ""); // Remove empty words
    setAllWords(allWords); // Store all words in state
    setTotalWords(allWords.length); // Store total number of words

    const paragraphs = extractedText
      .split("\n%%PAGE_BREAK%%\n") // Split document into paragraphs based on "%%PAGE_BREAK%%"
      .filter((p) => p.trim().length > 0); // Remove empty paragraphs

    // Function to divide paragraphs into pages based on container height
    const createPages = (paragraphs) => {
      const pages = [];
      let currentPageArr = []; // Array for the pages
      let currentHeight = 0;

      // Iterates over each paragraph
      for (const paragraph of paragraphs) {
        const lines = calculateLines(paragraph);
        const neededHeight = lines * LINE_HEIGHT;

        // If adding this paragraph exceeds page height, push the current page and start a new one
        if (currentHeight + neededHeight > CONTAINER_HEIGHT) {
          if (currentPageArr.length > 0) {
            pages.push([...currentPageArr]);
            currentPageArr = []; // Reset the current page
            currentHeight = 0;
          }

          // If the paragraph itself is larger than a page, split it into multiple pages
          if (neededHeight > CONTAINER_HEIGHT) {
            const maxLinesPerPage = Math.floor(CONTAINER_HEIGHT / LINE_HEIGHT);
            let remainingText = paragraph;

            while (remainingText) {
              const pageLines = [];
              let lineCount = 0;

              while (lineCount < maxLinesPerPage && remainingText) {
                let line = "";
                let words = remainingText.split(" ");

                while (words.length > 0) {
                  const testLine = line ? `${line} ${words[0]}` : words[0];
                  if (measureText(testLine) > CONTAINER_WIDTH) break; // Stop adding words if width is exceeded
                  line = testLine;
                  words.shift();
                }

                pageLines.push(line);
                remainingText = words.join(" ");
                lineCount++;
              }

              pages.push(pageLines);
            }
          } else {
            currentPageArr.push(paragraph);
            currentHeight += neededHeight;
          }
        } else {
          currentPageArr.push(paragraph);
          currentHeight += neededHeight;
        }
      }

      if (currentPageArr.length > 0) pages.push(currentPageArr);
      return pages;
    };

    const newPages = createPages(paragraphs);
    setPages(newPages);
    setCurrentPage(1); // Reset to the first page
    setStatus("display"); // Set status to display mode

    // Compute cumulative word count for each paragraph in the document
    let currentWordCount = 0;
    const cumulative = [];
    newPages.forEach((page) => {
      page.forEach((paragraph) => {
        const words = paragraph.split(" ");
        cumulative.push(currentWordCount);
        currentWordCount += words.length;
      });
    });

    setCumulativeWordCounts(cumulative);
  }, [extractedText, calculateLines, measureText]);

  const handlePlayPause = () => {
    if (isPlaying) {
      // Pause speed reading
      clearInterval(intervalId); // Clear the interval to stop updating the current word index
      setIntervalId(null); // Reset the interval ID
      setIsPlaying(false); // Set playing state to false
    } else {
      // Start speed reading
      const interval = 250; // Set the interval for updating the current word index (250 milliseconds)
      const newIntervalId = setInterval(() => {
        if (currentWordIndex < allWords.length - 1) {
          setCurrentWordIndex((prev) => prev + 1); // Increment the current word index
        } else {
          clearInterval(newIntervalId); // Clear the interval if the end of the words is reached
          setIsPlaying(false); // Set playing state to false
        }
      }, interval);
      setIntervalId(newIntervalId); // Update the interval ID with the new interval ID
      setIsPlaying(true); // Set playing state to true
    }
  };

  /**
   * Handles the upload of a PDF file, sets the status to "loading",
   * updates the file name, uploads the PDF, and sets the extracted text.
   *
   * @param {File} file - The PDF file to be uploaded.
   * @returns {Promise<void>} - A promise that resolves when the upload is complete.
   */
  const handleUpload = async (file) => {
    try {
      setStatus("loading");
      setFileName(file.name); // Set the file name
      const text = await uploadPDF(file);
      setExtractedText(text);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleClose = () => {
    setExtractedText("");
    setPages([]);
    setCurrentPage(1);
    setIsPlaying(false);
    setCurrentWordIndex(0);
    setStatus("idle");
  };

  return (
    <div className="pdf-viewer">
      {status === "idle" && <FileUploader onUpload={handleUpload} />}
      {status === "loading" && <Loader />}
      {status === "display" && pages.length > 0 && (
        <>
          <div>
            <button onClick={handleClose}>Close</button>
            <button onClick={handlePlayPause}>
              {isPlaying ? "Pause" : "Play"}
            </button>
            <div>{isPlaying ? currentWordIndex + 1 : totalWords}</div>
            <div>{fileName}</div> {/* Display the file name */}
          </div>
          <PDFViewer
            pages={pages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            allWords={allWords}
            currentWordIndex={currentWordIndex}
            isPlaying={isPlaying}
            cumulativeWordCounts={cumulativeWordCounts}
          />
        </>
      )}
    </div>
  );
};

export default PDFStateManager;
