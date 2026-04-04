const http = require('http');

const loginOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
};

const req = http.request(loginOptions, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        const token = JSON.parse(rawData).token;
        if (!token) {
            console.error("Login failed:", rawData);
            return;
        }

        const fetchOptions = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/reports?startDate=2026-03-19&endDate=2026-03-19',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        };

        http.get(fetchOptions, (res2) => {
            let data2 = '';
            res2.on('data', (chunk) => { data2 += chunk; });
            res2.on('end', () => {
                console.log("Status:", res2.statusCode);
                console.log("Response:", data2);
            });
        });
    });
});

req.write(JSON.stringify({ email: 'admin@hotel.com', password: 'admin123' }));
req.end();
