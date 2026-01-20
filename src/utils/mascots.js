
const maleMascotsGlob = import.meta.glob('../assets/Mascots/Male/*.png', { eager: true });
const femaleMascotsGlob = import.meta.glob('../assets/Mascots/Female/*.png', { eager: true });

// Helper to extract filename and create a map
const createMascotMap = (globResults) => {
    const map = {};
    const list = [];

    Object.keys(globResults).forEach(path => {
        const filename = path.split('/').pop();
        const src = globResults[path].default;
        map[filename] = src;
        list.push(filename);
    });

    return { map, list };
};

const maleData = createMascotMap(maleMascotsGlob);
const femaleData = createMascotMap(femaleMascotsGlob);

// Unified map for easy lookup by filename
export const ALL_MASCOTS = { ...maleData.map, ...femaleData.map };

/**
 * Returns a random mascot filename for the given gender.
 * @param {string} gender - 'male' or 'female'
 * @returns {string} filename - e.g. "ToyFaces_Tansparent_BG_29.png"
 */
export const getRandomMascot = (gender = 'male') => {
    const list = gender.toLowerCase() === 'female' ? femaleData.list : maleData.list;
    if (list.length === 0) return null;
    return list[Math.floor(Math.random() * list.length)];
};

/**
 * Returns the resolved image source URL for a given filename.
 * @param {string} filename 
 * @returns {string} src url
 */
export const getMascotUrl = (filename) => {
    return ALL_MASCOTS[filename] || null;
};
