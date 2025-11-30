import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tab,
  Tabs
} from '@mui/material';
import {
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Place as PlaceIcon,
  TrendingUp as TrendingUpIcon,
  Lightbulb as LightbulbIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import advancedAnalyticsAPI from '../../services/api/advancedAnalyticsAPI';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AdvancedAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  const [userBehavior, setUserBehavior] = useState(null);
  const [chargingPatterns, setChargingPatterns] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [behaviorData, patternsData, recommendationsData] = await Promise.all([
        advancedAnalyticsAPI.getMyBehavior().catch(() => null),
        advancedAnalyticsAPI.getChargingPatterns().catch(() => null),
        advancedAnalyticsAPI.getMyRecommendations().catch(() => [])
      ]);

      setUserBehavior(behaviorData);
      setChargingPatterns(patternsData);
      setRecommendations(recommendationsData);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Advanced Analytics & Insights
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="My Behavior" icon={<PersonIcon />} />
        <Tab label="Charging Patterns" icon={<AssessmentIcon />} />
        <Tab label="Recommendations" icon={<LightbulbIcon />} />
      </Tabs>

      {/* User Behavior Tab */}
      {tabValue === 0 && userBehavior && (
        <>
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Bookings
                  </Typography>
                  <Typography variant="h4">{userBehavior.totalBookings}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {userBehavior.analysisPeriod}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Avg Energy Per Session
                  </Typography>
                  <Typography variant="h4">{userBehavior.avgEnergyPerSession.toFixed(2)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    kWh
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    User Category
                  </Typography>
                  <Chip
                    label={userBehavior.userCategory.toUpperCase()}
                    color="primary"
                    sx={{ fontSize: '1rem', p: 2, mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Charging Profile
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Preferred Charging Time"
                    secondary={`${userBehavior.preferredHour}:00 - ${userBehavior.preferredHour + 1}:00`}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <PlaceIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Preferred Station"
                    secondary={userBehavior.preferredStation}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <TrendingUpIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Charging Frequency"
                    secondary={`Every ${userBehavior.avgDaysBetweenBookings.toFixed(1)} days on average`}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <AssessmentIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Avg Session Duration"
                    secondary={`${userBehavior.avgSessionDuration.toFixed(0)} minutes`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </>
      )}

      {/* Charging Patterns Tab */}
      {tabValue === 1 && chargingPatterns && (
        <>
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Sessions
                  </Typography>
                  <Typography variant="h4">{chargingPatterns.totalSessions}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {chargingPatterns.analysisPeriod}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Avg Session Duration
                  </Typography>
                  <Typography variant="h4">{chargingPatterns.avgSessionDuration.toFixed(0)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    minutes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Avg Energy Per Session
                  </Typography>
                  <Typography variant="h4">{chargingPatterns.avgEnergyPerSession.toFixed(2)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    kWh
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Hourly Patterns Chart */}
          {chargingPatterns.hourlyPatterns && chargingPatterns.hourlyPatterns.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Hourly Usage Patterns
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chargingPatterns.hourlyPatterns}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Sessions', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" name="Session Count" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Weekday Patterns */}
          {chargingPatterns.weekdayPatterns && chargingPatterns.weekdayPatterns.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Weekly Usage Patterns
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chargingPatterns.weekdayPatterns}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dayOfWeek" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#82ca9d" name="Sessions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Charger Type Usage */}
          {chargingPatterns.chargerTypeUsage && chargingPatterns.chargerTypeUsage.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Charger Type Preferences
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chargingPatterns.chargerTypeUsage}
                      dataKey="count"
                      nameKey="chargerType"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {chargingPatterns.chargerTypeUsage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Recommendations Tab */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          {recommendations.length === 0 ? (
            <Grid item xs={12}>
              <Alert severity="info">No recommendations available at this time.</Alert>
            </Grid>
          ) : (
            recommendations.map((rec, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6">{rec.title}</Typography>
                      <Chip
                        label={rec.priority.toUpperCase()}
                        color={getPriorityColor(rec.priority)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {rec.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}
    </Box>
  );
};

export default AdvancedAnalytics;
