import React, { useState, useEffect, useMemo, useCallback } from "react";
import FileUploader from "./FileUploader";
import Loader from "./Loader";
import PDFViewer from "./PDFViewer";
import SpanCounter from "./SpanCounter";
import uploadPDF from "../services/pdfService";
import Icons from "./Icons";
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
  const [intervalValue, setIntervalValue] = useState(250); // State for interval value

  const CONTAINER_WIDTH = 636;
  const LINE_HEIGHT = 26;
  const CONTAINER_HEIGHT = 676;
  const FONT_STYLE = "18px Roboto, sans-serif";
  const MIN_INTERVAL = 50; // Minimum interval value
  const MAX_INTERVAL = 1000; // Maximum interval value

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
      const newIntervalId = setInterval(() => {
        if (currentWordIndex < allWords.length - 1) {
          setCurrentWordIndex((prev) => prev + 1);
          setCurrentSpanCount((prevCount) => prevCount + 1);
        } else {
          clearInterval(newIntervalId);
          setDisplayState("paused");
        }
      }, intervalValue);
      setIntervalId(newIntervalId);
      setDisplayState("playing");
    }
  };

  useEffect(() => {
    if (currentSpanCount >= spanCount && currentSpanCount !== 0) {
      setCurrentSpanCount(0);
      setCurrentPage((prevPage) => prevPage + 1);
    }

    // console.log("currentSpanCount updated:", currentSpanCount);
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
    setExtractedText("");
    setPages([]);
    setCurrentPage(1);
    setDisplayState("idleDisplay");
    setCurrentWordIndex(0);
    setCurrentSpanCount(0);
    setStatus("idle");
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowUp") {
      setIntervalValue((prevInterval) =>
        Math.max(prevInterval - 50, MIN_INTERVAL)
      );
    } else if (event.key === "ArrowDown") {
      setIntervalValue((prevInterval) =>
        Math.min(prevInterval + 50, MAX_INTERVAL)
      );
    } else if (event.key === "Escape") {
      handleClose();
    } else if (event.key === "Space") {
      handlePlayPause();
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  let className = "word";
  if (displayState === "playing") {
    className += " word-other bold padding-bottom-1";
  } else if (displayState === "idleDisplay") {
    className += " word-idle bold padding-bottom-1";
  } else if (displayState === "paused") {
    className += " word-idle bold padding-bottom-1";
  }

  return (
    <div className="pdf-viewer margin-top-2">
      {status === "idle" && <FileUploader onUpload={handleUpload} />}
      {status === "loading" && <Loader />}
      {status === "display" && pages.length > 0 && (
        <>
          <button
            className="unstyled-button close-button"
            onClick={handleClose}
            title="Close PDF"
          >
            <Icons iconName="ClosePdf" />
          </button>
          <div
            className="speed-meter"
            title="Use up and down arrow keys to adjust speed"
          >
            {intervalValue}ms
          </div>
          <div className="margin-top-3">
            <div className={className}>{fileName}</div>{" "}
            <SpanCounter onSpanCount={handleSpanCount} />
            <PDFViewer
              pages={pages}
              currentPage={currentPage}
              onPageChange={(newPage) => setCurrentPage(newPage)}
              allWords={allWords}
              currentWordIndex={currentWordIndex} // Current word state
              displayState={displayState}
              cumulativeWordCounts={cumulativeWordCounts}
              onCurrentWordChange={(wordIndex) =>
                setCurrentWordIndex(wordIndex)
              }
              elementType="text"
              onDisplayStateChange={setDisplayState} // Pass the state change handler
            />
          </div>
          <div className="flex-center">
            <div className="flex-end width-fit" style={{ flex: 1 }}>
              <button
                className="unstyled-button play-button"
                onClick={handlePlayPause}
                title={displayState === "playing" ? "Pause" : "Play"}
              >
                {displayState === "playing" ? (
                  <Icons iconName="Pause" />
                ) : (
                  <Icons iconName="Play" />
                )}
              </button>
            </div>
            <div className="flex-end width-fit" style={{ flex: 1 }}>
              <PDFViewer
                pages={pages}
                currentPage={currentPage}
                onPageChange={(newPage) => setCurrentPage(newPage)}
                allWords={allWords}
                currentWordIndex={currentWordIndex} // Current word state
                displayState={displayState}
                cumulativeWordCounts={cumulativeWordCounts}
                onCurrentWordChange={(wordIndex) =>
                  setCurrentWordIndex(wordIndex)
                }
                elementType="inputs"
                onDisplayStateChange={setDisplayState} // Pass the state change handler
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PDFStateManager;
