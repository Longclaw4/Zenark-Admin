import React, { useState, useRef, useEffect } from 'react';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  Switch,
  PanResponder,
  Animated,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 600;
const isLargeScreen = width >= 1024; // For laptop/desktop screens

// Netlify proxy server URL
const PROXY_SERVER = 'https://endearing-syrniki-6e8c5c.netlify.app';

// Main App Component
export default function App() {
  let [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
  });

  // Academic data state
  const [academicData, setAcademicData] = useState([
    { mainHeight: 95, compareHeight: 65, subject: 'Math' },
    { mainHeight: 50, compareHeight: 95, subject: 'Science' },
    { mainHeight: 85, compareHeight: 90, subject: 'English' },
    { mainHeight: 75, compareHeight: 80, subject: 'History' }
  ]);
  const [newSubject, setNewSubject] = useState('');
  const [activeTab, setActiveTab] = useState('settings');
  const [selectedClass, setSelectedClass] = useState('overall');
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [updateCounter, setUpdateCounter] = useState(0);
  const [studentIdentifier, setStudentIdentifier] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedTeacherSubject, setSelectedTeacherSubject] = useState('maths');
  const [subjectToRemove, setSubjectToRemove] = useState('');
  const [subjectToAdd, setSubjectToAdd] = useState('');
  const [cohortA, setCohortA] = useState('grade10');
  const [cohortB, setCohortB] = useState('overall');
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // Check localStorage for saved login state
    const savedLoginState = localStorage.getItem('isLoggedIn');
    return savedLoginState === 'true';
  });
  const [dashboardData, setDashboardData] = useState(null);
  const [classData, setClassData] = useState(null);
  const [freshClassData, setFreshClassData] = useState(null);
  const [freshSchoolData, setFreshSchoolData] = useState(null);
  const [currentClassName, setCurrentClassName] = useState('MAD-1'); // Store the class name we're fetching data for
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupSchool, setSignupSchool] = useState('');

  // ZPI (Zenark Productivity Index) states
  const [studentZPI, setStudentZPI] = useState(null); // Individual student ZPI
  const [classAverageZPI, setClassAverageZPI] = useState(75); // Class average ZPI (random default)

  // Helper function to generate random ZPI score with breakdown
  const generateRandomZPI = () => {
    const performance = Math.floor(Math.random() * 41) + 60; // 60-100
    const effort = Math.floor(Math.random() * 41) + 60; // 60-100
    const readiness = Math.floor(Math.random() * 41) + 60; // 60-100

    // Calculate weighted ZPI: P(50%) + E(30%) + R(20%)
    const zpi = Math.round(performance * 0.5 + effort * 0.3 + readiness * 0.2);

    return {
      zpi,
      performance,
      effort,
      readiness
    };
  };

  // Helper function to get ZPI label and color
  const getZPILabel = (score) => {
    if (score >= 90) return { label: 'Exceptional', color: '#4CAF50' };
    if (score >= 75) return { label: 'Stable', color: '#2196F3' };
    if (score >= 50) return { label: 'At-Risk', color: '#FF9800' };
    return { label: 'Critical', color: '#F44336' };
  };


  const [userProfile, setUserProfile] = useState(() => {
    // Get user profile from localStorage or use default
    const savedProfile = localStorage.getItem('userProfile');
    return savedProfile ? JSON.parse(savedProfile) : {
      name: 'Principal Sharma',
      email: 'principal.sharma@gvh.edu'
    };
  });

  const subjectsToAdd = [
    { id: 'physics', label: 'Physics' },
    { id: 'chemistry', label: 'Chemistry' },
    { id: 'biology', label: 'Biology' },
    { id: 'geography', label: 'Geography' },
  ];

  const teacherSubjects = [
    { id: 'maths', label: 'Maths', teacher: 'Ms. Anjali Sharma' },
    { id: 'science', label: 'Science', teacher: 'Mr. Rajesh Kumar' },
    { id: 'english', label: 'English', teacher: 'Ms. Priya Mehta' },
    { id: 'hindi', label: 'Hindi', teacher: 'Ms. Sunita Patel' },
    { id: 'sst', label: 'SST', teacher: 'Mr. Amit Singh' },
    { id: 'social', label: 'Social', teacher: 'Mr. Vikram Joshi' }
  ];
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Function to handle search
  const handleSearch = () => {
    if (!studentIdentifier) return;

    // Add @zenark.in if it's a numeric ID
    const formattedIdentifier = /^\d+$/.test(studentIdentifier)
      ? `${studentIdentifier}@zenark.in`
      : studentIdentifier;

    setHasSearched(true);
    fetchDashboardData(formattedIdentifier);
  };


  // Effect to fetch fresh class data on component mount
  useEffect(() => {
    const getClassData = async () => {
      try {
        // Skip data fetching for Team Academy (no data available)
        const isTeamAcademy = userProfile.school === 'THE TEAM ACADEMY DAVANAGERE' ||
          userProfile.school === 'Team Academy' ||
          userProfile.school?.includes('TEAM ACADEMY');

        if (isTeamAcademy) {
          console.log('Team Academy user - no data available, skipping fetch');
          setFreshClassData(null);
          setFreshSchoolData(null);
          return;
        }

        // Get the class name from user profile, fallback to MAD-1
        const className = userProfile.currentClass || userProfile.class || 'MAD-1';
        setCurrentClassName(className); // Store it so we can display it
        console.log(`Fetching fresh class data for: ${className}`);


        const response = await axios.get(`${PROXY_SERVER}/api/class/${className}`);
        console.log('Class data response:', response.data);

        // Check if we have data in response.data or response.data.data
        const responseData = response.data.data || response.data;

        if (!responseData) {
          console.error('No data found in response');
          return;
        }

        console.log('Mental wellness data:', responseData.mental_wellness);
        console.log('Subjects graph data:', responseData.subjects_graph);
        console.log('Scores data:', responseData.scores);

        if (responseData.scores) {
          console.log('Scores keys:', Object.keys(responseData.scores));
          console.log('Physics score data:', responseData.scores.Physics);
          console.log('Chemistry score data:', responseData.scores.Chemistry);
          console.log('Botany score data:', responseData.scores.Botany);
          console.log('Zoology score data:', responseData.scores.Zoology);
        }

        setFreshClassData(responseData);
        setUpdateCounter(prev => prev + 1);
        console.log('Class data updated successfully');

        // Also fetch school data for AHI
        if (userProfile.school) {
          try {
            // Map frontend school names to backend school names
            const schoolNameMapping = {
              'Sir MV School': 'school',
              'THE TEAM ACADEMY DAVANAGERE': 'THE TEAM ACADEMY DAVANAGERE'
            };

            const backendSchoolName = schoolNameMapping[userProfile.school] || userProfile.school;
            console.log(`Fetching school data for: ${backendSchoolName} (frontend: ${userProfile.school})`);

            const schoolResponse = await axios.get(`${PROXY_SERVER}/api/school/${backendSchoolName}`);
            const schoolData = schoolResponse.data.data || schoolResponse.data;
            setFreshSchoolData(schoolData);
            console.log('School data response:', schoolData);
          } catch (schoolError) {
            console.error('Error fetching school data:', schoolError);
          }
        }
      } catch (error) {
        console.error('Error fetching class data:', error);
        if (Alert) {
          Alert.alert(
            'Error',
            error.response?.data?.error || 'Failed to fetch class data. Please try again.'
          );
        }
      }
    };
    getClassData();
  }, [userProfile.school]); // Re-fetch when user logs in or school changes

  // Effect to update cohort data when selections change
  useEffect(() => {
    // Simulate fetching new data by re-randomizing heights
    const updatedData = academicData.map(item => ({
      ...item,
      mainHeight: Math.floor(Math.random() * 66) + 30,
      compareHeight: Math.floor(Math.random() * 66) + 30,
    }));
    setAcademicData(updatedData);
  }, [cohortA, cohortB]);

  // Function to add a new subject
  const addNewSubject = () => {
    if (!subjectToAdd) return;

    const subjectLabel = subjectsToAdd.find(s => s.id === subjectToAdd)?.label;
    if (!subjectLabel) return;

    // Check for duplicates
    if (academicData.some(item => item.subject.toLowerCase() === subjectLabel.toLowerCase())) {
      setSubjectToAdd(''); // Clear selection
      return;
    }

    const newMainHeight = Math.floor(Math.random() * 66) + 30;
    const newCompareHeight = Math.floor(Math.random() * 66) + 30;

    setAcademicData(prevData => [
      ...prevData,
      {
        subject: subjectLabel,
        mainHeight: newMainHeight,
        compareHeight: newCompareHeight
      }
    ]);
    setSubjectToAdd(''); // Clear selection
    setUpdateCounter(prev => prev + 1);
  };

  // Function to remove the selected subject
  const removeSelectedSubject = () => {
    if (subjectToRemove) {
      setAcademicData(prevData => prevData.filter(item => item.subject !== subjectToRemove));
      setSubjectToRemove(''); // Reset selection
      setUpdateCounter(prev => prev + 1); // Force re-render
    }
  };

  // Handle keyboard submit
  const handleSubmit = () => {
    addNewSubject();
  };

  // Function to fetch dashboard data
  const fetchClassData = async (className) => {
    if (!className) return;
    try {
      console.log('Fetching data for class:', className);
      const response = await axios.get(`${CORS_PROXY}https://service.zenark.in/zenark/api/dashboard/class/${className}`);
      console.log('API Response:', response.data);
      console.log('Data to be set:', response.data.data);
      setClassData(response.data.data);
    } catch (error) {
      console.error('Error fetching class data:', error);
    }
  };

  const fetchDashboardData = async (identifier) => {
    // Block student search for Team Academy (no data available)
    const isTeamAcademy = userProfile.school === 'THE TEAM ACADEMY DAVANAGERE' ||
      userProfile.school === 'Team Academy' ||
      userProfile.school?.includes('TEAM ACADEMY');

    if (isTeamAcademy) {
      if (Alert) {
        Alert.alert('No Data', 'Student data is not available for this school yet.');
      } else {
        alert('Student data is not available for this school yet.');
      }
      return;
    }

    try {
      console.log('Fetching data for:', identifier);
      const response = await axios.get(
        `${PROXY_SERVER}/api/student/${encodeURIComponent(identifier)}`
      );

      console.log('API Response:', response.data);
      setDashboardData(response.data.data || response.data);

      // Generate random ZPI for this student
      const zpiData = generateRandomZPI();
      setStudentZPI(zpiData);
      console.log('Generated ZPI for student:', zpiData);
    } catch (error) {
      console.error('Error fetching student data:', error);
      if (Alert) {
        Alert.alert(
          'Error',
          error.response?.data?.error || 'Failed to fetch student data. Please check the ID and try again.'
        );
      }
    }
    if (!identifier) return; // Don't fetch if identifier is empty

    try {
      console.log('Fetching data for student:', identifier);
      const response = await axios.get(`${PROXY_SERVER}/api/student/${encodeURIComponent(identifier)}`);
      console.log('API Response:', response.data);
      setDashboardData(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching student data:', error);
      if (Alert) {
        Alert.alert(
          'Error',
          error.response?.data?.error || 'Failed to fetch student data. Please check the identifier and try again.'
        );
      }
    }
  };

  // Tab order for swiping - must match the order of pages
  const tabs = ['settings', 'home', 'reports', 'settingsPage'];

  // Map tab names to their render functions
  const renderTab = (tabName) => {
    switch (tabName) {
      case 'settings':
        return renderSettings();
      case 'home':
        return renderHome();
      case 'reports':
        return renderReports();
      case 'settingsPage':
        return renderSettingsPage();
      default:
        return renderHome();
    }
  };

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes (not vertical scrolling)
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        const hasMovedEnough = Math.abs(gestureState.dx) > 10;
        return isHorizontal && hasMovedEnough;
      },
      onPanResponderGrant: () => {
        // User started swiping
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (evt, gestureState) => {
        // Visual feedback during swipe - optional
        if (Math.abs(gestureState.dx) > 5) {
          slideAnim.setValue(gestureState.dx * 0.5);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const currentIndex = tabs.indexOf(activeTab);
        const swipeThreshold = 50; // Minimum distance to trigger swipe
        const velocityThreshold = 0.5; // Minimum velocity to trigger swipe

        // Reset animation
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          speed: 20,
          bounciness: 8,
        }).start();

        // Check if swipe meets threshold
        const isSwipeRight = gestureState.dx > swipeThreshold || gestureState.vx > velocityThreshold;
        const isSwipeLeft = gestureState.dx < -swipeThreshold || gestureState.vx < -velocityThreshold;

        // Handle swipe right (go to previous page)
        if (isSwipeRight && currentIndex > 0) {
          setActiveTab(tabs[currentIndex - 1]);
          return;
        }

        // Handle swipe left (go to next page)
        if (isSwipeLeft && currentIndex < tabs.length - 1) {
          setActiveTab(tabs[currentIndex + 1]);
        }
      },
    })
  ).current;

  // Class selection options
  const classOptions = [
    { id: 'overall', label: 'Overall School' },
    ...Array.from({ length: 7 }, (_, i) => ({
      id: `grade${i + 4}`,
      label: `Grade ${i + 4}`,
    })),
  ];

  // Render Home Screen
  const renderHome = () => (
    <ScrollView style={styles.pageContainer} contentContainerStyle={styles.pageContent}>
      <View style={styles.gridContainer}>
        {/* Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Section</Text>
          <Text style={styles.cardSubtitle}>Current Section:</Text>
          <View style={styles.classDisplayContainer}>
            <Text style={styles.classDisplayText}>
              {currentClassName}
            </Text>
          </View>
        </View>

        {/* Academic Performance */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Academic Performance</Text>
          <View style={[styles.legendContainer, { flexDirection: 'row' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 30 }}>
              <View style={{ width: 12, height: 12, backgroundColor: '#5e3a8f', marginRight: 6, borderRadius: 2 }} />
              <Text style={styles.comparisonLabel}>Class MAD-1</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 12, height: 12, backgroundColor: '#b19cd9', marginRight: 6, borderRadius: 2 }} />
              <Text style={styles.comparisonLabel}>School Average</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={styles.scrollContent}>
            <View style={styles.barChartContainer}>
              <View style={styles.chartContent}>
                {(() => {
                  console.log('ACADEMIC: freshClassData:', freshClassData);
                  console.log('ACADEMIC: scores:', freshClassData?.scores);
                  if (freshClassData && freshClassData.scores) {
                    const subjects = Object.keys(freshClassData.scores);
                    return subjects.map((subject, index) => {
                      const classScore = freshClassData.scores[subject].class || '0';
                      const schoolScore = freshClassData.scores[subject].school || '0';
                      // Cap the height at 100% for display, but show actual score
                      const displayHeight = Math.min(parseInt(classScore), 100);
                      return (
                        <View key={`academic-${subject}-${index}`} style={[styles.barGroup, { marginRight: 5 }]}>
                          <View style={styles.barsContainer}>
                            <View style={styles.barWrapper}>
                              <View style={[styles.bar, { height: `${displayHeight}%`, backgroundColor: '#5e3a8f' }]}><Text style={styles.barLabel}>{classScore}</Text></View>
                            </View>
                            <View style={[styles.barWrapper, { marginLeft: 4 }]}>
                              <View style={[styles.bar, { height: '0%', backgroundColor: '#b19cd9' }]}><Text style={styles.barLabel}>-</Text></View>
                            </View>
                          </View>
                          <Text style={[styles.barSubject, { minWidth: 60 }]}>{subject}</Text>
                        </View>
                      );
                    });
                  } else {
                    return <Text>Select a class to see the subjects graph.</Text>;
                  }
                })()}
              </View>
            </View>
          </ScrollView>
          <View style={styles.subjectControlsContainer}>
            <View style={styles.addSubjectRow}>
              <View style={{ flex: 1, width: '100%' }}>
                <Text style={styles.pickerLabel}>Add a subject:</Text>
                <View style={styles.subjectSelectorContainer}>
                  {subjectsToAdd.map(item => (
                    <TouchableOpacity key={`add-${item.id}`} style={[styles.subjectButton, subjectToAdd === item.id && styles.subjectButtonActive]} onPress={() => setSubjectToAdd(item.id)}><Text style={[styles.subjectButtonText, subjectToAdd === item.id && styles.subjectButtonTextActive]}>{item.label}</Text></TouchableOpacity>
                  ))}
                </View>
              </View>
              <TouchableOpacity style={[styles.addButton, !subjectToAdd && styles.disabledButton, { marginTop: 10 }]} onPress={addNewSubject} disabled={!subjectToAdd}><Text style={styles.addButtonText}>Add</Text></TouchableOpacity>
            </View>
            <View style={styles.removeSubjectRow}>
              <View style={{ flex: 1, width: '100%' }}>
                <Text style={styles.pickerLabel}>Remove a subject:</Text>
                <View style={styles.subjectSelectorContainer}>
                  {academicData.map(item => (
                    <TouchableOpacity key={`remove-${item.subject}`} style={[styles.subjectButton, subjectToRemove === item.subject && styles.subjectButtonActive]} onPress={() => setSubjectToRemove(item.subject)}><Text style={[styles.subjectButtonText, subjectToRemove === item.subject && styles.subjectButtonTextActive]}>{item.subject}</Text></TouchableOpacity>
                  ))}
                </View>
              </View>
              <TouchableOpacity style={[styles.addButton, styles.removeButton, !subjectToRemove && styles.disabledButton, { marginTop: 10 }]} onPress={removeSelectedSubject} disabled={!subjectToRemove}><Text style={styles.addButtonText}>Remove</Text></TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Cohort Comparison */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cohort Comparison</Text>
          <View style={styles.productivityGaugeContainer}>
            <Text style={styles.notAvailableText}>Not Available</Text>
          </View>
        </View>


        {/* Academic Health Index */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Academic Health Index</Text>
          <View style={styles.circularGaugeContainer}>
            {freshSchoolData && freshSchoolData.ahi !== undefined ? (
              <>
                <View style={[styles.circularGauge, { width: 180, height: 180 }]}>
                  <Text style={[styles.gaugeNumber, { fontSize: 42 }]}>{freshSchoolData.ahi}</Text>
                </View>
                <Text style={[styles.gaugeSubtext, { fontSize: 16, marginTop: 15 }]}>
                  {freshSchoolData.ahi >= 70 ? 'Healthy' : freshSchoolData.ahi >= 50 ? 'Needs Attention' : 'Critical'}
                </Text>
              </>
            ) : (
              <Text style={styles.notAvailableText}>Not Available</Text>
            )}
          </View>
        </View>

        {/* Mental Wellness Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mental Wellness Overview</Text>
          <View style={styles.wellnessContainer}>
            {(() => {
              console.log('RENDER: freshClassData:', freshClassData);
              console.log('RENDER: mental_wellness:', freshClassData?.mental_wellness);

              if (freshClassData) {
                let score = null;

                // Handle different data structures for mental_wellness
                if (freshClassData.mental_wellness) {
                  if (Array.isArray(freshClassData.mental_wellness) && freshClassData.mental_wellness.length > 0) {
                    // If it's an array, take the first element
                    score = Math.round(freshClassData.mental_wellness[0]);
                  } else if (typeof freshClassData.mental_wellness === 'number') {
                    // If it's a direct number
                    score = Math.round(freshClassData.mental_wellness);
                  } else if (typeof freshClassData.mental_wellness === 'object' && freshClassData.mental_wellness.score) {
                    // If it's an object with a score property
                    score = Math.round(freshClassData.mental_wellness.score);
                  }
                }

                if (score !== null && !isNaN(score)) {
                  const getWellnessColor = (score) => {
                    if (score >= 70) return '#4CAF50'; // Green - Good
                    if (score >= 60) return '#FFC107'; // Yellow - Average
                    return '#F44336'; // Red - Needs Attention
                  };
                  const getWellnessStatus = (score) => {
                    if (score >= 70) return 'Good';
                    if (score >= 60) return 'Average';
                    return 'Needs Attention';
                  };

                  return (
                    <View>
                      <View style={styles.wellnessScoreContainer}>
                        <Text style={[styles.wellnessScore, { color: getWellnessColor(score) }]}>
                          {score}
                        </Text>
                        <Text style={styles.wellnessScoreLabel}>Wellness Score</Text>
                        <View style={[styles.wellnessStatusBadge, { backgroundColor: getWellnessColor(score) }]}>
                          <Text style={styles.wellnessStatusText}>{getWellnessStatus(score)}</Text>
                        </View>
                      </View>
                      <View style={styles.wellnessProgressBar}>
                        <View style={[styles.wellnessProgressFill, { width: `${score}%`, backgroundColor: getWellnessColor(score) }]} />
                      </View>
                    </View>
                  );
                } else {
                  return (
                    <View style={styles.lineChartPlaceholder}>
                      <Text style={styles.chartLabel}>No mental wellness data available</Text>
                      <Text style={[styles.chartLabel, { fontSize: 12, color: '#999', marginTop: 5 }]}>
                        Data format: {typeof freshClassData.mental_wellness}
                      </Text>
                    </View>
                  );
                }
              } else {
                return (
                  <View style={styles.lineChartPlaceholder}>
                    <Text style={styles.chartLabel}>Loading mental wellness data...</Text>
                  </View>
                );
              }
            })()}
          </View>
        </View>

        {/* Class Productivity (ZPI) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Class Productivity</Text>
          <Text style={styles.cardSubtitle}>Zenark Productivity Index (ZPI)</Text>

          {(() => {
            const { label, color } = getZPILabel(classAverageZPI);
            return (
              <View style={styles.zpiContainer}>
                <View style={styles.zpiScoreContainer}>
                  <Text style={[styles.zpiScore, { color }]}>{classAverageZPI}</Text>
                  <Text style={styles.zpiMaxScore}>/100</Text>
                </View>
                <View style={[styles.zpiLabelBadge, { backgroundColor: color }]}>
                  <Text style={styles.zpiLabelText}>{label}</Text>
                </View>

                <View style={styles.zpiBreakdown}>
                  <Text style={styles.zpiBreakdownTitle}>Class Average Breakdown:</Text>
                  <View style={styles.zpiBreakdownItem}>
                    <Text style={styles.zpiBreakdownLabel}>Performance (50%)</Text>
                    <View style={styles.zpiProgressBar}>
                      <View style={[styles.zpiProgressFill, { width: '80%', backgroundColor: '#4CAF50' }]} />
                    </View>
                    <Text style={styles.zpiBreakdownValue}>80</Text>
                  </View>
                  <View style={styles.zpiBreakdownItem}>
                    <Text style={styles.zpiBreakdownLabel}>Effort (30%)</Text>
                    <View style={styles.zpiProgressBar}>
                      <View style={[styles.zpiProgressFill, { width: '70%', backgroundColor: '#2196F3' }]} />
                    </View>
                    <Text style={styles.zpiBreakdownValue}>70</Text>
                  </View>
                  <View style={styles.zpiBreakdownItem}>
                    <Text style={styles.zpiBreakdownLabel}>Readiness (20%)</Text>
                    <View style={styles.zpiProgressBar}>
                      <View style={[styles.zpiProgressFill, { width: '75%', backgroundColor: '#FF9800' }]} />
                    </View>
                    <Text style={styles.zpiBreakdownValue}>75</Text>
                  </View>
                </View>
              </View>
            );
          })()}
        </View>

        {/* Principal's Query Engine */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Principal's Query Engine</Text>
          <View style={styles.productivityGaugeContainer}>
            <Text style={styles.notAvailableText}>Not Available</Text>
          </View>
        </View>

        {/* Top 5 Concerns */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top 5 Concerns</Text>
          <View>
            {freshClassData ? (
              freshClassData.weaknesses ? (
                freshClassData.weaknesses.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.purpleBullet}>•</Text>
                    <Text style={styles.listText}>{item.text}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.listItem}>
                  <Text style={styles.purpleBullet}>•</Text>
                  <Text style={styles.listText}>No weaknesses found</Text>
                </View>
              )
            ) : (
              <View style={styles.listItem}>
                <Text style={styles.purpleBullet}>•</Text>
                <Text style={styles.listText}>Loading...</Text>
              </View>
            )}
          </View>
        </View>

        {/* Top 5 Strengths */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top 5 Strengths</Text>
          <View>
            {freshClassData ? (
              freshClassData.strengths ? (
                freshClassData.strengths.map((strength, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.purpleBullet}>•</Text>
                    <Text style={styles.listText}>{strength.text}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.listItem}>
                  <Text style={styles.purpleBullet}>•</Text>
                  <Text style={styles.listText}>No strengths found</Text>
                </View>
              )
            ) : (
              <View style={styles.listItem}>
                <Text style={styles.purpleBullet}>•</Text>
                <Text style={styles.listText}>Loading...</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // Render Reports Screen
  const renderReports = () => (
    <ScrollView style={styles.pageContainer} contentContainerStyle={styles.pageContent}>
      <View style={styles.singleColumnContainer}>

        {/* Student Name/ID Input */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Student Name/ID</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={studentIdentifier}
              onChangeText={setStudentIdentifier}
              placeholder="Student ID"
              placeholderTextColor="#999"
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchIcon}>🔍</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mental Wellness Trend */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mental Wellness Trend</Text>
          {dashboardData ? (
            dashboardData.mental_wellness && dashboardData.mental_wellness.length > 0 ? (
              (() => {
                const scores = Array.isArray(dashboardData.mental_wellness)
                  ? dashboardData.mental_wellness
                  : [dashboardData.mental_wellness];
                const average = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                const getWellnessColor = (score) => {
                  if (score >= 80) return '#4CAF50';
                  if (score >= 60) return '#FF9800';
                  if (score >= 40) return '#FF5722';
                  return '#F44336';
                };
                const getWellnessStatus = (score) => {
                  if (score >= 80) return 'Excellent';
                  if (score >= 60) return 'Good';
                  if (score >= 40) return 'Fair';
                  return 'Needs Attention';
                };

                return (
                  <View>
                    {/* Line Graph */}
                    <View style={styles.lineGraphContainer}>
                      <View style={styles.lineGraphChart}>
                        {/* Y-axis labels */}
                        <View style={styles.yAxisLabels}>
                          <Text style={styles.yAxisLabel}>100</Text>
                          <Text style={styles.yAxisLabel}>75</Text>
                          <Text style={styles.yAxisLabel}>50</Text>
                          <Text style={styles.yAxisLabel}>25</Text>
                          <Text style={styles.yAxisLabel}>0</Text>
                        </View>

                        {/* Graph area */}
                        <View style={styles.graphArea}>
                          {/* Grid lines */}
                          {[0, 25, 50, 75, 100].map((value) => (
                            <View key={value} style={[styles.gridLine, { bottom: `${value}%` }]} />
                          ))}

                          {/* Solid continuous line */}
                          <View style={styles.lineGraph}>
                            {/* Create a solid line using overlapping rectangles that merge */}
                            <View style={styles.smoothLinePath}>
                              {scores.map((score, index) => {
                                if (index >= scores.length - 1) return null;

                                // Adjust positioning to show ongoing trend (leave space for future scores)
                                const x1 = (index / (scores.length + 1)) * 100; // +1 for future space
                                const y1 = score;
                                const x2 = ((index + 1) / (scores.length + 1)) * 100; // +1 for future space
                                const y2 = scores[index + 1];

                                // Create many small rectangles that completely overlap
                                const segments = 50;
                                return Array.from({ length: segments }, (_, i) => {
                                  const progress = i / segments;
                                  const nextProgress = (i + 1) / segments;

                                  const currentX = x1 + (x2 - x1) * progress;
                                  const currentY = y1 + (y2 - y1) * progress;
                                  const nextX = x1 + (x2 - x1) * nextProgress;
                                  const nextY = y1 + (y2 - y1) * nextProgress;

                                  const segmentX = currentX;
                                  const segmentY = Math.min(currentY, nextY);
                                  const segmentWidth = (nextX - currentX) * 2; // 100% overlap for solid line
                                  const segmentHeight = Math.abs(nextY - currentY) + 4; // Thicker for solid appearance

                                  return (
                                    <View
                                      key={`solid-${index}-${i}`}
                                      style={[
                                        styles.solidLine,
                                        {
                                          left: `${segmentX}%`,
                                          bottom: `${segmentY - 2}%`,
                                          width: `${segmentWidth}%`,
                                          height: `${segmentHeight}%`,
                                          backgroundColor: '#10b981'
                                        }
                                      ]}
                                    />
                                  );
                                });
                              })}
                            </View>

                            {/* Data points */}
                            {scores.map((score, index) => {
                              // Adjust positioning to show ongoing trend (leave space for future scores)
                              const xPosition = (index / (scores.length + 1)) * 100; // +1 for future space
                              const yPosition = score;

                              return (
                                <View
                                  key={`point-${index}`}
                                  style={[
                                    styles.dataPoint,
                                    {
                                      left: `${xPosition}%`,
                                      bottom: `${yPosition}%`,
                                      backgroundColor: getWellnessColor(score),
                                      zIndex: 10
                                    }
                                  ]}
                                >
                                  <Text style={styles.dataPointLabel}>{score}</Text>
                                </View>
                              );
                            })}
                          </View>

                        </View>
                      </View>
                    </View>

                    {/* Average Score Display */}
                    <View style={styles.averageScoreContainer}>
                      <Text style={styles.averageLabel}>Average Wellness Score</Text>
                      <View style={styles.averageScoreDisplay}>
                        <Text style={[styles.averageScore, { color: getWellnessColor(average) }]}>
                          {average}
                        </Text>
                        <View style={[styles.averageStatusBadge, { backgroundColor: getWellnessColor(average) }]}>
                          <Text style={styles.averageStatusText}>{getWellnessStatus(average)}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })()
            ) : (
              <View style={styles.lineChartPlaceholder}>
                <Text style={styles.chartLabel}>No mental wellness data for this student</Text>
              </View>
            )
          ) : (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={styles.chartLabel}>Enter a student email to see data</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Principal's Query Engine</Text>
          <View style={styles.productivityGaugeContainer}>
            <Text style={styles.notAvailableText}>Not Available</Text>
          </View>
        </View>

        {/* Top 5 Concerns */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top 5 Concerns</Text>
          <View>
            {dashboardData && dashboardData.weaknesses ? (
              dashboardData.weaknesses.map((concern, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.redBullet}>•</Text>
                  <Text style={styles.listText}>{typeof concern === 'object' ? concern.text || concern : concern}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No concerns data available</Text>
            )}
          </View>
        </View>

        {/* Top 5 Strengths */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top 5 Strengths</Text>
          <View>
            {dashboardData && dashboardData.strengths ? (
              dashboardData.strengths.map((strength, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.purpleBullet}>•</Text>
                  <Text style={styles.listText}>{typeof strength === 'object' ? strength.text || strength : strength}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No strengths data available</Text>
            )}
          </View>
        </View>

        {/* Academic Productivity Index (ZPI) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Academic Productivity Index</Text>
          <Text style={styles.cardSubtitle}>Zenark Productivity Index (ZPI)</Text>

          {studentZPI ? (
            (() => {
              const { label, color } = getZPILabel(studentZPI.zpi);
              return (
                <View style={styles.zpiContainer}>
                  <View style={styles.zpiScoreContainer}>
                    <Text style={[styles.zpiScore, { color }]}>{studentZPI.zpi}</Text>
                    <Text style={styles.zpiMaxScore}>/100</Text>
                  </View>
                  <View style={[styles.zpiLabelBadge, { backgroundColor: color }]}>
                    <Text style={styles.zpiLabelText}>{label}</Text>
                  </View>

                  <View style={styles.zpiBreakdown}>
                    <Text style={styles.zpiBreakdownTitle}>Individual Breakdown:</Text>
                    <View style={styles.zpiBreakdownItem}>
                      <Text style={styles.zpiBreakdownLabel}>Performance (50%)</Text>
                      <View style={styles.zpiProgressBar}>
                        <View style={[styles.zpiProgressFill, { width: `${studentZPI.performance}%`, backgroundColor: '#4CAF50' }]} />
                      </View>
                      <Text style={styles.zpiBreakdownValue}>{studentZPI.performance}</Text>
                    </View>
                    <View style={styles.zpiBreakdownItem}>
                      <Text style={styles.zpiBreakdownLabel}>Effort (30%)</Text>
                      <View style={styles.zpiProgressBar}>
                        <View style={[styles.zpiProgressFill, { width: `${studentZPI.effort}%`, backgroundColor: '#2196F3' }]} />
                      </View>
                      <Text style={styles.zpiBreakdownValue}>{studentZPI.effort}</Text>
                    </View>
                    <View style={styles.zpiBreakdownItem}>
                      <Text style={styles.zpiBreakdownLabel}>Readiness (20%)</Text>
                      <View style={styles.zpiProgressBar}>
                        <View style={[styles.zpiProgressFill, { width: `${studentZPI.readiness}%`, backgroundColor: '#FF9800' }]} />
                      </View>
                      <Text style={styles.zpiBreakdownValue}>{studentZPI.readiness}</Text>
                    </View>
                  </View>

                  <View style={styles.zpiNote}>
                    <Text style={styles.zpiNoteText}>
                      💡 ZPI = Performance (50%) + Effort (30%) + Readiness (20%)
                    </Text>
                  </View>
                </View>
              );
            })()
          ) : (
            <View style={styles.productivityGaugeContainer}>
              <Text style={styles.chartLabel}>Enter a student ID to see their productivity index</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );

  // Render Settings Screen
  const renderSettings = () => (
    <ScrollView style={styles.pageContainer} contentContainerStyle={styles.pageContent}>
      <View style={styles.gridContainer}>
        {/* School's Health Index */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>School's Health Index</Text>
          <View style={styles.productivityGaugeContainer}>
            <Text style={styles.notAvailableText}>Not Available</Text>
          </View>
        </View>

        {/* School Growth Index */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>School Growth Index</Text>
          <View style={styles.productivityGaugeContainer}>
            <Text style={styles.notAvailableText}>Not Available</Text>
          </View>
        </View>

        {/* Teacher Performance Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Teacher Performance Overview</Text>
          <View style={styles.productivityGaugeContainer}>
            <Text style={styles.notAvailableText}>Not Available</Text>
          </View>
        </View>

        {/* Best Students */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Best Students (Academics & Wellness)</Text>
          <View style={styles.productivityGaugeContainer}>
            <Text style={styles.notAvailableText}>Not Available</Text>
          </View>
        </View>

        {/* Teacher Insights */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Teacher Insights</Text>
          <View style={styles.productivityGaugeContainer}>
            <Text style={styles.notAvailableText}>Not Available</Text>
          </View>
        </View>

        {/* Resource Allocation */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resource Allocation</Text>
          <View style={styles.productivityGaugeContainer}>
            <Text style={styles.notAvailableText}>Not Available</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // Handle Login
  const handleLogin = async () => {
    if (!email || !password) {
      setLoginError('Please enter both email and password');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await axios.post(`${PROXY_SERVER}/api/auth/signin`, {
        email: email.toLowerCase(),
        password
      });

      console.log('Login response:', response.data);

      if (response.data) {
        // Backend returns all user data including school and class
        const { token, ...userData } = response.data;

        // Set initial selected class
        if (userData.currentClass) {
          setSelectedClass(userData.currentClass);
        } else if (userData.classes && userData.classes.length > 0) {
          setSelectedClass(userData.classes[0]);
        }

        localStorage.setItem('isLoggedIn', 'true');
        if (token) localStorage.setItem('authToken', token);
        localStorage.setItem('userProfile', JSON.stringify(userData));

        setIsLoggedIn(true);
        setUserProfile(userData);
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(error.response?.data?.message || 'Login failed. Please check your credentials.');
      if (Platform.OS !== 'web') {
        if (Alert) Alert.alert('Login Failed', error.response?.data?.message || 'Please check your credentials.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Signup
  const handleSignup = async () => {
    if (!signupName || !signupEmail || !signupPassword || !signupConfirmPassword || !signupSchool) {
      setLoginError('Please fill in all fields');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setLoginError('Passwords do not match');
      return;
    }

    setIsLoggingIn(true); // Reuse loading state
    setLoginError('');

    try {
      const response = await axios.post(`${PROXY_SERVER}/api/auth/signup`, {
        name: signupName,
        email: signupEmail.toLowerCase(),
        password: signupPassword,
        school: signupSchool,
        roles: ['admin']
      });

      console.log('Signup response:', response.data);

      if (response.data) {
        if (Platform.OS !== 'web') {
          if (Alert) Alert.alert('Success', 'Account created successfully! Please log in.');
        } else {
          alert('Account created successfully! Please log in.');
        }
        setIsSigningUp(false); // Switch back to login
        setLoginError('');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setLoginError(error.response?.data?.message || 'Signup failed. Please try again.');
      if (Platform.OS !== 'web') {
        if (Alert) Alert.alert('Signup Failed', error.response?.data?.message || 'Please try again.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Render Login Screen
  const renderLogin = () => (
    <LinearGradient
      colors={['#fdeeff', '#f0e6f5', '#e6dcf0']}
      style={styles.loginContainer}
    >
      <View style={styles.loginContent}>
        <Text style={styles.loginTitle}>Your mindful leadership begins here.</Text>
        <Text style={styles.loginBrand}>ZEN ARK</Text>
        <TextInput
          style={styles.loginInput}
          placeholder="Email"
          placeholderTextColor="#999"
          keyboardType="email-address"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setLoginError('');
          }}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.loginInput}
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setLoginError('');
          }}
        />
        {loginError ? <Text style={{ color: 'red', marginBottom: 10, textAlign: 'center' }}>{loginError}</Text> : null}

        <TouchableOpacity
          style={[styles.loginButton, isLoggingIn && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={isLoggingIn}
        >
          <Text style={styles.loginButtonText}>{isLoggingIn ? 'Logging in...' : 'Log in'}</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.loginLink}>Forgot password?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsSigningUp(true)}>
          <Text style={styles.loginLink}>Create an account</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  // Render Signup Screen
  const renderSignup = () => (
    <LinearGradient
      colors={['#fdeeff', '#f0e6f5', '#e6dcf0']}
      style={styles.loginContainer}
    >
      <View style={styles.loginContent}>
        <Text style={styles.loginTitle}>Join Zenark today.</Text>
        <Text style={styles.loginBrand}>ZEN ARK</Text>

        <TextInput
          style={styles.loginInput}
          placeholder="Full Name"
          placeholderTextColor="#999"
          value={signupName}
          onChangeText={(text) => {
            setSignupName(text);
            setLoginError('');
          }}
        />

        <TextInput
          style={styles.loginInput}
          placeholder="Email"
          placeholderTextColor="#999"
          keyboardType="email-address"
          value={signupEmail}
          onChangeText={(text) => {
            setSignupEmail(text);
            setLoginError('');
          }}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.loginInput}
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={signupPassword}
          onChangeText={(text) => {
            setSignupPassword(text);
            setLoginError('');
          }}
        />

        <TextInput
          style={styles.loginInput}
          placeholder="Confirm Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={signupConfirmPassword}
          onChangeText={(text) => {
            setSignupConfirmPassword(text);
            setLoginError('');
          }}
        />

        <TextInput
          style={styles.loginInput}
          placeholder="School Name"
          placeholderTextColor="#999"
          value={signupSchool}
          onChangeText={(text) => {
            setSignupSchool(text);
            setLoginError('');
          }}
        />

        {loginError ? <Text style={{ color: 'red', marginBottom: 10, textAlign: 'center' }}>{loginError}</Text> : null}

        <TouchableOpacity
          style={[styles.loginButton, isLoggingIn && { opacity: 0.7 }]}
          onPress={handleSignup}
          disabled={isLoggingIn}
        >
          <Text style={styles.loginButtonText}>{isLoggingIn ? 'Creating Account...' : 'Sign Up'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {
          setIsSigningUp(false);
          setLoginError('');
        }}>
          <Text style={styles.loginLink}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  if (!fontsLoaded) {
    return null; // Or a loading spinner
  }

  const renderSettingsPage = () => (
    <ScrollView style={styles.pageContainer}>
      <View style={styles.pageContent}>
        <View style={styles.singleColumnContainer}>
          {/* Profile Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profile</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Name</Text>
              <TextInput
                style={[styles.settingValue, styles.editableInput]}
                value={userProfile.name}
                onChangeText={(text) => {
                  const updatedProfile = { ...userProfile, name: text };
                  setUserProfile(updatedProfile);
                  localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
                }}
                placeholder="Enter your name"
              />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Email</Text>
              <TextInput
                style={[styles.settingValue, styles.editableInput]}
                value={userProfile.email}
                onChangeText={(text) => {
                  const updatedProfile = { ...userProfile, email: text };
                  setUserProfile(updatedProfile);
                  localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
                }}
                placeholder="Enter your email"
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* Security Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Security</Text>
            <Text style={styles.settingLabel}>Change Password</Text>
            <TextInput style={styles.settingInput} placeholder="Current Password" secureTextEntry />
            <TextInput style={styles.settingInput} placeholder="New Password" secureTextEntry />
            <TextInput style={styles.settingInput} placeholder="Confirm New Password" secureTextEntry />
            <TouchableOpacity style={styles.settingButton}>
              <Text style={styles.settingButtonText}>Update Password</Text>
            </TouchableOpacity>
          </View>

          {/* Application Settings */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Application Settings</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Switch value={darkMode} onValueChange={setDarkMode} />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Email Notifications</Text>
              <Switch value={notifications} onValueChange={setNotifications} />
            </View>
          </View>

          {/* Logout Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account</Text>
            <TouchableOpacity
              style={[styles.settingButton, { backgroundColor: '#dc3545' }]}
              onPress={() => {
                setIsLoggedIn(false);
                localStorage.removeItem('isLoggedIn');
              }}
            >
              <Text style={styles.settingButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  if (isSigningUp) {
    return renderSignup();
  }

  if (!isLoggedIn) {
    return renderLogin();
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>ZENARK: School Analytics Dashboard - Overall View</Text>
            <Text style={styles.headerSubtitle}>{userProfile.school || userProfile.schoolName || 'School Dashboard'}</Text>
          </View>
        </View>
      </View>

      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={[styles.topNavItem, activeTab === 'settings' && styles.topNavItemActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={styles.topNavIcon}>🏫</Text>
          <Text style={[styles.topNavText, activeTab === 'settings' && styles.topNavTextActive]}>School</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.topNavItem, activeTab === 'home' && styles.topNavItemActive]}
          onPress={() => setActiveTab('home')}
        >
          <Text style={styles.topNavIcon}>🎒</Text>
          <Text style={[styles.topNavText, activeTab === 'home' && styles.topNavTextActive]}>Class</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.topNavItem, activeTab === 'reports' && styles.topNavItemActive]}
          onPress={() => setActiveTab('reports')}
        >
          <Text style={styles.topNavIcon}>👥</Text>
          <Text style={[styles.topNavText, activeTab === 'reports' && styles.topNavTextActive]}>Students</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.topNavItem, activeTab === 'settingsPage' && styles.topNavItemActive]}
          onPress={() => setActiveTab('settingsPage')}
        >
          <Text style={styles.topNavIcon}>⚙️</Text>
          <Text style={[styles.topNavText, activeTab === 'settingsPage' && styles.topNavTextActive]}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.mainContentContainer}>
        <View key={`page-${activeTab}-${updateCounter}`} style={{ flex: 1 }}>
          {renderTab(activeTab)}
        </View>

        {/* Page Indicators */}
        <View style={styles.pageIndicators}>
          {tabs.map((tab) => (
            <View
              key={tab}
              style={[
                styles.pageIndicator,
                activeTab === tab && styles.pageIndicatorActive
              ]}
            />
          ))}
        </View>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <View style={styles.pageNavContainer}>
          <TouchableOpacity
            style={styles.pageNavButton}
            onPress={() => {
              const currentIndex = tabs.indexOf(activeTab);
              if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1]);
            }}
          >
            <Text style={styles.pageNavText}>◀</Text>
          </TouchableOpacity>

          <View style={styles.pageIndicatorContainer}>
            <Text style={styles.pageIndicatorText}>
              {tabs.indexOf(activeTab) + 1} / {tabs.length}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.pageNavButton}
            onPress={() => {
              const currentIndex = tabs.indexOf(activeTab);
              if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1]);
            }}
          >
            <Text style={styles.pageNavText}>▶</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContentContainer: {
    flex: 1,
    position: 'relative',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: '#d4dce3',
  },
  header: {
    backgroundColor: '#5e3a8f',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  logoImage: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  logoText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: 'white',
    fontSize: isTablet ? 20 : 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
  },
  topNav: {
    flexDirection: 'row',
    backgroundColor: '#f0e6f5',
    paddingVertical: isLargeScreen ? 16 : 12,
    paddingHorizontal: isLargeScreen ? 20 : 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0d0e8',
    justifyContent: isLargeScreen ? 'center' : 'space-between',
    maxWidth: 1200, // Maximum width for very large screens
    alignSelf: 'center',
    width: '100%',
  },
  topNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: isLargeScreen ? 0 : 1,
    paddingVertical: isLargeScreen ? 8 : 4,
    paddingHorizontal: isLargeScreen ? 20 : 0,
    marginHorizontal: isLargeScreen ? 10 : 0,
    minWidth: isLargeScreen ? 120 : 'auto',
  },
  topNavItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#5e3a8f',
  },
  topNavIcon: {
    fontSize: isLargeScreen ? 20 : 16,
    marginRight: isLargeScreen ? 10 : 6,
  },
  topNavText: {
    fontSize: isLargeScreen ? 16 : 15,
    color: '#333',
    textAlign: 'center',
    fontWeight: isLargeScreen ? '500' : 'normal',
  },
  topNavTextActive: {
    fontWeight: '600',
    color: '#5e3a8f',
  },
  content: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
  pageContent: {
    padding: 20,
    paddingBottom: 20,
  },
  rightColumn: {
    flex: isTablet ? 1 : undefined,
    minWidth: isTablet ? 280 : undefined,
  },
  singleColumnContainer: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 3,
    borderColor: '#5e3a8f',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 15,
    color: '#1a1a1a',
  },
  cardSubtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 12,
  },
  radioGroup: {
    marginTop: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#5e3a8f',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5e3a8f',
  },
  radioLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  radioArrow: {
    fontSize: 16,
    color: '#999',
  },
  chartContainer: {
    marginTop: 10,
  },
  lineChartPlaceholder: {
    height: 200,
    backgroundColor: '#f8f5fc',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: '#e8e0f0',
  },
  chartLabel: {
    fontSize: 14,
    color: '#666',
  },
  circularGaugeContainer: {
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 20,
  },
  circularGauge: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 14,
    borderColor: '#5e3a8f',
    borderTopColor: '#b19cd9',
    borderRightColor: '#b19cd9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  gaugeNumber: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  gaugeSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  productivityGaugeContainer: {
    alignItems: 'center',
    paddingVertical: 25,
  },
  productivityGauge: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 14,
    borderColor: '#5e3a8f',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  productivityNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  barChartContainer: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 10,
    height: 240, // Reduced height
    minWidth: '100%',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  chartContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '100%',
    paddingBottom: 80,
    paddingTop: 20,
    minWidth: '100%',
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    marginHorizontal: 4,
    position: 'relative',
    minWidth: 60,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    position: 'relative',
    paddingBottom: 60,
  },
  barWrapper: {
    width: 22,
    marginHorizontal: 2,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  bar: {
    width: 22,
    borderRadius: 4,
    position: 'relative',
    marginBottom: 4,
  },
  mainBar: {
    backgroundColor: '#7e57c2',
  },
  compareBar: {
    backgroundColor: '#b39ddb',
  },
  barLabel: {
    position: 'absolute',
    top: -22,
    left: '50%',
    transform: [{ translateX: -11 }],
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
    width: 24,
    textAlign: 'center',
  },
  subjectName: {
    position: 'absolute',
    bottom: -50,
    width: 60,
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
    left: '50%',
    transform: [{ translateX: -30 }],
    lineHeight: 12,
  },
  yAxisContainer: {
    width: 30,
    height: 180,
    justifyContent: 'space-between',
    paddingRight: 8,
    marginRight: 8,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    paddingTop: 10,
    paddingBottom: 30,
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
    marginBottom: 15,
  },
  chartContent: {
    flexDirection: 'row',
    height: '100%',
    paddingHorizontal: 10,
    minWidth: '100%',
    alignItems: 'flex-end',
    height: 180,
    paddingBottom: 30,
    paddingTop: 10,
  },
  subjectControlsContainer: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  addSubjectRow: {
    marginBottom: 15,
  },
  removeSubjectRow: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  subjectInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    backgroundColor: '#f9f9f9',
  },
  addButton: {
    backgroundColor: '#5e3a8f',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
  },
  removeButton: {
    backgroundColor: '#c62828',
    alignSelf: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  pickerContainer: {
    marginBottom: 10,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%',
    paddingTop: 20,
  },
  queryContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  queryInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  processButton: {
    backgroundColor: '#5e3a8f',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  processButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
  queryStatus: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  purpleBullet: {
    fontSize: 16,
    marginRight: 10,
    color: '#5e3a8f',
    marginTop: 2,
  },
  listText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: '#5e3a8f',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  pageNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  pageNavButton: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  pageNavText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pageIndicatorContainer: {
    minWidth: 60,
    alignItems: 'center',
  },
  pageIndicatorText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  bottomNavIcon: {
    marginHorizontal: 8,
  },
  bottomNavText: {
    color: 'white',
    fontSize: 18,
  },
  bottomNavSpacer: {
    flex: 1,
  },
  pageIndicators: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: '40%',
  },
  pageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
    marginHorizontal: 5,
    transition: 'all 0.3s ease',
  },
  pageIndicatorActive: {
    backgroundColor: '#5e3a8f',
    width: 28,
    height: 8,
  },
  comparisonChartContainer: {
    overflow: 'hidden',
    position: 'relative',
    marginTop: 15,
    height: 240,
  },
  comparisonLabels: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 10,
    gap: 20,
  },
  comparisonLabel: {
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: '#f8f5fc',
    borderRadius: 12,
  },
  starRating: {
    flexDirection: 'row',
    marginVertical: 15,
    justifyContent: 'center',
  },
  star: {
    fontSize: 24,
    color: '#ddd',
    marginHorizontal: 4,
  },
  queryStatusSub: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  settingsGrid: {
    display: 'grid',
    gap: '15px',
    gridTemplateColumns: isLargeScreen ? 'repeat(3, 1fr)' : (isTablet ? 'repeat(2, 1fr)' : '1fr'),
  },
  settingsTopRow: {},
  settingsMiddleRow: {},
  settingsBottomRow: {},
  healthIndexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  healthGaugeWrapper: {
    alignItems: 'center',
  },
  healthGauge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 10,
    borderColor: '#5e3a8f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },

  healthGaugeNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  healthGaugeLabel: {
    fontSize: 12,
    color: '#666',
  },
  healthBars: {
    flex: 1,
    marginLeft: 20,
  },
  miniBar: {
    height: 35,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginBottom: 10,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    backgroundColor: '#b19cd9',
    width: '40%',
    borderRadius: 6,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  barLabelText: {
    fontSize: 11,
    color: '#333333',
    marginBottom: 4,
    fontWeight: '500',
  },
  progressSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#333',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#5e3a8f',
    borderRadius: 4,
    minWidth: 2,
  },
  comparisonText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  bubbleChartContainer: {
    height: 240,
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  bubbleChart: {
    width: '100%',
    height: 240,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f5fc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e0f0',
    padding: 5,
  },
  wellnessContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    minHeight: 150,
  },
  bubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    padding: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  bubbleTop: {
    top: 0,
  },
  bubbleRow: {
    flexDirection: 'row',
    position: 'absolute',
    top: '40%',
    width: '100%',
    justifyContent: 'space-around',
  },
  bubbleLeft: {
    position: 'relative',
  },
  bubbleRight: {
    position: 'relative',
  },
  bubbleBottom: {
    bottom: 0,
  },
  bubbleText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 2,
    includeFontPadding: false,
    lineHeight: 20,
  },
  bubbleLabel: {
    color: 'white',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 1,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    includeFontPadding: false,
    lineHeight: 8,
  },
  overallScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5e3a8f',
    textAlign: 'center',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e8e0f0',
  },
  teacherGauges: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  teacherGauge: {
    alignItems: 'center',
  },
  performanceCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 8,
    borderColor: '#5e3a8f',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  performanceText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
  },
  studentName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  studentGrade: {
    fontSize: 14,
    color: '#666',
  },
  viewRankingsButton: {
    backgroundColor: '#5e3a8f',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  viewRankingsText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  teacherCompItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  teacherCompName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  teacherCompGrowth: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  teacherCompPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  starFilled: {
    fontSize: 16,
    color: '#5e3a8f',
    marginRight: 2,
  },
  teacherPercent: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  ratingContainer: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  ratingScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  ratingNumberContainer: {
    alignItems: 'center',
    width: '10%',
  },
  ratingNumber: {
    fontSize: 10,
    color: '#666',
  },
  ratingTick: {
    width: 1,
    height: 4,
    backgroundColor: '#ddd',
    marginTop: 2,
  },
  ratingIndicator: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginTop: 4,
    overflow: 'hidden',
  },
  ratingFill: {
    width: '75%',
    height: '100%',
    backgroundColor: '#5e3a8f',
    borderRadius: 4,
  },
  insightsSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  weaknessItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  strengthBullet: {
    color: '#4CAF50',
    marginRight: 8,
    fontSize: 16,
    lineHeight: 20,
  },
  weaknessBullet: {
    color: '#f44336',
    marginRight: 8,
    fontSize: 16,
    lineHeight: 20,
  },
  strengthText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  weaknessText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  exportButton: {
    backgroundColor: '#5e3a8f',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 8,
    marginBottom: 15,
  },
  exportIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  exportTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  exportSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  latestReport: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  reportIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  reportText: {
    fontSize: 13,
    color: '#666',
  },
  advisorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  advisorStars: {
    fontSize: 16,
    color: '#5e3a8f',
    marginRight: 8,
  },
  advisorTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  advisorIcon: {
    fontSize: 24,
  },
  advisorSuggestion: {
    fontSize: 13,
    color: '#666',
    marginTop: 10,
  },
  queryDescription: {
    fontSize: 17,
    color: '#666',
    lineHeight: 24,
    marginBottom: 15,
  },
  insightsButton: {
    backgroundColor: '#5e3a8f',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  starRating: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  star: {
    fontSize: 24,
    color: '#ffd700',
    marginHorizontal: 5,
  },
  processButton: {
    backgroundColor: '#5e3a8f',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 10,
  },
  processButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  subjectSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
    flexWrap: 'wrap',
  },
  subjectButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    margin: 4,
    boxShadow: '0px 1px 1.41px rgba(0, 0, 0, 0.2)',
    elevation: 2,
  },
  subjectButtonActive: {
    backgroundColor: '#5e3a8f',
    borderColor: '#5e3a8f',
    elevation: 4,
  },
  subjectButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  subjectButtonTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  teacherFeedbackContainer: {
    marginTop: 15,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  feedbackHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 5,
  },
  feedbackText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  insightsButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: isTablet ? 20 : 15,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  statValue: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: 'bold',
    color: '#6a4c93',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  cohortSelectorSection: {
    marginBottom: 10,
  },
  barSubject: {
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
    maxWidth: 50,
    alignSelf: 'center',
  },
  gaugeContainer: {
    marginTop: 10,
  },
  gauge: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    backgroundColor: '#6a4c93',
    borderRadius: 10,
  },
  gaugeText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  queryContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  queryInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    marginRight: 10,
  },
  queryButton: {
    backgroundColor: '#6a4c93',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  queryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  listBullet: {
    fontSize: 18,
    marginRight: 10,
    color: '#6a4c93',
  },
  listText: {
    fontSize: 14,
    color: '#333',
  },
  healthIndexContainer: {
    flexDirection: isTablet ? 'row' : 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  circleGauge: {
    width: isTablet ? 140 : 120,
    height: isTablet ? 140 : 120,
    borderRadius: isTablet ? 70 : 60,
    borderWidth: 10,
    borderColor: '#6a4c93',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isTablet ? 0 : 20,
  },
  circleGaugeText: {
    fontSize: isTablet ? 32 : 28,
    fontWeight: 'bold',
    color: '#6a4c93',
  },
  circleGaugeLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: isLargeScreen ? 24 : (isTablet ? 22 : 20),
    color: 'white',
  },
  legendContainer: {
    flex: 1,
    marginLeft: isTablet ? 30 : 0,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
  growthContainer: {
    marginTop: 10,
  },
  growthItem: {
    marginBottom: 15,
  },
  growthLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    fontWeight: '500',
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  growthValue: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  chartPlaceholderText: {
    fontSize: 16,
    color: '#999',
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  alertContent: {
    flex: 1,
  },
  alertName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  alertIssue: {
    fontSize: 12,
    color: '#666',
  },
  alertBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  settingItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  settingButton: {
    backgroundColor: '#6a4c93',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  settingButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  navBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingHorizontal: 10,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItemActive: {
    borderTopWidth: 2,
    borderTopColor: '#6a4c93',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
    color: '#999',
  },
  navIconActive: {
    color: '#6a4c93',
  },
  navLabel: {
    fontSize: 12,
    color: '#999',
  },
  navLabelActive: {
    color: '#6a4c93',
    fontWeight: '500',
  },
  // Login Styles
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginContent: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  loginTitle: {
    fontSize: 24,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  loginBrand: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#5e3a8f',
    marginBottom: 40,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  loginInput: {
    width: '100%',
    height: 50,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#8e44ad',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    backgroundColor: '#f9f9f9',
  },
  searchButton: {
    backgroundColor: '#5e3a8f',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 20,
    color: 'white',
  },
  // Line Graph Styles
  lineGraphContainer: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  lineGraphChart: {
    flexDirection: 'row',
    height: 180,
  },
  yAxisLabels: {
    width: 30,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 10,
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  graphArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#fafafa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  lineGraph: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },
  lineSegment: {
    position: 'absolute',
    height: 3,
    backgroundColor: '#5e3a8f',
    transformOrigin: 'left center',
    zIndex: 1,
  },
  diagonalLine: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#5e3a8f',
    transformOrigin: 'left center',
    zIndex: 1,
    shadowColor: '#5e3a8f',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  linePath: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    zIndex: 1,
  },
  microSegment: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#5e3a8f',
    zIndex: 1,
  },
  simpleLine: {
    position: 'absolute',
    backgroundColor: '#5e3a8f',
    zIndex: 1,
    borderRadius: 1,
    opacity: 0.8,
  },
  dottedLinePath: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    zIndex: 1,
  },
  smoothLinePath: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    zIndex: 1,
  },
  smoothSegment: {
    position: 'absolute',
    backgroundColor: '#10b981',
    zIndex: 1,
    borderRadius: 1,
  },
  smoothDot: {
    position: 'absolute',
    width: 1.5,
    height: 1.5,
    borderRadius: 0.75,
    zIndex: 1,
  },
  solidLine: {
    position: 'absolute',
    backgroundColor: '#10b981',
    zIndex: 1,
  },
  lineDot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    zIndex: 1,
    backgroundColor: '#4a2f6f',
    shadowColor: '#4a2f6f',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 1,
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    transform: [{ translateX: -4 }, { translateY: 4 }],
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  dataPointLabel: {
    position: 'absolute',
    top: -20,
    left: 10,
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
  },
  xAxisLabels: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  xAxisLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  averageScoreContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 5,
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  averageLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  averageScoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  averageScore: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  averageStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  averageStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loginLink: {
    color: '#5e3a8f',
    fontSize: 14,
    marginTop: 20,
    fontWeight: '500',
  },
  loginSignupText: {
    marginTop: 30,
    fontSize: 14,
    color: '#666',
  },
  // Settings Page Styles
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
  },
  editableInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    minWidth: 200,
  },
  settingInput: {
    height: 45,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 10,
    backgroundColor: '#f9f9f9',
  },
  settingButton: {
    backgroundColor: '#5e3a8f',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  settingButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  // Mental Wellness Styles
  wellnessScoreContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  wellnessScore: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  wellnessScoreLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  wellnessStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
  },
  wellnessStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  wellnessProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginTop: 15,
  },
  wellnessProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  notAvailableText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 40,
    fontStyle: 'italic',
  },
  classDisplayContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#5e3a8f',
  },
  classDisplayText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5e3a8f',
  },
  classDropdownContainer: {
    marginTop: 10,
  },
  // ZPI Styles
  zpiContainer: {
    padding: 20,
  },
  zpiScoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 10,
  },
  zpiScore: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  zpiMaxScore: {
    fontSize: 24,
    color: '#999',
    marginLeft: 5,
  },
  zpiLabelBadge: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  zpiLabelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  zpiBreakdown: {
    marginTop: 10,
  },
  zpiBreakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  zpiBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  zpiBreakdownLabel: {
    fontSize: 13,
    color: '#666',
    width: 120,
  },
  zpiProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  zpiProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  zpiBreakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 30,
    textAlign: 'right',
  },
  zpiNote: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  zpiNoteText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});
