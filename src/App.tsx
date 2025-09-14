import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AuthPage } from './components/Auth/AuthPage';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CreateBudget } from './pages/CreateBudget';
import { EditBudget } from './pages/EditBudget';
import { ViewBudget } from './pages/ViewBudget';
import { TelegramBot } from './pages/TelegramBot';
import { Categories } from './pages/Categories';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/telegram-bot" element={<TelegramBot />} />
          <Route path="/budgets/create" element={<CreateBudget />} />
          <Route path="/budgets/:id/edit" element={<EditBudget />} />
          <Route path="/budgets/:id" element={<ViewBudget />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;