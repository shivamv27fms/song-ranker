import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Library from './pages/Library.jsx';
import Search from './pages/Search.jsx';
import Compare from './pages/Compare.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Analytics from './pages/Analytics.jsx';
import ImportExport from './pages/ImportExport.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/compare" replace />} />
        <Route path="/library" element={<Library />} />
        <Route path="/search" element={<Search />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/import-export" element={<ImportExport />} />
      </Routes>
    </Layout>
  );
}
