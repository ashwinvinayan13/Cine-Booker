import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { movieAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Movies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated || !token) {
      navigate('/login');
      return;
    }

    const fetchMovies = async () => {
      try {
        const response = await movieAPI.getAll();
        console.log('Movies response:', response);
        
        if (response && response.data) {
          setMovies(Array.isArray(response.data) ? response.data : []);
        } else {
          setError('Failed to load movies. Please try again.');
        }
      } catch (err) {
        console.error('Error fetching movies:', err);
        
        if (err.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
          navigate('/login');
        } else {
          setError(err.response?.data?.detail || 'Failed to fetch movies. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [token, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container>
      <h2 className="mb-4">Available Movies</h2>
      
      <Row>
        {movies.map((movie) => (
          <Col key={movie.id} xs={12} md={6} lg={4} className="mb-4">
            <Card>
              <Card.Img 
                variant="top" 
                src={movie.poster || 'https://via.placeholder.com/300x450'} 
                alt={movie.title}
                style={{ height: '400px', objectFit: 'cover' }}
              />
              <Card.Body>
                <Card.Title>{movie.title}</Card.Title>
                <Card.Text>
                  <strong>Duration:</strong> {movie.duration} minutes<br />
                  <strong>Genre:</strong> {movie.genre}
                </Card.Text>
                <Button 
                  variant="primary" 
                  className="w-100"
                  onClick={() => navigate(`/movies/${movie.id}/shows`)}
                >
                  View Shows
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default Movies; 