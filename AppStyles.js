import { Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 600;

const styles = {
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
    fontSize: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  logo: {
    fontSize: 24,
    marginRight: 8,
  },
  logoText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  // Add more styles here as needed
  navLabelActive: {
    color: '#6a4c93',
    fontWeight: '500',
  },
  navLabel: {
    fontSize: 12,
    color: '#999',
  },
  // Bottom navigation
  bottomNav: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: '#5e3a8f',
    alignItems: 'center',
    paddingHorizontal: 15,
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
  // Add all other styles from App.js here
};

export default styles;
