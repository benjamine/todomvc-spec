'use strict';

import inbox from 'inbox';
import MimeParser from 'mimeparser';
import htmlToText from 'html-to-text';
import promiseRetry from 'promise-retry';

class EmailClient {
  constructor(options) {
    if (!/@gmail\.com$/.test(options.email)) {
      throw new Error('only gmail.com is supported: ' + options.email);
    }
    this.email = options.email;
    this.password = options.password;
    this.retryOptions = options.retryOptions || {};

    // for gmail auth remove +alias
    let canonicalEmail = this.email.replace(/\+[^@]*@/g, '@');
    let auth;
    if (options.oauth) {
      auth = {
        XOAuth2: {
          user: canonicalEmail,
          clientId: options.oauth.clientId,
          clientSecret: options.oauth.clientSecret,
          refreshToken: options.oauth.refreshToken,
          accessToken: options.oauth.accessToken,
          timeout: 3600
        }
      };
    } else {
      auth = {
        user: canonicalEmail,
        pass: this.password
      };
    }
    this.client = inbox.createConnection(false, 'imap.gmail.com', {
      secureConnection: true,
      auth: auth
    });
    this.connected = false;
  }

  connect() {
    if (this.connectPromise) {
      return this.connectPromise;
    }
    this.connectPromise = new Promise((resolve, reject) => {
      let done = false;
      this.client.once('connect', () => {
        if (done) {
          return;
        }
        done = true;
        this.connected = true;
        this.connecting = false;
        resolve();
      });
      this.client.on('error', err => {
        if (err.errorType) {
          console.log('[Email Client] Error Type:', err.errorType);
        }
        if (err.errorLog) {
          console.log('[Email Client] Error Log:\n', err.errorLog);
        }
        if (done) {
          return;
        }
        done = true;
        this.connecting = false;
        reject(err);
      });
      this.connected = false;
      this.connecting = true;
      this.client.connect();
    });
    return this.connectPromise;
  }

  close() {
    if (this.connected) {
      this.client.close();
      this.client = null;
      this.connected = false;
    }
  }

  getMessageBody(message) {
    let client = this.client;
    return this.connect().then(() =>
      new Promise((resolve, reject) => {
        let stream = client.createMessageStream(message.UID);
        let bufs = [];
        let complete = false;
        let body;
        let parser = new MimeParser();
        parser.onbody = function(node, chunk) {
          body = '';
          for (let i = 0; i < chunk.length; i++) {
            body = body + String.fromCharCode(chunk[i]);
          }
        };
        stream.on('data', function(data) {
          parser.write(data);
          bufs.push(data);
        });
        stream.on('error', function(err) {
          if (complete) {
            return;
          }
          complete = true;
          reject(err);
        });
        stream.on('end', function() {
          if (complete) {
            return;
          }
          parser.end();
          complete = true;
          resolve({
            html: body,
            text: htmlToText.fromString(body)
          });
          // resolve(null, Buffer.concat(bufs).toString());
        });
      })
    );
  }

  findRecentMessage(options = {}) {
    let client = this.client;

    let promiseGetter = retry => this.connect().then(() =>
      new Promise((resolve, reject) => {
        client.openMailbox('INBOX', err /*, info */ => {
          if (err) {
            reject(err);
            return;
          }
          // list newest 20 messages
          client.listMessages(-20, (err, messages) => {
            if (err) {
              reject(err);
              return;
            }
            messages.sort((msg1, msg2) => msg2.date.getTime() - msg1.date.getTime());
            const filteredMessages = options.filter
              ? messages.filter(options.filter)
              : messages;

            if (!filteredMessages.length) {
              reject(new Error('message not found in inbox'));
              return;
            }
            resolve(addMessageHelpers(this, filteredMessages[0]));
          });
        });
      })
    ).catch(retry);

    if (options.retry === false) {
      return promiseGetter(err => {
        throw err;
      });
    }
    let retryOptions = options.retry;
    if (typeof retryOptions !== 'object') {
      retryOptions = this.retryOptions;
    }
    return promiseRetry(promiseGetter, retryOptions);
  }

}

function addMessageHelpers(emailClient, message) {
  message.getBody = function() {
    return emailClient.getMessageBody(message);
  };
  return message;
}

module.exports = EmailClient;
