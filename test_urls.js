const https = require('https');

https.get('https://order-nhac-fpt.vercel.app', (res) => {
    console.log('Main URL Status:', res.statusCode);
    if (res.statusCode >= 300 && res.statusCode < 400) {
        console.log('Location:', res.headers.location);
    }
});

https.get('https://order-nhac-rdmjrdnhq-betafpt-4462s-projects.vercel.app', (res) => {
    console.log('Deployment URL Status:', res.statusCode);
    if (res.statusCode >= 300 && res.statusCode < 400) {
        console.log('Location:', res.headers.location);
    }
});
