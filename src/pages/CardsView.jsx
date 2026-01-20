import React, { useState } from 'react';
import Card from '../components/dashboard/Card';

const CardsView = () => {
    // Generate 10 dummy cards with unique numbering
    const cards = Array.from({ length: 10 }, (_, i) => ({
        title: `Brand DNA ${i + 1}`,
        description: "Generate on-brand creatives and campaigns"
    }));

    const [selectedIndex, setSelectedIndex] = useState(null);

    return (
        <div className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-10 place-content-start">
                {cards.map((card, index) => (
                    <Card
                        key={index}
                        title={card.title}
                        description={card.description}
                        active={selectedIndex === index}
                        onClick={() => setSelectedIndex(index)}
                    />
                ))}
            </div>
        </div>
    );
};

export default CardsView;
