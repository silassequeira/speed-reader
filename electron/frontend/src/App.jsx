import "./App.css";
import PDFStateManager from "./components/PDFStateManager";
import CostumTitleBar from "./components/CostumTitleBar";

function App() {
  return (
    <>
      <CostumTitleBar />
      <div className="flex-center">
        <PDFStateManager />
      </div>
    </>
  );
}

export default App;
