import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Spinner, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { adminMovieAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function AdminDashboard() {
  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieFormData, setMovieFormData] = useState({
    title: '',
    description: '',
    duration: '',
    poster: null,
    show_time: '',
    seat_numbers: ''
  });
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [moviesResponse, showsResponse] = await Promise.all([
        adminMovieAPI.getAll(),
        adminMovieAPI.getShows()
      ]);
      console.log('Admin Movies Response:', moviesResponse);
      console.log('Admin Shows Response:', showsResponse);
      setMovies(moviesResponse);
      setShows(showsResponse);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Unauthorized. Please log in again.');
        logout();
        navigate('/admin/login');
        return;
      }
      setError('Failed to fetch data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleShowMovieModal = (movie = null) => {
    if (movie) {
      setMovieFormData({
        title: movie.title,
        description: movie.description,
        duration: movie.duration,
        poster: null,
        show_time: '',
        seat_numbers: ''
      });
      setSelectedMovie(movie);
    } else {
      setMovieFormData({
        title: '',
        description: '',
        duration: '',
        poster: null,
        show_time: '',
        seat_numbers: ''
      });
      setSelectedMovie(null);
    }
    setShowMovieModal(true);
  };

  const handleCloseMovieModal = () => {
    setShowMovieModal(false);
    setSelectedMovie(null);
    setMovieFormData({
      title: '',
      description: '',
      duration: '',
      poster: null,
      show_time: '',
      seat_numbers: ''
    });
  };

  const handleMovieChange = (e) => {
    const { name, value } = e.target;
    setMovieFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setMovieFormData(prev => ({
      ...prev,
      poster: e.target.files[0]
    }));
  };

  const handleMovieSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const formDataToSend = new FormData();
      Object.keys(movieFormData).forEach(key => {
        if (movieFormData[key] !== null && key !== 'show_time' && key !== 'seat_numbers') {
          formDataToSend.append(key, movieFormData[key]);
        }
      });

      let movieResponse;
      if (selectedMovie) {
        movieResponse = await adminMovieAPI.update(selectedMovie.id, formDataToSend);
      } else {
        movieResponse = await adminMovieAPI.create(formDataToSend);
      }

      // If this is a new movie and show details are provided, create the show
      if (!selectedMovie && movieFormData.show_time && movieFormData.seat_numbers) {
        const showDateTime = new Date(movieFormData.show_time);
        
        // Parse seat numbers here
        const seatNumbers = movieFormData.seat_numbers
          .split(',')
          .map(num => num.trim())
          .filter(num => num !== '')
          .map(num => parseInt(num))
          .filter(num => !isNaN(num));
        
        console.log('Creating show for movie:', movieResponse.id);
        
        const showData = {
          movie: movieResponse.id,
          show_time: showDateTime.toISOString(),
          total_seats: seatNumbers.length
        };
        
        const showResponse = await adminMovieAPI.createShow(showData);
        
        // Create seats for the show
        const showId = showResponse.id;
        const seats = seatNumbers.map(seatNumber => ({
          show: showId,
          seat_number: seatNumber,
          is_booked: false
        }));
        
        await Promise.all(seats.map(seat => adminMovieAPI.createSeat(seat)));
      }

      handleCloseMovieModal();
      fetchData();
    } catch (err) {
      console.error('Error saving movie and show:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Unauthorized. Please log in again.');
        logout();
        navigate('/admin/login');
        return;
      }
      setError(err.response?.data?.detail || 'Failed to save movie and show. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      try {
        await adminMovieAPI.delete(id);
        fetchData();
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError('Unauthorized. Please log in again.');
          logout();
          navigate('/admin/login');
          return;
        }
        setError('Failed to delete movie. Please try again.');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Admin Dashboard</h2>
            <Button variant="outline-danger" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      <Row className="mb-4">
        <Col>
          <Button variant="primary" onClick={() => handleShowMovieModal()}>
            Add New Movie
          </Button>
        </Col>
      </Row>

      <Row>
        {movies.map(movie => (
          <Col key={movie.id} md={6} lg={4} className="mb-4">
            <Card className="h-100">
              {movie.poster && (
                <Card.Img 
                  variant="top" 
                  src={movie.poster} 
                  alt={movie.title}
                  style={{ height: '300px', objectFit: 'cover' }}
                />
              )}
              <Card.Body>
                <Card.Title>{movie.title}</Card.Title>
                <Card.Text>
                  <strong>Duration:</strong> {movie.duration} minutes
                </Card.Text>
                <Card.Text>
                  <strong>Description:</strong><br />
                  {movie.description}
                </Card.Text>
                <div className="d-flex gap-2">
                  <Button 
                    variant="outline-primary"
                    onClick={() => handleShowMovieModal(movie)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline-danger"
                    onClick={() => handleDelete(movie.id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal show={showMovieModal} onHide={handleCloseMovieModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedMovie ? 'Edit Movie' : 'Add New Movie'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleMovieSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={movieFormData.title}
                onChange={handleMovieChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={movieFormData.description}
                onChange={handleMovieChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Duration (minutes)</Form.Label>
              <Form.Control
                type="number"
                name="duration"
                value={movieFormData.duration}
                onChange={handleMovieChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Poster</Form.Label>
              <Form.Control
                type="file"
                name="poster"
                onChange={handleFileChange}
                accept="image/*"
              />
            </Form.Group>

            {!selectedMovie && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Show Time</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="show_time"
                    value={movieFormData.show_time}
                    onChange={handleMovieChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Seat Numbers (comma-separated)</Form.Label>
                  <Form.Control
                    type="text"
                    name="seat_numbers"
                    value={movieFormData.seat_numbers}
                    onChange={handleMovieChange}
                    placeholder="1,2,3,4,5"
                  />
                  <Form.Text className="text-muted">
                    Enter seat numbers separated by commas (e.g., 1,2,3,4,5)
                  </Form.Text>
                </Form.Group>
              </>
            )}

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={handleCloseMovieModal}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {selectedMovie ? 'Update Movie' : 'Create Movie'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default AdminDashboard; 