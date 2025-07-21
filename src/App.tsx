import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ApiLogProvider } from './contexts/ApiLogContext';
import { ScrollProvider } from './contexts/ScrollContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { ApiPanel } from './components/ApiPanel';
import { Home } from './pages/Home';
import { MovieDetails } from './pages/MovieDetails';
import { Login } from './pages/Login';
import { Favorites } from './pages/Favorites';
import { AdminPanel } from './pages/AdminPanel';
import { Activity } from 'lucide-react';

function App() {
  const [isApiPanelOpen, setIsApiPanelOpen] = React.useState(false);

  return (
    <ApiLogProvider>
      <Router>
        <AuthProvider>
          <ScrollProvider>
            <ErrorBoundary>
              <div className="min-h-screen bg-dark-bg text-gray-100">
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/movie/:id" element={<MovieDetails />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/admin" element={<AdminPanel />} />
                  </Routes>
                </main>
                
                {/* API Monitor Button */}
                <button
                  onClick={() => setIsApiPanelOpen(true)}
                  className="fixed bottom-4 right-4 bg-accent-blue hover:bg-accent-blue-hover text-white p-3 rounded-full shadow-lg transition-colors z-40 hover:scale-110"
                  title="Abrir Monitor de API"
                  aria-label="Abrir Monitor de API"
                >
                  <Activity className="h-5 w-5" />
                </button>
                
                <ApiPanel 
                  isOpen={isApiPanelOpen} 
                  onClose={() => setIsApiPanelOpen(false)} 
                />
              </div>
            </ErrorBoundary>
          </ScrollProvider>
        </AuthProvider>
      </Router>
    </ApiLogProvider>
  );
}

export default App;