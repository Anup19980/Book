import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Alert,
} from 'react-native';
import {
    getAuth,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import {
    getFirestore,
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    arrayUnion,
    arrayRemove,
} from 'firebase/firestore';
import { FontAwesome5 } from '@expo/vector-icons'; // For favorite icon

const firestore = getFirestore();
const auth = getAuth();

const HomeScreen = ({ navigation }) => {
    const [events, setEvents] = useState([]);
    const [favourites, setFavourites] = useState([]);
    const [newEvent, setNewEvent] = useState('');
    const [editEventId, setEditEventId] = useState(null);
    const [editEventText, setEditEventText] = useState('');
    const [error, setError] = useState('');
    const currentUser = auth.currentUser;

    // Fetch events from Firestore
    useEffect(() => {
        const eventsRef = collection(firestore, 'events');

        const unsubscribe = onSnapshot(eventsRef, (snapshot) => {
            const fetchedEvents = [];
            snapshot.forEach((doc) => {
                fetchedEvents.push({ id: doc.id, ...doc.data() });
            });
            setEvents(fetchedEvents);

            const fetchedFavourites = fetchedEvents
                .filter((event) => event.isFavourite && event.userId === currentUser?.uid)
                .map((event) => event.id);
            setFavourites(fetchedFavourites);
        });

        return unsubscribe; // Cleanup listener
    }, [currentUser]);

    // Add a new event
    const addEvent = async () => {
        if (!newEvent.trim()) {
            setError('Event text is required!');
            return;
        }

        try {
            await addDoc(collection(firestore, 'events'), {
                title: newEvent.trim(),
                userId: currentUser.uid,
                createdAt: new Date(),
                isFavourite: false,
            });
            setNewEvent('');
            setError('');
        } catch (err) {
            setError(err.message);
        }
    };

    // Edit an event
    const editEvent = async (eventId) => {
        if (!editEventText.trim()) {
            setError('Event text is required for editing!');
            return;
        }

        try {
            const eventRef = doc(firestore, 'events', eventId);
            await updateDoc(eventRef, {
                title: editEventText.trim(),
            });
            setEditEventId(null);
            setEditEventText('');
            setError('');
        } catch (err) {
            setError(err.message);
        }
    };

    // Remove an event
    const removeEvent = async (eventId) => {
        try {
            const eventRef = doc(firestore, 'events', eventId);
            await deleteDoc(eventRef);
        } catch (err) {
            setError(err.message);
        }
    };

    // Add or remove favourite
    const toggleFavourite = async (eventId) => {
        try {
            const eventRef = doc(firestore, 'events', eventId);
            const event = events.find((e) => e.id === eventId);

            await updateDoc(eventRef, {
                isFavourite: !event.isFavourite,
            });

            if (!event.isFavourite) {
                setFavourites((prev) => [...prev, eventId]);
            } else {
                setFavourites((prev) => prev.filter((id) => id !== eventId));
            }
        } catch (err) {
            setError(err.message);
        }
    };

    // Log out
    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigation.replace('Login');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>My Events</Text>

            {/* Add Event Input */}
            <TextInput
                placeholder="Enter a new event"
                value={newEvent}
                onChangeText={setNewEvent}
                style={styles.input}
            />
            <TouchableOpacity style={styles.addButton} onPress={addEvent}>
                <Text style={styles.addButtonText}>Add Event</Text>
            </TouchableOpacity>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Events List */}
            <FlatList
                data={events}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.eventItem}>
                        {editEventId === item.id ? (
                            <>
                                <TextInput
                                    value={editEventText}
                                    onChangeText={setEditEventText}
                                    style={styles.input}
                                />
                                <View style={styles.actions}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => editEvent(item.id)}
                                    >
                                        <Text style={styles.actionButtonText}>Save</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => setEditEventId(null)}
                                    >
                                        <Text style={styles.actionButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <>
                                <Text style={styles.eventText}>{item.title}</Text>
                                {item.userId === currentUser.uid && (
                                    <View style={styles.actions}>
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => {
                                                setEditEventId(item.id);
                                                setEditEventText(item.text);
                                            }}
                                        >
                                            <Text style={styles.actionButtonText}>Edit</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => removeEvent(item.id)}
                                        >
                                            <Text style={styles.actionButtonText}>Remove</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                <TouchableOpacity
                                    style={styles.favouriteButton}
                                    onPress={() => toggleFavourite(item.id)}
                                >
                                    <FontAwesome5
                                        name={favourites.includes(item.id) ? 'heart' : 'heart-broken'}
                                        size={20}
                                        color="red"
                                    />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}
            />

            {/* Favourites List */}
            <Text style={styles.subtitle}>Favourite Events</Text>
            <FlatList
                data={events.filter((event) => favourites.includes(event.id))}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.eventItem}>
                        <Text style={styles.eventText}>{item.title}</Text>
                        <TouchableOpacity
                            style={styles.favouriteButton}
                            onPress={() => toggleFavourite(item.id)}
                        >
                            <FontAwesome5
                                name="heart"
                                size={20}
                                color="red"
                            />
                        </TouchableOpacity>
                    </View>
                )}
            />

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f9f9f9',
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    subtitle: {
        fontSize: 22,
        marginTop: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    input: {
        height: 40,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        paddingLeft: 10,
        marginBottom: 15,
        backgroundColor: '#fff',
    },
    addButton: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    eventItem: {
        backgroundColor: '#fff',
        padding: 15,
        marginVertical: 10,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    eventText: {
        fontSize: 16,
        color: '#333',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    actionButton: {
        backgroundColor: '#2196F3',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    favouriteButton: {
        marginTop: 10,
        alignItems: 'center',
    },
    error: {
        color: 'red',
        marginVertical: 8,
    },
    logoutButton: {
        backgroundColor: '#f44336',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    logoutButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default HomeScreen;
