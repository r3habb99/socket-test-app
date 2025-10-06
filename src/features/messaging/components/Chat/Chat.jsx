
import { useSocketContext } from "../../../../core/providers/SocketProvider";
import { UserProfileModal } from "../UserProfileModal";
import { useChatLogic } from "./ChatLogic";
import { useChatHandlers } from "./ChatHandlers";
import { useMessageHandlers } from "./MessageHandlers";
import { ChatHeader, MessageInput, MessagesContainer } from "./ChatUI";
import { CallModal, CallDebugger } from "../WebRTC";
import { useCall } from "../../hooks";
// import { SocketDebugPanel } from "../SocketDebugPanel";
import "./Chat.css";

export const Chat = ({ selectedChat, onBackClick }) => {
  const socketContext = useSocketContext();
  // Define showDebug state at the top level, not conditionally
  // const [showDebug] = useState(process.env.NODE_ENV === 'development');

  // Use the custom hooks to get all the logic and state
  const {
    message,
    setMessage,
    loadingMessages,
    setLoadingMessages,
    showProfileModal,
    setShowProfileModal,
    typingTimeout,
    setTypingTimeout,
    isAtTop,
    setIsAtTop,
    messagesEndRef,
    messagesContainerRef,
    userId,
    chatPartner,
    scrollToBottom,
    handleScrollToTop,
    lastLoadedChatIdRef,
    loadMessagesForChat,
    messages // Added messages from useChatLogic
  } = useChatLogic(selectedChat, socketContext);

  // Get chat event handlers
  const {
    handleTyping
  } = useChatHandlers({
    selectedChat,
    socketContext,
    message,
    setMessage,
    typingTimeout,
    setTypingTimeout,
    scrollToBottom,
    messagesContainerRef,
    setIsAtTop,
    handleScrollToTop,
    lastLoadedChatIdRef,
    loadMessagesForChat,
    setLoadingMessages
  });

  // Get message handling functions
  const {
    handleSendMessage,
    handleKeyPress,
    formatMessageDate,
    getMessageDate
  } = useMessageHandlers({
    selectedChat,
    socketContext,
    message,
    setMessage,
    userId,
    scrollToBottom,
    handleTyping
  });

  // WebRTC functionality
  const webrtcCall = useCall({
    onIncomingCall: (callData) => {
      console.log('Incoming call in Chat component:', callData);
    },
    onCallStateChange: (state) => {
      console.log('Call state changed in Chat component:', state);
    }
  });

  // Call handlers
  const handleStartVideoCall = (toUserId, chatId) => {
    console.log('Starting video call to:', toUserId, 'in chat:', chatId);
    webrtcCall.startVideoCall(toUserId, chatId);
  };

  const handleStartAudioCall = (toUserId, chatId) => {
    console.log('Starting audio call to:', toUserId, 'in chat:', chatId);
    webrtcCall.startAudioCall(toUserId, chatId);
  };

  // Check if a chat is selected
  if (!selectedChat) {
    return (
      <div className="chat-container">
        Please select a chat to start messaging.
      </div>
    );
  }

  // Debug mode is already defined at the top level

  return (
    <div className="chat-container">
      <ChatHeader
        selectedChat={selectedChat}
        chatPartner={chatPartner}
        onBackClick={onBackClick}
        socketContext={socketContext}
        setShowProfileModal={setShowProfileModal}
        onStartVideoCall={handleStartVideoCall}
        onStartAudioCall={handleStartAudioCall}
        isCallAvailable={webrtcCall.isAvailableForCalls()}
      />

      <MessagesContainer
        loadingMessages={loadingMessages}
        socketContext={socketContext}
        messagesContainerRef={messagesContainerRef}
        messagesEndRef={messagesEndRef}
        isAtTop={isAtTop}
        userId={userId}
        formatMessageDate={formatMessageDate}
        getMessageDate={getMessageDate}
        messages={messages} // Pass messages explicitly
      />

      <MessageInput
        message={message}
        setMessage={setMessage}
        handleKeyPress={handleKeyPress}
        handleSendMessage={handleSendMessage}
        socketContext={socketContext}
      />

      {/* User Profile Modal */}
      {showProfileModal && chatPartner && (
        <UserProfileModal
          user={chatPartner}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* WebRTC Call Modal */}
      <CallModal
        show={webrtcCall.showCallModal}
        callType={webrtcCall.currentCall?.callType}
        modalType={webrtcCall.callModalType}
        callState={webrtcCall.callState}
        currentCall={webrtcCall.currentCall}
        incomingCall={webrtcCall.incomingCall}
        localVideoRef={webrtcCall.localVideoRef}
        remoteVideoRef={webrtcCall.remoteVideoRef}
        isVideoEnabled={webrtcCall.isVideoEnabled}
        isAudioEnabled={webrtcCall.isAudioEnabled}
        onAccept={webrtcCall.acceptCall}
        onReject={webrtcCall.rejectCall}
        onEnd={webrtcCall.endCall}
        onToggleVideo={webrtcCall.toggleVideo}
        onToggleAudio={webrtcCall.toggleAudio}
        onClose={webrtcCall.closeCallModal}
      />

      {/* Socket Debug Panel - only shown in development mode */}
      {/* {showDebug && <SocketDebugPanel />} */}

      {/* WebRTC Call Debugger for testing */}
      <CallDebugger />
    </div>
  );
};
