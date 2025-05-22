/**
 * Socket debugging utilities
 * These utilities help with debugging socket connections and events
 */

// Debug mode flag - set to true to enable debug logging
let DEBUG_MODE = false;

/**
 * Enable or disable debug mode
 * @param {boolean} enabled - Whether debug mode should be enabled
 */
export const setDebugMode = (enabled) => {
  DEBUG_MODE = enabled;
  
  // Store the setting in localStorage to persist across page refreshes
  localStorage.setItem('socket_debug_mode', enabled ? 'true' : 'false');
  
  console.log(`Socket debug mode ${enabled ? 'enabled' : 'disabled'}`);
};

/**
 * Check if debug mode is enabled
 * @returns {boolean} - Whether debug mode is enabled
 */
export const isDebugMode = () => {
  // Check localStorage first, then fall back to the variable
  const storedValue = localStorage.getItem('socket_debug_mode');
  return storedValue === 'true' || DEBUG_MODE;
};

/**
 * Initialize debug mode from localStorage
 */
export const initDebugMode = () => {
  const storedValue = localStorage.getItem('socket_debug_mode');
  if (storedValue === 'true') {
    DEBUG_MODE = true;
    console.log('Socket debug mode initialized from localStorage: enabled');
  }
};

/**
 * Log a debug message if debug mode is enabled
 * @param {string} message - The message to log
 * @param {any} data - Optional data to log
 */
export const debugLog = (message, data) => {
  if (!isDebugMode()) return;
  
  if (data) {
    console.log(`[SOCKET DEBUG] ${message}`, data);
  } else {
    console.log(`[SOCKET DEBUG] ${message}`);
  }
};

/**
 * Log a socket event if debug mode is enabled
 * @param {string} eventName - The name of the socket event
 * @param {any} data - The data associated with the event
 * @param {string} direction - The direction of the event ('in' or 'out')
 */
export const logSocketEvent = (eventName, data, direction = 'in') => {
  if (!isDebugMode()) return;
  
  const directionSymbol = direction === 'out' ? '➡️' : '⬅️';
  console.log(`[SOCKET ${direction.toUpperCase()}] ${directionSymbol} ${eventName}`, data);
};

/**
 * Create a socket event logger middleware
 * @param {Object} socket - The socket.io socket instance
 * @returns {Object} - The same socket instance with logging added
 */
export const addSocketLogging = (socket) => {
  if (!socket) return socket;
  
  // Save the original emit function
  const originalEmit = socket.emit;
  
  // Override the emit function to add logging
  socket.emit = function(eventName, ...args) {
    // Log outgoing events (except for internal socket.io events)
    if (!eventName.startsWith('socket.') && eventName !== 'ping' && eventName !== 'pong') {
      logSocketEvent(eventName, args.length > 0 ? args[0] : undefined, 'out');
    }
    
    // Call the original emit function
    return originalEmit.apply(this, [eventName, ...args]);
  };
  
  // Add a listener for all incoming events
  const originalOnevent = socket.onevent;
  socket.onevent = function(packet) {
    const args = packet.data || [];
    const eventName = args[0];
    
    // Log incoming events (except for internal socket.io events)
    if (eventName && !eventName.startsWith('socket.') && eventName !== 'ping' && eventName !== 'pong') {
      logSocketEvent(eventName, args.length > 1 ? args[1] : undefined, 'in');
    }
    
    // Call the original onevent function
    return originalOnevent.apply(this, [packet]);
  };
  
  return socket;
};

/**
 * Track room join/leave events
 */
const joinedRooms = new Set();

/**
 * Track a room join event
 * @param {string} roomId - The ID of the room that was joined
 */
export const trackRoomJoin = (roomId) => {
  joinedRooms.add(roomId);
  debugLog(`Joined room: ${roomId}`);
  debugLog(`Currently joined rooms: ${Array.from(joinedRooms).join(', ')}`);
};

/**
 * Track a room leave event
 * @param {string} roomId - The ID of the room that was left
 */
export const trackRoomLeave = (roomId) => {
  joinedRooms.delete(roomId);
  debugLog(`Left room: ${roomId}`);
  debugLog(`Currently joined rooms: ${Array.from(joinedRooms).join(', ')}`);
};

/**
 * Check if a room is joined
 * @param {string} roomId - The ID of the room to check
 * @returns {boolean} - Whether the room is joined
 */
export const isRoomJoined = (roomId) => {
  return joinedRooms.has(roomId);
};

/**
 * Get all joined rooms
 * @returns {Array<string>} - Array of joined room IDs
 */
export const getJoinedRooms = () => {
  return Array.from(joinedRooms);
};

// Initialize debug mode when this module is loaded
initDebugMode();
