const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/screenings',
  method: 'GET',
  headers: {
    'x-demo-role': 'doctor'
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const data = JSON.parse(body);
    if (data.screenings && data.screenings.length > 0) {
      const s = data.screenings[0];
      console.log('Latest Screening ID:', s.screeningId);
      console.log('DR Grade:', s.drGrade);
      console.log('Confidence:', s.confidence);
      console.log('GradCAM URL:', s.gradcamUrl);
      
      if (s.gradcamUrl) {
        // Test fetching GradCAM image
        const imgOptions = {
          hostname: '127.0.0.1',
          port: 5000,
          path: s.gradcamUrl,
          method: 'GET',
          headers: {
            'x-demo-role': 'doctor'
          }
        };
        http.get(imgOptions, (imgRes) => {
          console.log('GradCAM Image HTTP Status:', imgRes.statusCode);
          console.log('GradCAM Image Content-Type:', imgRes.headers['content-type']);
        });
      }
    }
  });
});

req.end();
