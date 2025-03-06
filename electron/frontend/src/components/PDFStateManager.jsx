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
    // console.log("Closing and resetting state...");
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

  const svgClose = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
    >
      <path
        d="M18 16.3428C17.9883 16.3522 17.9662 16.3611 17.9662 16.3705C17.9653 16.6363 17.8446 16.8579 17.7084 17.0724C17.531 17.3518 17.2742 17.5405 16.9728 17.663C16.8742 17.7034 16.7657 17.7302 16.6582 17.7546C16.4798 17.795 16.3023 17.7903 16.1267 17.7799C15.799 17.7607 15.4868 17.6762 15.2173 17.4771C15.1352 17.4166 15.0558 17.3504 14.9835 17.2785C13.0366 15.333 11.0901 13.3869 9.14402 11.4404C9.10271 11.3991 9.0628 11.3569 9.01163 11.3043C8.97876 11.3212 8.94308 11.3353 8.91303 11.3569C8.88486 11.377 8.8628 11.4057 8.83791 11.4306C6.85855 13.4099 4.87965 15.3898 2.89887 17.3677C2.71577 17.5504 2.48713 17.6551 2.23501 17.7161C2.11623 17.7447 1.99651 17.7668 1.87679 17.7804C1.74956 17.795 1.61764 17.7968 1.49087 17.7804C1.3228 17.7583 1.15096 17.7367 0.996032 17.663C0.811523 17.5748 0.633587 17.4795 0.481003 17.3325C0.257056 17.1165 0.126069 16.848 0.0500113 16.5616C-0.00726646 16.3475 -0.0204122 16.1198 0.037335 15.8888C0.120435 15.555 0.128416 15.4977 0.323254 15.1982C0.396964 15.0846 0.477247 14.9766 0.573492 14.8804C2.57399 12.8803 4.57401 10.8803 6.5792 8.87513C6.51864 8.81504 6.45854 8.75447 6.39798 8.69391C4.44255 6.73942 2.48854 4.784 0.532177 2.83139C0.362222 2.66144 0.257056 2.46097 0.181468 2.23796C0.136397 2.10463 0.0913263 1.97035 0.113862 1.8281C0.124191 1.76378 0.0335791 1.71964 0.0988381 1.63842C0.13358 1.59523 0.100716 1.50274 0.113392 1.4356C0.166445 1.1586 0.27161 0.906019 0.435932 0.672213C0.537341 0.52808 0.664573 0.415872 0.801664 0.321974C0.960821 0.212583 1.13171 0.116807 1.32796 0.0670413C1.5228 0.0177449 1.71623 -0.00807704 1.91482 0.00225173C2.09792 0.0116415 2.27164 0.0623464 2.44018 0.13277C2.64864 0.219625 2.83455 0.336059 2.98995 0.504136C3.14911 0.675969 3.31437 0.842638 3.4862 1.00133C4.43598 1.87692 5.32191 2.81637 6.23976 3.72389C7.15949 4.6333 8.0703 5.55256 8.98486 6.46712C10.9408 4.51123 12.8952 2.55674 14.8497 0.60179C14.9934 0.458126 15.153 0.337937 15.3342 0.244508C15.3873 0.217278 15.4295 0.173615 15.4953 0.164226C15.553 0.156244 15.607 0.124788 15.6638 0.106009C15.7216 0.0867598 15.7868 0.0830039 15.8408 0.0651633C15.9892 0.0163364 16.1399 0.0247872 16.284 0.0407499C16.4558 0.0595294 16.6249 0.0980276 16.792 0.167981C16.9798 0.246386 17.138 0.361881 17.2939 0.479722C17.416 0.572212 17.6376 0.896629 17.7258 1.12339C17.8399 1.41776 17.8441 1.71683 17.816 2.01261C17.7939 2.24782 17.7089 2.48069 17.5554 2.67505C17.4958 2.75064 17.4366 2.82811 17.3685 2.89618C15.4272 4.8394 13.4849 6.78121 11.5426 8.72349C11.5023 8.76386 11.4614 8.80471 11.4121 8.854C11.4408 8.88452 11.4628 8.9094 11.4863 8.93241C12.8239 10.27 14.1615 11.6076 15.499 12.9451C16.1892 13.5583 16.8098 14.2419 17.4723 14.8827C17.6756 15.0794 17.8174 15.3165 17.915 15.578C17.9446 15.6574 17.9775 15.7461 17.9662 15.8391C17.9648 15.8527 17.9878 15.8696 17.9995 15.8846V16.3414L18 16.3428Z"
        fill="#5A5A5A"
      />
    </svg>
  );

  const svgPause = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="21"
      viewBox="0 0 18 21"
      fill="none"
    >
      <path
        d="M2.43138 0.00054163C3.12087 0.00054163 3.80983 0.00054163 4.49932 0.00054163C4.51016 0.0140824 4.51991 0.0379141 4.53182 0.039539C4.5784 0.0438721 4.62715 0.0362892 4.67319 0.0427888C4.72248 0.04983 4.7696 0.0714952 4.81889 0.0812445C5.02362 0.121325 5.22294 0.19282 5.39951 0.291397C5.66383 0.438721 5.91514 0.609876 6.13017 0.835194C6.40965 1.12822 6.61331 1.46078 6.75684 1.83559C6.86787 2.1259 6.92799 2.43084 6.92854 2.7374C6.93395 7.84606 6.93179 12.9542 6.93395 18.0628C6.93395 18.2085 6.86354 18.3456 6.89171 18.4923C6.82292 18.5552 6.86679 18.6429 6.84296 18.7155C6.71622 19.1011 6.56294 19.4765 6.29591 19.7863C6.01805 20.1086 5.69308 20.3794 5.29606 20.5489C5.03879 20.6589 4.78097 20.7715 4.4912 20.7601C4.48091 20.7601 4.47008 20.7856 4.45924 20.7991H2.43192C2.41459 20.7856 2.3978 20.7623 2.37938 20.7601C2.32576 20.7547 2.26672 20.7726 2.21852 20.7558C1.94716 20.6616 1.66226 20.6025 1.41311 20.4493C1.25333 20.3512 1.11034 20.2288 0.957061 20.1264C0.77399 20.004 0.662414 19.828 0.531881 19.6688C0.405681 19.5149 0.314146 19.3319 0.231276 19.1461C0.118075 18.8937 0 18.4691 0 18.2269C0 13.1037 3.72271e-08 7.97984 0.00162493 2.85656C0.00162493 2.6659 -0.00487465 2.47633 0.0324978 2.28297C0.0660789 2.10694 0.145157 1.94499 0.163031 1.7668C0.333644 1.4299 0.516174 1.09897 0.781573 0.82707C0.908314 0.69762 1.05618 0.585502 1.20513 0.481509C1.56531 0.230193 1.97803 0.0682454 2.40051 0.0389974C2.41188 0.0384558 2.42217 0.0135408 2.433 0L2.43138 0.00054163Z"
        fill="#5A5A5A"
      />
      <path
        d="M13.4996 0.000488281C14.1891 0.000488281 14.878 0.000488281 15.5675 0.000488281C15.5849 0.014029 15.6016 0.0378608 15.6201 0.0394857C15.697 0.0465269 15.7701 0.0557346 15.8475 0.0768582C16.3209 0.204141 16.3924 0.235556 16.7488 0.447875C17.0343 0.617947 17.2682 0.847598 17.4611 1.11246C17.5818 1.27928 17.6837 1.46181 17.7687 1.65354C17.8808 1.90594 18 2.33112 18 2.57269C18 7.69597 18 12.8198 17.9984 17.9431C17.9984 18.1337 18.0049 18.3233 17.9675 18.5167C17.9339 18.6927 17.8548 18.8546 17.8369 19.0328C17.6663 19.3697 17.4838 19.7007 17.2184 19.9726C17.0917 20.102 16.9438 20.2141 16.7949 20.3181C16.4347 20.5694 16.0219 20.7314 15.5995 20.7606C15.5881 20.7612 15.5778 20.7861 15.567 20.7996H13.5397C13.5391 20.7438 13.4947 20.7558 13.4671 20.7601C13.3398 20.7807 13.2185 20.739 13.1047 20.7032C12.7879 20.6041 12.3784 20.3831 12.152 20.2109C11.8801 20.0034 11.6721 19.7456 11.475 19.4759C11.4024 19.3768 11.3596 19.2538 11.3108 19.139C11.2648 19.0296 11.2209 18.918 11.1901 18.8037C11.157 18.6813 11.1099 18.5627 11.105 18.4322C11.1002 18.3022 11.0682 18.1727 11.0682 18.0427C11.066 13.2926 11.0649 8.54308 11.0693 3.79298C11.0693 3.3521 11.0249 2.90958 11.105 2.46978C11.1224 2.375 11.1207 2.27913 11.1429 2.18163C11.2442 1.74129 11.4305 1.34319 11.7171 0.999255C12.0074 0.650986 12.3686 0.385587 12.7873 0.211182C13.0029 0.121813 13.2239 0.0324445 13.4671 0.0400273C13.4774 0.0400273 13.4882 0.0145707 13.499 0.00102991L13.4996 0.000488281Z"
        fill="#5A5A5A"
      />
    </svg>
  );

  const svgPlay = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="19"
      height="21"
      viewBox="0 0 19 21"
      fill="none"
    >
      <path
        d="M3.17464 0C3.40941 0 3.64418 0 3.87895 0C3.89568 0.0130717 3.91241 0.0360779 3.93019 0.0376465C3.99502 0.0423524 4.07032 0.0183004 4.12417 0.0433981C4.31868 0.133332 4.54874 0.106665 4.72965 0.235814C4.9869 0.281303 5.19867 0.435027 5.41723 0.557901C5.62846 0.677115 5.84127 0.799989 6.04885 0.92966C6.31604 1.09698 6.59682 1.2439 6.86871 1.40547C7.06688 1.52312 7.28073 1.61566 7.4721 1.74272C7.75759 1.932 8.06555 2.08049 8.35366 2.26454C8.48071 2.34559 8.63182 2.39056 8.75313 2.47787C8.97796 2.63892 9.22789 2.75447 9.45952 2.9014C9.56148 2.96571 9.68017 3.00493 9.77952 3.07238C10.0268 3.24179 10.2935 3.37669 10.5497 3.52989C10.8111 3.68622 11.0726 3.84413 11.3371 3.99315C11.6388 4.16308 11.9343 4.34399 12.238 4.51026C12.3442 4.5683 12.4597 4.61222 12.5586 4.68072C12.8357 4.87157 13.1342 5.02372 13.4255 5.18895C13.631 5.30607 13.8328 5.43051 14.0409 5.54398C14.2809 5.67469 14.513 5.82214 14.7499 5.96123C14.8545 6.0224 14.9659 6.07207 15.0689 6.13534C15.2864 6.26972 15.5049 6.40253 15.7308 6.52279C15.8485 6.58553 15.9708 6.64252 16.0801 6.71834C16.261 6.84435 16.4597 6.93951 16.6453 7.05716C16.8137 7.16382 16.9779 7.27833 17.1227 7.41219C17.2869 7.56486 17.4458 7.72329 17.5859 7.90264C17.7961 8.17087 17.931 8.47832 18.0837 8.77635C18.1407 8.88772 18.1554 9.02053 18.1909 9.1434C18.2286 9.27308 18.2552 9.40693 18.2761 9.53765C18.3044 9.71176 18.274 9.8932 18.318 10.0704C18.3295 10.1175 18.2887 10.1755 18.284 10.2299C18.2777 10.3078 18.2876 10.3873 18.2808 10.4647C18.2746 10.5384 18.2584 10.6111 18.2427 10.6838C18.2129 10.8213 18.1904 10.9619 18.1459 11.0947C18.0691 11.3243 17.9812 11.5481 17.8552 11.7588C17.7041 12.0124 17.5441 12.2555 17.3324 12.4626C17.1765 12.6153 17.0328 12.7831 16.8477 12.9007C16.6113 13.0513 16.3687 13.192 16.1266 13.3331C15.884 13.4738 15.6472 13.626 15.4019 13.7593C15.0971 13.9245 14.8064 14.1127 14.5005 14.2754C14.3881 14.3355 14.2757 14.3951 14.1659 14.4594C13.9609 14.5791 13.7591 14.7046 13.5531 14.8233C13.4271 14.896 13.2885 14.9478 13.1693 15.0299C12.8922 15.2207 12.5941 15.3744 12.3018 15.5381C12.0953 15.6536 11.8935 15.7781 11.6869 15.8936C11.448 16.027 11.2122 16.1687 10.979 16.3135C10.8765 16.3773 10.7583 16.417 10.6595 16.4855C10.4383 16.6387 10.1957 16.7553 9.96671 16.8955C9.77638 17.0121 9.56828 17.1067 9.38162 17.2259C9.10816 17.4 8.82162 17.5511 8.54712 17.7221C8.30503 17.8727 8.05457 18.0133 7.80569 18.153C7.50347 18.3224 7.21066 18.5075 6.90426 18.6685C6.79708 18.725 6.68832 18.7794 6.58427 18.8416C6.37983 18.9634 6.18009 19.0936 5.9746 19.2139C5.84441 19.2902 5.69801 19.3414 5.57409 19.4256C5.30638 19.6076 5.01775 19.7487 4.72338 19.8779C4.62456 19.9213 4.51162 19.9333 4.40652 19.9631C4.25123 20.0076 4.09489 20.0426 3.93228 20.0484C3.92705 20.0484 3.92287 20.0693 3.91816 20.0802H3.17464C3.17412 20.0264 3.13177 20.0389 3.10458 20.0421C2.96968 20.0578 2.84053 20.0159 2.71556 19.9861C2.54093 19.9443 2.37099 19.881 2.20158 19.812C1.92708 19.7006 1.67715 19.5574 1.43872 19.3843C1.33414 19.3085 1.24578 19.2191 1.15166 19.1333C1.09153 19.0784 1.01572 19.0387 0.962908 18.9786C0.864085 18.8661 0.772583 18.7464 0.685787 18.6241C0.5969 18.4991 0.508012 18.3726 0.436902 18.2377C0.332851 18.04 0.24344 17.8366 0.180696 17.6186C0.129978 17.4429 0.0682794 17.2641 0.0531162 17.0879C0.0363844 16.8918 0.00396655 16.6957 0.00396655 16.4976C0.00396655 12.3308 0.00344373 8.16355 0.00605807 3.99681C0.00605807 3.76727 -0.0206082 3.53721 0.0379531 3.3061C0.0698481 3.18061 0.0374302 3.0431 0.0792597 2.91133C0.109063 2.81774 0.0891942 2.70637 0.125272 2.61643C0.245009 2.31997 0.301479 1.99474 0.513241 1.73906C0.566573 1.57645 0.676898 1.44259 0.788269 1.32809C0.910098 1.20312 0.975457 1.02012 1.15271 0.950052C1.33153 0.763388 1.54172 0.621691 1.7629 0.488882C1.96263 0.369145 2.16812 0.270846 2.38772 0.200782C2.54406 0.150586 2.69622 0.0779074 2.86667 0.0815675C2.94458 0.0177775 3.03765 0.0522869 3.12392 0.0407838C3.14222 0.0381694 3.15791 0.0162089 3.17464 0.00313721V0Z"
        fill="#5A5A5A"
      />
    </svg>
  );

  let className = "word";
  if (displayState === "playing") {
    className += " word-other bold padding-bottom-1";
  } else if (displayState === "idleDisplay") {
    className += " word-idle bold padding-bottom-1";
  } else if (displayState === "paused") {
    className += " word-idle bold padding-bottom-1";
  }

  return (
    <div className="pdf-viewer">
      {status === "idle" && <FileUploader onUpload={handleUpload} />}
      {status === "loading" && <Loader />}
      {status === "display" && pages.length > 0 && (
        <>
          <button
            className="unstyled-button close-button"
            onClick={handleClose}
          >
            {svgClose}
          </button>
          <div className="margin-top-4">
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
            />
          </div>
          <div className="flex-center">
            <div className="flex-end width-fit" style={{ flex: 1 }}>
              <button className="unstyled-button " onClick={handlePlayPause}>
                {displayState === "playing" ? svgPause : svgPlay}
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
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PDFStateManager;
