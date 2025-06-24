import React from 'react';
const MessageList = ({ messages, currentUser }) => {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {messages.map((msg, index) => {
        const isOwn = msg.senderId === currentUser.uid;
        return (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: isOwn ? 'row-reverse' : 'row',
              alignItems: 'flex-end',
              gap: '10px',
              maxWidth: '70%',
              alignSelf: isOwn ? 'flex-end' : 'flex-start',
            }}
          >
            {!isOwn && (
              <img
                src={msg.senderProfileUrl}
                alt={msg.senderName}
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
              />
            )}
            <div
              style={{
                backgroundColor: isOwn ? '#007AFF' : '#3a3a3a',
                color: 'white',
                borderRadius: '16px',
                padding: '10px 14px',
                wordBreak: 'break-word',
              }}
            >
              {msg.text}
              <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7, textAlign: 'right' }}>
                {new Date(msg.createdAt?.toDate ? msg.createdAt.toDate() : msg.createdAt).toLocaleTimeString()}
              </div>
            </div>
            {isOwn && (
              <img
                src={msg.senderProfileUrl}
                alt={msg.senderName}
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;
