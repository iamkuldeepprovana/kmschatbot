import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

// More detailed logging about the MongoDB URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not defined');
  throw new Error('Please define the MONGODB_URI environment variable');
} else {
  // Log the MongoDB URI format without exposing credentials
  const sanitizedUri = MONGODB_URI.includes('@') 
    ? MONGODB_URI.substring(0, MONGODB_URI.indexOf('://') + 3) + '***:***@' + MONGODB_URI.substring(MONGODB_URI.indexOf('@') + 1)
    : 'Invalid URI format';
  
  console.log('MongoDB URI format:', sanitizedUri);
}

// Define the cache interface
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Add mongoose to NodeJS.Global interface
declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectToDatabase() {
  // Check connection state if it exists
  if (cached.conn) {
    const connectionState = cached.conn.connection.readyState;
    console.log('Existing MongoDB connection state:', getConnectionStateString(connectionState));
    
    // If connection is established, return it
    if (connectionState === 1) {
      console.log('Using existing MongoDB connection');
      return cached.conn;
    } else {
      console.log('Existing connection is not ready, creating new connection');
      cached.conn = null;
      cached.promise = null;
    }
  }
    if (!cached.promise) {
    const sanitizedUri = MONGODB_URI.includes('@') 
      ? MONGODB_URI.substring(0, MONGODB_URI.indexOf('://') + 3) + '***:***@' + MONGODB_URI.substring(MONGODB_URI.indexOf('@') + 1)
      : 'Invalid URI format';
      
    console.log('Establishing new MongoDB connection to:', sanitizedUri);
    
    // Connection options - keep these simple to avoid compatibility issues
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 15000, // Give up initial connection after 15 seconds
      connectTimeoutMS: 15000, // How long to wait for a connection
      socketTimeoutMS: 45000 // How long to wait for a socket operation
    };
    
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      const dbName = mongoose.connection.name || 'unknown';
      const host = mongoose.connection.host || 'unknown';
      console.log(`Successfully connected to MongoDB database '${dbName}' at ${host}`);
      return mongoose;
    }).catch(err => {
      console.error('Error in MongoDB connection promise:', err);
      throw err;
    });
  }
  
  try {
    cached.conn = await cached.promise;
    const connectionState = cached.conn.connection.readyState;
    console.log('MongoDB connection established with state:', getConnectionStateString(connectionState));
    
    // Log DB information
    console.log('Connected to database:', cached.conn.connection.name);
    console.log('MongoDB server:', cached.conn.connection.host);
    
    // Register connection event listeners for better debugging
    cached.conn.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    cached.conn.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    cached.conn.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
  } catch (e) {
    cached.promise = null;
    console.error('MongoDB connection error:', e);
    throw e;
  }

  return cached.conn;
}

// Helper function to convert connection state numbers to readable strings
function getConnectionStateString(state: number): string {
  switch (state) {
    case 0: return 'disconnected';
    case 1: return 'connected';
    case 2: return 'connecting';
    case 3: return 'disconnecting';
    default: return `unknown (${state})`;
  }
}

export default connectToDatabase;
export { getConnectionStateString };
