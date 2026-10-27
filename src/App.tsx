import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from './lib/supabase';
import PublicLayout from './layouts/PublicLayout';
import PortalLayout from './layouts/PortalLayout';
import Home from './pages/Home';
import ReportForm from './pages/ReportForm';
import Dashboard from './pages/Dashboard';
import ModDashboard from './pages/ModDashboard';
import Login from './pages/Login';
import ScammerDetails from './pages/ScammerDetails';
import MyDisputes from './pages/MyDisputes';
import WallOfShame from './pages/WallOfShame'; // <-- Import here

function App() {
  useEffect(() => {
    const keepAlive = async () => {
      try {
        await supabase.from('categories').select('id').limit(1);
      } catch (err) {}
    };
    keepAlive();
    const interval = setInterval(keepAlive, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/report" element={<ReportForm />} />
          <Route path="/login" element={<Login />} />
          <Route path="/scammer/:id" element={<ScammerDetails />} />
          <Route path="/wall-of-shame" element={<WallOfShame />} /> {/* <-- Add route here */}
        </Route>

        <Route element={<PortalLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-disputes" element={<MyDisputes />} />
          <Route path="/mod/pending" element={<ModDashboard tab="pending" />} />
          <Route path="/mod/database" element={<ModDashboard tab="scammers" />} />
          <Route path="/mod/disputes" element={<ModDashboard tab="disputes" />} />
          <Route path="/mod/categories" element={<ModDashboard tab="categories" />} />
          <Route path="/mod/users" element={<ModDashboard tab="users" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;