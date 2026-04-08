const http = require('http');

const runTests = async () => {
    const fetchAuth = () => new Promise(resolve => {
        const req = http.request({
            hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, res => {
            let d = ''; res.on('data', c => d+=c); res.on('end', () => resolve(JSON.parse(d).token));
        });
        req.write(JSON.stringify({ email: 'admin@hotel.com', password: 'admin123' }));
        req.end();
    });

    const token = await fetchAuth();

    const fetchEndpoint = (path) => new Promise(resolve => {
        http.get({ hostname: 'localhost', port: 5000, path, headers: { 'Authorization': `Bearer ${token}` } }, res => {
             let d = ''; res.on('data', c => d+=c); 
             res.on('end', () => {
                 let err = '';
                 if (res.statusCode !== 200) err = d;
                 resolve(`${path}: ${res.statusCode} ${err}`);
             });
        });
    });

    console.log(await fetchEndpoint('/api/expenses'));
    console.log(await fetchEndpoint('/api/billing'));
    console.log(await fetchEndpoint('/api/reservations'));
    console.log(await fetchEndpoint('/api/inventory/products'));
};

runTests();
