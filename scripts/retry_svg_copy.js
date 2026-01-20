const fs = require('fs');
const path = require('path');

// Use forward slashes to avoid any backslash escaping issues
const projectRoot = 'C:/Users/Admin/Desktop/clg/Projects/Pucho Dashboard Template';
const sourceDirName = 'templat icon-svg';
const sourceDir = `${projectRoot}/${sourceDirName}`;
const destDir = `${projectRoot}/pucho-dashboard/src/assets/icons`;

console.log(`Checking Source: "${sourceDir}"`);

if (!fs.existsSync(sourceDir)) {
    console.error(`ERROR: Source directory "${sourceDir}" does not exist!`);
    console.log(`Listing contents of "${projectRoot}":`);
    try {
        const files = fs.readdirSync(projectRoot);
        files.forEach(f => console.log(` - "${f}"`));
    } catch (e) {
        console.error(`Cannot read project root: ${e.message}`);
    }
    process.exit(1);
}

if (!fs.existsSync(destDir)) {
    console.log(`Creating dest dir: ${destDir}`);
    fs.mkdirSync(destDir, { recursive: true });
}

const iconMapping = {
    'Property 2=Grid, Property 1=Default.svg': 'home.svg',
    'Property 2=Agents, Property 1=Default.svg': 'agents.svg',
    'Property 2=Chat, Property 1=Default.svg': 'chat.svg',
    'Property 2=Flows, Property 1=Default.svg': 'flows.svg',
    'Property 2=Activity, Property 1=Default.svg': 'activity.svg',
    'Property 2=MCP, Property 1=Default.svg': 'mcp.svg',
    'Property 2=Knowledge, Property 1=Default.svg': 'knowledge.svg',
    'Property 2=Tool, Property 1=Default.svg': 'tools.svg',
    'Property 2=Marketplace, Property 1=Default.svg': 'marketplace.svg',
    'Property 2=Log out, Property 1=Default.svg': 'logout.svg',
    'Property 2=Search, Property 1=Default.svg': 'search.svg',
    'Property 2=List, Property 1=Default.svg': 'menu.svg'
};

let successCount = 0;
let failCount = 0;

Object.entries(iconMapping).forEach(([srcName, destName]) => {
    const srcPath = path.join(sourceDir, srcName);
    const destPath = path.join(destDir, destName);

    // Try finding exact match or case-insensitive match
    if (fs.existsSync(srcPath)) {
        try {
            fs.copyFileSync(srcPath, destPath);
            console.log(`[OK] Copied "${srcName}" -> "${destName}"`);
            successCount++;
        } catch (err) {
            console.error(`[ERR] Failed to copy "${srcName}": ${err.message}`);
            failCount++;
        }
    } else {
        // Fallback search
        const files = fs.readdirSync(sourceDir);
        const match = files.find(f => f.toLowerCase() === srcName.toLowerCase());
        if (match) {
            try {
                fs.copyFileSync(path.join(sourceDir, match), destPath);
                console.log(`[OK] Copied (fuzzy match) "${match}" -> "${destName}"`);
                successCount++;
            } catch (err) {
                console.error(`[ERR] Failed to copy "${match}": ${err.message}`);
                failCount++;
            }
        } else {
            console.warn(`[WARN] Source file missing: "${srcName}"`);
            failCount++;
        }
    }
});

console.log(`SUMMARY: ${successCount} copied, ${failCount} failed.`);
