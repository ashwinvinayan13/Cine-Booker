import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <Container className="py-5">
      <Row className="align-items-center">
        <Col md={6}>
          <h1 className="display-4 mb-4">Welcome to Movie Booker</h1>
          <p className="lead mb-4">
            Book your favorite movies with ease. Browse through our collection of movies,
            select your preferred show time, and reserve your seats.
          </p>
          <div className="d-grid gap-2 d-md-flex">
            <Button as={Link} to="/login" variant="outline-primary" size="lg">
              Login
            </Button>
          </div>
        </Col>
        <Col md={6}>
        </Col>
      </Row>
    </Container>
  );
}

export default LandingPage; 