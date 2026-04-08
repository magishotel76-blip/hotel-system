const http = require('http');
http.get('http://localhost:5000/api/reports?startDate=2026-03-19&endDate=2026-03-19', (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            const parsedData = JSON.parse(rawData);
            console.log(`Status: ${res.statusCode}`);
            if (res.statusCode !== 200) console.log(`Error:`, parsedData);
            else console.log(`Success, summary:`, Object.keys(parsedData.summary));
        } catch (e) {
            console.error(e.message);
            console.log(rawData);
        }
    });
}).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
});
