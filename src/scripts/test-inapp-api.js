/**
 * Test in-app notification API
 * Run with: node src/scripts/test-inapp-api.js
 */

const http = require('http');

const userId = '69f9f5f9c0e3c31d321fc990';
const apiUrl = `http://localhost:3000/api/inapp/notifications?user_id=${encodeURIComponent(userId)}&limit=50`;

console.log('🧪 Testing In-App Notification API\n');
console.log('URL:', apiUrl);
console.log();

http.get(apiUrl, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log();
    
    try {
      const json = JSON.parse(data);
      console.log('Response:');
      console.log(JSON.stringify(json, null, 2));
      console.log();
      
      if (json.notifications) {
        console.log(`✅ API returned ${json.notifications.length} notifications`);
        console.log(`   Unread count: ${json.unreadCount}`);
        
        if (json.notifications.length > 0) {
          console.log('\n📋 Notifications:');
          json.notifications.forEach((n, i) => {
            console.log(`   ${i + 1}. ${n.title}`);
          });
        }
      } else {
        console.log('❌ No notifications in response');
      }
    } catch (e) {
      console.error('❌ Failed to parse JSON:', e.message);
      console.log('Raw response:', data);
    }
  });
}).on('error', (err) => {
  console.error('❌ API request failed:', err.message);
  console.log('\n⚠️  Make sure the server is running:');
  console.log('   npm start');
});
