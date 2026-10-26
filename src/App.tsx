import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import PortalLayout from './layouts/PortalLayout';
import Home from './pages/Home';
import ReportForm from './pages/ReportForm';
import Dashboard from './pages/Dashboard';
import ModDashboard from './pages/ModDashboard';
import Login from './pages/Login';
import ScammerDetails from './pages/ScammerDetails';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/report" element={<ReportForm />} />
          <Route path="/login" element={<Login />} />
          <Route path="/scammer/:id" element={<ScammerDetails />} />
        </Route>

        <Route element={<PortalLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mod/pending" element={<ModDashboard tab="pending" />} />
          <Route path="/mod/database" element={<ModDashboard tab="scammers" />} />
          <Route path="/mod/disputes" element={<ModDashboard tab="disputes" />} />
          <Route path="/mod/categories" element={<ModDashboard tab="categories" />} />
          <Route path="/mod/users" element={<ModDashboard tab="users" />} /> {/* <-- ADDED THIS */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;