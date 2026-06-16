const fs = require('fs');
const path = require('path');

async function testUpload() {
  const fetch = (await import('node-fetch')).default;
  const FormData = (await import('form-data')).default;

  // Create a dummy video file
  const dummyFilePath = path.join(__dirname, 'dummy.mp4');
  fs.writeFileSync(dummyFilePath, Buffer.alloc(1024 * 1024)); // 1MB video

  const form = new FormData();
  form.append('file', fs.createReadStream(dummyFilePath));

  try {
    const res = await fetch('http://localhost:4000/api/v1/media/upload', {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${text}`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (fs.existsSync(dummyFilePath)) {
      fs.unlinkSync(dummyFilePath);
    }
  }
}

testUpload();
