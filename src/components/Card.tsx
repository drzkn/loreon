import React from 'react';

interface CardProps {
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  className = '',
  children
}) => {
  return (
    <div className={`card ${className}`}>
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <p className="card-description">{description}</p>
        {children}
      </div>
    </div>
  );
};

export default Card;
