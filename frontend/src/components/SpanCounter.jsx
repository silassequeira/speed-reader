import { useEffect } from "react";

// Function to count spans and call the callback
const countSpans = (onSpanCount) => {
  return new Promise((resolve) => {
    const spans = document.querySelectorAll("span");
    const spanCount = spans.length;
    console.log(`Number of spans on the page: ${spanCount}`);
    // Notify the parent component with the count
    onSpanCount(spanCount);
    resolve(spanCount);
  });
};

const SpanCounter = ({ onSpanCount }) => {
  useEffect(() => {
    // Initial count
    countSpans(onSpanCount).then((spanCount) => {
      console.log(`Initial span count completed: ${spanCount}`);
    });

    // Mutation observer to watch for DOM changes
    const observer = new MutationObserver(() => {
      countSpans(onSpanCount).then((spanCount) => {
        console.log(`Span count updated: ${spanCount}`);
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
