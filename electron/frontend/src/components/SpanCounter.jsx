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

const SpanCounter = ({ onSpanCount }) => {
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

    // Cleanup
    return () => observer.disconnect();
  }, [onSpanCount]); // Dependency array includes the callback

  return null;
};

export default SpanCounter;
