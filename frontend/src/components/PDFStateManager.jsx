import React, { useState, useEffect, useMemo, useCallback } from "react";
import FileUploader from "./FileUploader";
import Loader from "./Loader";
import PDFViewer from "./PDFViewer";
import uploadPDF from "../services/pdfService";

const PDFStateManager = () => {
  const [status, setStatus] = useState("idle");
  const [extractedText, setText] = useState("");
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

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

    const paragraphs = extractedText
      .split("\n%%PAGE_BREAK%%\n")
      .filter((p) => p.trim().length > 0);

    const newPages = createPages(paragraphs);
    setPages(newPages);
    setCurrentPage(1);
    setStatus("display");
  }, [extractedText, calculateLines, measureText]);

  const handleUpload = async (file) => {
    try {
      setStatus("loading");
      const text = await uploadPDF(file);
      setText(text);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleClose = () => {
    setText("");
    setPages([]);
    setCurrentPage(1);
    setStatus("idle");
  };

  return (
    <div className="pdf-viewer">
      {status === "idle" && <FileUploader onUpload={handleUpload} />}
      {status === "loading" && <Loader />}
      {status === "display" && pages.length > 0 && (
        <>
          <button onClick={handleClose}>Close</button>
          <PDFViewer
            pages={pages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
};

export default PDFStateManager;
