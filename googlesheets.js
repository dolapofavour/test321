const { google } = require('googleapis');
const fs = require('fs');
const readline = require('readline');
const { promisify } = require('util');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';

const readFileAsync = promisify(fs.readFile);

// Load client secrets from a file, and setup the Sheets API
readFileAsync('credentials.json')
  .then(content => authorize(JSON.parse(content)))
  .then(listMajors)
  .catch(err => console.error('Error loading client secret file:', err));

function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  try {
    const token = fs.readFileSync(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (err) {
    return getNewToken(oAuth2Client);
  }
}

function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', code => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
      return oAuth2Client;
    });
  });
}

function listMajors(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  sheets.spreadsheets.values.get({
    spreadsheetId: 'your-spreadsheet-id',
    range: 'Sheet1!A2:B', // Adjust the range accordingly
  }, (err, res) => {
    if (err) return console.error('The API returned an error:', err.message);
    const rows = res.data.values;
    if (rows.length) {
      console.log('Data:');
      rows.forEach(row => {
        console.log(`${row[0]}, ${row[1]}`);
      });
    } else {
      console.log('No data found.');
    }
  });
}
