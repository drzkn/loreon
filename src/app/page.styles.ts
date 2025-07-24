import styled from 'styled-components';

export const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: calc(100vw - var(--nav-width, 60px));
  position: fixed;
  top: 0;
  left: var(--nav-width, 60px);
  background: var(--background);
  font-family: var(--font-geist-sans);
  overflow: hidden;
`;

export const ChatHeader = styled.header`
  padding: 1rem 0;
  background: var(--background);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(10px);
`;

export const ChatTitle = styled.h1`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  text-align: center;
  letter-spacing: -0.025em;
`;

export const ChatSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  
  &::-webkit-scrollbar {
    width: 3px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

export const Message = styled.div<{ $isUser: boolean }>`
  display: flex;
  padding: 1rem 1.5rem;
  gap: 0.75rem;
  max-width: 65%;
  width: fit-content;
  margin: ${props => props.$isUser ? '0.5rem 4rem 0.5rem auto' : '0.5rem auto 0.5rem 4rem'};
  flex-direction: ${props => props.$isUser ? 'row-reverse' : 'row'};
  
  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    gap: 0.5rem;
    max-width: 80%;
    margin: ${props => props.$isUser ? '0.5rem 1rem 0.5rem auto' : '0.5rem auto 0.5rem 1rem'};
  }
`;

export const MessageAuthor = styled.div<{ $isUser: boolean }>`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
  background: ${props => props.$isUser
    ? 'linear-gradient(135deg, #10b981, #059669)'
    : 'linear-gradient(135deg, #8b5cf6, #7c3aed)'};
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  align-self: flex-end;
  margin-bottom: 0.5rem;
`;

export const MessageBubble = styled.div<{ $isUser: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const MessageContent = styled.div<{ $isUser: boolean }>`
  background: ${props => props.$isUser
    ? 'linear-gradient(135deg, #059669, #047857)'
    : 'rgba(255, 255, 255, 0.05)'};
  color: ${props => props.$isUser ? '#ffffff' : 'var(--text-primary)'};
  padding: 0.75rem 1rem;
  border-radius: ${props => props.$isUser
    ? '1.25rem 1.25rem 0.25rem 1.25rem'
    : '1.25rem 1.25rem 1.25rem 0.25rem'};
  line-height: 1.6;
  font-size: 1rem;
  letter-spacing: 0.01em;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  ${props => props.$isUser && `
    font-weight: 500;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  `}
`;

export const MessageTime = styled.div<{ $isUser: boolean }>`
  font-size: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.6;
  font-weight: 400;
  text-align: ${props => props.$isUser ? 'right' : 'left'};
  padding: 0 0.25rem;
`;

export const ActionsSection = styled.div`
  background: var(--background);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1.5rem;
  min-height: auto;
`;

export const InputContainer = styled.div`
  max-width: 48rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem;
  padding: 0.75rem;
  transition: all 0.2s ease;
  
  &:focus-within {
    border-color: rgba(16, 185, 129, 0.4);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    background: rgba(255, 255, 255, 0.05);
  }
`;

export const ChatInput = styled.textarea`
  flex: 1;
  padding: 0.5rem;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-family: var(--font-geist-sans);
  font-size: 0.95rem;
  line-height: 1.5;
  resize: none;
  min-height: 2.5rem;
  max-height: 8rem;
  outline: none;
  
  &::placeholder {
    color: var(--text-secondary);
    opacity: 0.6;
  }
  
  &::-webkit-scrollbar {
    width: 3px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }
`;

export const SendButton = styled.button`
  width: 2.5rem;
  height: 2.5rem;
  background: ${props => props.disabled
    ? 'rgba(255, 255, 255, 0.1)'
    : 'linear-gradient(135deg, #10b981, #059669)'};
  color: ${props => props.disabled ? 'rgba(255, 255, 255, 0.4)' : 'white'};
  border: none;
  border-radius: 50%;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  box-shadow: ${props => props.disabled
    ? 'none'
    : '0 2px 8px rgba(16, 185, 129, 0.3)'};
  
  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }
  
  &:active:not(:disabled) {
    transform: scale(0.95);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  }
`;

export const WelcomeMessage = styled.div`
  text-align: center;
  padding: 2rem 2rem;
  max-width: 32rem;
  margin: 0 auto;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
`;

export const WelcomeTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  letter-spacing: -0.025em;
`;

export const WelcomeSubtitle = styled.p`
  font-size: 0.95rem;
  line-height: 1.6;
  opacity: 0.8;
`; 