import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Card, CardMedia, CardContent, Typography, Alert } from '@mui/material';
import { movieAPI } from '../../services/api';

const MovieList = () => {
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMovies = async () => {
    try {
      console.log('Fetching movies...');
      const response = await movieAPI.getAll();
      console.log('Movies response:', response);
      setMovies(response.data);
      setError('');
    } catch (error) {
      console.error('Error in fetchMovies:', error);
      console.log('Detailed error info:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      setError('Failed to fetch movies. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  if (loading) {
    return (
      <Container>
        <Box sx={{ mt: 4 }}>
          <Typography>Loading movies...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {movies.map((movie) => (
            <Grid item key={movie.id} xs={12} sm={6} md={4}>
              <Card>
                {movie.poster && (
                  <CardMedia
                    component="img"
                    height="300"
                    image={movie.poster}
                    alt={movie.title}
                    sx={{ objectFit: 'cover' }}
                  />
                )}
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {movie.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Duration: {movie.duration} minutes
                  </Typography>
                  <Typography variant="body2">
                    {movie.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default MovieList; 