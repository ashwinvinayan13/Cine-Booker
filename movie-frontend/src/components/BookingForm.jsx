import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Form, Button, Card, Alert, Row, Col } from 'react-bootstrap';
import { showAPI } from '../services/api';

const BookingForm = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    num_seats: 1,
    total_amount: 0
  });

  useEffect(() => {
    const fetchShowDetails = async () => {
      try {
        // Fetch show details
        const showResponse = await showAPI.getOne(showId);
        setShow(showResponse.data);
        setFormData(prev => ({
          ...prev,
          total_amount: showResponse.data.price
        }));

        // Fetch booked seats
        const bookedSeatsResponse = await showAPI.getBookedSeats(showId);
        const bookedSeats = bookedSeatsResponse.data || [];
        
        // Create available seats (assuming total seats are 1-50)
        const totalSeats = Array.from({ length: 50 }, (_, i) => {
          const seatNumber = i + 1;
          return {
            id: seatNumber,
            number: seatNumber,
            isBooked: bookedSeats.includes(seatNumber)
          };
        });
        
        setAvailableSeats(totalSeats);
      } catch (err) {
        console.error('Error fetching show details:', err);
        setError('Failed to load show details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchShowDetails();

    // Set up periodic refresh of booked seats
    const refreshInterval = setInterval(async () => {
      try {
        const bookedSeatsResponse = await showAPI.getBookedSeats(showId);
        const bookedSeats = bookedSeatsResponse.data || [];
        
        setAvailableSeats(prev => prev.map(seat => ({
          ...seat,
          isBooked: bookedSeats.includes(seat.number)
        })));

        // Remove selected seats that have been booked by others
        setSelectedSeats(prev => prev.filter(seatNumber => !bookedSeats.includes(seatNumber)));
      } catch (err) {
        console.error('Error refreshing booked seats:', err);
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(refreshInterval);
  }, [showId]);

  const handleSeatSelect = (seatId) => {
    setSelectedSeats(prev => {
      const isSelected = prev.includes(seatId);
      let newSelected;
      
      if (isSelected) {
        newSelected = prev.filter(id => id !== seatId);
      } else {
        newSelected = [...prev, seatId];
      }

      // Update form data based on selected seats
      setFormData(prev => ({
        ...prev,
        num_seats: newSelected.length,
        total_amount: newSelected.length * (show?.price || 0)
      }));

      return newSelected;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat');
      return;
    }

    try {
      // First verify if seats are still available
      const bookedSeatsResponse = await showAPI.getBookedSeats(showId);
      const bookedSeats = bookedSeatsResponse.data;
      
      // Check if any selected seat is now booked
      const nowBooked = selectedSeats.filter(seat => bookedSeats.includes(seat));
      if (nowBooked.length > 0) {
        setAvailableSeats(prev => prev.map(seat => 
          seat.number === nowBooked[0] ? { ...seat, isBooked: true } : seat
        ));
        setSelectedSeats(prev => prev.filter(seat => !bookedSeats.includes(seat)));
        setError(`Seats ${nowBooked.join(', ')} have been booked by someone else. Please select different seats.`);
        return;
      }

      // Book seats one by one
      let successfulBookings = [];
      let failedBookings = [];

      for (const seatNumber of selectedSeats) {
        try {
          await showAPI.bookTicket(showId, {
            show: parseInt(showId),
            seat: seatNumber
          });
          successfulBookings.push(seatNumber);
        } catch (bookingError) {
          failedBookings.push(seatNumber);
          console.error(`Failed to book seat ${seatNumber}:`, bookingError);
          
          // If it's already booked, update the UI
          if (bookingError.response?.data?.error === "This seat is already booked") {
            setAvailableSeats(prev => prev.map(seat => 
              seat.number === seatNumber ? { ...seat, isBooked: true } : seat
            ));
          }
        }
      }

      // Handle the booking results
      if (successfulBookings.length > 0) {
        if (failedBookings.length > 0) {
          setError(`Successfully booked seats ${successfulBookings.join(', ')}. Failed to book seats ${failedBookings.join(', ')}.`);
          // Update selected seats to remove failed bookings
          setSelectedSeats(prev => prev.filter(seat => !failedBookings.includes(seat)));
        } else {
          // All bookings successful
          navigate('/bookings');
        }
      } else {
        setError('Failed to book any seats. Please try again.');
      }

    } catch (err) {
      console.error('Error in booking process:', err);
      setError(err.response?.data?.error || 'Failed to create booking. Please try again.');
      
      // Refresh seat status
      try {
        const latestBookedSeats = await showAPI.getBookedSeats(showId);
        setAvailableSeats(prev => prev.map(seat => ({
          ...seat,
          isBooked: latestBookedSeats.data.includes(seat.number)
        })));
        setSelectedSeats(prev => prev.filter(seat => !latestBookedSeats.data.includes(seat)));
      } catch (refreshError) {
        console.error('Error refreshing seats:', refreshError);
      }
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">Loading...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Container>
    );
  }

  if (!show) {
    return (
      <Container className="py-5">
        <Alert variant="warning">Show not found</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Card>
        <Card.Header>
          <h3>Book Tickets for {show.movie?.title || 'Loading...'}</h3>
        </Card.Header>
        <Card.Body>
          <div className="mb-4">
            <h5>Show Details</h5>
            <p>Date: {show.date ? new Date(show.date).toLocaleDateString() : 'Loading...'}</p>
            <p>Time: {show.date ? new Date(show.date).toLocaleTimeString() : 'Loading...'}</p>
            <p>Price per ticket: ₹{show.price || 0}</p>
          </div>

          <div className="mb-4">
            <h5>Select Seats</h5>
            <div className="seat-grid">
              <div className="mb-3">
                <div className="d-flex gap-2 align-items-center mb-2">
                  <Button variant="outline-primary" size="sm" disabled>Available</Button>
                  <Button variant="success" size="sm" disabled>Selected</Button>
                  <Button variant="danger" size="sm" disabled>Booked</Button>
                </div>
              </div>
              <Row className="g-2">
                {availableSeats.map(seat => (
                  <Col key={seat.id} xs={2}>
                    <Button
                      variant={
                        seat.isBooked ? 'danger' :
                        selectedSeats.includes(seat.number) ? 'success' : 'outline-primary'
                      }
                      disabled={seat.isBooked}
                      onClick={() => handleSeatSelect(seat.number)}
                      className="w-100"
                      style={{ 
                        cursor: seat.isBooked ? 'not-allowed' : 'pointer',
                        opacity: seat.isBooked ? '0.8' : '1'
                      }}
                    >
                      {seat.number}
                    </Button>
                  </Col>
                ))}
              </Row>
            </div>
          </div>

          <Form onSubmit={handleSubmit}>
            <div className="mb-3">
              <h5>Selected Seats: {selectedSeats.length}</h5>
              <h5>Total Amount: ₹{formData.total_amount}</h5>
            </div>

            <Button 
              variant="primary" 
              type="submit"
              disabled={selectedSeats.length === 0}
            >
              Confirm Booking
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default BookingForm; 