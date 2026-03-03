import { Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AnalyzePage from './components/AnalyzePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/analyze" element={<AnalyzePage />} />
    </Routes>
  );
}

export default App;
