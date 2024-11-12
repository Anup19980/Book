import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Button, Image, StyleSheet, Alert } from 'react-native';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { collection, onSnapshot, doc, getDocs, setDoc, deleteDoc, updateDoc, query } from 'firebase/firestore';
import { db } from './firebaseConfig'; // Assuming firebase is configured here
import { StatusBar } from 'expo-status-bar';

// Define navigators
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Book Card Component
function BookCard({ book, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <Text style={styles.title}>{book.bookName}</Text>
      <Text style={styles.author}>{book.authorName}</Text>
    </TouchableOpacity>
  );
}

// Books List Screen Component
function BooksListScreen({ navigation }) {
  const [books, setBooks] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      const booksCollection = collection(db, 'books');
      const unsubscribe = onSnapshot(booksCollection, snapshot => {
        const booksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBooks(booksData);
      });

      return () => unsubscribe();
    }, [])
  );

  const renderItem = ({ item }) => (
    <BookCard
      book={item}
      onPress={() => navigation.navigate('BookDetail', { book: item })}
    />
  );

  return (
    <FlatList data={books} renderItem={renderItem} keyExtractor={item => item.id} />
  );
}

// Book Detail Screen Component
// Book Detail Screen Component
function BookDetailScreen({ route, navigation }) {
  const { book } = route.params;  // Get the book object from navigation params
  const [isBorrowed, setIsBorrowed] = useState(book.isBorrowed);
  const [borrowedCount, setBorrowedCount] = useState(0);  // Track the borrowed count

  // Fetch the number of borrowed books when the component mounts
  useEffect(() => {
    const fetchBorrowedBooksCount = async () => {
      const booksCollection = collection(db, 'books');
      const querySnapshot = await getDocs(booksCollection);

      // Filter out books that are borrowed
      const borrowedBooks = querySnapshot.docs.filter(doc => doc.data().isBorrowed === true);
      setBorrowedCount(borrowedBooks.length);  // Set the count of borrowed books
    };

    fetchBorrowedBooksCount();
  }, []);

  const borrowABook = async (id, newValue) => {
    if (borrowedCount >= 2) {
      alert("You can't borrow more than 2 books. Please return a book first.");
      return;
    }

    if (isBorrowed) {
      alert("You have already borrowed this book! Please return it first.");
      return;
    }

    const bookDocRef = doc(db, 'books', id);

    try {
      await updateDoc(bookDocRef, { isBorrowed: newValue });
      setIsBorrowed(newValue);
      alert(`Book has been ${newValue ? 'borrowed' : 'returned'} successfully.`);
    } catch (error) {
      console.error("Error updating document: ", error);
      alert("Failed to update book status. Please try again.");
    }
  };

  return (
    <View style={styles.detailContainer}>
      <Image source={{ uri: book.coverPage }} style={styles.coverImage} />
      <Text>{book.bookName}</Text>
      <Text>{book.authorName}</Text>
      <Text>Rating: {book.rating}</Text>
      <Text>{book.briefSummary}</Text>
      <Button
        title={isBorrowed ? 'Borrowed' : 'Borrow'}
        onPress={() => borrowABook(book.id, !book.isBorrowed)}
      />
    </View>
  );
}


function BorrowedScreen() {
  const [borrowedBooks, setBorrowedBooks] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchBorrowedBooks = async () => {
        const booksCollection = collection(db, 'books');
        const querySnapshot = await getDocs(booksCollection);

        // Filter out books that are not borrowed
        const booksData = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(book => book.isBorrowed == true);

        console.log(booksData);
        setBorrowedBooks(booksData);
      };

      fetchBorrowedBooks();

      // Cleanup function (if needed, for example, clearing data on screen focus loss)
      return () => {
        // Clean up any resources or cancel network requests if necessary
      };
    }, []),  // Empty dependency array ensures this effect runs only on focus
  );

  const returnBook = async (id) => {
    // Update the 'isBorrowed' field to false when a book is returned
    const bookDocRef = doc(db, 'books', id);
    await updateDoc(bookDocRef, {
      isBorrowed: false
    });

    // Remove the returned book from the list (local state)
    setBorrowedBooks(prevBooks => prevBooks.filter(book => book.id !== id));
  };

  const renderItem = ({ item }) => (
    <View style={styles.borrowedBookContainer}>
      <Text>{item.bookName} by {item.authorName}</Text>
      <Button title="Return" onPress={() => returnBook(item.id)} />
    </View>
  );

  return (
    <FlatList
      data={borrowedBooks}
      renderItem={renderItem}
      keyExtractor={item => item.id}
    />
  );
}
// Stack Navigator for Home
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="BooksList" component={BooksListScreen} options={{ title: 'Books List' }} />
      <Stack.Screen name="BookDetail" component={BookDetailScreen} options={{ title: 'Book Detail' }} />
    </Stack.Navigator>
  );
}

// Main App Navigator
function AppNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" options={{
        headerShown: false  // This will hide the header
      }} component={HomeStack} />
      <Tab.Screen name="Borrowed" component={BorrowedScreen} options={{ title: 'Borrowed Books' }} />
    </Tab.Navigator>
  );
}

// App Component
export default function App() {
  return (
    <NavigationContainer>
      <AppNavigator />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

// Styles
const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  author: {
    fontSize: 14,
    color: '#555',
  },
  detailContainer: {
    padding: 16,
  },
  coverImage: {
    alignSelf: 'center',
    width: 100,
    height: 150,
    marginBottom: 16,
  },
  borrowedBookContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});
