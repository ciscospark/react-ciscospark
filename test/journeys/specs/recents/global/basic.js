import {assert} from 'chai';

import testUsers from '@ciscospark/test-helper-test-users';
import '@ciscospark/plugin-logger';
import '@ciscospark/plugin-phone';
import '@ciscospark/internal-plugin-feature';
import CiscoSpark from '@ciscospark/spark-core';
import '@ciscospark/internal-plugin-conversation';

import waitForPromise from '../../../lib/wait-for-promise';
import {runAxe} from '../../../lib/axe';
import {clearEventLog, getEventLog} from '../../../lib/events';

import {moveMouse} from '../../../lib/test-helpers';
import {FEATURE_FLAG_GROUP_CALLING, elements as meetElements, hangup} from '../../../lib/test-helpers/space-widget/meet';
import {
  createSpaceAndPost,
  displayAndReadIncomingMessage,
  displayIncomingMessage,
  elements
} from '../../../lib/test-helpers/recents-widget';

describe('Widget Recents', () => {
  const browserLocal = browser.select('browserLocal');
  const browserRemote = browser.select('browserRemote');

  let docbrown, lorraine, marty;
  let conversation, oneOnOneConversation;

  before('load browser for recents widget', () => {
    browserLocal
      .url('/recents.html')
      .execute(() => {
        localStorage.clear();
      });
  });

  before('load browser for meet widget', () => {
    browserRemote
      .url('/space.html?meetRecents')
      .execute(() => {
        localStorage.clear();
      });
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
        .then(() => marty.spark.internal.feature.setFeature('developer', FEATURE_FLAG_GROUP_CALLING, true))
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
      return lorraine.spark.phone.register();
    }));

  before('pause to let test users establish', () => browser.pause(5000));

  after('disconnect', () => Promise.all([
    marty.spark.internal.mercury.disconnect(),
    lorraine.spark.phone.deregister(),
    docbrown.spark.internal.mercury.disconnect()
  ]));

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

  before('open recents widget for marty', () => {
    browserLocal.execute((localAccessToken) => {
      const options = {
        accessToken: localAccessToken,
        onEvent: (eventName) => {
          window.ciscoSparkEvents.push(eventName);
        }
      };
      window.openRecentsWidget(options);
    }, marty.token.access_token);
    browserLocal.waitForVisible(elements.recentsWidget);
  });

  before('open meet widget for lorraine', () => {
    browserRemote.execute((localAccessToken, localToUserEmail) => {
      const options = {
        accessToken: localAccessToken,
        onEvent: (eventName, detail) => {
          window.ciscoSparkEvents.push({eventName, detail});
        },
        toPersonEmail: localToUserEmail,
        initialActivity: 'meet'
      };
      window.openSpaceWidget(options);
    }, lorraine.token.access_token, marty.email);
  });

  it('loads the test page', () => {
    const title = browserLocal.getTitle();
    assert.equal(title, 'Cisco Spark Widget Test');
  });

  describe('group space', () => {
    it('displays a new incoming message', () => {
      const lorraineText = 'Marty, will we ever see you again?';
      displayIncomingMessage(browserLocal, lorraine, conversation, lorraineText);
    });

    it('removes unread indicator when read', () => {
      const lorraineText = 'You\'re safe and sound now!';
      displayAndReadIncomingMessage(browserLocal, lorraine, marty, conversation, lorraineText);
    });

    it('displays a call button on hover', () => {
      displayIncomingMessage(browserLocal, lorraine, conversation, 'Can you call me?');
      moveMouse(browserLocal, elements.firstSpace);
      browserLocal.waitUntil(() =>
        browserLocal.element(elements.callButton).isVisible(),
      1500,
      'does not show call button');
    });

    describe('events', () => {
      // https://github.com/ciscospark/react-ciscospark/blob/master/packages/node_modules/%40ciscospark/widget-recents/events.md
      it('messages:created', () => {
        clearEventLog(browserLocal);
        const lorraineText = 'Don\'t be such a square';
        displayIncomingMessage(browserLocal, lorraine, conversation, lorraineText);
        assert.include(getEventLog(browserLocal), 'messages:created', 'does not have event in log');
      });

      it('rooms:unread', () => {
        clearEventLog(browserLocal);
        const lorraineText = 'Your Uncle Joey didn\'t make parole again.';
        displayIncomingMessage(browserLocal, lorraine, conversation, lorraineText);
        assert.include(getEventLog(browserLocal), 'rooms:unread', 'does not have event in log');
      });

      it('rooms:read', () => {
        clearEventLog(browserLocal);
        const lorraineText = 'Your Uncle Joey didn\'t make parole again.';
        displayAndReadIncomingMessage(browserLocal, lorraine, marty, conversation, lorraineText);
        assert.include(getEventLog(browserLocal), 'rooms:read', 'does not have event in log');
      });

      it('rooms:selected', () => {
        clearEventLog(browserLocal);
        browserLocal.element(elements.firstSpace).click();
        assert.include(getEventLog(browserLocal), 'rooms:selected', 'does not have event in log');
      });

      it('memberships:created', () => {
        const roomTitle = 'Test Group Space 2';
        const firstPost = 'Everybody who\'s anybody drinks.';
        clearEventLog(browserLocal);
        createSpaceAndPost(browserLocal, lorraine, [marty, docbrown, lorraine], roomTitle, firstPost);
        assert.include(getEventLog(browserLocal), 'memberships:created', 'does not have event in log');
      });

      it('memberships:deleted', () => {
        // Create Room
        const roomTitle = 'Kick Marty Out';
        const firstPost = 'Goodbye Marty.';
        const kickedConversation = createSpaceAndPost(
          browserLocal,
          lorraine,
          [marty, docbrown, lorraine],
          roomTitle,
          firstPost
        );
        // Remove user from room
        clearEventLog(browserLocal);
        waitForPromise(lorraine.spark.internal.conversation.leave(kickedConversation, marty));
        browserLocal.waitUntil(() =>
          browserLocal.element(`${elements.firstSpace} ${elements.title}`).getText() !== roomTitle,
        5000,
        'does not remove space from list');
        assert.include(getEventLog(browserLocal), 'memberships:deleted', 'does not have event in log');
      });
    });
  });

  describe('one on one space', () => {
    it('displays a new incoming message', () => {
      const lorraineText = 'Marty? Why are you so nervous?';
      displayIncomingMessage(browserLocal, lorraine, oneOnOneConversation, lorraineText, true);
    });

    it('removes unread indicator when read', () => {
      const lorraineText = 'You\'re safe and sound now!';
      displayAndReadIncomingMessage(browserLocal, lorraine, marty, oneOnOneConversation, lorraineText);
    });

    it('displays a new one on one', () => {
      const docText = 'Marty! We have to talk!';
      createSpaceAndPost(browserLocal, docbrown, [marty, docbrown], undefined, docText, true);
    });

    it('displays a call button on hover', () => {
      displayIncomingMessage(browserLocal, lorraine, oneOnOneConversation, 'Can you call me?', true);
      moveMouse(browserLocal, elements.firstSpace);
      browserLocal.waitUntil(() =>
        browserLocal.element(elements.callButton).isVisible(),
      1500,
      'does not show call button');
    });
  });

  describe('incoming call', () => {
    it('should display incoming call screen', () => {
      browserRemote.waitForVisible(`${meetElements.meetWidget} ${meetElements.callButton}`);
      browserRemote.click(meetElements.callButton);
      browserLocal.waitUntil(
        () => browserLocal.isVisible(elements.answerButton),
        15000, 'does not show call answer button'
      );
      hangup(browserRemote);
    });
  });

  describe('accessibility', () => {
    it('should have no accessibility violations', () =>
      runAxe(browserLocal, 'ciscospark-widget')
        .then((results) => {
          assert.equal(results.violations.length, 0, 'has accessibilty violations');
        }));
  });
});
