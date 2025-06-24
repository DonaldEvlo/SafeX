import React, { useState } from 'react';

const MessageForm = ({ onSend }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() === '') return;
    onSend(text.trim());
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', padding: '12px', borderTop: '1px solid #3a3a3a' }}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message"
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: '20px',
          border: 'none',
          outline: 'none',
          backgroundColor: '#3a3a3a',
          color: 'white',
          fontSize: '14px',
        }}
      />
      <button
        type="submit"
        style={{
          marginLeft: '8px',
          backgroundColor: '#007AFF',
          color: 'white',
          border: 'none',
          borderRadius: '20px',
          padding: '10px 18px',
          cursor: 'pointer',
          fontWeight: '600',
        }}
      >
        Send
      </button>
    </form>
  );
};

export default MessageForm;
