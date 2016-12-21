'use strict';
import EmailClient from './email-client';
import configuration from './configuration';
let gmailConfig = configuration.load('gmail');
import google from 'googleapis';
import open from 'open';
import http from 'http';
import url from 'url';
import chalk from 'chalk';

class EmailConfigPlugin {

  cli(program, config) {
    this.config = config;
    program.command('email-config')
      .description('configures integration with gmail API')
      .action(() => {
        this.configure();
      });
    program.command('email-test')
      .description('tests email configuration (logs first message in inbox)')
      .action(() => {
        this.test();
      });
  }

  configure() {
    let OAuth2Client = google.auth.OAuth2;
    // var plus = google.plus('v1');
    let gmail = google.gmail('v1');

    let gmailConfig = configuration.load('gmail');

    if (!(gmailConfig.gmail && gmailConfig.gmail.oauth && gmailConfig.gmail.oauth.clientId)) {
      console.log('missing gmail.oauth.clientId');
      console.log('to get client id & secret visit: https://console.developers.google.com');
      process.exit(1);
    }
    if (!gmailConfig.gmail.oauth.clientSecret) {
      console.log('missing gmail.oauth.clientSecret');
      console.log('to get client id & secret visit: https://console.developers.google.com');
      process.exit(1);
    }

    let redirectPort = 51575;
    let redirectUrl = 'http://localhost:' + redirectPort;
    let oauth2Client = new OAuth2Client(
      gmailConfig.gmail.oauth.clientId,
      gmailConfig.gmail.oauth.clientSecret,
      redirectUrl);

    function getAccessToken(oauth2Client, callback) {
      // generate consent page url
      let url = oauth2Client.generateAuthUrl({
        'access_type': 'offline', // will return a refresh token
        scope: [
          'https://mail.google.com/',
          'https://www.googleapis.com/auth/plus.me'
        ]
      });
      waitForUrlRedirect(function(code) {
        // request access token
        oauth2Client.getToken(code, function(err, tokens) {
          if (err) {
            throw err;
          }
          // set tokens to the client
          oauth2Client.setCredentials(tokens);
          callback(tokens);
        });
      });
      console.log('opening browser for oauth authorization');
      open(url);
    }

    function waitForUrlRedirect(callback) {
      let server = http.createServer(function(req, res) {
        res.writeHead(200, {
          'Content-Type': 'text/plain'
        });
        let reqUrl = url.parse(req.url, true);
        let code = reqUrl.query.code;
        if (code) {
          res.end('Thanks!,\nYou can close this window');
          callback(code);
          setTimeout(function() {
            server.close();
          }, 1000);
          return;
        }
        res.end('Authorization code not found');
      }).listen(redirectPort);
    }

    // retrieve an access token
    getAccessToken(oauth2Client, function(tokens) {
      gmail.users.getProfile({
        userId: 'me',
        auth: oauth2Client
      }, function(err, profile) {
        if (err) {
          console.log(chalk.red('An error occured getting gmail profile'), err);
          return;
        }
        let users = configuration.load('users').users;
        if (users.default.email.replace(/\+[^@]*@/g, '@') !== profile.emailAddress) {
          console.log(chalk.red('users.yml default email address doesn\'t match: ' + profile.emailAddress));
          process.exit(1);
        }

        let oauth = gmailConfig.gmail.oauth;
        /* jshint camelcase: false */
        oauth.accessToken = tokens.access_token;
        oauth.refreshToken = tokens.refresh_token;
        /* jshint camelcase: true */

        configuration.save('gmail', gmailConfig);
        console.log(chalk.green('new tokens saved for user ' + profile.emailAddress));
        console.log(' (test it running: ./run-plugin email-test )');
        /*
        plus.people.get({ userId: 'me', auth: oauth2Client }, function(err, profile) {
          if (err) {
            console.log(chalk.red('An error occured getting google plus profile'), err);
            return;
          }
          console.log(profile);
        });
        */
        process.exit();
      });
    });
  }

  test() {
    let user = this.config.users.default;
    let client = new EmailClient({
      email: user.email,
      password: gmailConfig.gmail.password,
      oauth: gmailConfig.gmail.oauth
    });

    function onFailure(err) {
      client.close();
      process.nextTick(function() {
        throw err;
      });
    }

    client.findRecentMessage().then(function(message) {
      console.log(message);
      return message.getBody().then(function(body) {
        console.log('*********************************************');
        console.log(body.text);
        console.log('*********************************************');
        client.close();
      });
    }, onFailure);
  }
}

export default new EmailConfigPlugin();
