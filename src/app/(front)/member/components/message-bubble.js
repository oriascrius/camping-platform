'use client';

import React from 'react';
import '../styles/customer-service.scss';

const MessageBubble = ({ type, avatar, nickname, content }) => {
  return (
    <div className={`message-wrapper ${type}`}>
      <div className={`message-header ${type}`}>
        {type === 'official' && <img src={avatar} alt={type} />}
        <div className="message-nickname">{nickname}</div>
        {type === 'user' && <img src={avatar} alt={type} />}
      </div>
      <div className={`message-body ${type}`}>
        <p>{content}</p>
      </div>
    </div>
  );
};

export default MessageBubble;
