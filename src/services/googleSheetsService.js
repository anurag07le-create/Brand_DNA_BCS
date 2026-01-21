import Papa from 'papaparse';

// Defaults
const DEFAULT_SPREADSHEET_ID = '1OidGIp5NkHTYRcIytoGROlYOpff7ZBSJApETUfLfPP4';
const DEFAULT_CAMPAIGN_IDEAS_GID = '1514990292';
const DEFAULT_CREATIVES_GID = '273253656';
const DEFAULT_ANIMATED_CREATIVES_GID = '322601545';
const DEFAULT_CUSTOM_CREATIVES_GID = '1705854880';
const DEFAULT_INPUT_URL_WORKSHEET_ID = ''; // Default/first sheet

const getSheetUrl = (spreadsheetId = DEFAULT_SPREADSHEET_ID, gid) => {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv${gid ? `&gid=${gid}` : ''}&_t=${Date.now()}`;
};

export const fetchBrands = async (config = {}) => {
    const spreadsheetId = config?.spreadsheet_id || DEFAULT_SPREADSHEET_ID;
    const gid = config?.input_url_worksheet_id || DEFAULT_INPUT_URL_WORKSHEET_ID;
    const url = getSheetUrl(spreadsheetId, gid);

    try {
        const response = await fetch(url);
        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    // Helper to find key ignoring case and newlines
                    const findKey = (row, target) => {
                        return Object.keys(row).find(k =>
                            k.toLowerCase().replace(/[\n\r]/g, ' ').includes(target.toLowerCase())
                        );
                    };

                    const brands = results.data.map((row, index) => {
                        const name = row['Brand Name'];
                        const slug = name ? name.toLowerCase().replace(/[^a-z0-9]/g, '-') : `brand-${index}`;

                        // dynamic key finding for Industry
                        const industryKey = findKey(row, 'industry domain') || 'Industry Domain';

                        // Parse Elements JSON string if it exists
                        let elements = [];
                        try {
                            if (row['Elements']) {
                                // The CSV might have escaped quotes or be a simple list
                                let elementsRaw = row['Elements'].trim();
                                if (elementsRaw.startsWith('[') && elementsRaw.endsWith(']')) {
                                    // Handle doubled quotes in GSheets CSV export if PapaParse didn't catch them
                                    const processedJson = elementsRaw.replace(/""/g, '"');
                                    const parsed = JSON.parse(processedJson);

                                    // Convert to array of objects with url property
                                    elements = parsed.map(item => {
                                        if (typeof item === 'string') {
                                            return { url: item };
                                        } else if (item && typeof item === 'object' && item.url) {
                                            return item;
                                        }
                                        return null;
                                    }).filter(Boolean);
                                } else {
                                    // Simple comma-separated list of URLs
                                    elements = elementsRaw.split(',')
                                        .map(item => item.trim().replace(/^"(.*)"$/, '$1'))
                                        .filter(Boolean)
                                        .map(url => ({ url }));
                                }
                            }
                        } catch (e) {
                            console.error(`Error parsing elements for ${name}:`, e);
                            elements = [];
                        }

                        return {
                            id: slug,
                            slug: slug,
                            name: name || 'Unknown Brand',
                            fullName: name || 'Unknown Brand', // Sheet doesn't have fullName, using name
                            url: row['URL'],
                            tagline: row['Tag Line'],
                            shortDescription: row['Short Description'],
                            longDescription: row['Long Description'] || '',
                            values: row['Brand Values'] ? row['Brand Values'].split(',').map(v => v.trim()).filter(Boolean) : [],
                            aesthetics: row['Brand Aesthetics'] ? row['Brand Aesthetics'].split(',').map(a => a.trim()).filter(Boolean) : [],
                            tone: row['Brand Tone of voice'] ? row['Brand Tone of voice'].split(',').map(t => t.trim()).filter(Boolean) : [],
                            logo: row['Logo-1'],
                            favicon: row['Favicon-1'],
                            colors: [
                                row['Color-1'],
                                row['Color-2'],
                                row['Color-3'],
                                row['Color-4'],
                                row['Color-5'],
                                row['Color-6']
                            ].filter(Boolean),
                            bodyFont: row['Body font'] || 'Inter',
                            headingFont: row['Heading Font'] || 'Inter',
                            elements: elements,
                            socials: {
                                linkedin: row['Linkedin'],
                                twitter: row['Twitter'],
                                instagram: row['Instagram'],
                                facebook: row['Facebook'],
                                youtube: row['YouTube'],
                                github: row['Github'],
                                discord: row['Discord']
                            },
                            industry: row[industryKey],
                            city: row['City'],
                            state: row['State'],
                            country: row['Country']
                        };
                    });

                    // Deduplicate: Keep only the latest entry for each unique URL
                    const uniqueBrandsMap = new Map();
                    brands.forEach(brand => {
                        if (brand.url) {
                            // Normalize URL for consistent deduplication key
                            const normalizedUrl = brand.url.toLowerCase().trim()
                                .replace(/^https?:\/\//, '')
                                .replace(/^www\./, '')
                                .replace(/\/$/, '');

                            // Map.set overwrites existing keys, so the last (latest) entry in the array wins
                            uniqueBrandsMap.set(normalizedUrl, brand);
                        }
                    });

                    const uniqueBrands = Array.from(uniqueBrandsMap.values()).reverse();
                    resolve(uniqueBrands);
                },
                error: (error) => {
                    reject(error);
                }
            });
        });
    } catch (error) {
        console.error('Error fetching brands from Google Sheets:', error);
        throw error;
    }
};

export const fetchCampaignIdeas = async (brandUrl, config = {}) => {
    const spreadsheetId = config?.spreadsheet_id || DEFAULT_SPREADSHEET_ID;
    const gid = config?.campaign_ideas_id || DEFAULT_CAMPAIGN_IDEAS_GID;
    const url = getSheetUrl(spreadsheetId, gid);

    console.log('🎯 fetchCampaignIdeas called with brandUrl:', brandUrl);

    try {
        const response = await fetch(url);
        const csvText = await response.text();
        console.log('📥 CSV fetched, length:', csvText.length);

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const normalizedBrandUrl = brandUrl.toLowerCase().trim()
                        .replace(/^https?:\/\//, '')
                        .replace(/^www\./, '')
                        .replace(/\/$/, '');

                    const matchingRows = results.data.filter(row => {
                        const rowUrl = row['Brand URL'];
                        if (!rowUrl) return false;

                        const normalizedRowUrl = rowUrl.toLowerCase().trim()
                            .replace(/^https?:\/\//, '')
                            .replace(/^www\./, '')
                            .replace(/\/$/, '');

                        return normalizedRowUrl === normalizedBrandUrl;
                    });

                    console.log('🔍 Matching rows for brand:', matchingRows.length);

                    // Parse all ideas from Idea 1, Idea 2, Idea 3 columns
                    const ideas = [];
                    matchingRows.forEach(row => {
                        ['Idea 1', 'Idea 2', 'Idea 3'].forEach(ideaColumn => {
                            try {
                                const ideaJsonStr = row[ideaColumn];
                                if (!ideaJsonStr || ideaJsonStr.trim() === '') return;

                                // Clean up the JSON string
                                const normalizedJson = ideaJsonStr
                                    .replace(/^\"|\"$/g, '')  // Remove outer quotes
                                    .replace(/""/g, '"');      // Replace double quotes

                                const ideaData = JSON.parse(normalizedJson);

                                // Only add if it has required fields
                                if (ideaData.idea_name && ideaData.one_liner) {
                                    ideas.push(ideaData);
                                }
                            } catch (e) {
                                console.error(`Error parsing ${ideaColumn}:`, e);
                            }
                        });
                    });

                    console.log('🎨 Total ideas parsed:', ideas.length);
                    resolve({ ideas });
                },
                error: (error) => {
                    reject(error);
                }
            });
        });
    } catch (error) {
        console.error('Error fetching campaign ideas:', error);
        throw error;
    }
};

// Fetch campaign ideas by Request ID (more reliable than URL matching)
export const fetchCampaignIdeasByRequestId = async (requestId, config = {}) => {
    const spreadsheetId = config?.spreadsheet_id || DEFAULT_SPREADSHEET_ID;
    const gid = config?.campaign_ideas_id || DEFAULT_CAMPAIGN_IDEAS_GID;
    const url = getSheetUrl(spreadsheetId, gid);

    console.log('🎯 fetchCampaignIdeasByRequestId called with requestId:', requestId);

    try {
        const response = await fetch(url);
        const csvText = await response.text();
        console.log('📥 CSV fetched, length:', csvText.length);

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    console.log('📊 Total rows:', results.data.length);
                    if (results.data.length > 0) {
                        console.log('📊 Sample row:', results.data[0]);
                        console.log('📊 Column names:', Object.keys(results.data[0]));
                    }

                    // Match by Log id column
                    const matchingRows = results.data.filter(row => {
                        // Handle both title case (Log ID) and lowercase (Log id) variants
                        const rowRequestId = (row['Log ID'] || row['Log id'])?.trim();
                        const matches = rowRequestId === requestId;
                        if (matches) {
                            console.log('✅ Found matching row with Log id:', rowRequestId);
                        }
                        return matches;
                    });

                    console.log('🔍 Matching rows for request ID:', matchingRows.length);

                    if (matchingRows.length === 0) {
                        resolve(null);
                        return;
                    }

                    // Get the latest matching row
                    const latestRow = matchingRows[matchingRows.length - 1];

                    // Parse all ideas from Idea 1, Idea 2, Idea 3 columns
                    const ideas = [];
                    ['Idea 1', 'Idea 2', 'Idea 3'].forEach(ideaColumn => {
                        try {
                            const ideaJsonStr = latestRow[ideaColumn];
                            if (!ideaJsonStr || ideaJsonStr.trim() === '') return;

                            console.log(`📝 Parsing ${ideaColumn}:`, ideaJsonStr.substring(0, 100) + '...');

                            // Clean up the JSON string
                            const normalizedJson = ideaJsonStr
                                .replace(/^\"|\"$/g, '')  // Remove outer quotes
                                .replace(/""/g, '"');      // Replace double quotes

                            const ideaData = JSON.parse(normalizedJson);

                            // Only add if it has required fields
                            if (ideaData.idea_name && ideaData.one_liner) {
                                console.log('✅ Parsed idea:', ideaData.idea_name);
                                ideas.push(ideaData);
                            } else {
                                console.log('⚠️ Missing required fields in idea');
                            }
                        } catch (e) {
                            console.error(`❌ Error parsing ${ideaColumn}:`, e.message);
                        }
                    });

                    console.log('🎨 Total ideas parsed:', ideas.length);

                    // Return in the same format as fetchCampaignIdeas
                    resolve({ ideas });
                },
                error: (error) => {
                    console.error('❌ Papa Parse error:', error);
                    reject(error);
                }
            });
        });
    } catch (error) {
        console.error('❌ Error fetching campaign ideas by request ID:', error);
        throw error;
    }
};

// Match by Request ID OR (Brand URL + Idea Name) fallback
export const fetchGeneratedCreatives = async (requestId, brandUrl, ideaName, config = {}) => {
    const spreadsheetId = config?.spreadsheet_id || DEFAULT_SPREADSHEET_ID;
    const gid = config?.creatives_id || DEFAULT_CREATIVES_GID;
    const url = getSheetUrl(spreadsheetId, gid);

    try {
        const response = await fetch(url);
        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    console.log('📋 Fetched', results.data.length, 'rows from sheet');

                    let matchingRows = [];

                    // Strategy 1: Match by Request ID
                    if (requestId) {
                        matchingRows = results.data.filter(row => {
                            const rowRequestId = (row['Log ID'] || row['Log id'] || row['Request ID'] || row['request_id'])?.trim();
                            return rowRequestId === requestId;
                        });
                        console.log('Strategy 1 (Request ID): Found', matchingRows.length, 'rows');
                    }

                    // Strategy 2: Fallback to Brand URL + Idea Name (if Strategy 1 failed)
                    if (matchingRows.length === 0 && brandUrl && ideaName) {
                        const normalizedBrandUrl = brandUrl.toLowerCase().trim()
                            .replace(/^https?:\/\//, '')
                            .replace(/^www\./, '')
                            .replace(/\/$/, '');

                        matchingRows = results.data.filter(row => {
                            // 1. Check Brand URL
                            const rowUrl = row['Brand URL'];
                            if (!rowUrl) return false;
                            const normRowUrl = rowUrl.toLowerCase().trim()
                                .replace(/^https?:\/\//, '')
                                .replace(/^www\./, '')
                                .replace(/\/$/, '');

                            if (normRowUrl !== normalizedBrandUrl) return false;

                            // 2. Check Idea Name
                            let rowIdeaName = "";
                            try {
                                if (row['Campaign idea']) {
                                    const rawIdea = row['Campaign idea'];
                                    // Try parsing as JSON first
                                    try {
                                        const ideaJson = JSON.parse(
                                            rawIdea.replace(/^\"|\"$/g, '').replace(/""/g, '"')
                                        );
                                        if (ideaJson.idea_name) rowIdeaName = ideaJson.idea_name;
                                    } catch (jsonErr) {
                                        // If JSON fails, treat as raw string
                                        rowIdeaName = rawIdea;
                                    }
                                }
                            } catch (e) {
                                rowIdeaName = row['Campaign idea'] || "";
                            }

                            // Robust match: contains check + case insensitive
                            const normRowName = (rowIdeaName || "").toLowerCase().trim();
                            const normTargetName = (ideaName || "").toLowerCase().trim();

                            return normRowName === normTargetName ||
                                normRowName.includes(normTargetName) ||
                                normTargetName.includes(normRowName);
                        });
                        console.log('Strategy 2 (Brand+Idea Fallback): Found', matchingRows.length, 'rows');
                    }


                    if (matchingRows.length === 0) {
                        resolve(null);
                        return;
                    }

                    // Get the latest matching row
                    const latestRow = matchingRows[matchingRows.length - 1];
                    console.log('📌 Using latest row:', latestRow);

                    // Find all HTTP URLs in Creative 1, Creative 2, Creative 3 columns
                    const creatives = ['Creative 1', 'Creative 2', 'Creative 3']
                        .map(col => latestRow[col])
                        .filter(value => value && String(value).startsWith('http'))
                        .map(value => String(value));

                    console.log('🎨 Found', creatives.length, 'creative URLs:', creatives);

                    if (creatives.length > 0) {
                        resolve(creatives);
                    } else {
                        resolve(null); // Row exists but no creatives yet
                    }
                },
                error: (error) => {
                    reject(error);
                }
            });
        });
    } catch (error) {
        console.error('Error fetching generated creatives:', error);
        return null;
    }
};

export const fetchAnimatedCreatives = async (brandUrl, config = {}) => {
    const spreadsheetId = config?.spreadsheet_id || DEFAULT_SPREADSHEET_ID;
    const gid = config?.animated_creatives_id || DEFAULT_ANIMATED_CREATIVES_GID;
    const url = getSheetUrl(spreadsheetId, gid);

    try {
        const response = await fetch(url);
        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const normalizedBrandUrl = brandUrl.toLowerCase().trim()
                        .replace(/^https?:\/\//, '')
                        .replace(/^www\./, '')
                        .replace(/\/$/, '');

                    console.log(`🔍 Polling Logic: Looking for Brand URL: "${normalizedBrandUrl}" in ${results.data.length} rows`);

                    const matchingRows = results.data.filter(row => {
                        const rowUrl = row['Brand URL'];
                        if (!rowUrl) return false;

                        const normalizedRowUrl = rowUrl.toLowerCase().trim()
                            .replace(/^https?:\/\//, '')
                            .replace(/^www\./, '')
                            .replace(/\/$/, '');

                        // Debug log for first few rows or if match is close
                        // console.log(`   - Comparing with: "${normalizedRowUrl}"`);

                        return normalizedRowUrl === normalizedBrandUrl;
                    });

                    console.log(`✅ Found ${matchingRows.length} matching rows for brand.`);

                    const animationMap = {};
                    matchingRows.forEach(row => {
                        try {
                            const ideaJsonStr = row['Campaign idea'];
                            if (!ideaJsonStr) {
                                console.warn("⚠️ Row has empty 'Campaign idea'");
                                return;
                            }

                            // Normalize JSON string (remove wrapping quotes)
                            const normalizedJson = ideaJsonStr.replace(/^\"|\"$/g, '').replace(/""/g, '"');
                            const ideaData = JSON.parse(normalizedJson);
                            const ideaName = ideaData.idea_name;

                            // Find the key that matches "Animated video" (or fallback to "Animated Creative")
                            const animatedKey = Object.keys(row).find(k => {
                                const norm = k.trim().toLowerCase();
                                return norm === 'animated video' || norm === 'animated creative';
                            });
                            const videoUrl = row[animatedKey];

                            console.log(`   - Parsed Idea Name: "${ideaName}", Video URL: "${videoUrl}"`);

                            if (ideaName && videoUrl) {
                                animationMap[ideaName] = videoUrl;
                            }
                        } catch (e) {
                            console.error('❌ Error parsing animated creative row:', e, row);
                        }
                    });

                    resolve(animationMap);
                },
                error: (error) => {
                    reject(error);
                }
            });
        });
    } catch (error) {
        console.error('Error fetching animated creatives:', error);
        throw error;
    }
};

export const fetchCustomCreatives = async (prompt, config = {}) => {
    // Custom Creatives sheet GID
    const spreadsheetId = config?.spreadsheet_id || DEFAULT_SPREADSHEET_ID;
    const gid = config?.custom_creatives_id || DEFAULT_CUSTOM_CREATIVES_GID;
    const url = getSheetUrl(spreadsheetId, gid);

    console.log('🎨 Polling for custom creative with prompt:', prompt);

    try {
        const response = await fetch(url);
        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    console.log('📊 Total rows in custom creatives sheet:', results.data.length);

                    // Match by exact Prompt
                    const matchingRow = results.data.find(row => {
                        const rowPrompt = row['Prompt']?.trim();
                        const searchPrompt = prompt?.trim();
                        return rowPrompt === searchPrompt;
                    });

                    if (matchingRow) {
                        console.log('✅ Found matching row:', matchingRow);
                        console.log('🔑 Row Keys:', Object.keys(matchingRow));
                        console.log('👀 Creative Generated Value:', matchingRow['Creative Generated']);

                        const creativeUrl = matchingRow['Creative Generated'];

                        if (creativeUrl && creativeUrl.startsWith('http')) {
                            console.log('🎨 Creative URL found:', creativeUrl);
                            // Return as array for consistency with existing format
                            resolve([{
                                image_url: creativeUrl,
                                prompt: prompt,
                                size: matchingRow['Size'],
                                header: matchingRow['Header'],
                                description: matchingRow['Description'],
                                call_to_action: matchingRow['Call To Action']
                            }]);
                        } else {
                            console.log('⏳ Row found but no creative URL yet');
                            resolve(null);
                        }
                    } else {
                        console.log('⏳ No matching row found yet for prompt');
                        resolve(null);
                    }
                },
                error: (error) => {
                    console.error('❌ Error parsing CSV:', error);
                    reject(error);
                }
            });
        });
    } catch (error) {
        console.error('❌ Error fetching custom creatives:', error);
        return null;
    }
};

export const fetchBrandCreatives = async (brandUrl, config = {}) => {
    const spreadsheetId = config?.spreadsheet_id || DEFAULT_SPREADSHEET_ID;
    const customGid = config?.custom_creatives_id || DEFAULT_CUSTOM_CREATIVES_GID;
    const batchGid = config?.creatives_id || DEFAULT_CREATIVES_GID;

    const customUrl = getSheetUrl(spreadsheetId, customGid);
    const batchUrl = getSheetUrl(spreadsheetId, batchGid);

    console.log('🎨 Fetching all creatives (Custom + Batch) for brand:', brandUrl);

    try {
        const [customResponse, batchResponse] = await Promise.all([
            fetch(customUrl),
            fetch(batchUrl)
        ]);

        const [customCsv, batchCsv] = await Promise.all([
            customResponse.text(),
            batchResponse.text()
        ]);

        const parseCsv = (csvText) => {
            return new Promise((resolve) => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => resolve(results.data),
                    error: (err) => {
                        console.error('CSV Parse Error:', err);
                        resolve([]);
                    }
                });
            });
        };

        const [customData, batchData] = await Promise.all([
            parseCsv(customCsv),
            parseCsv(batchCsv)
        ]);

        const normalizedBrandUrl = brandUrl.toLowerCase().trim()
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/$/, '');

        // 1. Process Custom Creatives
        const customCreatives = customData
            .filter(row => {
                const rowUrl = row['Brand URL'];
                if (!rowUrl) return false;
                const normRowUrl = rowUrl.toLowerCase().trim()
                    .replace(/^https?:\/\//, '')
                    .replace(/^www\./, '')
                    .replace(/\/$/, '');
                return normRowUrl === normalizedBrandUrl;
            })
            .map(row => {
                const creativeUrl = row['Creative Generated'];
                if (creativeUrl && creativeUrl.startsWith('http')) {
                    return {
                        image_url: creativeUrl,
                        prompt: row['Prompt'],
                        size: row['Size'],
                        header: row['Header'],
                        description: row['Description'],
                        call_to_action: row['Call To Action'],
                        source: 'custom'
                    };
                }
                return null;
            })
            .filter(Boolean);

        // 2. Process Batch Creatives (Creative 1, 2, 3)
        const batchCreatives = batchData
            .filter(row => {
                const rowUrl = row['Brand URL'];
                if (!rowUrl) return false;
                const normRowUrl = rowUrl.toLowerCase().trim()
                    .replace(/^https?:\/\//, '')
                    .replace(/^www\./, '')
                    .replace(/\/$/, '');
                return normRowUrl === normalizedBrandUrl;
            })
            .flatMap(row => {
                // Extract Idea Name from JSON if possible, or use raw column
                let ideaName = "Campaign Concept";
                try {
                    if (row['Campaign idea']) {
                        const ideaJson = JSON.parse(
                            row['Campaign idea'].replace(/^\"|\"$/g, '').replace(/""/g, '"')
                        );
                        if (ideaJson.idea_name) ideaName = ideaJson.idea_name;
                    }
                } catch (e) {
                    // Fallback to raw string if not JSON
                    if (row['Campaign idea']) {
                        ideaName = row['Campaign idea'].trim();
                    }
                }

                // Map Creative 1, 2, 3 columns
                return ['Creative 1', 'Creative 2', 'Creative 3']
                    .map(col => {
                        const url = row[col];
                        if (url && url.startsWith('http')) {
                            return {
                                image_url: url,
                                prompt: ideaName, // Use Idea Name as the "Prompt" or title
                                size: '1:1',     // Default size for batch
                                header: '',
                                description: '',
                                call_to_action: '',
                                source: 'batch'
                            };
                        }
                        return null;
                    })
                    .filter(Boolean);
            });

        console.log(`✅ Found ${customCreatives.length} custom and ${batchCreatives.length} batch creatives.`);

        // Merge and show newest first (assuming sheet order is chronological, so reverse both)
        // Note: Ideally timestamp usage would be better, but strict reverse is a good proxy.
        // We'll put Custom ones first if they are newer, but since we don't have timestamps,
        // we'll just concat and reverse the whole thing or reverse individually?
        // Let's reverse combined list implies newest added to either sheet is at bottom.
        // Actually, just concat and then reverse.

        const allCreatives = [...customCreatives, ...batchCreatives].reverse();

        return allCreatives;

    } catch (error) {
        console.error('❌ Error fetching merged brand creatives:', error);
        return [];
    }
};

export const fetchMarketIntelligenceReports = async (config = {}) => {
    // New Sheet ID provided by user
    // https://docs.google.com/spreadsheets/d/1trmuPKla4JjrNEJbj0_Ll2uXpbws0g2e7FhXa4rUdDU/edit?gid=454926026
    const spreadsheetId = '1trmuPKla4JjrNEJbj0_Ll2uXpbws0g2e7FhXa4rUdDU';
    const gid = '454926026';
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}&_t=${Date.now()}`;

    console.log('📊 Fetching Market Intelligence Reports from:', url);

    try {
        const response = await fetch(url);
        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    console.log('✅ Parsed', results.data.length, 'rows from new sheet');

                    const reports = results.data.map(row => {
                        // 1. Basic columns
                        const reportLink = row['Report Link'];
                        const brandNameFromCsv = row['Brand Name'];

                        // 2. Parse embedded JSON from HTML column if it exists
                        let details = {};
                        const htmlContent = row['HTML'];

                        if (htmlContent) {
                            try {
                                // Regex to extract the JSON content inside the script tag
                                // <script id="client-form" type="application/json">{...}</script>
                                const jsonMatch = htmlContent.match(/<script id="client-form" type="application\/json">([\s\S]*?)<\/script>/);

                                if (jsonMatch && jsonMatch[1]) {
                                    const rawJson = jsonMatch[1];
                                    // The JSON might be double-escaped or have issues, but let's try direct parse first
                                    const parsedData = JSON.parse(rawJson);

                                    // The structure seems to be: { body: { ...details... } } or just { ...details... }
                                    // Based on inspection, it looks like the root has body: { ... }

                                    const body = parsedData.body || parsedData;

                                    details = {
                                        clientName: body.clientName,
                                        brandProduct: body.brandProduct,
                                        problemStatement: body.problemStatement,
                                        targetConsumer: body.targetConsumer,
                                        proposition: body.singleMindedProposition,
                                        desiredAction: body.desiredAction,
                                        tone: body.toneCommunication,
                                        functionalReasons: body.functionalReasons,
                                        emotionalReasons: body.emotionalReasons,
                                        kpis: body.kpis,
                                        dosDonts: body.dosDonots,
                                        budget: body.budget,
                                        otherInfo: body.otherInfo,
                                        competition: body.complications // mapped 'complications' to competition based on content
                                    };
                                }
                            } catch (e) {
                                console.error('⚠️ Error parsing embedded JSON for row:', brandNameFromCsv, e);
                            }
                        }

                        // Fallback: if JSON parsing failed but we have CSV columns? 
                        // The new CSV ONLY has Trigger ID, Brand Name, Report Link, HTML.
                        // So we rely heavily on the HTML parsing.

                        return {
                            ...details,
                            // Ensure we have at least these if parsing failed
                            brandProduct: details.brandProduct || brandNameFromCsv || 'Untitled Brand',
                            reportLink: reportLink,
                            htmlContent: htmlContent // Expose raw HTML for preview
                        };
                    }).filter(r => r.brandProduct);

                    resolve(reports);
                },
                error: (error) => {
                    console.error('❌ CSV Parse Error:', error);
                    reject(error);
                }
            });
        });

    } catch (error) {
        console.error('❌ Error fetching Market Intelligence Reports:', error);
        return [];
    }
};

export const fetchAudioTranscriptionSummaries = async (config = {}) => {
    // Using same spreadsheet as Market Intelligence
    const spreadsheetId = '1trmuPKla4JjrNEJbj0_Ll2uXpbws0g2e7FhXa4rUdDU';
    const gid = '12631152'; // User provided GID
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}&_t=${Date.now()}`;

    console.log('🎙️ Fetching Audio Transcription Summaries from:', url);

    try {
        const response = await fetch(url);
        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    console.log('✅ Parsed', results.data.length, 'rows from Audio Summary sheet');

                    const summaries = results.data.map(row => {
                        return {
                            triggerId: row['Trigger ID'],
                            fileName: row['File Name'] || 'Untitled Audio',
                            summary: row['Audio Transcription Summary'] || '',
                            transcription: row['Audio Transcription'] || ''
                        };
                    }).filter(item => item.fileName && item.fileName !== 'Untitled Audio'); // Filter empty rows

                    resolve(summaries);
                },
                error: (error) => {
                    console.error('❌ CSV Parse Error:', error);
                    reject(error);
                }
            });
        });
    } catch (error) {
        console.error('❌ Error fetching Audio Summaries:', error);
        return [];
    }
};

export const fetchCompetitorAnalysisReports = async () => {
    try {
        const SHEET_ID = '1trmuPKla4JjrNEJbj0_Ll2uXpbws0g2e7FhXa4rUdDU';
        const GID = '2028255086';

        // Use standard export endpoint which is often more reliable for raw CSV
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}&_t=${Date.now()}`;

        console.log("Fetching Competitor Analysis Reports from:", url);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        // console.log("First 100 chars:", text.substring(0, 100));

        return new Promise((resolve, reject) => {
            Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const findKey = (row, target) => {
                        if (!row) return null;
                        return Object.keys(row).find(k =>
                            k.toLowerCase().trim().includes(target.toLowerCase())
                        );
                    };

                    console.log("Headers found:", results.meta.fields);

                    const parsedData = results.data.map(row => {
                        const companyKey = findKey(row, 'company') || findKey(row, 'name') || 'Company Name';
                        const websiteKey = findKey(row, 'website') || findKey(row, 'url') || 'Brand Website';
                        const htmlKey = findKey(row, 'html') || 'HTML';

                        return {
                            companyName: row[companyKey] || row['Company Name'] || 'Unknown Company',
                            websiteUrl: row[websiteKey] || row['Brand Website'] || '#',
                            htmlContent: row[htmlKey] || row['HTML'] || '<p>No analysis available.</p>'
                        };
                    }).filter(item =>
                        item.companyName &&
                        item.companyName !== 'Unknown Company' &&
                        item.companyName !== 'Company Name' // Header in data check
                    );

                    console.log(`Parsed ${parsedData.length} reports`);
                    resolve(parsedData);
                },
                error: (error) => {
                    reject(error);
                }
            });
        });
    } catch (error) {
        console.error("Error fetching competitor analysis reports:", error);
        return [];
    }
};

export const fetchMomSummaries = async () => {
    try {
        const SHEET_ID = '1trmuPKla4JjrNEJbj0_Ll2uXpbws0g2e7FhXa4rUdDU';
        const GID = '1724442704';

        // Use standard export endpoint
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}&_t=${Date.now()}`;

        console.log("Fetching MOM Summaries from:", url);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(text, {
                header: true, // Try with headers first
                skipEmptyLines: true,
                complete: (results) => {
                    console.log("MOM Raw headers:", results.meta.fields);

                    // Helper to find key case-insensitive
                    const findKey = (row, target) => {
                        if (!row) return null;
                        return Object.keys(row).find(k =>
                            k.toLowerCase().trim().includes(target.toLowerCase())
                        );
                    };

                    const parsedData = results.data.map((row, index) => {
                        // Try to find structured columns
                        let title = row[findKey(row, 'Title') || findKey(row, 'Meeting')];
                        let date = row[findKey(row, 'Date')];
                        let time = row[findKey(row, 'Time')];
                        let summary = row[findKey(row, 'Summary') || findKey(row, 'Notes') || findKey(row, 'Content')];

                        // Fallback logic could be added here if needed

                        // If we have minimal data, return it
                        if (title || date || summary) {
                            return {
                                id: index,
                                title: title || 'Untitled Meeting',
                                date: date || 'Unknown Date',
                                time: time || '',
                                summaryContent: summary || ''
                            };
                        }
                        return null;
                    }).filter(item => item !== null);

                    resolve(parsedData);
                },
                error: (error) => {
                    reject(error);
                }
            });
        });
    } catch (error) {
        console.error("Error fetching MOM summaries:", error);
        return [];
    }
};
