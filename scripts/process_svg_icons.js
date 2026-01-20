const fs = require('fs');
const path = require('path');

const sourceDir = path.join(process.cwd(), '../', 'templat icon-svg'); // Assuming it's in the parent dir based on previous context or check path
// Wait, user said "c:\Users\Admin\Desktop\clg\Projects\Pucho Dashboard Template\templat icon-svg"
// And current cwd is "c:\Users\Admin\Desktop\clg\Projects\Pucho Dashboard Template\pucho-dashboard"
// So sourceDir should be path.join(process.cwd(), '..', 'templat icon-svg')

const destDir = path.join(process.cwd(), 'src', 'assets', 'icons');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

const iconMapping = {
    'Property 2=Grid, Property 1=Default.svg': 'home.svg', // Using Grid for "Cards"/Home
    'Property 2=Agents, Property 1=Default.svg': 'agents.svg',
    'Property 2=Chat, Property 1=Default.svg': 'chat.svg',
    'Property 2=Flows, Property 1=Default.svg': 'flows.svg',
    'Property 2=Activity, Property 1=Default.svg': 'activity.svg',
    'Property 2=MCP, Property 1=Default.svg': 'mcp.svg', // Assuming this exists or closest
    'Property 2=Knowledge, Property 1=Default.svg': 'knowledge.svg',
    'Property 2=Tool, Property 1=Default.svg': 'tools.svg',
    'Property 2=Marketplace, Property 1=Default.svg': 'marketplace.svg',
    'Property 2=Log out, Property 1=Default.svg': 'logout.svg',
    // Header icons
    'Property 2=Search, Property 1=Default.svg': 'search.svg',
    'Property 2=List, Property 1=Default.svg': 'menu.svg'
};

// Adjust mappings if files don't exist perfectly.
// I will attempt simple copy.

console.log(`Copying icons from ${sourceDir} to ${destDir}`);

Object.entries(iconMapping).forEach(([srcName, destName]) => {
    const srcPath = path.join(sourceDir, srcName);
    const destPath = path.join(destDir, destName);

    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Converted: ${srcName} -> ${destName}`);
    } else {
        console.error(`Missing source: ${srcName}`);
    }
});
