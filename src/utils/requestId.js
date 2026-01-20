/**
 * Generate a unique 10-character alphanumeric request ID
 * Format: Uppercase letters (A-Z) and numbers (0-9)
 * Example: A7K9M2X5P1
 */
export const generateRequestId = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let requestId = '';

    for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        requestId += characters[randomIndex];
    }

    return requestId;
};
