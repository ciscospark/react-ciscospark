import {assert} from 'chai';

import testUsers from '@ciscospark/test-helper-test-users';
import '@ciscospark/plugin-logger';
import CiscoSpark from '@ciscospark/spark-core';
import '@ciscospark/internal-plugin-conversation';
import SauceLabs from 'saucelabs';

import {elements, openMenuAndClickButton} from '../../../lib/test-helpers/space-widget/main';
import {
  elements as rosterElements,
  canSearchForParticipants,
  hasParticipants,
  searchAndAddPerson,
  FEATURE_FLAG_ROSTER
} from '../../../lib/test-helpers/space-widget/roster';

describe('Widget Space', () => {
  describe('Data API', () => {
    const browserLocal = browser.select('browserLocal');
    const browserName = process.env.BROWSER || 'chrome';
    const platform = process.env.PLATFORM || 'mac 10.12';
    let biff, docbrown, lorraine, marty;
    let conversation;

    before('initialize', () => {
      if (process.env.SAUCE && process.env.INTEGRATION) {
        browser.reload();
        const account = new SauceLabs({
          username: process.env.SAUCE_USERNAME,
          password: process.env.SAUCE_ACCESS_KEY
        });
        account.getJobs((err, jobs) => {
          const widgetJobs = jobs.filter((job) => job.name === 'react-widget-integration' && job.consolidated_status === 'in progress'
                  && job.os.toLowerCase().includes(platform) && job.browser.toLowerCase().includes(browserName));
          widgetJobs.forEach((job) => account.updateJob(job.id, {name: 'react-widget-space'}));
        });
      }

      browserLocal
        .url('/data-api/space.html')
        .execute(() => {
          localStorage.clear();
        });

      testUsers.create({count: 1, config: {displayName: 'Marty McFly'}})
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
            .then(() => marty.spark.internal.feature.setFeature('developer', FEATURE_FLAG_ROSTER, true))
            .then(() => marty.spark.internal.mercury.connect());
        });

      testUsers.create({count: 1, config: {displayName: 'Emmett Brown'}})
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
        });

      testUsers.create({count: 1, config: {displayName: 'Lorraine Baines'}})
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
        });

      testUsers.create({count: 1, config: {displayName: 'Biff Tannen'}})
        .then((users) => {
          [biff] = users;
          biff.spark = new CiscoSpark({
            credentials: {
              authorization: biff.token
            },
            config: {
              logger: {
                level: 'error'
              }
            }
          });
        });

      browser.pause(5000);

      marty.spark.internal.conversation.create({
        displayName: 'Test Widget Space',
        participants: [marty, docbrown, lorraine]
      }).then((c) => {
        conversation = c;
        return conversation;
      });

      browserLocal.waitUntil(() => conversation && conversation.id, 10000, 'failed to create conversation');

      browserLocal.execute((localAccessToken, spaceId) => {
        const csmmDom = document.createElement('div');
        csmmDom.setAttribute('class', 'ciscospark-widget');
        csmmDom.setAttribute('data-toggle', 'ciscospark-space');
        csmmDom.setAttribute('data-access-token', localAccessToken);
        csmmDom.setAttribute('data-space-id', spaceId);
        csmmDom.setAttribute('data-initial-activity', 'message');
        document.getElementById('ciscospark-widget').appendChild(csmmDom);
        window.loadBundle('/dist-space/bundle.js');
      }, marty.token.access_token, conversation.id);
    });

    it('loads the test page', () => {
      const title = browserLocal.getTitle();
      assert.equal(title, 'Cisco Spark Widget Test');
    });

    it('loads the space name', () => {
      browserLocal.waitForVisible('h1.ciscospark-title');
      assert.equal(browserLocal.getText('h1.ciscospark-title'), conversation.displayName);
    });

    describe('When conversation is established', () => {
      before('wait for conversation to be ready', () => {
        const textInputField = `[placeholder="Send a message to ${conversation.displayName}"]`;
        browserLocal.waitForVisible(textInputField);
      });

      describe('Activity Menu', () => {
        it('has a menu button', () => {
          assert.isTrue(browserLocal.isVisible(elements.menuButton));
        });

        it('displays the menu when clicking the menu button', () => {
          browserLocal.click(elements.menuButton);
          browserLocal.waitForVisible(elements.activityMenu);
        });

        it('has an exit menu button', () => {
          assert.isTrue(browserLocal.isVisible(elements.activityMenu));
          browserLocal.waitForVisible(elements.exitButton);
        });

        it('closes the menu with the exit button', () => {
          browserLocal.click(elements.exitButton);
          browserLocal.waitForVisible(elements.activityMenu, 1500, true);
        });

        it('has a message button', () => {
          browserLocal.click(elements.menuButton);
          browserLocal.waitForVisible(`${elements.activityMenu} ${elements.messageButton}`);
        });

        it('has a files button', () => {
          browserLocal.waitForVisible(`${elements.activityMenu} ${elements.filesButton}`);
        });

        it('switches to files widget', () => {
          browserLocal.waitForVisible(elements.filesButton);
          browserLocal.click(elements.filesButton);
          browserLocal.waitForVisible(elements.filesWidget);
          browserLocal.waitForVisible(elements.menuButton);
          browserLocal.click(elements.menuButton);
        });

        it('hides menu and switches to message widget', () => {
          browserLocal.click(`${elements.activityMenu} ${elements.messageButton}`);
          browserLocal.waitForVisible(elements.activityMenu, 1500, true);
          assert.isTrue(browserLocal.isVisible(elements.messageWidget));
        });
      });

      describe('roster tests', () => {
        before('open roster widget', () => {
          openMenuAndClickButton(browserLocal, rosterElements.peopleButton);
          browserLocal.waitForVisible(rosterElements.rosterWidget);
        });

        it('has a close button', () => {
          assert.isTrue(
            browserLocal.isVisible(`${rosterElements.rosterWidget} ${rosterElements.closeButton}`)
          );
        });

        it('has the total count of participants', () => {
          assert.equal(browserLocal.getText(rosterElements.rosterTitle), 'People (3)');
        });

        it('has the participants listed', () => {
          hasParticipants(browserLocal, [marty, docbrown, lorraine]);
        });

        it('has search for participants', () => {
          canSearchForParticipants(browserLocal);
        });

        it('searches and adds person to space', () => {
          searchAndAddPerson({
            aBrowser: browserLocal,
            searchString: biff.email,
            searchResult: biff.displayName
          });
        });

        it('closes the people roster widget', () => {
          browserLocal.click(`${rosterElements.rosterWidget} ${rosterElements.closeButton}`);
          browserLocal.waitForVisible(rosterElements.rosterWidget, 500, true);
        });
      });
    });

    after('disconnect', () => marty.spark.internal.mercury.disconnect());
  });
});
