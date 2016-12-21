TODOMvc-Spec
============

Example [cucumber](https://cucumber.io/) spec for [todomvc app](http://todomvc.com/examples/react/)

- using cucumber.js
- supports docker
- 3 tier architecture:
  - user-centric specs ([cucumber.js](https://github.com/cucumber/cucumber-js))
  - page objects ([page-object-pattern](https://github.com/benjamine/page-object-pattern))
  - browser automation ([leadfoot](https://github.com/theintern/leadfoot))


Usage
=====

- `make && make test` - run all tests inside docker
- `./cucumber` runs tests on the host machine, takes the same arguments as the standard cucumber cli
- `./cucumber-docker` run tests on docker containers, takes the same arguments as standard cucumber cli

Examples:

``` sh
  # test only some features
  ./cucumber-docker --tags=@smoke
  ./cucumber-docker features/somefolder

  # run on your local firefox (firefox|chrome|safari)
  BROWSER=firefox ./cucumber

  # print all selenium debug output
  SELENIUMDEBUG=1 ./cucumber

  # run against production
  CONFIG=env/production ./cucumber
```

Emails
======

Emails are obtained accessing gmail using IMAP and OAuth2.

To generate new access tokens run `./run-plugin email-config` and authorize using `yourtestaccount@gmail.com` (default user specified in `config/users.yml`).

To test email access run: `./run-plugin email-test`

Driver Gotchas
==============

Safari
------

WebDriver Extension needs to be enabled on Safari Preferences.

Internet Explorer
---------------

- Add the site being tested to Trusted Sites

Mobile Safari (iPhone Simulator)
------

**IMPORTANT**: this needs the last version of XCode installed.

appium needs to be installed:
``` sh
./appium-setup
```
for more details see https://github.com/appium/appium/blob/master/docs/en/appium-setup/running-on-osx.md

running:
``` sh
CONFIG=iphone ./cucumber --tags=@mobile
```

For running iOS instruments without delay: https://github.com/appium/appium/blob/master/docs/en/advanced-concepts/iwd_xcode7.md
