const fs = require('fs');
const path = require('path');

// Test script to verify uploads directory
console.log('Testing uploads directory...');

// Get the absolute path to the uploads directory
const uploadsDir = path.join(__dirname, '../uploads');
console.log('Uploads directory path:', uploadsDir);

// Check if the directory exists
if (fs.existsSync(uploadsDir)) {
  console.log('✅ Uploads directory exists');
} else {
  console.log('❌ Uploads directory does not exist');
  
  // Try to create the directory
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created uploads directory');
  } catch (error) {
    console.error('❌ Failed to create uploads directory:', error);
  }
}

// Test write permissions
try {
  const testFile = path.join(uploadsDir, 'test-file.txt');
  fs.writeFileSync(testFile, 'This is a test file to verify write permissions.');
  console.log('✅ Successfully wrote test file');
  
  // Read the file back
  const content = fs.readFileSync(testFile, 'utf8');
  console.log('✅ Successfully read test file:', content);
  
  // Delete the test file
  fs.unlinkSync(testFile);
  console.log('✅ Successfully deleted test file');
} catch (error) {
  console.error('❌ File operation failed:', error);
}

console.log('Upload directory test complete');

// Instructions for running the server
console.log('\nTo start the server, run:');
console.log('npm run dev');
console.log('\nThe uploads directory will be served at:');
console.log('http://localhost:5000/uploads/'); 