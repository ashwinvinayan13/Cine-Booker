import { Row, Col, Button } from 'react-bootstrap';

function SeatSelection({ availableSeats, selectedSeats, onSeatSelect, totalSeats, bookedSeats = [] }) {
  const renderSeat = (seatNumber) => {
    const seatStr = seatNumber.toString();
    const seatNum = parseInt(seatNumber);
    
    // Check if the seat is booked by comparing seat numbers directly
    const isBooked = bookedSeats.includes(seatStr);
    
    const isSelected = selectedSeats.includes(seatStr);
    const isAvailable = availableSeats.includes(seatStr);

    console.log(`Seat ${seatStr}:`, {
      isBooked,
      isSelected,
      isAvailable,
      bookedSeats,
      availableSeats,
      seatNum,
      totalSeats
    });

    return (
      <Col key={seatNumber} xs={2} className="mb-2">
        <Button
          variant={
            isBooked ? 'secondary' :  // grey for booked
            isSelected ? 'primary' :   // solid blue for selected
            'outline-primary'          // outlined for available
          }
          className="w-100"
          disabled={isBooked || !isAvailable || seatNum > totalSeats}
          onClick={() => !isBooked && isAvailable && seatNum <= totalSeats && onSeatSelect(seatStr)}
          style={{ 
            cursor: isBooked || !isAvailable || seatNum > totalSeats ? 'not-allowed' : 'pointer',
            opacity: isBooked || !isAvailable || seatNum > totalSeats ? '0.7' : '1'
          }}
        >
          {seatNumber}
        </Button>
      </Col>
    );
  };

  return (
    <div className="seat-selection">
      <div className="mb-4">
        <div className="d-flex align-items-center mb-2">
          <div className="seat-legend me-3">
            <Button variant="outline-primary" className="me-2" size="sm">Available</Button>
            <Button variant="primary" className="me-2" size="sm">Selected</Button>
            <Button variant="secondary" size="sm">Booked</Button>
          </div>
        </div>
      </div>

      <Row className="justify-content-center">
        {Array.from({ length: totalSeats }, (_, i) => i + 1).map(renderSeat)}
      </Row>

      {selectedSeats.length > 0 && (
        <div className="mt-3 text-center">
          <strong>Selected Seats:</strong> {selectedSeats.join(', ')}
        </div>
      )}
    </div>
  );
}

export default SeatSelection; 