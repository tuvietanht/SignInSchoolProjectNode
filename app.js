const express = require('express');
const bodyParser = require('body-parser');
const XLSX = require('xlsx');
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); 

// read file
const workbook = XLSX.readFile('UserLogin.xlsx');
const sheetName = workbook.SheetNames[0];
let users = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

function checkLogin(username, password) {
    return users.some(user => user.User === username && user.Password === password);
}

function isValidEmail(email) {
    const parts = email.split('@');
    return parts.length === 2 && parts[1].includes('.') && parts[0];
}

app.get('/', (req, res) => {
    res.redirect('/signin');
});

// Main Page
app.get('/main_page', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'MainPage.html'));
});

// Sign In Page
app.route('/signin')
    .get((req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'SignIn.html'));
    })
    .post((req, res) => {
        const { username, password } = req.body;
        if (checkLogin(username, password)) {
            res.redirect('/main_page');
        } else {
            res.redirect('/signin?error=Invalid username or password');
        }
    });

// Sign Up Page
app.route('/signup')
    .get((req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'SignUp.html'));
    })
    .post((req, res) => {
        const { email, username, password } = req.body;
        if (!isValidEmail(email)) {
            return res.redirect('/signup?error=Invalid email format');
        }

        if (users.some(user => user.Email.toLowerCase() === email.toLowerCase() || user.User.toLowerCase() === username.toLowerCase())) {
            return res.redirect('/signup?error=Email or Username already exists');
        }

        const newUser = { id: Math.max(...users.map(u => u.id)) + 1, Email: email, User: username, Password: password };
        users.push(newUser);

        const newSheet = XLSX.utils.json_to_sheet(users);
        workbook.Sheets[sheetName] = newSheet;
        XLSX.writeFile(workbook, 'UserLogin.xlsx');

        res.redirect('/main_page');
    });

// Start the server port 3000
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
