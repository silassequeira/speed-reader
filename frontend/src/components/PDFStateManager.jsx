import React, { useState, useEffect, useMemo, useCallback } from "react";
import FileUploader from "./FileUploader";
import Loader from "./Loader";
import PDFViewer from "./PDFViewer";
import SpanCounter from "./SpanCounter";
import uploadPDF from "../services/pdfService";
import "../App.css";

const PDFStateManager = () => {
  const [status, setStatus] = useState("idle");
  const [extractedText, setExtractedText] = useState("");
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [allWords, setAllWords] = useState([]);
  const [cumulativeWordCounts, setCumulativeWordCounts] = useState([]);
  const [displayState, setDisplayState] = useState("idleDisplay"); // New state for sub-states
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [intervalId, setIntervalId] = useState(null);
  const [fileName, setFileName] = useState("");
  const [spanCount, setSpanCount] = useState(0);
  const [currentSpanCount, setCurrentSpanCount] = useState(0);

  const CONTAINER_WIDTH = 636;
  const LINE_HEIGHT = 26;
  const CONTAINER_HEIGHT = 676;
  const FONT_STYLE = "18px Roboto, sans-serif";

  const handleSpanCount = useCallback((count) => {
    setSpanCount(count);
  }, []);

  const measureText = useMemo(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    return (text) => {
      ctx.font = FONT_STYLE;
      return ctx.measureText(text).width;
    };
  }, [FONT_STYLE]);

  const calculateLines = useCallback(
    (paragraph) => {
      const words = paragraph.split(" ");
      let line = "";
      let lines = 1;

      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        const width = measureText(testLine);

        if (width > CONTAINER_WIDTH) {
          lines++;
          line = word;
        } else {
          line = testLine;
        }
      }

      return lines;
    },
    [measureText, CONTAINER_WIDTH]
  );

  useEffect(() => {
    if (!extractedText) return;
    const allWords = extractedText
      .replace(/(\r\n|\n|\r)/gm, " ")
      .replace(/\s+/g, " ")
      .split(" ")
      .filter((word) => word.trim() !== "");
    setAllWords(allWords);

    const paragraphs = extractedText
      .split("\n%%PAGE_BREAK%%\n")
      .filter((p) => p.trim().length > 0);

    const createPages = (paragraphs) => {
      const pages = [];
      let currentPageArr = [];
      let currentHeight = 0;

      for (const paragraph of paragraphs) {
        const lines = calculateLines(paragraph);
        const neededHeight = lines * LINE_HEIGHT;

        if (currentHeight + neededHeight > CONTAINER_HEIGHT) {
          if (currentPageArr.length > 0) {
            pages.push([...currentPageArr]);
            currentPageArr = [];
            currentHeight = 0;
          }

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
                  if (measureText(testLine) > CONTAINER_WIDTH) break;
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
    setCurrentPage(1);
    setStatus("display");
    setDisplayState("idleDisplay");

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
    if (displayState === "playing") {
      clearInterval(intervalId);
      setIntervalId(null);
      setDisplayState("paused");
    } else {
      const interval = 250;
      const newIntervalId = setInterval(() => {
        if (currentWordIndex < allWords.length - 1) {
          setCurrentWordIndex((prev) => prev + 1);
          setCurrentSpanCount((prevCount) => prevCount + 1);
        } else {
          clearInterval(newIntervalId);
          setDisplayState("paused");
        }
      }, interval);
      setIntervalId(newIntervalId);
      setDisplayState("playing");
    }
  };

  useEffect(() => {
    if (currentSpanCount >= spanCount && currentSpanCount !== 0) {
      setCurrentSpanCount(0);
      setCurrentPage((prevPage) => prevPage + 1);
    }

    console.log("currentSpanCount updated:", currentSpanCount);
  }, [currentWordIndex, currentSpanCount, spanCount]);

  const handleUpload = async (file) => {
    try {
      setStatus("loading");
      setFileName(file.name);
      const text = await uploadPDF(file);
      setExtractedText(text);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleClose = () => {
    console.log("Closing and resetting state...");
    setExtractedText("");
    setPages([]);
    setCurrentPage(1);
    setDisplayState("idleDisplay");
    setCurrentWordIndex(0);
    setCurrentSpanCount(0);
    setStatus("idle");
    console.log("State after reset:", {
      extractedText: "",
      pages: [],
      currentPage: 1,
      displayState: "idleDisplay",
      currentWordIndex: 0,
      status: "idle",
    });
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
              {displayState === "playing" ? "Pause" : "Play"}
            </button>
            <div>{fileName}</div> {/* Display the file name */}
            <SpanCounter onSpanCount={handleSpanCount} />
          </div>
          <PDFViewer
            pages={pages}
            currentPage={currentPage}
            onPageChange={(newPage) => setCurrentPage(newPage)}
            allWords={allWords}
            currentWordIndex={currentWordIndex} // Current word state
            displayState={displayState}
            cumulativeWordCounts={cumulativeWordCounts}
            onCurrentWordChange={(wordIndex) => setCurrentWordIndex(wordIndex)}
          />
        </>
      )}
    </div>
  );
};

export default PDFStateManager;
