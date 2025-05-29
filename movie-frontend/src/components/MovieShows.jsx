import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button,
  Modal,
  Alert,
  Spinner
} from 'react-bootstrap';
import { showAPI, movieAPI } from '../services/api';
import SeatSelection from './SeatSelection';

function MovieShows() {
  const { movieId } = useParams();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [totalSeats, setTotalSeats] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [movieResponse, showsResponse] = await Promise.all([
          movieAPI.getOne(movieId),
          showAPI.getAll()
        ]);
        
        console.log('Movie response:', movieResponse.data);
        console.log('All shows response:', showsResponse.data);
        
        setMovie(movieResponse.data);
        const movieShows = showsResponse.data.filter(show => show.movie === parseInt(movieId));
        console.log('Filtered movie shows with seat info:', movieShows.map(show => ({
          id: show.id,
          total_seats: show.total_seats,
          available_seats: show.available_seats,
          show_time: show.show_time
        })));

        // Fetch booked seats for each show
        const showsWithSeats = await Promise.all(
          movieShows.map(async (show) => {
            try {
              const bookedSeatsResponse = await showAPI.getBookedSeats(show.id);
              let bookedSeats = [];
              if (bookedSeatsResponse.data.booked_seats) {
                if (Array.isArray(bookedSeatsResponse.data.booked_seats)) {
                  bookedSeats = bookedSeatsResponse.data.booked_seats;
                } else if (typeof bookedSeatsResponse.data.booked_seats === 'object') {
                  bookedSeats = Object.values(bookedSeatsResponse.data.booked_seats);
                }
              }
              console.log(`Raw booked seats for show ${show.id}:`, bookedSeats);
              
              // Map seat IDs to seat numbers
              const mappedBookedSeats = bookedSeats.map(seatId => {
                const seatNumber = parseInt(seatId) - 180;
                // If the mapped seat number is greater than total seats, it's invalid
                if (seatNumber > (show.total_seats || 50)) {
                  console.log(`Invalid seat number ${seatNumber} for total seats ${show.total_seats || 50}`);
                  return null;
                }
                return seatNumber.toString();
              }).filter(Boolean); // Remove any null values
              
              console.log(`Mapped booked seats for show ${show.id}:`, mappedBookedSeats);
              
              const totalSeats = show.total_seats || 50;
              const availableSeatsCount = totalSeats - mappedBookedSeats.length;
              console.log(`Available seats for show ${show.id}:`, availableSeatsCount);

              return {
                ...show,
                booked_seats: mappedBookedSeats,
                available_seats: availableSeatsCount,
                total_seats: totalSeats
              };
            } catch (error) {
              console.error(`Error fetching booked seats for show ${show.id}:`, error);
              return {
                ...show,
                booked_seats: [],
                available_seats: show.total_seats || 50,
                total_seats: show.total_seats || 50
              };
            }
          })
        );

        if (showsWithSeats.length === 0) {
          setError('No shows available for this movie');
          return;
        }

        setShows(showsWithSeats);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch show details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [movieId]);

  const handleBookingClick = async (show) => {
    console.log('Booking click for show:', show);
    setSelectedShow(show);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to book tickets');
        return;
      }

      // Get booked seats first
      const bookedSeatsResponse = await showAPI.getBookedSeats(show.id);
      console.log('Booked seats response:', bookedSeatsResponse.data);

      // Get total seats (default to 50 if not specified)
      const calculatedTotalSeats = show.total_seats || 50;
      setTotalSeats(calculatedTotalSeats);

      // Get booked seats from the response
      const bookedSeats = bookedSeatsResponse.data.booked_seats || [];
      console.log('Booked seats:', bookedSeats);

      // Create array of all possible seats
      const allSeats = Array.from({ length: calculatedTotalSeats }, (_, i) => (i + 1).toString());
      console.log('All possible seats:', allSeats);

      // Map booked seats to seat numbers first
      const mappedBookedSeats = bookedSeats.map(seatId => {
        const seatNumber = parseInt(seatId) - 180;
        // If the mapped seat number is greater than total seats, it's invalid
        if (seatNumber > calculatedTotalSeats) {
          console.log(`Invalid seat number ${seatNumber} for total seats ${calculatedTotalSeats}`);
          return null;
        }
        return seatNumber.toString();
      }).filter(Boolean); // Remove any null values
      
      console.log('Mapped booked seats:', mappedBookedSeats);

      // Calculate available seats by filtering out booked seats
      const available = allSeats.filter(seat => !mappedBookedSeats.includes(seat));
      console.log('Available seats:', available);

      if (available.length === 0) {
        setError('No seats available for this show');
        return;
      }

      // Update the show's booked seats with the mapped seat numbers
      setSelectedShow({
        ...show,
        booked_seats: mappedBookedSeats,
        available_seats: available.length // Update available seats count
      });
      
      setAvailableSeats(available);
      setSelectedSeats([]);
      setShowModal(true);
      setError('');
    } catch (error) {
      console.error('Error in handleBookingClick:', error);
      setError(error.response?.data?.detail || 'Failed to fetch seat availability');
    }
  };

  const handleSeatSelect = (seatNumber) => {
    setSelectedSeats(prev => {
      if (prev.includes(seatNumber)) {
        return prev.filter(seat => seat !== seatNumber);
      } else {
        return [...prev, seatNumber];
      }
    });
  };

  const handleBooking = async () => {
    try {
      if (!selectedSeats.length || !selectedShow) {
        setError('Please select a seat to book');
        return;
      }

      const seatNumber = parseInt(selectedSeats[0]);
      
      if (isNaN(seatNumber)) {
        setError('Invalid seat selection');
        return;
      }

      const bookingData = {
        seat: seatNumber
      };
      
      console.log('Attempting to book seat:', bookingData);
      const response = await showAPI.bookTicket(selectedShow.id, bookingData);
      
      if (response.status === 201 || response.status === 200) {
        setSuccessMessage('Ticket booked successfully!');
        
        // Update the UI immediately
        const bookedSeatNumber = selectedSeats[0];
        setAvailableSeats(prev => prev.filter(seat => seat !== bookedSeatNumber));
        
        // Update selected show with the new booked seat
        setSelectedShow(prev => {
          const newBookedSeats = [...(prev.booked_seats || []), bookedSeatNumber];
          return {
            ...prev,
            booked_seats: newBookedSeats,
            available_seats: (prev.total_seats || 50) - newBookedSeats.length
          };
        });
        
        // Update the shows state
        setShows(prev => prev.map(show => 
          show.id === selectedShow.id 
            ? {
                ...show,
                booked_seats: [...(show.booked_seats || []), bookedSeatNumber],
                available_seats: Math.max(0, (show.total_seats || 50) - (show.booked_seats?.length || 0) - 1)
              }
            : show
        ));
        
        setShowModal(false);
        setSelectedSeats([]);
        
        // Refresh data in the background
        try {
          const [showsResponse, bookedSeatsResponse] = await Promise.all([
            showAPI.getAll(),
            showAPI.getBookedSeats(selectedShow.id)
          ]);

          const movieShows = showsResponse.data.filter(show => show.movie === parseInt(movieId));
          const updatedShows = await Promise.all(
            movieShows.map(async (show) => {
              try {
                if (show.id === selectedShow.id) {
                  const showBookedSeats = bookedSeatsResponse.data.booked_seats || [];
                  const mappedBookedSeats = showBookedSeats.map(seatId => {
                    const seatNumber = parseInt(seatId) - 180;
                    if (seatNumber > (show.total_seats || 50)) {
                      console.log(`Invalid seat number ${seatNumber} for total seats ${show.total_seats || 50}`);
                      return null;
                    }
                    return seatNumber.toString();
                  }).filter(Boolean);
                  
                  const totalSeats = show.total_seats || 50;
                  const availableSeatsCount = totalSeats - mappedBookedSeats.length;
                  console.log(`Updated available seats for show ${show.id}:`, availableSeatsCount);
                  
                  return {
                    ...show,
                    booked_seats: mappedBookedSeats,
                    available_seats: availableSeatsCount,
                    total_seats: totalSeats
                  };
                }
                const showBookedSeatsResponse = await showAPI.getBookedSeats(show.id);
                const showBookedSeats = showBookedSeatsResponse.data.booked_seats || [];
                const mappedBookedSeats = showBookedSeats.map(seatId => {
                  const seatNumber = parseInt(seatId) - 180;
                  if (seatNumber > (show.total_seats || 50)) {
                    console.log(`Invalid seat number ${seatNumber} for total seats ${show.total_seats || 50}`);
                    return null;
                  }
                  return seatNumber.toString();
                }).filter(Boolean);
                
                const totalSeats = show.total_seats || 50;
                const availableSeatsCount = totalSeats - mappedBookedSeats.length;
                
                return {
                  ...show,
                  booked_seats: mappedBookedSeats,
                  available_seats: availableSeatsCount,
                  total_seats: totalSeats
                };
              } catch (error) {
                console.error(`Error fetching booked seats for show ${show.id}:`, error);
                return show;
              }
            })
          );
          
          setShows(updatedShows);
        } catch (refreshError) {
          console.error('Error refreshing data:', refreshError);
        }
      } else {
        setError('Failed to book ticket. Please try again.');
      }
      
    } catch (err) {
      console.error('Booking error:', err);
      
      // Handle seat already booked error
      if (err.response?.data?.error === 'This seat is already booked') {
        setError('This seat is already booked. Please select another seat.');
        // Update the UI to show the seat as booked
        setAvailableSeats(prev => prev.filter(seat => seat !== selectedSeats[0]));
        setSelectedSeats([]);
        
        // Refresh the booked seats data to get the correct state
        try {
          const bookedSeatsResponse = await showAPI.getBookedSeats(selectedShow.id);
          const bookedSeats = bookedSeatsResponse.data.booked_seats || [];
          
          // Map the booked seats to seat numbers
          const mappedBookedSeats = bookedSeats.map(seatId => {
            const seatNumber = parseInt(seatId) - 180;
            if (seatNumber > (selectedShow.total_seats || 50)) {
              console.log(`Invalid seat number ${seatNumber} for total seats ${selectedShow.total_seats || 50}`);
              return null;
            }
            return seatNumber.toString();
          }).filter(Boolean);
          
          // Update the selected show with the correct booked seats
          setSelectedShow(prev => ({
            ...prev,
            booked_seats: mappedBookedSeats,
            available_seats: (prev.total_seats || 50) - mappedBookedSeats.length
          }));
          
          // Update the shows state with the correct booked seats
          setShows(prev => prev.map(show => 
            show.id === selectedShow.id 
              ? { 
                  ...show, 
                  booked_seats: mappedBookedSeats,
                  available_seats: Math.max(0, (show.total_seats || 50) - mappedBookedSeats.length)
                }
              : show
          ));
        } catch (refreshError) {
          console.error('Error refreshing booked seats:', refreshError);
        }
      } else {
        setError(err.response?.data?.error || err.message || 'Failed to book tickets');
      }
    }
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
    <Container>
      {movie && (
        <h2 className="mb-4">Shows for {movie.title}</h2>
      )}
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" className="mb-4">
          {successMessage}
        </Alert>
      )}

      <Row>
        {shows.map((show) => (
          <Col key={show.id} xs={12} md={6} lg={4} className="mb-4">
            <Card>
              <Card.Body>
                <Card.Title>
                  {new Date(show.show_time).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Card.Title>
                <Card.Text>
                  <strong>Time:</strong> {new Date(show.show_time).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'UTC'
                  })}
                  <br />
                  <strong>Available Seats:</strong> {show.available_seats} / {show.total_seats || 50}
                </Card.Text>
                <Button 
                  variant="primary" 
                  onClick={() => handleBookingClick(show)}
                  disabled={show.available_seats === 0}
                >
                  {show.available_seats === 0 ? 'Sold Out' : 'Book Now'}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Select Seats</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <SeatSelection
            availableSeats={availableSeats}
            selectedSeats={selectedSeats}
            onSeatSelect={handleSeatSelect}
            totalSeats={totalSeats}
            bookedSeats={selectedShow?.booked_seats || []}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleBooking}>
            Confirm Booking
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default MovieShows; 