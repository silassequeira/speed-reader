import { useEffect } from "react";

// Function to count spans and call the callback
const countSpans = (onSpanCount) => {
  return new Promise((resolve) => {
    const spans = document.querySelectorAll("span");
    const spanCount = spans.length;
    // Notify the parent component with the count
    onSpanCount(spanCount);
    resolve();
  });
};

// Function to detect the index of the clicked span
const detectClickedSpanIndex = (event) => {
  const spans = Array.from(document.querySelectorAll("span"));
  const clickedSpan = event.target;
  const spanIndex = spans.indexOf(clickedSpan);
  return spanIndex;
};

const SpanCounter = ({ onSpanCount, onSpanClick }) => {
  useEffect(() => {
    // Initial count
    countSpans(onSpanCount).then(() => {
      // Initial span count completed
    });

    // Mutation observer to watch for DOM changes
    const observer = new MutationObserver(() => {
      countSpans(onSpanCount).then(() => {
        // Span count updated
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Event listener for span clicks
    const handleSpanClick = (event) => {
      const spanIndex = detectClickedSpanIndex(event);
      if (spanIndex !== -1) {
        onSpanClick(spanIndex);
      }
    };

    document.body.addEventListener("click", handleSpanClick);

    // Cleanup
    return () => {
      observer.disconnect();
      document.body.removeEventListener("click", handleSpanClick);
    };
  }, [onSpanCount, onSpanClick]); // Dependency array includes the callbacks

  return null;
};

export default SpanCounter;
