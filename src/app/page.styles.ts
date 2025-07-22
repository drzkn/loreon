import styled from 'styled-components';

export const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  background: var(--background);
  font-family: var(--font-geist-sans);
`;

export const ChatHeader = styled.header`
  padding: 1.5rem;
  background: var(--nav-active);
  backdrop-filter: blur(var(--backdrop-blur));
  border-bottom: 1px solid var(--nav-active-border);
  text-align: center;
`;

export const ChatTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-primary);
  margin: 0;
`;

export const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--nav-active-border);
    border-radius: 3px;
  }
`;

export const Message = styled.div<{ $isUser: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  max-width: 70%;
  align-self: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
`;

export const MessageAuthor = styled.div<{ $isUser: boolean }>`
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

export const MessageContent = styled.div<{ $isUser: boolean }>`
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  background: ${props => props.$isUser
    ? 'var(--success-500)'
    : 'var(--nav-active)'};
  color: ${props => props.$isUser
    ? 'white'
    : 'var(--text-primary)'};
  border: 1px solid ${props => props.$isUser
    ? 'var(--success-600)'
    : 'var(--nav-active-border)'};
  line-height: 1.5;
  word-wrap: break-word;
  backdrop-filter: blur(var(--backdrop-blur));
`;

export const MessageTime = styled.div`
  font-size: 0.7rem;
  color: var(--text-secondary);
  opacity: 0.7;
`;

export const InputContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--nav-active);
  backdrop-filter: blur(var(--backdrop-blur));
  border-top: 1px solid var(--nav-active-border);
  align-items: flex-end;
`;

export const ChatInput = styled.textarea`
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid var(--nav-active-border);
  border-radius: 1rem;
  background: var(--background);
  color: var(--text-primary);
  font-family: var(--font-geist-sans);
  font-size: 0.9rem;
  resize: none;
  min-height: 40px;
  max-height: 120px;
  
  &::placeholder {
    color: var(--text-secondary);
    opacity: 0.7;
  }
  
  &:focus {
    outline: none;
    border-color: var(--success-500);
    box-shadow: 0 0 0 2px var(--success-500)33;
  }
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--nav-active-border);
    border-radius: 2px;
  }
`;

export const SendButton = styled.button`
  padding: 0.75rem;
  background: var(--success-500);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: var(--success-600);
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &:disabled {
    background: var(--nav-active-border);
    cursor: not-allowed;
    opacity: 0.5;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--success-500)33;
  }
`; 