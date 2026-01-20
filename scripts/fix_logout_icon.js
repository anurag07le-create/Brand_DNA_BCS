const fs = require('fs');
const path = require('path');

const iconsDir = path.join(process.cwd(), 'src', 'assets', 'icons');
// The source file name as seen in previous listings
const sourceName = 'Property 2=Log out, Property 1=Default.png';
const destName = 'logout.png';

const srcPath = path.join(iconsDir, sourceName);
const destPath = path.join(iconsDir, destName);

if (fs.existsSync(srcPath)) {
    try {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Successfully copied "${sourceName}" to "${destName}"`);
    } catch (err) {
        console.error(`Error copying file: ${err.message}`);
    }
} else {
    // Try to find it loosely if exact match fails
    console.log(`Exact match not found for: ${sourceName}`);
    console.log('Listing related files:');
    const files = fs.readdirSync(iconsDir);
    const related = files.filter(f => f.includes('Log out'));
    related.forEach(f => console.log(` - ${f}`));

    if (related.length > 0) {
        try {
            fs.copyFileSync(path.join(iconsDir, related[0]), destPath);
            console.log(`Copied partial match "${related[0]}" to "${destName}"`);
        } catch (err) {
            console.error(`Error copying related file: ${err.message}`);
        }
    }
}
