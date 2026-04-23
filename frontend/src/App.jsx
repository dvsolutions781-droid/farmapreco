import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BasketProvider } from './hooks/useBasket';
import { GeoProvider } from './hooks/useGeoLocation';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import ResultsPage from './pages/ResultsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import BasketPage from './pages/BasketPage';
import DashboardPage from './pages/DashboardPage';

function AppShell() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/product" element={<ProductDetailPage />} />
        <Route path="/basket" element={<BasketPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <GeoProvider>
        <BasketProvider>
          <AppShell />
        </BasketProvider>
      </GeoProvider>
    </BrowserRouter>
  );
}
