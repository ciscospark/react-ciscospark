import {assert} from 'chai';

import '@ciscospark/plugin-logger';
import '@ciscospark/internal-plugin-feature';
import '@ciscospark/internal-plugin-conversation';
import CiscoSpark from '@ciscospark/spark-core';
import testUsers from '@ciscospark/test-helper-test-users';
import SauceLabs from 'saucelabs';

import waitForPromise from '../../lib/wait-for-promise';
import {moveMouse} from '../../lib/test-helpers';
import {elements as spaceElements} from '../../lib/test-helpers/space-widget/main';
import {sendMessage, verifyMessageReceipt} from '../../lib/test-helpers/space-widget/messaging';

import {
  displayAndReadIncomingMessage,
  displayIncomingMessage,
  elements as recentsElements
} from '../../lib/test-helpers/recents-widget';

describe('Multiple Widgets', () => {
  const browserLocal = browser.select('browserLocal');
  const browserRemote = browser.select('browserRemote');
  const browserName = process.env.BROWSER || 'chrome';
  const platform = process.env.PLATFORM || 'mac 10.12';

  let docbrown, lorraine, marty;
  let conversation, oneOnOneConversation;
  let local, remote;

  before('update sauce job', () => {
    if (process.env.SAUCE && process.env.INTEGRATION) {
      const account = new SauceLabs({
        username: process.env.SAUCE_USERNAME,
        password: process.env.SAUCE_ACCESS_KEY
      });
      account.getJobs((err, jobs) => {
        const widgetJobs = jobs.filter((job) => job.name === 'react-widget-integration' && job.consolidated_status === 'in progress'
              && job.os.toLowerCase().includes(platform) && job.browser.toLowerCase().includes(browserName));
        widgetJobs.forEach((job) => account.updateJob(job.id, {name: 'react-widget-multiple'}));
      });
    }
  });

  before('load browser', () => {
    browser.url('/multiple.html');
  });

  before('create marty', () => testUsers.create({count: 1, config: {displayName: 'Marty McFly'}})
    .then((users) => {
      [marty] = users;
      marty.spark = new CiscoSpark({
        credentials: {
          authorization: marty.token
        },
        config: {
          logger: {
            level: 'error'
          }
        }
      });
      return marty.spark.internal.device.register()
        .then(() => marty.spark.internal.mercury.connect());
    }));

  before('create docbrown', () => testUsers.create({count: 1, config: {displayName: 'Emmett Brown'}})
    .then((users) => {
      [docbrown] = users;
      docbrown.spark = new CiscoSpark({
        credentials: {
          authorization: docbrown.token
        },
        config: {
          logger: {
            level: 'error'
          }
        }
      });
      return docbrown.spark.internal.mercury.connect();
    }));

  before('create lorraine', () => testUsers.create({count: 1, config: {displayName: 'Lorraine Baines'}})
    .then((users) => {
      [lorraine] = users;
      lorraine.spark = new CiscoSpark({
        credentials: {
          authorization: lorraine.token
        },
        config: {
          logger: {
            level: 'error'
          }
        }
      });
      return lorraine.spark.internal.mercury.connect();
    }));

  before('pause to let test users establish', () => browser.pause(5000));

  before('create group space', () => marty.spark.internal.conversation.create({
    displayName: 'Test Group Space',
    participants: [marty, docbrown, lorraine]
  }).then((c) => {
    conversation = c;
    return conversation;
  }));

  before('create one on one converstation', () => lorraine.spark.internal.conversation.create({
    participants: [marty, lorraine]
  }).then((c) => {
    oneOnOneConversation = c;
    return oneOnOneConversation;
  }));

  before('open widgets local', () => {
    local = {browser: browserLocal, user: marty, displayName: conversation.displayName};
    browserLocal.execute((localAccessToken) => {
      const options = {
        accessToken: localAccessToken,
        onEvent: (eventName) => {
          window.ciscoSparkEvents.push({widget: 'recents', eventName});
        }
      };
      window.openRecentsWidget(options);
    }, marty.token.access_token);
    browserLocal.waitForVisible(recentsElements.recentsWidget);

    browserLocal.execute((localAccessToken, spaceId) => {
      const options = {
        accessToken: localAccessToken,
        spaceId,
        onEvent: (eventName) => {
          window.ciscoSparkEvents.push({widget: 'space', eventName});
        }
      };
      window.openSpaceWidget(options);
    }, marty.token.access_token, conversation.id);
    browserLocal.waitForVisible(spaceElements.spaceWidget);
  });

  before('open space widget', () => {
    remote = {browser: browserRemote, user: docbrown, displayName: conversation.displayName};
    browserRemote.execute((localAccessToken) => {
      const options = {
        accessToken: localAccessToken,
        onEvent: (eventName) => {
          window.ciscoSparkEvents.push({widget: 'recents', eventName});
        }
      };
      window.openRecentsWidget(options);
    }, docbrown.token.access_token);
    browserRemote.waitForVisible(recentsElements.recentsWidget);

    browserRemote.execute((localAccessToken, spaceId) => {
      const options = {
        accessToken: localAccessToken,
        spaceId,
        onEvent: (eventName) => {
          window.ciscoSparkEvents.push({widget: 'space', eventName});
        }
      };
      window.openSpaceWidget(options);
    }, docbrown.token.access_token, conversation.id);
    browserRemote.waitForVisible(spaceElements.spaceWidget);
  });

  it('has the page loaded', () => {
    const expectedTitle = 'Cisco Spark Multiple Widget Test';
    assert.equal(browserLocal.getTitle(), expectedTitle, 'page title does not match expected');
  });

  describe('recents widget functionality', () => {
    it('displays a new incoming message', () => {
      const lorraineText = 'Marty, will we ever see you again?';
      displayIncomingMessage(browserLocal, lorraine, conversation, lorraineText);
    });

    it('removes unread indicator when read', () => {
      const lorraineText = 'You\'re safe and sound now!';
      displayAndReadIncomingMessage(browserLocal, lorraine, marty, conversation, lorraineText);
    });

    it('displays a call button on hover', () => {
      displayIncomingMessage(browserLocal, lorraine, oneOnOneConversation, 'Can you call me?', true);
      moveMouse(browserLocal, recentsElements.firstSpace);
      browserLocal.waitForVisible(`${recentsElements.callButton}`);
    });
  });

  describe('space widget functionality', () => {
    before('wait for conversation to be ready', () => {
      const textInputField = `[placeholder="Send a message to ${conversation.displayName}"]`;
      browserLocal.waitForVisible(textInputField);
    });

    describe('Activity Menu', () => {
      it('has a menu button', () => {
        assert.isTrue(browserLocal.isVisible(spaceElements.menuButton));
      });

      it('displays the menu when clicking the menu button', () => {
        browserLocal.click(spaceElements.menuButton);
        browserLocal.waitForVisible(spaceElements.activityMenu);
      });

      it('has an exit menu button', () => {
        assert.isTrue(browserLocal.isVisible(spaceElements.activityMenu));
        browserLocal.waitForVisible(spaceElements.exitButton);
      });

      it('closes the menu with the exit button', () => {
        browserLocal.click(spaceElements.exitButton);
        browserLocal.waitForVisible(spaceElements.activityMenu, 60000, true);
      });

      it('has a message button', () => {
        browserLocal.click(spaceElements.menuButton);
        browserLocal.waitForVisible(spaceElements.messageButton);
      });

      it('hides menu and switches to message widget', () => {
        browserLocal.click(spaceElements.messageButton);
        browserLocal.waitForVisible(spaceElements.activityMenu, 60000, true);
        assert.isTrue(browserLocal.isVisible(spaceElements.messageWidget));
      });
    });

    describe('messaging', () => {
      it('sends and receives messages', () => {
        const martyText = 'Wait a minute. Wait a minute, Doc. Ah... Are you telling me that you built a time machine... out of a DeLorean?';
        const docText = 'The way I see it, if you\'re gonna build a time machine into a car, why not do it with some style?';
        const lorraineText = 'Marty, will we ever see you again?';
        const martyText2 = 'I guarantee it.';
        sendMessage(remote, local, martyText);
        verifyMessageReceipt(local, remote, martyText);
        sendMessage(remote, local, docText);
        verifyMessageReceipt(local, remote, docText);
        // Send a message from a 'client'
        waitForPromise(lorraine.spark.internal.conversation.post(conversation, {
          displayName: lorraineText
        }));
        // Wait for both widgets to receive client message
        verifyMessageReceipt(local, remote, lorraineText);
        verifyMessageReceipt(remote, local, lorraineText);
        sendMessage(local, remote, martyText2);
        verifyMessageReceipt(remote, local, martyText2);
      });
    });
  });

  after('disconnect', () => Promise.all([
    marty.spark.internal.mercury.disconnect(),
    lorraine.spark.internal.mercury.disconnect(),
    docbrown.spark.internal.mercury.disconnect()
  ]));
});
