import React from 'react';
import { ReviewCardProps } from '@/types/sectionComponents';
import '@components/sections/reviewCard/ReviewCard.css';

const ReviewCard = ({ text, rating = 5, author = 'Anónimo' }: ReviewCardProps) => {
    return (
        
        <div className="review-card">
            <p className="review-text">{text}</p>
            <div className='review-footer'>
                <p className="review-author">— {author}</p>
                <div className="stars">
                    {[...Array(rating)].map((_, i) => (
                        <span key={i} className="star">★</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReviewCard;
