import React, { useState } from 'react';

const Chat = () => {
  const [selectedContact, setSelectedContact] = useState('Ryan Bennett');
  const [message, setMessage] = useState('');

  const contacts = [
    { name: 'Ryan Bennett', lastMessage: 'Last message preview...', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { name: 'Olivia Carter', lastMessage: 'Last message preview...', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { name: 'Owen Davis', lastMessage: 'Last message preview...', avatar: 'https://randomuser.me/api/portraits/men/25.jpg' },
    { name: 'Chloe Foster', lastMessage: 'Last message preview...', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
    { name: 'Nathan Hughes', lastMessage: 'Last message preview...', avatar: 'https://randomuser.me/api/portraits/men/15.jpg' },
    { name: 'Ava Jenkins', lastMessage: 'Last message preview...', avatar: 'https://randomuser.me/api/portraits/women/23.jpg' },
    { name: 'Liam Knight', lastMessage: 'Last message preview...', avatar: 'https://randomuser.me/api/portraits/men/67.jpg' },
    { name: 'Mia Lawson', lastMessage: 'Last message preview...', avatar: 'https://randomuser.me/api/portraits/women/32.jpg' },
    { name: 'Lucas Morgan', lastMessage: 'Last message preview...', avatar: 'https://randomuser.me/api/portraits/men/41.jpg' },
    { name: 'Sophie Nolan', lastMessage: 'Last message preview...', avatar: 'https://randomuser.me/api/portraits/women/55.jpg' }
  ];

  const messages = [
    { sender: 'Ryan Bennett', text: "Hey there! How's it going?", isOwn: false },
    { sender: 'You', text: "Hi Ryan! I'm doing great, thanks! How about you?", isOwn: true },
    { sender: 'Ryan Bennett', text: "I'm doing well too, just finished a big project at work. What have you been up to?", isOwn: false },
    { sender: 'You', text: "That's awesome! I've been working on a new design project, it's been pretty challenging but rewarding.", isOwn: true },
    { sender: 'Ryan Bennett', text: "Sounds interesting! What kind of design project is it?", isOwn: false },
    { sender: 'You', text: "It's a web application for secure chatting, actually. Trying to make it user-friendly and secure at the same time.", isOwn: true },
    { sender: 'Ryan Bennett', text: "No way! That's exactly what I'm working on too! What a coincidence!", isOwn: false },
    { sender: 'You', text: "That's crazy! Maybe we can share some ideas?", isOwn: true }
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  const styles = {
    chatContainer: {
      display: 'flex',
      height: '100vh',
      width: '100%',
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    sidebar: {
      width: '320px',
      backgroundColor: '#2a2a2a',
      borderRight: '1px solid #3a3a3a',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0
    },
    searchContainer: {
      padding: '16px',
      borderBottom: '1px solid #3a3a3a'
    },
    searchBar: {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#3a3a3a',
      borderRadius: '8px',
      padding: '0 12px',
      height: '40px'
    },
    searchIcon: {
      width: '18px',
      height: '18px',
      color: '#8a8a8a',
      marginRight: '8px',
      strokeWidth: '2'
    },
    searchInput: {
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: '#ffffff',
      flex: '1',
      fontSize: '14px'
    },
    contactList: {
      flex: '1',
      overflowY: 'auto'
    },
    contactItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px 16px',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      borderBottom: '1px solid #353535'
    },
    activeContact: {
      backgroundColor: '#404040'
    },
    contactAvatar: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      marginRight: '12px',
      objectFit: 'cover'
    },
    contactInfo: {
      flex: '1',
      minWidth: '0'
    },
    contactName: {
      margin: '0 0 4px 0',
      fontSize: '16px',
      fontWeight: '500',
      color: '#ffffff',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    lastMessage: {
      margin: '0',
      fontSize: '13px',
      color: '#8a8a8a',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    chatArea: {
      flex: '1',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#1a1a1a',
      minWidth: 0
    },
    chatHeader: {
      padding: '16px 24px',
      borderBottom: '1px solid #3a3a3a',
      backgroundColor: '#2a2a2a',
      flexShrink: 0
    },
    chatTitle: {
      margin: '0 0 4px 0',
      fontSize: '24px',
      fontWeight: '600',
      color: '#ffffff'
    },
    onlineStatus: {
      margin: '0',
      fontSize: '14px',
      color: '#4ade80'
    },
    messagesContainer: {
      flex: '1',
      overflowY: 'auto',
      padding: '24px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    messageWrapper: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '12px',
      width: '100%'
    },
    ownMessage: {
      flexDirection: 'row-reverse'
    },
    otherMessage: {
      flexDirection: 'row'
    },
    messageAvatar: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      objectFit: 'cover',
      flexShrink: 0
    },
    messageContent: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      maxWidth: '70%',
      minWidth: '200px'
    },
    ownMessageContent: {
      alignItems: 'flex-end'
    },
    otherMessageContent: {
      alignItems: 'flex-start'
    },
    messageSender: {
      margin: '0',
      fontSize: '12px',
      color: '#8a8a8a',
      fontWeight: '500'
    },
    messageBubble: {
      padding: '12px 16px',
      borderRadius: '18px',
      fontSize: '14px',
      lineHeight: '1.4',
      wordWrap: 'break-word',
      wordBreak: 'break-word'
    },
    ownBubble: {
      backgroundColor: '#007AFF',
      color: '#ffffff'
    },
    otherBubble: {
      backgroundColor: '#3a3a3a',
      color: '#ffffff'
    },
    messageInputContainer: {
      padding: '16px 24px',
      borderTop: '1px solid #3a3a3a',
      backgroundColor: '#2a2a2a',
      flexShrink: 0
    },
    messageInputWrapper: {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#3a3a3a',
      borderRadius: '24px',
      padding: '8px 16px',
      gap: '12px'
    },
    messageInput: {
      flex: '1',
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: '#ffffff',
      fontSize: '14px',
      padding: '8px 0'
    },
    attachIcon: {
      width: '20px',
      height: '20px',
      color: '#8a8a8a',
      cursor: 'pointer',
      strokeWidth: '2',
      transition: 'color 0.2s ease'
    },
    sendButton: {
      backgroundColor: '#007AFF',
      color: '#ffffff',
      border: 'none',
      borderRadius: '16px',
      padding: '8px 16px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease'
    }
  };

  return (
    <div style={styles.chatContainer}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        {/* Search Bar */}
        <div style={styles.searchContainer}>
          <div style={styles.searchBar}>
            <svg style={styles.searchIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search" 
              style={styles.searchInput}
            />
          </div>
        </div>

        {/* Contact List */}
        <div style={styles.contactList}>
          {contacts.map((contact, index) => (
            <div 
              key={index} 
              style={{
                ...styles.contactItem,
                ...(selectedContact === contact.name ? styles.activeContact : {})
              }}
              onClick={() => setSelectedContact(contact.name)}
            >
              <img 
                src={contact.avatar} 
                alt={contact.name}
                style={styles.contactAvatar}
              />
              <div style={styles.contactInfo}>
                <h3 style={styles.contactName}>{contact.name}</h3>
                <p style={styles.lastMessage}>{contact.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div style={styles.chatArea}>
        {/* Chat Header */}
        <div style={styles.chatHeader}>
          <h2 style={styles.chatTitle}>Ryan Bennett</h2>
          <p style={styles.onlineStatus}>Online</p>
        </div>

        {/* Messages */}
        <div style={styles.messagesContainer}>
          {messages.map((msg, index) => (
            <div key={index} style={{
              ...styles.messageWrapper,
              ...(msg.isOwn ? styles.ownMessage : styles.otherMessage)
            }}>
              {!msg.isOwn && (
                <img 
                  src="https://randomuser.me/api/portraits/men/32.jpg" 
                  alt="Ryan Bennett"
                  style={styles.messageAvatar}
                />
              )}
              <div style={{
                ...styles.messageContent,
                ...(msg.isOwn ? styles.ownMessageContent : styles.otherMessageContent)
              }}>
                <p style={styles.messageSender}>{msg.sender}</p>
                <div style={{
                  ...styles.messageBubble,
                  ...(msg.isOwn ? styles.ownBubble : styles.otherBubble)
                }}>
                  {msg.text}
                </div>
              </div>
              {msg.isOwn && (
                <img 
                  src="https://randomuser.me/api/portraits/women/44.jpg" 
                  alt="You"
                  style={styles.messageAvatar}
                />
              )}
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div style={styles.messageInputContainer}>
          <div style={styles.messageInputWrapper}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message"
              style={styles.messageInput}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <svg style={styles.attachIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49"/>
            </svg>
            <button 
              style={styles.sendButton}
              onClick={handleSendMessage}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;