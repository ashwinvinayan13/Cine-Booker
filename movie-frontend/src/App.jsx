import { Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from './components/common/Navbar';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminLogin from './components/admin/AdminLogin';
import UserLogin from './components/user/UserLogin';
import Register from './components/Register';
import Movies from './components/Movies';
import MovieShows from './components/MovieShows';
import BookingForm from './components/BookingForm';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <div className="App">
      <Navbar />
      <Container className="py-4">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          {/* User Routes */}
          <Route path="/login" element={<UserLogin />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/movies" 
            element={
              <PrivateRoute>
                <Movies />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/movies/:movieId/shows" 
            element={
              <PrivateRoute>
                <MovieShows />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/booking/:showId"
            element={
              <PrivateRoute>
                <BookingForm />
              </PrivateRoute>
            }
          />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
        </Routes>
      </Container>
    </div>
  );
}

export default App;
