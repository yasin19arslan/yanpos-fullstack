import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  StatusBar 
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.logoContainer}>
        <View style={styles.imageContainer}>
          <Image
            source={require('../../../assets/yanposlogo.jpg')}
            style={styles.logo}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.title}>Kaliteli Ürünler Uygun Fiyata</Text>
        <Text style={styles.subtitle}>YANPOS Yeni Nesil Pos Uygulaması</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Şubeden Al</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.buttonOutline]}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={[styles.buttonText, styles.buttonOutlineText]}>QR ile Öde</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginLinkText}>
            Üye Girişi Yap veya Üye Ol
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  logoContainer: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  imageContainer: {
    width: width * 0.7,
    height: width * 0.5,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    marginBottom: 40,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#CCCCCC',
  },
  buttonContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  buttonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonOutlineText: {
    color: '#FFFFFF',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 10,
  },
  loginLinkText: {
    color: '#CCCCCC',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
}); 