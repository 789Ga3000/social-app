import fs from 'fs';

async function testUpload() {
  const fileContent = new Uint8Array(1024 * 1024); // 1MB dummy video
  const blob = new Blob([fileContent], { type: 'video/mp4' });
  const form = new FormData();
  form.append('file', blob, 'test.mp4');

  try {
    const res = await fetch('http://localhost:4000/api/v1/media/upload', {
      method: 'POST',
      body: form,
    });
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${text}`);
  } catch (err) {
    console.error('Error:', err);
  }
}

testUpload();
