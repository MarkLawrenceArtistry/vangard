import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import ReportForm from './pages/ReportForm';
import Dashboard from './pages/Dashboard';
import ModDashboard from './pages/ModDashboard'; // <-- ADD THIS

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/report" element={<ReportForm />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mod" element={<ModDashboard />} /> {/* <-- ADD THIS */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;