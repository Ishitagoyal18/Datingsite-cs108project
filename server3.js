const express = require('express');
const path = require('path');
const fs = require('fs');
const generatePara = require('./finalgenpara.js');

const app = express();
const PORT = process.env.PORT || 1000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Define routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to handle user registration
app.post('/register', (req, res) => {
  const { username, password, secret_question, secret_answer } = req.body;

  // Load existing user data
  const filePath = path.join(__dirname, 'public', 'login.json');
  const users = require(filePath);

  // Check if username already exists
  const existingUser = users.find(user => user.username === username);
  if (existingUser) {
    return res.status(400).send('Username already exists');
  }

  // Add new user to the array
  users.push({ username, password, secret_question, secret_answer });

  // Save updated user data back to the file
  fs.writeFile(filePath, JSON.stringify(users, null, 2), err => {
    if (err) {
      console.error('Error writing to login.json:', err);
      return res.status(500).send('Registration failed');
    }
    console.log('User registered successfully:', username);
    res.status(200).send('Registration successful');
  });
});

// Function to update students.json with generated paragraphs
function updateStudentsJSON() {
  // Read the contents of students.json from the public directory
  const filePath = path.join(__dirname, 'public', 'students.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }

    try {
      // Parse JSON data
      const students = JSON.parse(data);

      // Check and add missing 'para' property for each student
      students.forEach(student => {
        // Check if 'para' property already exists
        if (!student.hasOwnProperty('para')) {
          // Generate new 'para' content
          student.para = generatePara(student['Name'], student['Interests'], student['Hobbies']);
        }
      });

      // Convert the updated data back to JSON format
      const updatedJsonData = JSON.stringify(students, null, 2); // Beautify JSON with 2-space indentation

      // Write the updated JSON data back to students.json
      fs.writeFile(filePath, updatedJsonData, 'utf8', err => {
        if (err) {
          console.error('Error writing file:', err);
          return;
        }

        console.log('Students.json updated successfully.');
      });
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  });
}

const FAQ = {
  "1": "To create an account, click on 'Join Clover' and fill out the required information.",
  "2": "You can answer your secret question to retrieve your password.",
 
  "3": "This site is completely safe to use. Your information is secured with us.",
  "4": "Yes, Clover is completely free to use.",
  "5": "Yes, you should be 18 years or older to use Clover" 
};

// Route to handle user queries
app.post('/api/faq', (req, res) => {
  const { questionId } = req.body;
  const answer = FAQ[questionId];
  if (answer) {
    res.json({ answer }); // Sending answer in JSON response
  } else {
    res.status(404).json({ error: 'Question not found' });
  }
});

// Load liked profiles from the JSON file
let likedProfiles = {};
try {
  likedProfiles = JSON.parse(fs.readFileSync('likedProfiles.json', 'utf8'));
} catch (err) {
  // If the file doesn't exist, initialize an empty object
  likedProfiles = {};
}

// Save liked profiles to the JSON file
function saveLikedProfiles() {
  fs.writeFileSync('likedProfiles.json', JSON.stringify(likedProfiles, null, 2));
}



// Handle GET requests to retrieve liked profiles
app.get('/api/liked-profiles', (req, res) => {
  const { username } = req.query;
  if (username) {
    const userLikedProfiles = likedProfiles[username] || [];
    res.json({ [username]: userLikedProfiles });
  } else {
    res.status(400).json({ error: 'Username not provided' });
  }
});

// Handle POST requests to update liked profiles
app.post('/api/liked-profiles', (req, res) => {
  const { username, likedProfiles: newLikedProfiles } = req.body;

  if (username) {
    if (!likedProfiles.hasOwnProperty(username)) {
      likedProfiles[username] = [];
    }
    likedProfiles[username] = newLikedProfiles;
    saveLikedProfiles();
    res.sendStatus(200);
  } else {
    res.status(400).json({ error: 'Username not provided' });
  }
});

// Start the server and call updateStudentsJSON function
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Call the function to update students.json after server starts
  updateStudentsJSON();
});
