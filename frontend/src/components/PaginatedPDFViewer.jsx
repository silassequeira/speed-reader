import React, { useState, useEffect } from "react";
import uploadPDF from "../services/pdfService";

const PaginatedPDFViewer = () => {
  const [file, setFile] = useState(null);
  const [extractedText, setText] = useState("");
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Configuration constants
  const CONTAINER_WIDTH = 636;
  const CONTAINER_HEIGHT = 676;
  const LINE_HEIGHT = 26;
  const FONT_SIZE = 18;
  const FONT = `${FONT_SIZE}px Roboto, sans-serif`;

  // Memoized text measurement
  const measureText = (() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    return (text) => {
      ctx.font = FONT;
      return ctx.measureText(text).width;
    };
  })();

  const calculateLines = (paragraph) => {
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
  };

  useEffect(() => {
    if (!extractedText) return;

    const createPages = (paragraphs) => {
      const pages = [];
      let currentPage = [];
      let currentHeight = 0;

      for (const paragraph of paragraphs) {
        const lines = calculateLines(paragraph);
        const neededHeight = lines * LINE_HEIGHT;

        if (currentHeight + neededHeight > CONTAINER_HEIGHT) {
          if (currentPage.length > 0) {
            pages.push([...currentPage]);
            currentPage = [];
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

              // Push array of lines instead of joined string
              pages.push(pageLines); // Fixed line
            }
          } else {
            currentPage.push(paragraph);
            currentHeight += neededHeight;
          }
        } else {
          currentPage.push(paragraph);
          currentHeight += neededHeight;
        }
      }

      if (currentPage.length > 0) pages.push(currentPage);
      return pages;
    };

    const paragraphs = extractedText
      .split("\n%%PAGE_BREAK%%\n")
      .filter((p) => p.trim().length > 0);

    const pages = createPages(paragraphs);
    setPages(pages);
    setCurrentPage(1);
  }, [extractedText]);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setFile(event.dataTransfer.files[0]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) return;

    try {
      const text = await uploadPDF(file);
      setText(text);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const nextPage = () => {
    if (currentPage < pages.length) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="pdf-viewer">
      <form onSubmit={handleSubmit}>
        <div
          className="dropzone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
          />
          <p>or drop PDF file here</p>
        </div>
        <button type="submit">Upload PDF</button>
      </form>

      {pages.length > 0 && (
        <div>
          <div className="viewer-container">
            {pages[currentPage - 1]?.map((para, i) => (
              <p key={`${currentPage}-${i}`} className="lineHeight">
                {para}
              </p>
            ))}
          </div>

          <div className="pagination-controls">
            <button onClick={prevPage} disabled={currentPage === 1}>
              Previous Page
            </button>
            <span>
              Page {currentPage} of {pages.length}
            </span>
            <button onClick={nextPage} disabled={currentPage === pages.length}>
              Next Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaginatedPDFViewer;
