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
  padding: 1.5rem 1rem;
  gap: 1rem;
  max-width: 48rem;
  margin: 0 auto;
  width: 100%;
  
  ${props => props.$isUser && `
    background: rgba(255, 255, 255, 0.02);
  `}
  
  @media (max-width: 768px) {
    padding: 1rem;
    gap: 0.75rem;
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
`;

export const MessageContent = styled.div<{ $isUser: boolean }>`
  flex: 1;
  color: var(--text-primary);
  line-height: 1.7;
  font-size: 0.95rem;
  letter-spacing: 0.01em;
  
  ${props => props.$isUser && `
    font-weight: 500;
  `}
`;

export const MessageTime = styled.div`
  font-size: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.6;
  margin-top: 0.5rem;
  font-weight: 400;
`;

export const InputContainer = styled.div`
  padding: 1.5rem;
  background: var(--background);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky;
  bottom: 0;
  backdrop-filter: blur(10px);
`;

export const InputWrapper = styled.div`
  max-width: 48rem;
  margin: 0 auto;
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
`;

export const ChatInput = styled.textarea`
  flex: 1;
  padding: 1rem 1.25rem;
  padding-right: 3rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  font-family: var(--font-geist-sans);
  font-size: 0.95rem;
  line-height: 1.5;
  resize: none;
  min-height: 3rem;
  max-height: 8rem;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  
  &::placeholder {
    color: var(--text-secondary);
    opacity: 0.6;
  }
  
  &:focus {
    outline: none;
    border-color: rgba(16, 185, 129, 0.4);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    background: rgba(255, 255, 255, 0.08);
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
  position: absolute;
  right: 0.5rem;
  bottom: 0.5rem;
  width: 2rem;
  height: 2rem;
  background: ${props => props.disabled
    ? 'rgba(255, 255, 255, 0.1)'
    : 'linear-gradient(135deg, #10b981, #059669)'};
  color: ${props => props.disabled ? 'rgba(255, 255, 255, 0.4)' : 'white'};
  border: none;
  border-radius: 50%;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
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