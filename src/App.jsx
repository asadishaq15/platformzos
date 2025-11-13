// App.jsx
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './index.css';
import InnerPlatform from './Components/InnerPlatform';


function App() {
  return (
    <Router>
      <Routes>
     
         <Route path="/" element={<InnerPlatform />} /> 
      </Routes>
    </Router>
  );
}

export default App;