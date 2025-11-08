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

const { width, height } = Dimensions.get('window');
const isTablet = width >= 600;
const isLargeScreen = width >= 1024; // For laptop/desktop screens

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
  const [selectedTeacherSubject, setSelectedTeacherSubject] = useState('maths');
  const [subjectToRemove, setSubjectToRemove] = useState('');
  const [subjectToAdd, setSubjectToAdd] = useState('');
  const [cohortA, setCohortA] = useState('grade10');
  const [cohortB, setCohortB] = useState('overall');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
      <View style={styles.singleColumnContainer}>
        {/* Class Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Class Selector</Text>
          <Text style={styles.cardSubtitle}>Select Class:</Text>
          <View style={styles.radioGroup}>
            {classOptions.map((cls) => (
              <TouchableOpacity
                key={cls.id}
                style={styles.radioItem}
                onPress={() => setSelectedClass(cls.id)}
              >
                <View style={styles.radioOuter}>
                  {selectedClass === cls.id && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>{cls.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Academic Performance */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Academic Performance</Text>
          <View style={[styles.comparisonLabels, { marginBottom: 8 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20 }}>
              <View style={{ width: 12, height: 12, backgroundColor: '#5e3a8f', marginRight: 6, borderRadius: 2 }} />
              <Text style={styles.comparisonLabel}>Grade 10A</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 12, height: 12, backgroundColor: '#b19cd9', marginRight: 6, borderRadius: 2 }} />
              <Text style={styles.comparisonLabel}>School Average</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={styles.barChartContainer}>
              <View style={styles.chartContent}>
                {academicData.map((item, index) => (
                  <View key={`academic-${item.subject}-${index}`} style={styles.barGroup}>
                    <View style={styles.barsContainer}>
                      <View style={styles.barWrapper}>
                        <View style={[styles.bar, { height: `${item.mainHeight}%`, backgroundColor: '#5e3a8f' }]}><Text style={styles.barLabel}>{item.mainHeight}%</Text></View>
                      </View>
                      <View style={[styles.barWrapper, { marginLeft: 4 }]}>
                        <View style={[styles.bar, { height: `${item.compareHeight}%`, backgroundColor: '#b19cd9' }]}><Text style={styles.barLabel}>{item.compareHeight}%</Text></View>
                      </View>
                    </View>
                    <Text style={styles.barSubject}>{item.subject}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
          <View style={styles.subjectControlsContainer}>
            <View style={styles.addSubjectRow}>
              <View style={{flex: 1, width: '100%'}}>
                <Text style={styles.pickerLabel}>Add a subject:</Text>
                <View style={styles.subjectSelectorContainer}>
                  {subjectsToAdd.map(item => (
                    <TouchableOpacity key={`add-${item.id}`} style={[styles.subjectButton, subjectToAdd === item.id && styles.subjectButtonActive]} onPress={() => setSubjectToAdd(item.id)}><Text style={[styles.subjectButtonText, subjectToAdd === item.id && styles.subjectButtonTextActive]}>{item.label}</Text></TouchableOpacity>
                  ))}
                </View>
              </View>
              <TouchableOpacity style={[styles.addButton, !subjectToAdd && styles.disabledButton, {marginTop: 10}]} onPress={addNewSubject} disabled={!subjectToAdd}><Text style={styles.addButtonText}>Add</Text></TouchableOpacity>
            </View>
            <View style={styles.removeSubjectRow}>
              <View style={{flex: 1, width: '100%'}}>
                <Text style={styles.pickerLabel}>Remove a subject:</Text>
                <View style={styles.subjectSelectorContainer}>
                  {academicData.map(item => (
                    <TouchableOpacity key={`remove-${item.subject}`} style={[styles.subjectButton, subjectToRemove === item.subject && styles.subjectButtonActive]} onPress={() => setSubjectToRemove(item.subject)}><Text style={[styles.subjectButtonText, subjectToRemove === item.subject && styles.subjectButtonTextActive]}>{item.subject}</Text></TouchableOpacity>
                  ))}
                </View>
              </View>
              <TouchableOpacity style={[styles.addButton, styles.removeButton, !subjectToRemove && styles.disabledButton, {marginTop: 10}]} onPress={removeSelectedSubject} disabled={!subjectToRemove}><Text style={styles.addButtonText}>Remove</Text></TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Cohort Comparison */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cohort Comparison</Text>
          <View style={styles.cohortSelectorSection}><Text style={styles.pickerLabel}>Compare:</Text><View style={styles.subjectSelectorContainer}>{classOptions.map(cls => (<TouchableOpacity key={`cohortA-${cls.id}`} style={[styles.subjectButton, cohortA === cls.id && styles.subjectButtonActive]} onPress={() => setCohortA(cls.id)}><Text style={[styles.subjectButtonText, cohortA === cls.id && styles.subjectButtonTextActive]}>{cls.label}</Text></TouchableOpacity>))}</View></View>
          <View style={styles.cohortSelectorSection}><Text style={styles.pickerLabel}>With:</Text><View style={styles.subjectSelectorContainer}>{classOptions.map(cls => (<TouchableOpacity key={`cohortB-${cls.id}`} style={[styles.subjectButton, cohortB === cls.id && styles.subjectButtonActive]} onPress={() => setCohortB(cls.id)}><Text style={[styles.subjectButtonText, cohortB === cls.id && styles.subjectButtonTextActive]}>{cls.label}</Text></TouchableOpacity>))}</View></View>
          <View style={[styles.comparisonLabels, { marginBottom: 8, marginTop: 15 }]}><View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20 }}><View style={{ width: 12, height: 12, backgroundColor: '#5e3a8f', marginRight: 6, borderRadius: 2 }} /><Text style={styles.comparisonLabel}>{classOptions.find(c => c.id === cohortA)?.label || ''}</Text></View><View style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ width: 12, height: 12, backgroundColor: '#b19cd9', marginRight: 6, borderRadius: 2 }} /><Text style={styles.comparisonLabel}>{classOptions.find(c => c.id === cohortB)?.label || ''}</Text></View></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={styles.barChartContainer}>
              <View style={styles.chartContent}>
                {academicData.map((item, i) => (
                  <View key={`cohort-${i}`} style={styles.barGroup}>
                    <View style={styles.barsContainer}><View style={styles.barWrapper}><View style={[styles.bar, { height: `${item.mainHeight}%`, backgroundColor: '#5e3a8f' }]}><Text style={styles.barLabel}>{item.mainHeight}%</Text></View></View><View style={[styles.barWrapper, { marginLeft: 4 }]}><View style={[styles.bar, { height: `${item.compareHeight}%`, backgroundColor: '#b19cd9' }]}><Text style={styles.barLabel}>{item.compareHeight}%</Text></View></View></View>
                    <Text style={styles.barSubject}>{item.subject}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
          <View style={styles.subjectControlsContainer}>
            <View style={styles.addSubjectRow}><View style={{flex: 1, width: '100%'}}><Text style={styles.pickerLabel}>Add a subject:</Text><View style={styles.subjectSelectorContainer}>{subjectsToAdd.map(item => (<TouchableOpacity key={`add-cohort-${item.id}`} style={[styles.subjectButton, subjectToAdd === item.id && styles.subjectButtonActive]} onPress={() => setSubjectToAdd(item.id)}><Text style={[styles.subjectButtonText, subjectToAdd === item.id && styles.subjectButtonTextActive]}>{item.label}</Text></TouchableOpacity>))}</View></View><TouchableOpacity style={[styles.addButton, !subjectToAdd && styles.disabledButton, {marginTop: 10}]} onPress={addNewSubject} disabled={!subjectToAdd}><Text style={styles.addButtonText}>Add</Text></TouchableOpacity></View>
            <View style={styles.removeSubjectRow}><View style={{flex: 1, width: '100%'}}><Text style={styles.pickerLabel}>Remove a subject:</Text><View style={styles.subjectSelectorContainer}>{academicData.map(item => (<TouchableOpacity key={`remove-cohort-${item.subject}`} style={[styles.subjectButton, subjectToRemove === item.subject && styles.subjectButtonActive]} onPress={() => setSubjectToRemove(item.subject)}><Text style={[styles.subjectButtonText, subjectToRemove === item.subject && styles.subjectButtonTextActive]}>{item.subject}</Text></TouchableOpacity>))}</View></View><TouchableOpacity style={[styles.addButton, styles.removeButton, !subjectToRemove && styles.disabledButton, {marginTop: 10}]} onPress={removeSelectedSubject} disabled={!subjectToRemove}><Text style={styles.addButtonText}>Remove</Text></TouchableOpacity></View>
          </View>
        </View>

        {/* Academic Health Index */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Academic Health Index</Text>
          <View style={styles.circularGaugeContainer}>
            <View style={[styles.circularGauge, { width: 180, height: 180 }]}>
              <Text style={[styles.gaugeNumber, { fontSize: 42 }]}>92</Text>
            </View>
            <Text style={[styles.gaugeSubtext, { fontSize: 16, marginTop: 15 }]}>Early Warning: 57 Students</Text>
          </View>
        </View>

        {/* Class Productivity */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Class Productivity</Text>
          <View style={styles.productivityGaugeContainer}>
            <View style={[styles.productivityGauge, { width: 150, height: 150, borderRadius: 75 }]}>
              <Text style={[styles.productivityNumber, { fontSize: 28 }]}>87/100</Text>
            </View>
            <Text style={styles.chartLabel}>Productivity Index</Text>
          </View>
        </View>

        {/* Mental Wellness Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mental Wellness Overview</Text>
          <View style={styles.chartContainer}>
            <View style={styles.lineChartPlaceholder}>
              <Text style={styles.chartLabel}>Student Sentiment Trend</Text>
            </View>
          </View>
        </View>

        {/* Teacher Report */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Teacher Report</Text>
          <Text style={styles.teacherName}>
            {teacherSubjects.find(subj => subj.id === selectedTeacherSubject)?.teacher || 'Select a subject'}
          </Text>
          <View style={styles.subjectSelectorContainer}>
            {teacherSubjects.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                style={[
                  styles.subjectButton,
                  selectedTeacherSubject === subject.id && styles.subjectButtonActive,
                ]}
                onPress={() => setSelectedTeacherSubject(subject.id)}
              >
                <Text
                  style={[
                    styles.subjectButtonText,
                    selectedTeacherSubject === subject.id && styles.subjectButtonTextActive,
                  ]}
                >
                  {subject.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.teacherFeedbackContainer}>
            <Text style={styles.ratingText}>Average Class Performance: 7.5/10</Text>
            <Text style={styles.feedbackHeader}>Teacher's Feedback:</Text>
            <Text style={styles.feedbackText}>
              Students are showing strong progress in core concepts, but engagement in group activities could be improved.
            </Text>
          </View>
        </View>

        {/* Principal's Query Engine */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Principal's Query Engine</Text>
          <Text style={styles.queryDescription}>Type your strategic question about school performance, budget allocation, or staff development</Text>
          <TextInput
            style={styles.queryInput}
            placeholder="Ask a question..."
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.insightsButton}>
            <Text style={styles.insightsButtonText}>Get Insights</Text>
          </TouchableOpacity>
        </View>

        {/* Top 5 Concerns */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top 5 Concerns</Text>
          <View>
            {['Resilience', 'Time Management', 'Consistency in Performance', 'Class Participation', 'Homework Completion'].map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.purpleBullet}>•</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top 5 Strengths */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top 5 Strengths</Text>
          <View>
            {['Critical Thinking', 'Creativity', 'Collaboration', 'Problem-Solving', 'Leadership'].map((strength, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.purpleBullet}>•</Text>
                <Text style={styles.listText}>{strength}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // Render Reports Screen
  const renderReports = () => (
    <ScrollView style={styles.pageContainer} contentContainerStyle={styles.pageContent}>
      <View style={styles.singleColumnContainer}>
        {/* Class Badge */}
        <View style={styles.classBadge}>
          <Text style={styles.classBadgeText}>
            Class: {classOptions.find(c => c.id === selectedClass)?.label || 'N/A'}
          </Text>
        </View>

        {/* Student Name/ID Input */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Student Name / ID</Text>
          <TextInput
            style={styles.subjectInput}
            value={studentIdentifier}
            onChangeText={setStudentIdentifier}
            placeholder="Enter student name or ID"
            placeholderTextColor="#999"
          />
        </View>

        {/* Mental Wellness Trend */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mental Wellness Trend</Text>
          <Text style={styles.cardSubtitle}>- {classOptions.find(c => c.id === selectedClass)?.label || 'N/A'}</Text>
          <View style={styles.lineChartPlaceholder}>
            <Text style={styles.chartLabel}>Student Sentiment Trend</Text>
          </View>
        </View>

        {/* Principal's Query Engine */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Principal's Query Engine</Text>
          <Text style={styles.queryDescription}>Type your strategic question about school performance, budget allocation, or staff development</Text>
          <TextInput
            style={styles.queryInput}
            placeholder="Ask a question..."
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.insightsButton}>
            <Text style={styles.insightsButtonText}>Get Insights</Text>
          </TouchableOpacity>
        </View>

        {/* Top 5 Concerns */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top 5 Concerns</Text>
          <View>
            {['Resilience', 'Time Management', 'Consistency in Performance', 'Class Participation', 'Homework Completion'].map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.purpleBullet}>•</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top 5 Strengths */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top 5 Strengths</Text>
          {['Critical Thinking', 'Creativity', 'Collaboration', 'Problem-Solving', 'Leadership'].map((strength, index) => (
              <View key={index} style={styles.listItem}>
                  <Text style={styles.purpleBullet}>•</Text>
                  <Text style={styles.listText}>{strength}</Text>
              </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  // Render Settings Screen
  const renderSettings = () => (
    <ScrollView style={styles.pageContainer} contentContainerStyle={styles.pageContent}>
      <View style={styles.settingsGrid}>
        {/* Top Row */}
        <View style={styles.settingsTopRow}>
          {/* School's Health Index */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>School's Health Index</Text>
            <View style={[styles.healthIndexRow, { justifyContent: 'center' }]}>
              <View style={[styles.healthGaugeWrapper, { alignItems: 'center' }]}>
                <View style={[styles.healthGauge, { marginBottom: 5 }]}>
                  <Text style={styles.healthGaugeNumber}>88</Text>
                </View>
                <Text style={[styles.healthGaugeLabel, { textAlign: 'center' }]}>Mental Wellness</Text>
              </View>
            </View>
            <View style={[styles.progressSection, { justifyContent: 'center' }]}>
              <Text style={[styles.progressLabel, { textAlign: 'center', marginRight: 0 }]}>Overall Health Score: </Text>
              <Text style={styles.progressValue}>88%</Text>
            </View>
            <View style={{ paddingHorizontal: 20, marginTop: 5 }}>
              <View style={[styles.progressBar, { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4 }]}>
                <View style={[styles.progressBarFill, { width: '88%' }]} />
              </View>
            </View>
            <Text style={[styles.comparisonText, { textAlign: 'center' }]}>vs Regional Avg: 78%</Text>
          </View>

          {/* School Growth Index */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>School Growth Index</Text>
            <View style={styles.bubbleChartContainer}>
              <View style={styles.bubbleChart}>
                {/* Top Left */}
                <View style={[styles.bubble, { backgroundColor: '#5e3a8f', top: '10%', left: '10%' }]}>
                  <Text style={styles.bubbleText}>78%</Text>
                  <Text style={styles.bubbleLabel}>Academics</Text>
                </View>
                
                {/* Top Right */}
                <View style={[styles.bubble, { backgroundColor: '#b19cd9', top: '10%', right: '10%' }]}>
                  <Text style={styles.bubbleText}>71%</Text>
                  <Text style={styles.bubbleLabel}>Engagement</Text>
                </View>
                
                {/* Bottom Left */}
                <View style={[styles.bubble, { backgroundColor: '#5e3a8f', bottom: '10%', left: '10%' }]}>
                  <Text style={styles.bubbleText}>67%</Text>
                  <Text style={styles.bubbleLabel}>Attendance</Text>
                </View>
                
                {/* Bottom Right */}
                <View style={[styles.bubble, { backgroundColor: '#4CAF50', bottom: '10%', right: '10%' }]}>
                  <Text style={styles.bubbleText}>83/100</Text>
                  <Text style={styles.bubbleLabel}>Well-being</Text>
                </View>
              </View>
            </View>
            <Text style={[styles.overallScore, { textAlign: 'center', marginTop: 10 }]}>Overall Score: 83/100</Text>
          </View>

          {/* Teacher Performance Overview */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Teacher Performance Overview</Text>
            <View style={styles.teacherGauges}>
              <View style={styles.teacherGauge}>
                <View style={styles.performanceCircle}>
                  <Text style={styles.performanceText}>85/100</Text>
                </View>
                <Text style={styles.gaugeSubtext}>Avg Performance</Text>
              </View>
              <View style={styles.teacherGauge}>
                <View style={styles.performanceCircle}>
                  <Text style={styles.performanceText}>92/100</Text>
                </View>
                <Text style={styles.gaugeSubtext}>Engagement</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Middle Row */}
        <View style={styles.settingsMiddleRow}>
          {/* Best Students */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Best Students (Academics & Wellness)</Text>
            <View style={styles.studentItem}>
              <View style={styles.studentAvatar}>
                <Text style={styles.avatarText}>👨</Text>
              </View>
              <Text style={styles.studentName}>Priya Sharma</Text>
              <Text style={styles.studentGrade}>A | 95 😊 95 😊</Text>
            </View>
            <View style={styles.studentItem}>
              <View style={styles.studentAvatar}>
                <Text style={styles.avatarText}>👨</Text>
              </View>
              <Text style={styles.studentName}>Zoe Lee 😊 90 88</Text>
            </View>
            <TouchableOpacity style={styles.viewRankingsButton}>
              <Text style={styles.viewRankingsText}>View Full Rankings</Text>
            </TouchableOpacity>
          </View>

          {/* Teacher Insights */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Teacher Insights</Text>
            <Text style={styles.teacherName}>
            {teacherSubjects.find(subj => subj.id === selectedTeacherSubject)?.teacher || 'Select a subject'}
          </Text>
            
            {/* Rating Scale */}
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingLabel}>Overall Rating:</Text>
              <View style={styles.ratingScale}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <View key={num} style={styles.ratingNumberContainer}>
                    <Text style={styles.ratingNumber}>{num}</Text>
                    <View style={styles.ratingTick}></View>
                  </View>
                ))}
              </View>
              <View style={styles.ratingIndicator}>
                <View style={styles.ratingFill} />
              </View>
            </View>

            {/* Strengths */}
            <View style={styles.insightsSection}>
              <Text style={styles.sectionTitle}>Strengths</Text>
              <View style={styles.strengthItem}>
                <Text style={styles.strengthBullet}>•</Text>
                <Text style={styles.strengthText}>Excellent classroom management</Text>
              </View>
              <View style={styles.strengthItem}>
                <Text style={styles.strengthBullet}>•</Text>
                <Text style={styles.strengthText}>Strong subject knowledge</Text>
              </View>
              <View style={styles.strengthItem}>
                <Text style={styles.strengthBullet}>•</Text>
                <Text style={styles.strengthText}>Good student engagement</Text>
              </View>
            </View>

            {/* Weaknesses */}
            <View style={styles.insightsSection}>
              <Text style={styles.sectionTitle}>Areas for Improvement</Text>
              <View style={styles.weaknessItem}>
                <Text style={styles.weaknessBullet}>•</Text>
                <Text style={styles.weaknessText}>Could provide more detailed feedback</Text>
              </View>
              <View style={styles.weaknessItem}>
                <Text style={styles.weaknessBullet}>•</Text>
                <Text style={styles.weaknessText}>Pacing could be adjusted for slower learners</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Row */}
        <View style={styles.settingsBottomRow}>
          {/* Generate Export */}
          <View style={styles.card}>
            <TouchableOpacity style={styles.exportButton}>
              <Text style={styles.exportIcon}>📖</Text>
              <View>
                <Text style={styles.exportTitle}>Generate Export for Parent Reports</Text>
                <Text style={styles.exportSubtitle}>(PDF/CSV)</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.latestReport}>
              <Text style={styles.reportIcon}>🕒</Text>
              <Text style={styles.reportText}>Latest report: October 25, 2023</Text>
            </View>
          </View>

          {/* Strategic AI-Based Advisor */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Strategic AI-Based Advisor</Text>
            <View style={styles.advisorHeader}>
              <Text style={styles.advisorStars}>★ ★ ★</Text>
              <Text style={styles.advisorTitle}>Sremics Advisor</Text>
              <Text style={styles.advisorIcon}>🤖</Text>
            </View>
            <View style={styles.queryContainer}>
              <TextInput
                style={styles.queryInput}
                placeholder="Suggest about curiculum gaps..."
                placeholderTextColor="#999"
              />
              <TouchableOpacity style={styles.processButton}>
                <Text style={styles.processButtonText}>Process</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.advisorSuggestion}>Suget community outreach ideas...</Text>
          </View>

          {/* Principal's Query Engine */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Principal's Query Engine</Text>
            <Text style={styles.queryDescription}>Type your strategic question about school performance, budget allocation, or staff development</Text>
            <TextInput
              style={styles.queryInput}
              placeholder="Ask a question..."
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.insightsButton}>
              <Text style={styles.insightsButtonText}>Get Insights</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </ScrollView>
  );

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
        />
        <TextInput
          style={styles.loginInput}
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
        />
        <TouchableOpacity style={styles.loginButton} onPress={() => setIsLoggedIn(true)}>
          <Text style={styles.loginButtonText}>Log in</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.loginLink}>Forgot password?</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.loginLink}>Contact us to register</Text>
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
              <Text style={styles.settingValue}>Principal Sharma</Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Email</Text>
              <Text style={styles.settingValue}>principal.sharma@gvh.edu</Text>
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
        </View>
      </View>
    </ScrollView>
  );

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
            <Text style={styles.headerSubtitle}>Green Valley High School</Text>
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
        <View key={`page-${activeTab}-${updateCounter}`} style={{flex: 1}}>
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
    fontSize: 50,
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
  classBadge: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  classBadgeText: {
    fontSize: 15,
    color: '#1a1a1a',
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
});
